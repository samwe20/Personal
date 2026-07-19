# Claude Code Agenti

Tato složka obsahuje definice subagentů pro Claude Code. Claude je automaticky načte při startu session v tomto repozitáři a deleguje na ně úkoly podle jejich popisu — nebo si je můžeš vyžádat přímo (např. „použij agenta code-reviewer").

## Přehled agentů

| Agent | K čemu slouží |
|-------|---------------|
| `code-reviewer` | Revize JavaScriptu, HTML a CSS — hledá chyby, výkonnostní problémy a navrhuje zlepšení |
| `game-developer` | Vývoj hry Galactic Empire — nové mechaniky, ladění rovnováhy, opravy herní logiky |
| `docs-writer` | Psaní a údržba české dokumentace ve stylu existujících dokumentů |
| `researcher` | Rešerše na webu — porovnání nástrojů, sumarizace zdrojů, strukturované podklady |
| `productivity-coach` | Poradenství k osobní produktivitě s AI, vychází ze znalostní báze v repozitáři |
| `translator` | Překlady čeština ↔ angličtina se zachováním formátování a technických termínů |

## Jak agenti fungují

Každý agent je Markdown soubor s hlavičkou (frontmatter):

```markdown
---
name: nazev-agenta
description: Kdy má Claude tohoto agenta použít
tools: Read, Grep, Glob        # nástroje, které smí používat (volitelné)
model: sonnet                  # model — sonnet/haiku/opus (volitelné)
---

Systémový prompt agenta — instrukce, styl, zásady…
```

- **description** rozhoduje o tom, kdy Claude agenta automaticky zvolí — piš konkrétně.
- **tools** omezuje, co agent smí — revizor kódu např. nemá právo zápisu.
- **model** umožňuje šetřit: jednoduché úkoly (překlady) zvládne rychlejší a levnější model.

## Přidání nového agenta

1. Vytvoř nový `.md` soubor v této složce.
2. Vyplň frontmatter (`name`, `description`, volitelně `tools` a `model`).
3. Napiš systémový prompt — čím konkrétnější instrukce, tím lepší výsledky.
4. Agent bude dostupný v příští session (nebo po `/agents` reload).

Více v dokumentaci: https://code.claude.com/docs/en/sub-agents
