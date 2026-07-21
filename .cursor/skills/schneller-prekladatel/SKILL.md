---
name: schneller-prekladatel
description: Odborná revize překladu deníku Karla Schnellera (DE→CS). Použij, když uživatel chce zlepšit kvalitu češtiny, revidovat strojový překlad, přeložit deník profesionálně, nebo pokračovat v revizi Schnellerova tagebuchu.
---

# Schneller — odborný překladatel (DE→CS)

## Kdy použít

- Uživatel stěžuje na kvalitu češtiny v `schneller-tagebuch-cs/`
- Požaduje profesionální / revidovaný překlad
- Chce pokračovat v dávkové revizi deníku

## Rychlý start

```bash
# kolik je hotovo / kolik zbývá
python3 scripts/revise_schneller_translation.py status

# dalších 10 nerevidovaných dnů
python3 scripts/revise_schneller_translation.py next 10

# po revizi souboru
python3 scripts/revise_schneller_translation.py mark 1918-10-28 --by agent
```

## Workflow

1. **Přečti glosář:** [scripts/glossary-de-cs.md](../../scripts/glossary-de-cs.md)
2. **Agent prompt:** [.cursor/agents/schneller-prekladatel.md](../../.cursor/agents/schneller-prekladatel.md) — plná pravidla
3. Pro každý `schneller-tagebuch-cs/YYYY-MM-DD.md`:
   - Překlad dělej **z německé sekce**, ne opravou strojového textu
   - Nahraď obsah mezi `## Český překlad` a `## Originál (německy)`
   - V metadata přidej/změň: `- **Překlad:** odborně revidováno (YYYY-MM-DD)`
4. `mark` + commit po logické dávce

## Formát souboru (neměnit strukturu)

```markdown
# Deník Karla Schnellera — DD.MM.YYYY
- **Datum:** …
- **Zdroj:** …
- **Typ:** …
- **Překlad:** odborně revidováno (2026-07-21)

## Český překlad
… revidovaný text …

## Originál (německy)
… beze změny …
```

## Kvalita

Cíl: text by měl snést **tisk nebo publikaci** po lehké redakci — gramatika, terminologie, čitelnost. Strojový překlad je jen návrh; finální verze = lidská odborná revize v agentovi.

## Dávky

| Priorita | Rozsah |
|----------|--------|
| Doporučeno | 10–20 dnů / relace |
| Dlouhé záznamy | 1 den / relace |
| Commit | po měsíci nebo ~50 souborech |

## Automatizace (plný běh)

### 1. Nastav API klíč (doporučeno)

V **Cursor → Environment secrets** přidej:
```
OPENAI_API_KEY=sk-...
REVISION_MODEL=gpt-4o-mini   # volitelné
```

### 2. Spusť watchdog (běží na pozadí)

```bash
tmux new-session -d -s schneller-revision-watchdog -- scripts/watchdog_revision.sh
```

Watchdog:
- volá `batch_revise_translation.py` (8 souborů / dávka)
- commit + push každých ~25 souborů
- hodinové logy: `schneller-hourly-revision.log`
- po dokončení: `schneller-revision-complete.txt`

### 3. Sledování

```bash
python3 scripts/revise_schneller_translation.py status
tail -f schneller-revision.log
tail -f schneller-revision-watchdog.log
```

### Ruční / agentní režim

Bez API klíče použij agenta **schneller-prekladatel** v Cursoru nebo:
```bash
gh agent-task create --custom-agent schneller-prekladatel -F scripts/revision-agent-task.txt
```

## Cursor agent

V Cursoru vyber agenta **schneller-prekladatel** nebo invoke skill `/schneller-prekladatel`.
