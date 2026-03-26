import App from "@/App";
import { AppLocaleSync } from "@/components/app-locale-sync";
import { TextProvider } from "@/contexts/text-context";
import { initI18n } from "@/lib/i18n";
import i18n from "@/lib/i18n";
import { getAppLocale } from "@/storage/app-locale";
import React from "react";
import ReactDOM from "react-dom/client";
import { I18nextProvider } from "react-i18next";

async function bootstrap() {
  const locale = await getAppLocale();
  await initI18n(locale);

  ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
    <React.StrictMode>
      <I18nextProvider i18n={i18n}>
        <AppLocaleSync />
        <TextProvider>
          <App />
        </TextProvider>
      </I18nextProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
