# Web Scraping - Prázdné domy Kalendárium

Tento projekt obsahuje skript pro vytěžení kalendáře událostí z webu [databaze.prazdnedomy.cz](https://databaze.prazdnedomy.cz/kalendarium/).

## Popis

Skript `scrape_prazdnedomy.py` stahuje a parsuje kalendář událostí projektu Prázdné domy, který dokumentuje opuštěné a prázdné budovy v České republice.

## Požadavky

Pro běh skriptu je potřeba Python 3 a následující knihovny:

```bash
pip install -r requirements.txt
```

Knihovny:
- `requests` - pro stahování webových stránek
- `beautifulsoup4` - pro parsování HTML
- `lxml` - parser pro BeautifulSoup

## Použití

Spusťte skript následujícím příkazem:

```bash
python3 scrape_prazdnedomy.py
```

## Výstup

Skript vytvoří dva soubory:

1. **`prazdnedomy_kalendarium.json`** - data ve formátu JSON
2. **`prazdnedomy_kalendarium.csv`** - data ve formátu CSV

### Struktura dat

Každá událost obsahuje:
- `datum` - datum události v českém formátu (DD.MM.YYYY)
- `datum_iso` - datum v ISO formátu (YYYY-MM-DD)
- `popis` - popis události

### Příklad JSON výstupu

```json
[
  {
    "datum": "23.3.2023",
    "datum_iso": "2023-03-23",
    "popis": "3. konference Prázdných domů s podtitulem Prázdné domy na bojišti, zaměřená na vojenské objekty"
  },
  {
    "datum": "31.12.2022",
    "datum_iso": "2022-12-31",
    "popis": "3700 fanoušků na našem instagramovém účtu"
  }
]
```

### Příklad CSV výstupu

```csv
datum,datum_iso,popis
23.3.2023,2023-03-23,"3. konference Prázdných domů s podtitulem Prázdné domy na bojišti, zaměřená na vojenské objekty"
31.12.2022,2022-12-31,3700 fanoušků na našem instagramovém účtu
```

## Statistiky

Aktuálně skript vytěží **133 událostí** z období 2014-2023.

## O projektu Prázdné domy

Prázdné domy (prazdnedomy.cz) je český projekt zaměřený na dokumentaci opuštěných a prázdných budov. Projekt vznikl v roce 2015 a sleduje a mapuje prázdné objekty napříč Českou republikou.

## Licence a etika

Tento skript je určen pouze pro vzdělávací účely. Při používání webového scrapingu:
- Respektujte robots.txt soubor webu
- Netlačte na server příliš mnoha požadavky
- Respektujte autorská práva na obsah
- Používejte vytěžená data zodpovědně

## Autor

Vytvořeno pro analýzu a archivaci veřejně dostupných dat z kalendáře projektu Prázdné domy.
