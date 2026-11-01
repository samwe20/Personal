#!/usr/bin/env python3
"""Batch professional revision of Schneller diary using an LLM (OpenAI-compatible API)."""

from __future__ import annotations

import argparse
import os
import re
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPTS = ROOT / "scripts"
PROMPT_FILE = SCRIPTS / "prompts" / "revise-de-cs-system.txt"
GLOSSARY_FILE = SCRIPTS / "glossary-de-cs.md"
LOG_FILE = ROOT / "schneller-revision.log"

sys.path.insert(0, str(SCRIPTS))
from revise_schneller_translation import (  # noqa: E402
    all_diary_files,
    apply_czech,
    extract_german,
    is_revised,
    load_status,
)

DEFAULT_MODEL = os.environ.get("REVISION_MODEL", "gpt-4o-mini")
MAX_GERMAN_CHARS = 12000


def log(msg: str) -> None:
    line = f"[{time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}] {msg}"
    print(line, flush=True)
    with LOG_FILE.open("a", encoding="utf-8") as fh:
        fh.write(line + "\n")


def build_system_prompt() -> str:
    base = PROMPT_FILE.read_text(encoding="utf-8")
    if GLOSSARY_FILE.exists():
        glossary = GLOSSARY_FILE.read_text(encoding="utf-8")
        if len(glossary) < 8000:
            base += "\n\nPLNÝ GLOSÁŘ:\n" + glossary
    return base


def get_client():
    api_key = os.environ.get("OPENAI_API_KEY") or os.environ.get("CURSOR_OPENAI_API_KEY")
    if not api_key:
        return None, "Chybí OPENAI_API_KEY (nastav v Cursor Environment secrets)"
    try:
        from openai import OpenAI
    except ImportError as exc:
        return None, f"Nainstaluj: pip install -r scripts/requirements-revision.txt ({exc})"

    base_url = os.environ.get("OPENAI_BASE_URL")
    kwargs: dict = {"api_key": api_key}
    if base_url:
        kwargs["base_url"] = base_url
    return OpenAI(**kwargs), None


def translate_german(client, system: str, german: str, date_label: str, retries: int = 3) -> str:
    if len(german) > MAX_GERMAN_CHARS:
        german = german[:MAX_GERMAN_CHARS] + "\n\n[… text zkrácen pro limit API …]"

    user = f"Datum záznamu: {date_label}\n\nNĚMECKÝ ORIGINÁL:\n{german}"
    last_err: Exception | None = None
    for attempt in range(retries):
        try:
            response = client.chat.completions.create(
                model=DEFAULT_MODEL,
                messages=[
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                temperature=0.2,
                timeout=120,
            )
            content = (response.choices[0].message.content or "").strip()
            if not content:
                raise ValueError("Prázdná odpověď modelu")
            content = re.sub(r"^#+\s.*\n", "", content)
            content = re.sub(r"^##\s*Český překlad\s*\n", "", content, flags=re.I)
            return content.strip()
        except Exception as exc:
            last_err = exc
            wait = min(30, 2**attempt)
            log(f"  [warn] API pokus {attempt + 1}/{retries}: {exc}")
            time.sleep(wait)
    raise RuntimeError(f"Překlad selhal pro {date_label}: {last_err}")


def pending_files(start: str | None = None) -> list[Path]:
    status = load_status()
    files = [f for f in all_diary_files() if not is_revised(f, status)]
    if start:
        files = [f for f in files if f.stem >= start]
    return files


def extract_date_label(path: Path) -> str:
    text = path.read_text(encoding="utf-8")
    m = re.search(r"^#\s*Deník Karla Schnellera\s*—\s*(.+)$", text, re.M)
    if m:
        return m.group(1).strip()
    y, mth, d = path.stem.split("-")
    return f"{d}.{mth}.{y}"


def run_batch(limit: int, delay: float, start: str | None, dry_run: bool) -> int:
    client, err = get_client()
    if client is None:
        log(f"CHYBA: {err}")
        return 0

    system = build_system_prompt()
    files = pending_files(start)[:limit]
    if not files:
        log("Žádné nerevidované soubory.")
        return 0

    log(f"Start dávky: {len(files)} souborů (model={DEFAULT_MODEL})")
    done = 0
    for path in files:
        iso = path.stem
        date_label = extract_date_label(path)
        german = extract_german(path.read_text(encoding="utf-8"))
        if not german.strip():
            log(f"[skip] {iso} — prázdný originál")
            continue

        log(f"[revise] {date_label} ({len(german)} znaků DE)")
        if dry_run:
            done += 1
            continue

        czech = translate_german(client, system, german, date_label)
        apply_czech(path, czech, mark_revised=True, by="batch-llm")
        done += 1
        log(f"[ok] {iso}")
        if delay > 0:
            time.sleep(delay)

    log(f"Dávka hotova: {done} souborů")
    return done


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--limit", type=int, default=10, help="Max souborů v dávce")
    parser.add_argument("--delay", type=float, default=1.5, help="Pauza mezi API voláními (s)")
    parser.add_argument("--start", help="ISO datum YYYY-MM-DD")
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    count = run_batch(args.limit, args.delay, args.start, args.dry_run)
    if count == 0 and not args.dry_run:
        _client, err = get_client()
        if _client is None:
            sys.exit(2)


if __name__ == "__main__":
    main()
