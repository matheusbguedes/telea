export type AppLocale = "en" | "pt" | "es";

export const DEFAULT_APP_LOCALE: AppLocale = "en";

export const APP_LOCALES: AppLocale[] = ["en", "pt", "es"];

export const APP_LOCALE_UPDATED_EVENT = "app-locale-updated" as const;

export type AppLocaleUpdatedPayload = {
  locale: AppLocale;
};

export const HTML_LANG_BY_APP_LOCALE: Record<AppLocale, string> = {
  en: "en",
  pt: "pt-BR",
  es: "es",
};

export function isAppLocale(value: unknown): value is AppLocale {
  return value === "en" || value === "pt" || value === "es";
}
