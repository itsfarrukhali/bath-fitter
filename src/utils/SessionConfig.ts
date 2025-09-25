import { SessionConfig } from "@/types/design";

const STORAGE_KEY = "showerConfig";

export const getConfig = (): SessionConfig => {
  try {
    if (typeof window === "undefined") return {};
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export const updateConfig = (patch: Partial<SessionConfig>): SessionConfig => {
  const current = getConfig();
  const updated = { ...current, ...patch };
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
  return updated;
};
