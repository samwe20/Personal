import "@fontsource-variable/literata";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import { FolioApp } from "./app";
import { isTauri } from "./lib/runtime";

const app = new FolioApp();
void app.init().catch((error) => {
  console.error("Folio startup failed", error);
  const status = document.getElementById("status-save");
  if (status) status.textContent = "Knihovnu se nepodařilo otevřít. Zkuste obnovit stránku nebo vybrat složku znovu.";
});

if (import.meta.env.PROD && !isTauri() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}
