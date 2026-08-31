#!/usr/bin/env python3
"""
Komplexní scraper pro vytěžení celé databáze domů z prazdnedomy.cz
Vytěží všechny objekty včetně jejich detailů, časových os, popisů a metadat
"""

import requests
from bs4 import BeautifulSoup
import json
import csv
import re
from datetime import datetime
import time
from urllib.parse import urljoin
import logging

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class PrazdneDomyScraper:
    """Scraper pro databázi Prázdných domů"""
    
    BASE_URL = "https://databaze.prazdnedomy.cz"
    LIST_URL = f"{BASE_URL}/domy/objekty/"
    
    def __init__(self, delay=1.0):
        self.delay = delay
        self.session = requests.Session()
        self.session.headers.update({
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        })
    
    def get_page(self, url):
        """Stáhne stránku s retry mechanikou"""
        max_retries = 3
        for attempt in range(max_retries):
            try:
                time.sleep(self.delay)
                response = self.session.get(url, timeout=30)
                response.raise_for_status()
                return response
            except Exception as e:
                logger.warning(f"Pokus {attempt + 1}/{max_retries} selhal pro {url}: {e}")
                if attempt == max_retries - 1:
                    raise
                time.sleep(self.delay * 2)
    
    def get_total_pages(self):
        """Zjistí celkový počet stránek"""
        response = self.get_page(self.LIST_URL)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Najdeme poslední číslo stránky
        pagination = soup.find('div', class_='paginator')
        if pagination:
            links = pagination.find_all('a')
            pages = []
            for link in links:
                text = link.get_text(strip=True)
                if text.isdigit():
                    pages.append(int(text))
            if pages:
                return max(pages)
        return 1
    
    def scrape_object_list(self, page=1):
        """Vytěží seznam objektů z jedné stránky"""
        url = f"{self.LIST_URL}?page={page}" if page > 1 else self.LIST_URL
        logger.info(f"Stahuji stránku {page}: {url}")
        
        response = self.get_page(url)
        soup = BeautifulSoup(response.content, 'html.parser')
        
        objects = []
        items = soup.find_all('h3')
        
        for item in items:
            link = item.find('a')
            if link and link.get('href'):
                obj_url = urljoin(self.BASE_URL, link['href'])
                obj_name = link.get_text(strip=True)
                objects.append({
                    'name': obj_name,
                    'url': obj_url
                })
        
        return objects
    
    def extract_coordinates(self, text):
        """Extrahuje GPS souřadnice z textu"""
        pattern = r"(\d+)°\s*(\d+)'\s*([\d.]+)''[,\s]+(\d+)°\s*(\d+)'\s*([\d.]+)''"
        match = re.search(pattern, text)
        if match:
            lat_deg, lat_min, lat_sec, lon_deg, lon_min, lon_sec = match.groups()
            lat = float(lat_deg) + float(lat_min)/60 + float(lat_sec)/3600
            lon = float(lon_deg) + float(lon_min)/60 + float(lon_sec)/3600
            return {
                'latitude': round(lat, 6),
                'longitude': round(lon, 6),
                'original': match.group(0)
            }
        return None
    
    def scrape_timeline(self, soup):
        """Vytěží časovou osu objektu"""
        timeline = []
        seen_events = set()
        
        # Hledáme timeline-item elementy
        timeline_items = soup.find_all('div', class_='timeline-item')
        
        for item in timeline_items:
            # Hledáme datum v <span class="year">
            year_span = item.find('span', class_='year')
            label_span = item.find('span', class_='lbl')
            
            if year_span:
                date = year_span.get_text(strip=True)
                category = label_span.get_text(strip=True) if label_span else ""
                
                # Získáme celý text a odstraníme z něj datum a kategorii
                full_text = item.get_text(strip=True)
                description = full_text
                
                # Odstraníme datum a kategorii z popisu
                if date in description:
                    description = description.replace(date, '', 1).strip()
                if category in description:
                    description = description.replace(category, '', 1).strip()
                
                # Kombinujeme kategorii a popis
                if category and description:
                    event = f"{category} - {description}"
                elif category:
                    event = category
                else:
                    event = description
                
                # Validace data
                if re.match(r'^\d{1,2}/\d{4}$|^\d{4}$', date):
                    event_key = f"{date}:{event[:50]}"
                    if event_key not in seen_events and len(event) > 5:
                        seen_events.add(event_key)
                        timeline.append({
                            'date': date,
                            'event': event[:500]  # Limit délky
                        })
        
        return timeline
    
    def scrape_object_detail(self, url):
        """Vytěží detailní informace o objektu"""
        logger.info(f"Stahuji detail: {url}")
        
        try:
            response = self.get_page(url)
            soup = BeautifulSoup(response.content, 'html.parser')
            
            # Základní informace
            title = soup.find('h1')
            obj_name = title.get_text(strip=True) if title else "Neznámý objekt"
            
            # Extrakce adresních informací
            address_text = soup.get_text()
            
            # GPS souřadnice
            coordinates = self.extract_coordinates(address_text)
            
            # Stav nemovitosti a typ
            obj_info = {}
            info_section = soup.find('div', class_='object-info')
            if info_section:
                obj_info['info_text'] = info_section.get_text(strip=True)
            
            # Osoby spojené s objektem (architekti, majitelé)
            persons = {}
            person_section = soup.find('div', text=re.compile('Osoby spjaté'))
            if person_section:
                parent = person_section.find_parent()
                if parent:
                    persons['raw_text'] = parent.get_text(strip=True)
            
            # Doplňující informace (popis)
            description = ""
            for heading in soup.find_all(['h4', 'h3']):
                if 'doplňující informace' in heading.get_text().lower():
                    # Najdeme následující text až do dalšího nadpisu
                    desc_parts = []
                    current = heading.find_next_sibling()
                    while current and current.name not in ['h2', 'h3', 'h4']:
                        text = current.get_text(strip=True)
                        if len(text) > 50 and 'Zobrazit' not in text:
                            desc_parts.append(text)
                        current = current.find_next_sibling()
                    
                    description = ' '.join(desc_parts)
                    break
            
            # Časová osa
            timeline = self.scrape_timeline(soup)
            
            # Odkazy na články
            articles = []
            for heading in soup.find_all(['h4', 'h3']):
                if 'články' in heading.get_text().lower():
                    current = heading.find_next_sibling()
                    while current and current.name not in ['h2', 'h3', 'h4']:
                        links = current.find_all('a')
                        for link in links:
                            if link.get('href') and link.get_text(strip=True):
                                articles.append({
                                    'title': link.get_text(strip=True),
                                    'url': link.get('href')
                                })
                        current = current.find_next_sibling()
                    break
            
            # Odkazy
            external_links = []
            for heading in soup.find_all(['h4', 'h3']):
                if heading.get_text().strip() == 'Odkazy':
                    current = heading.find_next_sibling()
                    while current and current.name not in ['h2', 'h3', 'h4']:
                        links = current.find_all('a')
                        for link in links:
                            if link.get('href'):
                                external_links.append({
                                    'text': link.get_text(strip=True),
                                    'url': link.get('href')
                                })
                        current = current.find_next_sibling()
                    break
            
            # Autor karty
            author = ""
            author_section = soup.find('div', text=re.compile('Autor karty'))
            if author_section:
                author = author_section.get_text(strip=True)
            
            return {
                'url': url,
                'name': obj_name,
                'coordinates': coordinates,
                'object_info': obj_info,
                'persons': persons,
                'description': description[:1000] if description else "",  # Limit pro úsporu místa
                'timeline': timeline,
                'articles': articles,
                'external_links': external_links[:10],  # Limit pro úsporu místa
                'author': author,
                'scraped_at': datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Chyba při stahování {url}: {e}")
            return {
                'url': url,
                'error': str(e),
                'scraped_at': datetime.now().isoformat()
            }
    
    def scrape_all(self, max_pages=None, max_objects=None):
        """Vytěží všechny objekty z databáze"""
        logger.info("Začínám vytěžování databáze...")
        
        # Zjistíme počet stránek
        total_pages = self.get_total_pages()
        logger.info(f"Celkem stránek: {total_pages}")
        
        if max_pages:
            total_pages = min(total_pages, max_pages)
        
        # Projdeme všechny stránky a sesbíráme odkazy
        all_objects = []
        for page in range(1, total_pages + 1):
            objects = self.scrape_object_list(page)
            all_objects.extend(objects)
            logger.info(f"Stránka {page}/{total_pages}: nalezeno {len(objects)} objektů")
            
            if max_objects and len(all_objects) >= max_objects:
                all_objects = all_objects[:max_objects]
                break
        
        logger.info(f"Celkem objektů k vytěžení: {len(all_objects)}")
        
        # Vytěžíme detaily jednotlivých objektů
        detailed_objects = []
        for i, obj in enumerate(all_objects, 1):
            logger.info(f"Vytěžuji objekt {i}/{len(all_objects)}: {obj['name']}")
            detail = self.scrape_object_detail(obj['url'])
            detailed_objects.append(detail)
            
            # Průběžné ukládání každých 100 objektů
            if i % 100 == 0:
                self.save_checkpoint(detailed_objects, i)
        
        return detailed_objects
    
    def save_checkpoint(self, data, count):
        """Uloží průběžný checkpoint"""
        filename = f"prazdnedomy_checkpoint_{count}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
        logger.info(f"Checkpoint uložen: {filename}")


def save_to_json(data, filename='prazdnedomy_full.json'):
    """Uloží data do JSON souboru"""
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)
    logger.info(f"Data uložena do: {filename}")


def save_summary_csv(data, filename='prazdnedomy_summary.csv'):
    """Uloží přehledné CSV se základními informacemi"""
    if not data:
        logger.warning("Žádná data k uložení")
        return
    
    with open(filename, 'w', encoding='utf-8', newline='') as f:
        fieldnames = ['name', 'url', 'latitude', 'longitude', 'timeline_events', 'has_description', 'articles_count']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        
        for obj in data:
            if 'error' not in obj:
                row = {
                    'name': obj.get('name', ''),
                    'url': obj.get('url', ''),
                    'latitude': obj.get('coordinates', {}).get('latitude', '') if obj.get('coordinates') else '',
                    'longitude': obj.get('coordinates', {}).get('longitude', '') if obj.get('coordinates') else '',
                    'timeline_events': len(obj.get('timeline', [])),
                    'has_description': 'yes' if obj.get('description') else 'no',
                    'articles_count': len(obj.get('articles', []))
                }
                writer.writerow(row)
    
    logger.info(f"Summary CSV uloženo do: {filename}")


def main():
    """Hlavní funkce"""
    import sys
    
    scraper = PrazdneDomyScraper(delay=0.5)
    
    # Kontrola argumentů z příkazové řádky
    full_scrape = '--full' in sys.argv
    
    if full_scrape:
        logger.info("=== PLNÉ VYTĚŽENÍ VŠECH OBJEKTŮ ===")
        logger.info("Vytěžím celou databázi (~7855 objektů)")
        logger.info("To může trvat několik hodin!")
        objects = scraper.scrape_all(max_pages=None, max_objects=None)
    else:
        logger.info("=== TESTOVACÍ REŽIM ===")
        logger.info("Pro test vytěžím prvních 50 objektů")
        logger.info("Pro plné vytěžení spusťte: python3 scrape_prazdnedomy_full.py --full")
        objects = scraper.scrape_all(max_pages=2, max_objects=50)
    
    # Uložíme výsledky
    save_to_json(objects)
    save_summary_csv(objects)
    
    # Statistiky
    logger.info("\n=== STATISTIKY ===")
    logger.info(f"Celkem vytěženo objektů: {len(objects)}")
    
    successful = [o for o in objects if 'error' not in o]
    failed = [o for o in objects if 'error' in o]
    
    logger.info(f"Úspěšně vytěženo: {len(successful)}")
    logger.info(f"Chyby: {len(failed)}")
    
    if successful:
        with_coords = [o for o in successful if o.get('coordinates')]
        with_timeline = [o for o in successful if o.get('timeline')]
        with_desc = [o for o in successful if o.get('description')]
        
        logger.info(f"Objektů s GPS souřadnicemi: {len(with_coords)}")
        logger.info(f"Objektů s časovou osou: {len(with_timeline)}")
        logger.info(f"Objektů s popisem: {len(with_desc)}")
        
        if with_timeline:
            total_events = sum(len(o.get('timeline', [])) for o in with_timeline)
            logger.info(f"Celkem událostí v časových osách: {total_events}")
            
            # Ukázka časové osy z prvního objektu
            if len(successful) > 0 and successful[0].get('timeline'):
                logger.info(f"\n=== Příklad časové osy z objektu: {successful[0]['name']} ===")
                for event in successful[0]['timeline'][:5]:
                    logger.info(f"  {event['date']}: {event['event'][:80]}...")


if __name__ == '__main__':
    main()
