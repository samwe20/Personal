import "@fontsource-variable/literata";
import "@fontsource-variable/plus-jakarta-sans";
import "@fontsource/jetbrains-mono/400.css";
import "@fontsource/jetbrains-mono/500.css";
import { FolioApp } from "./app";
import { isTauri } from "./lib/runtime";

const app = new FolioApp();
void app.init();

if (!isTauri() && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    void navigator.serviceWorker.register("./sw.js").catch((err) => {
      console.warn("SW registration failed", err);
    });
  });
}