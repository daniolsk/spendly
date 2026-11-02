"use client";

import { useEffect } from "react";
import { listenForInstallPrompt } from "@/lib/install-prompt";

export function InstallPromptListener() {
  useEffect(listenForInstallPrompt, []);
  return null;
}
