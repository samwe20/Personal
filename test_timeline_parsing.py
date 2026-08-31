#!/usr/bin/env python3
"""
Test scriptu pro analýzu struktury časové osy
"""

import requests
from bs4 import BeautifulSoup
import re

url = "https://databaze.prazdnedomy.cz/domy/objekty/detail/80-mottluv-dum-cp-761"

response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

# Najdeme sekci s časovou osou
print("=== Hledání časové osy ===\n")

# Metoda 1: Hledání nadpisu
for heading in soup.find_all(['h4', 'h3', 'h2']):
    text = heading.get_text().lower()
    if 'časová' in text or 'timeline' in text:
        print(f"Nalezen nadpis: {heading.name} - '{heading.get_text().strip()}'")
        print(f"HTML: {heading}")
        
        # Podívejme se na následující elementy
        print("\nNásledující siblings:")
        current = heading.find_next_sibling()
        count = 0
        while current and count < 10:
            print(f"  {count}. {current.name} - '{current.get_text().strip()[:100]}'")
            count += 1
            current = current.find_next_sibling()
        
        print("\n" + "="*80 + "\n")

# Metoda 2: Hledání podle class
print("\n=== Hledání podle CSS tříd ===\n")
timeline_divs = soup.find_all('div', class_=re.compile('timeline|casova', re.I))
for div in timeline_divs:
    print(f"Nalezen div s class: {div.get('class')}")
    print(f"Obsah (první 200 znaků): {div.get_text().strip()[:200]}")
    print()

# Metoda 3: Vytiskneme celou sekci kolem "časové osy"
print("\n=== Plný HTML kolem časové osy ===\n")
page_text = soup.get_text()
if 'Časová osa' in page_text:
    idx = page_text.find('Časová osa')
    print(f"Text nalezen na pozici: {idx}")
    print(f"Kontext:\n{page_text[idx:idx+500]}")
