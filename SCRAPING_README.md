# Web Scraping - Prázdnédomy.cz

Tento projekt obsahuje komplexní nástroje pro vytěžení dat z webu [databaze.prazdnedomy.cz](https://databaze.prazdnedomy.cz/), včetně kalendáře událostí a celé databáze historických objektů.

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

## Dva scrapery v jednom projektu

### 1. Kalendář událostí (`scrape_prazdnedomy.py`)

Vytěžuje **kalendář událostí** projektu Prázdné domy.

**Výsledky:**
- **133 událostí** z období 2014-2023
- Export do `prazdnedomy_kalendarium.json` a `.csv`

### 2. Kompletní databáze (`scrape_prazdnedomy_full.py`)

Vytěžuje **celou databázi historických objektů** včetně detailů.

**Co vytěžuje:**
- ~**7855 objektů** celkem
- GPS souřadnice každého objektu
- **Časové osy** - kompletní historie objektů
- Popisy, architekti, majitelé
- Odkazy na články a fotografie

**Výsledky:**
- `prazdnedomy_full.json` - kompletní data (50+ MB)
- `prazdnedomy_summary.csv` - přehledné CSV
- Checkpoint soubory každých 100 objektů

## Statistiky databáze

### Růst počtu objektů (z kalendáře)
- **2015**: 268 objektů (start projektu)
- **2016**: 1 000 domů
- **2017**: 2 000 domů
- **2018**: 3 000 domů  
- **2019**: 4 000 objektů
- **2020**: 6 000 objektů
- **2021**: 7 000 objektů
- **2026**: ~7 855 objektů (aktuálně)

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
