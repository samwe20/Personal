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

## Poznámky

- Není to nativní iOS appka ze App Store
- Složku z disku nevybíráš — knihovna je uvnitř prohlížeče
- Na telefonu otevřeš `[[odkaz]]` **dlouhým stiskem**
