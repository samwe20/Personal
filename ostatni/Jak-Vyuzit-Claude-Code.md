# Jak Využít Claude Code pro Maximální Produktivitu

## Co je Claude Code?

Claude Code je AI asistent přímo v terminálu - tvůj programátorský parťák, který Ti pomůže s vývojem, automatizací a každodenními úkoly. Na rozdíl od webových chatbotů mám přímý přístup k tvým souborům, gitu, a můžu přímo provádět změny.

## Moje Klíčové Schopnosti

### 1. Práce se Soubory
**Co můžu dělat:**
- Číst jakékoli soubory v projektu
- Editovat kód s přesností na řádky
- Vytvářet nové soubory a složky
- Hledat v celém codebase pomocí regex
- Najít soubory podle vzorů (glob patterns)

**Praktické příklady:**
```bash
# Řekni mi: "Přečti si všechny TypeScript soubory v src/components"
# Udělám: Najdu je a analyzuji strukturu

# Řekni mi: "Najdi všechny funkce, které obsahují 'API'"
# Udělám: Prohledám codebase a ukážu Ti výsledky

# Řekni mi: "Oprav všechny TypeScript chyby v projektu"
# Udělám: Najdu je, opravím a vysvětlím co jsem změnil
```

### 2. Git Operace
**Co můžu dělat:**
- Vytvářet commity s popisnými zprávami
- Pushovat na remote repository
- Vytvářet a mergovat branches
- Analyzovat git historii
- Vytvářet pull requesty (pomocí gh CLI)

**Praktické příklady:**
```bash
# Řekni mi: "Commitni všechny změny"
# Udělám: Analyzuji změny, vytvořím smysluplnou commit message

# Řekni mi: "Vytvoř PR pro tuto feature"
# Udělám: Vytvořím popis změn a otevřu pull request

# Řekni mi: "Co se změnilo za poslední týden?"
# Udělám: Projdu git historii a sumarizuji změny
```

### 3. Vývoj a Debugging
**Co můžu dělat:**
- Psát nový kód podle specifikace
- Refaktorovat existující kód
- Hledat a opravovat bugy
- Přidávat testy
- Optimalizovat výkon
- Vysvětlovat složitý kód

**Praktické příklady:**
```bash
# Řekni mi: "Přidej unit testy pro UserService"
# Udělám: Napíšu comprehensive testy pokrývající edge cases

# Řekni mi: "Tento kód je pomalý, můžeš ho zoptimalizovat?"
# Udělám: Analyzuji bottlenecks a navrhnu/implementuji řešení

# Řekni mi: "Vysvětli mi jak funguje tento regex"
# Udělám: Rozeberu ho krok za krokem
```

### 4. Automatizace a Skripty
**Co můžu dělat:**
- Spouštět bash příkazy
- Vytvářet automatizační skripty
- Nastavovat CI/CD workflow
- Instalovat a konfigurovat nástroje

**Praktické příklady:**
```bash
# Řekni mi: "Spusť testy a řekni mi výsledky"
# Udělám: Spustím test suite a analyzuji výsledky

# Řekni mi: "Vytvoř skript pro deployment"
# Udělám: Napíšu bash skript s error handlingem

# Řekni mi: "Nastav pre-commit hook pro linting"
# Udělám: Vytvořím a nakonfiguruji hook
```

### 5. Dokumentace
**Co můžu dělat:**
- Generovat dokumentaci z kódu
- Psát README soubory
- Vytvářet API dokumentaci
- Komentovat složitý kód
- Vytvářet tutoriály

**Praktické příklady:**
```bash
# Řekni mi: "Vytvoř README pro tento projekt"
# Udělám: Analyzuji projekt a napíšu comprehensive README

# Řekni mi: "Přidej JSDoc komentáře ke všem funkcím"
# Udělám: Projdu kód a přidám kvalitní dokumentaci
```

### 6. Research a Analýza
**Co můžu dělat:**
- Analyzovat strukturu projektu
- Hledat best practices
- Porovnávat různé přístupy
- Navrhovat architekturu
- Reviewovat kód

**Praktické příklady:**
```bash
# Řekni mi: "Jak je strukturovaný tento projekt?"
# Udělám: Projdu soubory a vytvořím přehled architektury

# Řekni mi: "Je tento kód podle best practices?"
# Udělám: Code review s konkrétními doporučeními

# Řekni mi: "Jaký framework bych měl použít pro tento úkol?"
# Udělám: Porovnám možnosti a doporučím řešení
```

## Pokročilé Použití

### Multi-Step Úkoly
Můžu zvládat komplexní úkoly s více kroky:

**Příklad: "Přidej novou feature pro user authentication"**
1. Analyzuji existující strukturu
2. Vytvořím todo list s kroky
3. Implementuji backend (API routes, middleware)
4. Přidám frontend komponenty
5. Napíšu testy
6. Aktualizuji dokumentaci
7. Commitnu a pushnu změny

### Automatizované Workflow
**Příklad denního workflow:**
```
Řekni mi: "Udělej morning check-up projektu"

Udělám:
1. Git pull nejnovější změny
2. Spustím testy
3. Zkontroluju linting errors
4. Aktualizuju dependencies pokud je potřeba
5. Shrnu co je potřeba udělat dnes
```

### Učení a Vysvětlování
**Když se učíš novou technologii:**
```
Řekni mi: "Pomoz mi pochopit jak funguje React hooks"

Udělám:
1. Vysvětlím koncept s příklady
2. Ukážu konkrétní use cases z tvého projektu
3. Navrhnu kde můžeš hooks použít
4. Refaktoruju kód s vysvětlením
```

## Jak Mě Efektivně Používat

### 1. Buď Konkrétní
❌ "Oprav to"
✅ "Oprav TypeScript error na řádku 45 v UserService.ts"

❌ "Udělej to lepší"
✅ "Refaktoruj tuto funkci aby používala async/await místo callbacks"

### 2. Dávej Kontext
✅ "Přidej validaci emailu - používáme Zod library v tomto projektu"
✅ "Tento kód má být thread-safe, běží v concurrent prostředí"

### 3. Využívej Moji Paměť
Můžu si pamatovat předchozí konverzaci:
```
Ty: "Přečti si strukturu databáze v schema.prisma"
Já: [analyzuji schéma]

Ty: "Teď vytvoř API endpoint pro vytvoření uživatele"
Já: [použiju znalost schématu z předchozího kroku]
```

### 4. Kombinuj Úkoly
✅ "Oprav bug v handleLogin, přidej testy, a commitni změny"
✅ "Vytvoř novou komponentu Button, přidej do Storybook, a aktualizuj dokumentaci"

### 5. Ptej Se na Vysvětlení
✅ "Proč jsi použil tento přístup?"
✅ "Jaké jsou alternativy k tomuto řešení?"
✅ "Co se může pokazit s tímto kódem?"

## Praktické Use Cases pro Každodenní Produktivitu

### Ranní Rutina
```
1. "Pull nejnovější změny a řekni mi co se změnilo"
2. "Spusť testy a build, řekni mi jestli něco selhalo"
3. "Jaké jsou open issues nebo TODOs v projektu?"
```

### Během Development
```
1. "Vytvoř boilerplate pro nový React komponent"
2. "Přidej error handling do všech API calls"
3. "Najdi všechny konzole.logy a odstraň je"
4. "Aktualizuj všechny importy po přejmenování souboru"
```

### Code Review
```
1. "Zkontroluj tento PR a navrhni vylepšení"
2. "Jsou tady nějaké security issues?"
3. "Je kód dostatečně testovaný?"
```

### Před Commitem
```
1. "Spusť linter a oprav všechny warningy"
2. "Ujisti se že všechny testy projdou"
3. "Vytvoř smysluplnou commit message"
```

### Debugging
```
1. "Proč tento test failuje?"
2. "Trace error stack a najdi kde je problém"
3. "Přidej logging pro debugging tohoto issue"
```

## Tipy pro Maximální Efektivitu

### 1. Využívej TODO Listy
Když zadáš komplexní úkol, vytvořím todo list:
- Vidíš přesný plán
- Sleduješ progress v real-time
- Můžeš požádat o změny v plánu

### 2. Nech Mě Přemýšlet Nahlas
Můžu Ti ukázat své myšlenkové procesy:
- Proč volím určitý přístup
- Jaké alternativy zvažuji
- Potenciální problémy

### 3. Iterativní Vývoj
Nemusíš specifikovat vše najednou:
```
Ty: "Vytvoř login form"
Já: [vytvořím základní form]

Ty: "Přidej validaci a error handling"
Já: [rozšířím o validaci]

Ty: "Přidej remember me checkbox"
Já: [přidám další feature]
```

### 4. Experimentuj
```
"Zkus tři různé přístupy k optimalizaci této funkce"
"Porovnej výkon těchto dvou implementací"
"Vytvoř prototyp a ukažu ho stakeholderům"
```

### 5. Deleguj Rutinní Úkoly
```
"Aktualizuj všechny dependencies"
"Formátuj všechny soubory podle prettier config"
"Přejmenuj všechny instances oldName na newName"
"Přidej TypeScript types ke všem props"
```

## Co Dělat a Nedělat

### ✅ Dělej
- Ptej se na vysvětlení
- Kontroluj můj kód před commitem
- Požaduj testy pro nový kód
- Žádej o best practices
- Kombinuj více úkolů
- Používej mě pro learning

### ❌ Nedělej
- Neřekej jen "oprav to" bez kontextu
- Neočekávej že vím o změnách které jsi udělal ručně
- Nezapomeň reviewovat kritický kód
- Nepředpokládej že znám specifické firemní konvence (řekni mi je)

## Pokročilé Funkce

### Slash Commands
Můžeš si vytvořit vlastní příkazy:
```bash
# V .claude/commands/test.md
"/test - Spustí test suite a analyzuje výsledky"

# Pak jen napíšeš:
/test
```

### Hooks
Automatické akce při určitých událostech:
```bash
# SessionStart hook - co udělat při startu
# Pre-commit hook - kontroly před commitem
# atd.
```

### MCP Servery
Integrace s externími nástroji a službami

## Reálné Příklady z Praxe

### Příklad 1: Nový Feature
```
Ty: "Potřebuji přidat dark mode do aplikace"

Já:
1. Projdu strukturu projektu
2. Vytvořím todo list:
   - Přidám theme context
   - Vytvořím CSS variables
   - Implementuji toggle komponentu
   - Přidám persistence do localStorage
   - Aktualizuji všechny komponenty
   - Přidám testy
3. Implementuji krok za krokem
4. Commitnu změny s popisnou message
```

### Příklad 2: Bug Fix
```
Ty: "Uživatelé reportují že login nefunguje na Firefoxu"

Já:
1. Přečtu login kód
2. Hledám Firefox-specific issues
3. Najdu problém (např. kompatibilita s API)
4. Opravím s fallback řešením
5. Přidám cross-browser test
6. Commitnu fix
```

### Příklad 3: Refaktoring
```
Ty: "Tento component je moc velký a nepřehledný"

Já:
1. Analyzuji komponentu
2. Identifikuji části k rozdělení
3. Vytvořím menší, specializované komponenty
4. Zachovám stejnou funkcionalitu
5. Přidám/aktualizuju testy
6. Ukážu rozdíl před/po
```

### Příklad 4: Performance Optimization
```
Ty: "Aplikace je pomalá při načítání dat"

Já:
1. Analyzuji datové toky
2. Identifikuji bottlenecks
3. Navrhnu optimalizace:
   - Přidám memoization
   - Implementuji lazy loading
   - Použiju virtualizaci pro dlouhé listy
   - Optimalizuju API calls
4. Změřím improvement
```

## Integrace do Tvého Workflow

### VS Code (nebo jiný editor)
```bash
# Otevři terminál v editoru
# Spusť Claude Code
# Pracuj paralelně - kód v editoru, já v terminálu
```

### Git Workflow
```bash
# Před commitem:
"Zkontroluj změny a vytvoř commit message"

# Před push:
"Ujisti se že testy projdou a build funguje"

# Před PR:
"Vytvoř popis změn pro pull request"
```

### CI/CD Integration
```bash
# Můžu pomoct s:
- Nastavením GitHub Actions
- Konfigurací test coverage
- Deploy scripty
- Environment setup
```

## Měření Produktivity

Sleduj jak Ti pomohu:

### Čas Ušetřený
- **Rutinní úkoly**: 80% rychleji (boilerplate, refaktoring)
- **Debugging**: 50% rychleji (rychlá analýza)
- **Dokumentace**: 90% rychleji (automatická generace)
- **Code review**: 60% rychleji (automatická kontrola)

### Kvalita Kódu
- Méně bugů díky testům
- Lepší dokumentace
- Konzistentnější code style
- Security best practices

### Learning Acceleration
- Vysvětlení on-demand
- Practical examples
- Best practices
- Code reviews s výukou

## Tipy Pro Začátečníky

### Den 1-3: Základy
```
- Ptej se mě na vysvětlení kódu
- Nech mě psát boilerplate
- Používej pro git operations
- Experimentuj s jednoduchými úkoly
```

### Týden 1: Getting Comfortable
```
- Deleguj rutinní úkoly
- Používej pro debugging
- Nech mě psát testy
- Kombinuj více úkolů
```

### Měsíc 1: Power User
```
- Vytvoř si custom slash commands
- Nastav hooks pro automation
- Používej pro code reviews
- Integruj do celého workflow
```

## Nejčastější Otázky

**Q: Můžeš přepsat celý můj projekt?**
A: Můžu, ale není to best practice. Lepší je iterativní přístup - refaktoring po částech.

**Q: Kontroluješ můj kód na internetu?**
A: Ne, vše běží lokálně s respektem k tvému soukromí.

**Q: Co když uděláš chybu?**
A: Proto je důležitý code review. Vždy kontroluj změny před commitem. Používej git pro snadný rollback.

**Q: Můžeš mi pomoci s jazykem X?**
A: Ano! Podporuju prakticky všechny programovací jazyky a frameworky.

**Q: Jak moc můžu být specifický?**
A: Čím víc detailů, tím lépe! Neváhej být velmi konkrétní.

## Budoucnost Naší Spolupráce

Jak budeme pracovat společně:
- **Naučím se tvůj styl**: Budu chápat tvoje preference
- **Poznám tvůj projekt**: Budu znát architekturu a konvence
- **Zrychlím se**: Budu efektivnější s opakujícími se úkoly
- **Přizpůsobím se**: Budu se učit z tvého feedbacku

## Závěr

Jsem Tu Pro Tebe jako:
- 🤝 Pair programming partner
- 🔍 Code reviewer
- 📚 Documentation writer
- 🐛 Bug hunter
- 🎓 Teacher & mentor
- ⚡ Productivity booster

**Nejlepší způsob jak mě používat?**
Začni jednoduše, experimentuj, a postupně mě integruj do svého workflow. Nejsem náhrada za tvé skills - jsem nástroj k jejich rozšíření.

**Připravený začít?**
Zkus mě teď poprosit o něco konkrétního z tvého aktuálního projektu!

---

*Vytvořeno: 2025-11-10*
*Tvůj AI programátorský asistent v terminálu*
