#!/usr/bin/env python3
"""Track and assist professional revision of Schneller diary Czech translations."""

from __future__ import annotations

import argparse
import json
import re
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DIARY_DIR = ROOT / "schneller-tagebuch-cs"
STATUS_FILE = DIARY_DIR / ".revision-status.json"

CS_HEADER = "## Český překlad"
DE_HEADER = "## Originál (německy)"
TRANSLATION_META = "**Překlad:**"


def iso_from_path(path: Path) -> str:
    return path.stem


def all_diary_files() -> list[Path]:
    return sorted(p for p in DIARY_DIR.glob("*.md") if p.is_file())


def load_status() -> dict:
    if not STATUS_FILE.exists():
        return {"revised": {}, "notes": ""}
    return json.loads(STATUS_FILE.read_text(encoding="utf-8"))


def save_status(status: dict) -> None:
    STATUS_FILE.parent.mkdir(parents=True, exist_ok=True)
    STATUS_FILE.write_text(json.dumps(status, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")


def is_revised(path: Path, status: dict) -> bool:
    return iso_from_path(path) in status.get("revised", {})


def parse_sections(text: str) -> tuple[str, str, str]:
    """Return (prefix_with_cs_header, czech_body, suffix_from_de_header)."""
    if CS_HEADER not in text or DE_HEADER not in text:
        raise ValueError("Soubor nemá očekávanou strukturu sekcí Český překlad / Originál")

    before, rest = text.split(CS_HEADER, 1)
    czech_part, german_part = rest.split(DE_HEADER, 1)
    prefix = before + CS_HEADER + "\n\n"
    return prefix, czech_part.strip(), DE_HEADER + german_part


def extract_german(text: str) -> str:
    if DE_HEADER not in text:
        raise ValueError("Chybí sekce Originál (německy)")
    return text.split(DE_HEADER, 1)[1].strip()


def update_header_meta(text: str, label: str = "odborně revidováno") -> str:
    today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
    new_line = f"- **Překlad:** {label} ({today})"
    if TRANSLATION_META in text:
        return re.sub(r"- \*\*Překlad:\*\*[^\n]*", new_line, text, count=1)
    marker = "- **Typ:**"
    if marker in text:
        idx = text.find(marker)
        end = text.find("\n", idx)
        return text[: end + 1] + new_line + "\n" + text[end + 1 :]
    return text


def apply_czech(path: Path, new_czech: str, mark_revised: bool = True, by: str = "agent") -> None:
    text = path.read_text(encoding="utf-8")
    prefix, _old, suffix = parse_sections(text)
    body = prefix + new_czech.strip() + "\n\n" + suffix
    if mark_revised:
        body = update_header_meta(body)
    if not body.endswith("\n"):
        body += "\n"
    path.write_text(body, encoding="utf-8")

    if mark_revised:
        status = load_status()
        status.setdefault("revised", {})[iso_from_path(path)] = {
            "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "by": by,
        }
        save_status(status)


def cmd_status(_: argparse.Namespace) -> None:
    files = all_diary_files()
    status = load_status()
    revised = sum(1 for f in files if is_revised(f, status))
    pending = len(files) - revised
    print(f"Celkem souborů: {len(files)}")
    print(f"Revidováno:      {revised}")
    print(f"Zbývá:           {pending}")
    if status.get("revised"):
        last_iso = max(status["revised"].keys())
        print(f"Poslední revize: {last_iso}")


def cmd_next(args: argparse.Namespace) -> None:
    status = load_status()
    pending_files = [f for f in all_diary_files() if not is_revised(f, status)]
    if args.start:
        pending_files = [f for f in pending_files if iso_from_path(f) >= args.start]
    batch = pending_files[: args.count]
    if not batch:
        print("Žádné nerevidované soubory.")
        return
    for path in batch:
        print(path.relative_to(ROOT))


def cmd_mark(args: argparse.Namespace) -> None:
    path = DIARY_DIR / f"{args.date}.md"
    if not path.exists():
        raise SystemExit(f"Soubor neexistuje: {path}")
    text = path.read_text(encoding="utf-8")
    text = update_header_meta(text)
    path.write_text(text, encoding="utf-8")
    status = load_status()
    status.setdefault("revised", {})[args.date] = {
        "at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "by": args.by,
    }
    save_status(status)
    print(f"Označeno: {args.date}")


def cmd_show(args: argparse.Namespace) -> None:
    path = DIARY_DIR / f"{args.date}.md"
    if not path.exists():
        raise SystemExit(f"Soubor neexistuje: {path}")
    text = path.read_text(encoding="utf-8")
    print("=== ORIGINÁL (DE) ===")
    print(extract_german(text))
    print("\n=== SOUČASNÝ PŘEKLAD (CS) ===")
    _, czech, _ = parse_sections(text)
    print(czech)


def cmd_apply(args: argparse.Namespace) -> None:
    path = DIARY_DIR / f"{args.date}.md"
    new_czech = args.text_file.read_text(encoding="utf-8")
    apply_czech(path, new_czech, mark_revised=True, by=args.by)
    print(f"Aktualizováno: {path}")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_status = sub.add_parser("status", help="Počty revidovaných / zbývajících")
    p_status.set_defaults(func=cmd_status)

    p_next = sub.add_parser("next", help="Vypiš další nerevidované soubory")
    p_next.add_argument("count", type=int, nargs="?", default=10)
    p_next.add_argument("--start", help="ISO datum YYYY-MM-DD — začít od tohoto dne")
    p_next.set_defaults(func=cmd_next)

    p_mark = sub.add_parser("mark", help="Označ den jako revidovaný (metadata)")
    p_mark.add_argument("date", help="YYYY-MM-DD")
    p_mark.add_argument("--by", default="agent")
    p_mark.set_defaults(func=cmd_mark)

    p_show = sub.add_parser("show", help="Zobraz DE originál a současný CS překlad")
    p_show.add_argument("date", help="YYYY-MM-DD")
    p_show.set_defaults(func=cmd_show)

    p_apply = sub.add_parser("apply", help="Nahraď sekci Český překlad ze souboru")
    p_apply.add_argument("date", help="YYYY-MM-DD")
    p_apply.add_argument("text_file", type=Path)
    p_apply.add_argument("--by", default="agent")
    p_apply.set_defaults(func=cmd_apply)

    args = parser.parse_args()
    args.func(args)


if __name__ == "__main__":
    main()
