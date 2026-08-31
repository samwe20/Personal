#!/usr/bin/env python3
"""
Script pro vytvoření všech 7860 objektů jako markdown soubory pro Obsidian
UPOZORNĚNÍ: Vytvoří 7860 souborů!
"""

import json
from pathlib import Path
from tqdm import tqdm

def create_all_markdown_files():
    """Vytvoří markdown soubor pro každý objekt"""
    
    # Načteme data
    with open('prazdnedomy_full.json', 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    print(f"Načteno {len(data)} objektů")
    print("⚠️  Vytvoří se 7860 markdown souborů!")
    
    response = input("Pokračovat? (ano/ne): ")
    if response.lower() not in ['ano', 'a', 'yes', 'y']:
        print("Zrušeno.")
        return
    
    # Vytvoříme složku
    output_dir = Path('Prazdnedomy_Vsechny_Objekty')
    output_dir.mkdir(exist_ok=True)
    
    # Vytvoříme soubor pro každý objekt
    for i, obj in enumerate(tqdm(data, desc="Vytváření markdown souborů"), 1):
        name = obj.get('name', f'objekt_{i}')
        # Bezpečný název souboru
        safe_name = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in name)
        safe_name = safe_name[:100]  # Limit délky
        
        # Pokud už soubor existuje, přidáme číslo
        filename = output_dir / f"{safe_name}.md"
        counter = 1
        while filename.exists():
            filename = output_dir / f"{safe_name}_{counter}.md"
            counter += 1
        
        with open(filename, 'w', encoding='utf-8') as f:
            # Frontmatter pro Obsidian
            f.write(f"---\n")
            f.write(f"typ: historický objekt\n")
            f.write(f"zdroj: prazdnedomy.cz\n")
            if obj.get('coordinates'):
                f.write(f"latitude: {obj['coordinates']['latitude']}\n")
                f.write(f"longitude: {obj['coordinates']['longitude']}\n")
            f.write(f"pocet_udalosti: {len(obj.get('timeline', []))}\n")
            f.write(f"pocet_clanku: {len(obj.get('articles', []))}\n")
            f.write(f"---\n\n")
            
            # Obsah
            f.write(f"# {obj.get('name', 'Neznámý objekt')}\n\n")
            
            if obj.get('url'):
                f.write(f"🔗 [Zobrazit na prazdnedomy.cz]({obj['url']})\n\n")
            
            if obj.get('coordinates'):
                coords = obj['coordinates']
                f.write(f"📍 **GPS**: {coords['latitude']}, {coords['longitude']}\n\n")
            
            if obj.get('object_info') and obj['object_info'].get('info_text'):
                f.write(f"ℹ️ **Info**: {obj['object_info']['info_text']}\n\n")
            
            if obj.get('persons') and obj['persons'].get('raw_text'):
                f.write(f"👤 **Osoby**: {obj['persons']['raw_text']}\n\n")
            
            if obj.get('description'):
                f.write(f"## Popis\n\n{obj['description']}\n\n")
            
            if obj.get('timeline'):
                f.write(f"## Časová osa ({len(obj['timeline'])} událostí)\n\n")
                for event in obj['timeline']:
                    f.write(f"### {event['date']}\n")
                    f.write(f"{event['event']}\n\n")
            
            if obj.get('articles'):
                f.write(f"## Články ({len(obj['articles'])})\n\n")
                for article in obj['articles']:
                    f.write(f"- [{article['title']}]({article['url']})\n")
                f.write("\n")
            
            if obj.get('external_links'):
                f.write(f"## Externí odkazy ({len(obj['external_links'])})\n\n")
                for link in obj['external_links'][:20]:
                    f.write(f"- [{link['text']}]({link['url']})\n")
                f.write("\n")
            
            if obj.get('author'):
                f.write(f"---\n\n*{obj['author']}*\n")
    
    print(f"\n✅ Vytvořeno {len(data)} markdown souborů ve složce: {output_dir}")
    print(f"📁 Velikost: ~{len(data) * 5 / 1024:.1f} MB")


if __name__ == '__main__':
    try:
        import tqdm
    except ImportError:
        print("Instaluji tqdm...")
        import subprocess
        subprocess.run(['pip', 'install', '-q', 'tqdm'])
        import tqdm
    
    create_all_markdown_files()
