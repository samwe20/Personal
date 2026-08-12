# Folio PWA (iPhone / prohlížeč)

Webová verze Folia funguje v **Safari na iPhonu** bez Macu a bez App Store.

## Rychlý start u sebe

```bash
cd folio
npm install
npm run web:dev
```

Nebo produkční build:

```bash
npm run web:build
npm run web:preview
```

## Přidat na plochu iPhonu

1. Otevři Folio v **Safari**
2. Klepni **Sdílet**
3. **Přidat na plochu**
4. Otevři ikonu Folio

## Co běží v prohlížeči

- poznámky v **IndexedDB** (zůstávají v zařízení)
- `[[wikilinky]]` + backlinky
- mobilní drawer / Links sheet
- offline shell přes service worker
- **Export na disk** / **Import .md** (v levém panelu)

## Jak dostat poznámky na disk (iPhone)

Safari neumí webovce tiše zapisovat do složky Soubory. Funguje to takto:

1. Otevři knihovnu (☰)
2. Klepni **Export na disk**
3. V share sheetu zvol **Uložit do Souborů**
4. Vyber složku (iCloud Drive, Na mém iPhonu, …)

Obráceně: **Import .md** načte soubory ze Souborů zpět do Folia.

Na desktop Chrome/Edge je navíc **Uložit do složky** (File System Access API).

## Poznámky

- Není to nativní iOS appka ze App Store
- Primární úložiště zůstává IndexedDB; disk je přes export/import
- Na telefonu otevřeš `[[odkaz]]` **dlouhým stiskem**
