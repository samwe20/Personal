# Pošta

Vlastní pošta ve třech panelech: složky, seznam a čtení. Schránka je místní soubor. Gmail se připojí heslem aplikace a pošta se stáhne sem.

```bash
cd posta
npm ci
npm test
npm start
```

Aplikace běží na http://localhost:1430. Data jsou v `data/mailbox.json` a do gitu nepatří, protože v nich může být heslo i zprávy.
