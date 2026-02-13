const UTM_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const;

type UtmKey = (typeof UTM_KEYS)[number];
export type UtmData = Partial<Record<UtmKey, string>>;

const STORAGE_KEY = "fm_utm";

export function captureUtmFromLocation(search: string) {
  if (typeof window === "undefined") {
    return;
  }

  const params = new URLSearchParams(search);
  const current = getStoredUtm();

  UTM_KEYS.forEach((key) => {
    const value = params.get(key);
    if (value) {
      current[key] = value;
    }
  });

  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getStoredUtm(): UtmData {
  if (typeof window === "undefined") {
    return {};
  }

  const raw = window.sessionStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return {};
  }

  try {
    return JSON.parse(raw) as UtmData;
  } catch {
    return {};
  }
}
