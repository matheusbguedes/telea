import {
  APP_LOCALE_UPDATED_EVENT,
  DEFAULT_APP_LOCALE,
  type AppLocale,
  type AppLocaleUpdatedPayload,
  isAppLocale,
} from "@/types/app-locale";
import { emit } from "@tauri-apps/api/event";
import { load } from "@tauri-apps/plugin-store";

const store = await load("app-locale.json", { autoSave: false, defaults: {} });

export async function getAppLocale(): Promise<AppLocale> {
  const saved = await store.get<unknown>("locale");
  if (isAppLocale(saved)) return saved;

  await store.set("locale", DEFAULT_APP_LOCALE);
  await store.save();
  return DEFAULT_APP_LOCALE;
}

export async function saveAppLocale(locale: AppLocale): Promise<void> {
  await store.set("locale", locale);
  await store.save();
  await emit(APP_LOCALE_UPDATED_EVENT, { locale } satisfies AppLocaleUpdatedPayload);
}
