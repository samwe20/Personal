# Folio na iOS

Nativní iOS build Folia běží přes **Tauri 2 + Xcode**.  
Apple dovoluje sestavení jen na **macOS** — z Windows/Linuxu (ani z tohoto cloudu) `.ipa` nevznikne.

## Co už je v projektu připravené

- Mobilní UI (drawer knihovny, bottom sheet pro backlinky, safe areas)
- Na iPhonu se knihovna ukládá do app sandboxu (není potřeba vybírat složku)
- `src-tauri/tauri.ios.conf.json`
- npm skripty `ios:init`, `ios:dev`, `ios:build`

## Požadavky na Macu

1. macOS + **Xcode** (celé IDE, ne jen CLI tools)
2. Node.js 20+
3. Rust (`rustup`)
4. CocoaPods (`brew install cocoapods`)
5. Rust iOS targety:

```bash
rustup target add aarch64-apple-ios aarch64-apple-ios-sim x86_64-apple-ios
```

6. Apple ID v Xcode (pro zařízení / TestFlight ideálně Apple Developer Program)

## První sestavení

```bash
cd folio
npm install

# jednou vygeneruje Xcode projekt
npm run ios:init

# simulátor / připojený iPhone
npm run ios:dev
```

Release / IPA:

```bash
npm run ios:build
```

Nastav development team (jednou):

```bash
export APPLE_DEVELOPMENT_TEAM=XXXXXXXXXX
```

nebo v Xcode: *Signing & Capabilities* → Team.

## Na iPhonu bez Macu

Bez Macu nejde nativní Folio nainstalovat přímo z tohoto repa.  
Možnosti:

1. Sestavit na Macu / přes známého s Macem a poslat přes **TestFlight**
2. Počkat na webovou / PWA verzi (můžeme přidat jako další krok)

## iOS chování Folia

- První start → nabídne / vytvoří **ukázkovou knihovnu** v app Documents
- Knihovna = levý **drawer** (hamburger)
- Backlinky = **Links** otevře spodní sheet
- `[[odkaz]]` otevřeš **dlouhým stiskem** (na desktopu zůstává dvojklik)
