import { enUS, es, ptBR } from "date-fns/locale";
import type { Locale } from "date-fns";

export function getDateFnsLocaleForApp(language: string): Locale {
  const base = language.split("-")[0];
  if (base === "pt") return ptBR;
  if (base === "es") return es;
  return enUS;
}
