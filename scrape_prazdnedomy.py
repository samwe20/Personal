#!/usr/bin/env python3
"""
Skript pro vytěžení kalendária z databaze.prazdnedomy.cz
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import re
from datetime import datetime


def scrape_calendar(url):
    """Vytěží data z kalendária na stránce Prázdné domy"""
    
    print(f"Stahuji data z: {url}")
    response = requests.get(url)
    response.raise_for_status()
    
    soup = BeautifulSoup(response.content, 'html.parser')
    
    events = []
    
    # Najdeme všechny položky seznamu (li elementy)
    list_items = soup.find_all('li')
    
    for item in list_items:
        text = item.get_text(strip=True)
        
        # Parsujeme datum a popis události
        # Formát: "DD.MM.YYYY - popis události"
        match = re.match(r'(\d{1,2}\.\d{1,2}\.\d{4})\s*-\s*(.+)', text)
        
        if match:
            date_str = match.group(1)
            description = match.group(2)
            
            # Převedeme datum do ISO formátu
            try:
                date_obj = datetime.strptime(date_str, '%d.%m.%Y')
                iso_date = date_obj.strftime('%Y-%m-%d')
            except ValueError:
                iso_date = date_str
            
            events.append({
                'datum': date_str,
                'datum_iso': iso_date,
                'popis': description
            })
    
    print(f"Vytěženo {len(events)} událostí")
    return events


def save_to_json(data, filename='prazdnedomy_kalendarium.json'):
    """Uloží data do JSON souboru"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    print(f"Data uložena do: {filename}")


def save_to_csv(data, filename='prazdnedomy_kalendarium.csv'):
    """Uloží data do CSV souboru"""
    if not data:
        print("Žádná data k uložení")
        return
    
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=['datum', 'datum_iso', 'popis'])
        writer.writeheader()
        writer.writerows(data)
    print(f"Data uložena do: {filename}")


def main():
    url = 'https://databaze.prazdnedomy.cz/kalendarium/'
    
    try:
        events = scrape_calendar(url)
        
        if events:
            save_to_json(events)
            save_to_csv(events)
            
            print("\n=== Statistiky ===")
            print(f"Celkem událostí: {len(events)}")
            if events:
                print(f"První událost: {events[-1]['datum']} - {events[-1]['popis'][:50]}...")
                print(f"Poslední událost: {events[0]['datum']} - {events[0]['popis'][:50]}...")
        else:
            print("Nebyly nalezeny žádné události")
            
    except Exception as e:
        print(f"Chyba při vytěžování dat: {e}")
        raise


if __name__ == '__main__':
    main()
