"use client";

import { useSyncExternalStore } from "react";
import { STANDALONE_COOKIE } from "@/lib/standalone";

// Chrome/Edge/Samsung Internet fire `beforeinstallprompt` once per page load when the
// app can be installed; keep it so a button can show the install dialog later.
// Safari (iOS) has no such API, so iPhone users get instructions instead.

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferred: InstallPromptEvent | null = null;
let installed = false;
let listening = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

/** Starts listening; called from the root layout so the event isn't missed before Settings mounts. */
export function listenForInstallPrompt() {
  if (listening) return;
  listening = true;
  // Android shares cookies with Chrome (and uses the manifest start_url anyway), so iOS only.
  if ((navigator as Navigator & { standalone?: boolean }).standalone === true) {
    document.cookie = `${STANDALONE_COOKIE}=1; path=/; max-age=31536000; samesite=lax; secure`;
  }
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    emit();
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    installed = true;
    emit();
  });
}

export type InstallState = "unknown" | "standalone" | "installed" | "prompt" | "ios" | "manual";

function isStandalone() {
  return (
    window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos() {
  // iPadOS reports itself as a Mac; tell it apart by touch support.
  return /iPhone|iPad|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function getState(): InstallState {
  if (isStandalone()) return "standalone";
  if (installed) return "installed";
  if (deferred) return "prompt";
  return isIos() ? "ios" : "manual";
}

export function useInstallState() {
  return useSyncExternalStore(
    (onChange) => {
      listeners.add(onChange);
      return () => listeners.delete(onChange);
    },
    getState,
    () => "unknown" as const,
  );
}

/** Shows the browser's install dialog. Resolves to true when the user accepted. */
export async function promptInstall() {
  const event = deferred;
  if (!event) return false;
  await event.prompt();
  const { outcome } = await event.userChoice;
  // A prompt can only be used once.
  deferred = null;
  if (outcome === "accepted") installed = true;
  emit();
  return outcome === "accepted";
}
