/** Rough mobile / iOS detection for layout + library defaults. */

export function isAppleMobile(): boolean {
  const ua = navigator.userAgent || "";
  if (/iPhone|iPad|iPod/i.test(ua)) return true;
  // iPadOS desktop UA spoof
  return navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
}

export function isMobileUi(): boolean {
  return (
    isAppleMobile() ||
    window.matchMedia("(max-width: 820px)").matches ||
    window.matchMedia("(pointer: coarse)").matches
  );
}

export function isTouchPrimary(): boolean {
  return window.matchMedia("(pointer: coarse)").matches || isAppleMobile();
}
