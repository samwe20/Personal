#!/usr/bin/env python3
import requests
from bs4 import BeautifulSoup
import re

url = "https://databaze.prazdnedomy.cz/domy/objekty/detail/80-mottluv-dum-cp-761"
response = requests.get(url)
soup = BeautifulSoup(response.content, 'html.parser')

print("=== Timeline Items ===\n")
timeline_items = soup.find_all('div', class_='timeline-item')
print(f"Počet timeline-item elemntů: {len(timeline_items)}\n")

for i, item in enumerate(timeline_items[:5], 1):
    print(f"\n--- Item {i} ---")
    print(f"HTML: {item}")
    print(f"\nText: {item.get_text()[:200]}")
    
    # Zkusíme parsovat
    text = item.get_text(strip=True)
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    print(f"\nLines: {lines}")
    
    if len(lines) >= 2:
        date = lines[0]
        category = lines[1] if len(lines) > 2 else ""
        description = ' '.join(lines[2:]) if len(lines) > 2 else lines[1]
        
        print(f"\nParsed:")
        print(f"  Date: '{date}'")
        print(f"  Category: '{category}'")
        print(f"  Description: '{description[:100]}'")
        
        # Validace data
        is_valid = re.match(r'^\d{1,2}/\d{4}$|^\d{4}$', date)
        print(f"  Valid date: {bool(is_valid)}")
