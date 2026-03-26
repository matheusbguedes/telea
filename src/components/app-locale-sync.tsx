import {
  APP_LOCALE_UPDATED_EVENT,
  HTML_LANG_BY_APP_LOCALE,
  isAppLocale,
} from "@/types/app-locale";
import i18n from "@/lib/i18n";
import { listen } from "@tauri-apps/api/event";
import { useEffect } from "react";

function applyDocumentLanguage() {
  const lng = i18n.language;
  const code = isAppLocale(lng) ? HTML_LANG_BY_APP_LOCALE[lng] : "en";
  document.documentElement.lang = code;
  document.title = i18n.t("app.documentTitle");
}

export function AppLocaleSync() {
  useEffect(() => {
    applyDocumentLanguage();

    const onLanguageChanged = () => applyDocumentLanguage();
    i18n.on("languageChanged", onLanguageChanged);

    let unlisten: (() => void) | undefined;
    void listen<{ locale?: unknown }>(APP_LOCALE_UPDATED_EVENT, (event) => {
      const next = event.payload?.locale;
      if (isAppLocale(next) && next !== i18n.language) {
        void i18n.changeLanguage(next);
      }
    }).then((fn) => {
      unlisten = fn;
    });

    return () => {
      i18n.off("languageChanged", onLanguageChanged);
      unlisten?.();
    };
  }, []);

  return null;
}
