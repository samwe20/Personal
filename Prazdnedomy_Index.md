# Prázdné Domy - Index

> Databáze 7 860 historických objektů z České republiky

## 📊 Pro Obsidian Dataview

Pokud máš nainstalovaný plugin **Dataview**, můžeš použít tyto dotazy:

### Všechny objekty s GPS souřadnicemi

```dataview
TABLE latitude, longitude, pocet_udalosti as "Událostí"
FROM "Prazdnedomy_Objekty"
WHERE latitude
SORT pocet_udalosti DESC
```

### Top objekty podle počtu událostí

```dataview
TABLE pocet_udalosti as "Událostí", pocet_clanku as "Článků"
FROM "Prazdnedomy_Objekty"
WHERE pocet_udalosti > 0
SORT pocet_udalosti DESC
LIMIT 20
```

### Mapa objektů

```dataview
TABLE latitude, longitude
FROM "Prazdnedomy_Objekty"
WHERE latitude AND longitude
```

## 📁 Soubory

- **`Prazdnedomy_Prehled.md`** - přehled celé databáze
- **`Prazdnedomy_Objekty/`** - top 20 objektů jako markdown (ukázka)
- **`prazdnedomy_summary.csv`** - CSV se všemi objekty (1 MB)
- **`prazdnedomy_full.json`** - kompletní JSON data (30 MB)

## 🚀 Vytvoření všech objektů jako markdown

Pokud chceš vytvořit **všech 7 860 objektů** jako samostatné markdown soubory:

```bash
python3 create_all_markdown.py
```

⚠️ **Upozornění**: Vytvoří se 7 860 souborů (~40 MB)!

## 📈 Statistiky

- **Celkem objektů**: 7 860
- **Objektů s GPS**: 7 860 (100%)
- **Objektů s časovou osou**: 7 860 (100%)
- **Celkem událostí**: 62 094
- **Objektů s popisem**: 5 764 (73%)

## 🔗 Zdroj dat

Data vytěžena z: https://databaze.prazdnedomy.cz/

## 📝 Formát dat

Každý markdown soubor obsahuje:

```yaml
---
typ: historický objekt
zdroj: prazdnedomy.cz
latitude: 50.083139
longitude: 14.422194
pocet_udalosti: 15
pocet_clanku: 11
---
```

## 💡 Tipy pro Obsidian

1. **Dataview plugin**: Pro pokročilé dotazy a vizualizace
2. **Obsidian Leaflet**: Pro zobrazení GPS souřadnic na mapě
3. **Database Folder**: Pro tabulkové zobrazení CSV
4. **Graph view**: Pro propojení objektů

## 📅 Vytěženo

- Datum: 12. července 2026
- Celkový čas: ~93 minut
- Použitý scraper: `scrape_prazdnedomy_full.py`
