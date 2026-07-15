#!/usr/bin/env python3
"""Extract Karl Schneller war diary from wk1.staatsarchiv.at, translate to Czech, save as Markdown."""

from __future__ import annotations

import argparse
import re
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from datetime import datetime
from html import unescape
from pathlib import Path

from bs4 import BeautifulSoup
from deep_translator import GoogleTranslator

BASE_URL = "https://wk1.staatsarchiv.at/tagebuch/karl-schneller/"
USER_AGENT = "Mozilla/5.0 (compatible; SchnellerTagebuchExtractor/1.0)"
DATE_RE = re.compile(r"(\d{2})\.(\d{2})\.(\d{4})")


@dataclass
class DiaryDay:
    date_label: str
    iso_date: str
    url: str
    german_paragraphs: list[str]
    kaiserbericht_hint: str | None = None


def fetch_html(url: str, retries: int = 3) -> str:
    for attempt in range(retries):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
            with urllib.request.urlopen(request, timeout=45) as response:
                return response.read().decode("utf-8", errors="replace")
        except urllib.error.HTTPError as exc:
            if exc.code in {429, 500, 502, 503, 504} and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
        except urllib.error.URLError:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise
    raise RuntimeError(f"Failed to fetch {url}")


def parse_index() -> list[tuple[str, str]]:
    html = fetch_html(BASE_URL + "index.html")
    soup = BeautifulSoup(html, "lxml")
    days: list[tuple[str, str]] = []

    for span in soup.select("span[data-date]"):
        date_label = span.get("data-date", "").strip()
        anchor = span.find("a", href=True)
        if not date_label or anchor is None:
            continue
        href = anchor["href"].replace("&amp;", "&")
        url = BASE_URL + href
        days.append((date_label, url))

    deduped: dict[str, str] = {}
    for date_label, url in days:
        deduped[date_label] = url
    return sorted(deduped.items(), key=lambda item: to_iso_date(item[0]))


def to_iso_date(date_label: str) -> str:
    match = DATE_RE.fullmatch(date_label)
    if not match:
        raise ValueError(f"Unexpected date label: {date_label}")
    day, month, year = match.groups()
    return f"{year}-{month}-{day}"


def extract_diary(html: str, date_label: str, url: str) -> DiaryDay | None:
    soup = BeautifulSoup(html, "lxml")
    page_text = soup.get_text(" ", strip=True)

    if "kein Tagebucheintrag" in page_text:
        kaiser_hint = None
        if "Kaiserbericht" in page_text:
            kaiser_hint = "Pro tento den existuje pouze Kaiserbericht (oficiální zpráva AOK císaři)."
        return None

    paragraphs = [
        unescape(p.get_text(" ", strip=True))
        for p in soup.select("p.bodytext")
        if p.get_text(strip=True)
    ]
    if not paragraphs:
        return None

    kaiser_hint = None
    if "Kaiserbericht" in page_text:
        kaiser_hint = "Ke stejnému datu existuje i Kaiserbericht na portálu."

    return DiaryDay(
        date_label=date_label,
        iso_date=to_iso_date(date_label),
        url=url,
        german_paragraphs=paragraphs,
        kaiserbericht_hint=kaiser_hint,
    )


def split_sentences(text: str) -> list[str]:
    parts = re.split(r"(?<=[.!?…])\s+", text.strip())
    return [part.strip() for part in parts if part.strip()]


def translate_sentence(sentence: str, translator: GoogleTranslator, retries: int = 4) -> str:
    for attempt in range(retries):
        try:
            result = translator.translate(sentence)
            if result:
                return result
        except Exception:
            pass
        time.sleep(1.5 * (attempt + 1))
    return sentence


def translate_text(text: str, translator: GoogleTranslator) -> str:
    sentences = split_sentences(text)
    if not sentences:
        return ""

    translated_sentences: list[str] = []
    for sentence in sentences:
        translated_sentences.append(translate_sentence(sentence, translator))
        time.sleep(0.05)
    return " ".join(translated_sentences)


def translate_paragraphs(paragraphs: list[str], translator: GoogleTranslator) -> list[str]:
    return [translate_text(paragraph, translator) for paragraph in paragraphs]


def render_markdown(day: DiaryDay, czech_paragraphs: list[str]) -> str:
    german = "\n\n".join(day.german_paragraphs)
    czech = "\n\n".join(czech_paragraphs)
    lines = [
        f"# Deník Karla Schnellera — {day.date_label}",
        "",
        f"- **Datum:** {day.date_label}",
        f"- **Zdroj:** [{day.url}]({day.url})",
        f"- **Typ:** Osobní deník generalstabního důstojníka AOK",
        "",
    ]
    if day.kaiserbericht_hint:
        lines.extend([f"> {day.kaiserbericht_hint}", ""])
    lines.extend(
        [
            "## Český překlad",
            "",
            czech,
            "",
            "## Originál (německy)",
            "",
            german,
            "",
        ]
    )
    return "\n".join(lines)


def save_day(day: DiaryDay, czech_paragraphs: list[str], output_dir: Path) -> Path:
    output_dir.mkdir(parents=True, exist_ok=True)
    path = output_dir / f"{day.iso_date}.md"
    path.write_text(render_markdown(day, czech_paragraphs), encoding="utf-8")
    return path


def filter_days(days: list[tuple[str, str]], start: str | None, end: str | None, limit: int | None):
    filtered = days
    if start:
        filtered = [item for item in filtered if to_iso_date(item[0]) >= start]
    if end:
        filtered = [item for item in filtered if to_iso_date(item[0]) <= end]
    if limit is not None:
        filtered = filtered[:limit]
    return filtered


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--output-dir",
        default="schneller-tagebuch-cs",
        help="Directory for generated Markdown files",
    )
    parser.add_argument("--start", help="ISO start date YYYY-MM-DD")
    parser.add_argument("--end", help="ISO end date YYYY-MM-DD")
    parser.add_argument("--limit", type=int, help="Process only first N calendar days")
    parser.add_argument("--delay", type=float, default=0.35, help="Delay between HTTP requests")
    parser.add_argument(
        "--skip-existing",
        action="store_true",
        help="Skip dates that already have a Markdown file",
    )
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    days = filter_days(parse_index(), args.start, args.end, args.limit)
    translator = GoogleTranslator(source="de", target="cs")

    processed = 0
    skipped_empty = 0
    skipped_existing = 0

    print(f"Calendar days to check: {len(days)}", flush=True)

    for date_label, url in days:
        iso = to_iso_date(date_label)
        target = output_dir / f"{iso}.md"
        if args.skip_existing and target.exists():
            skipped_existing += 1
            continue

        html = fetch_html(url)
        day = extract_diary(html, date_label, url)
        time.sleep(args.delay)

        if day is None:
            skipped_empty += 1
            print(f"[skip] {date_label} — bez záznamu v deníku Schnellera", flush=True)
            continue

        try:
            czech = translate_paragraphs(day.german_paragraphs, translator)
        except Exception as exc:
            print(f"[error] {date_label} — překlad selhal: {exc}")
            continue

        save_day(day, czech, output_dir)
        processed += 1
        print(f"[ok] {date_label} -> {target}", flush=True)

    print(
        f"Done. Saved: {processed}, empty days: {skipped_empty}, skipped existing: {skipped_existing}",
        flush=True,
    )


if __name__ == "__main__":
    main()
