import { Button } from "@/components/animate-ui/components/buttons/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import i18n from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { saveAppLocale } from "@/storage/app-locale";
import { usePrompterSettings } from "@/stores/use-prompter-settings";
import { APP_LOCALES, type AppLocale, isAppLocale } from "@/types/app-locale";
import type { PrompterTextColor, PrompterTextSize } from "@/types/prompter-settings";
import { motion } from "framer-motion";
import { Settings2Icon } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

const SPEEDS = { min: 10, max: 50, step: 1 } as const;

const TEXT_SIZE_VALUES: PrompterTextSize[] = ["small", "medium", "large"];

const TEXT_COLORS: {
  value: PrompterTextColor;
  swatch: string;
  hex: string;
}[] = [
    { value: "white", swatch: "bg-white", hex: "#ffffff" },
    { value: "purple", swatch: "bg-purple-400", hex: "#c084fc" },
    { value: "yellow", swatch: "bg-yellow-400", hex: "#facc15" },
    { value: "green", swatch: "bg-green-400", hex: "#4ade80" },
  ];

const LOCALE_LABEL_KEYS: Record<AppLocale, string> = {
  en: "settings.langEn",
  pt: "settings.langPt",
  es: "settings.langEs",
};

export function PrompterSettingsSheet() {
  const { t } = useTranslation();
  const { settings, ready, update } = usePrompterSettings();
  const [isOpen, setIsOpen] = useState(false);

  const speedPct =
    ((settings.scrollSpeed - SPEEDS.min) / (SPEEDS.max - SPEEDS.min)) * 100;

  const activeLocale: AppLocale = isAppLocale(i18n.language) ? i18n.language : "en";

  async function selectLocale(locale: AppLocale) {
    if (locale === activeLocale) return;
    await saveAppLocale(locale);
    await i18n.changeLanguage(locale);
  }

  return (
    <>
      <style>{`
        .ps-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 4px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .ps-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 0 4px rgba(168,85,247,0.2), 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.2s, box-shadow 0.2s;
          cursor: grab;
        }
        .ps-range::-webkit-slider-thumb:hover {
          transform: scale(1.15);
          box-shadow: 0 0 0 6px rgba(168,85,247,0.25), 0 4px 12px rgba(0,0,0,0.5);
        }
        .ps-range::-webkit-slider-thumb:active { 
          cursor: grabbing;
          transform: scale(1.05);
        }
        .ps-range::-moz-range-thumb {
          width: 18px; 
          height: 18px;
          border-radius: 50%;
          background: #a855f7;
          border: none;
          box-shadow: 0 0 0 4px rgba(168,85,247,0.2), 0 2px 8px rgba(0,0,0,0.4);
        }
      `}</style>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label={t("settings.prompterSettingsAria")}
          >
            <Settings2Icon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="h-full bg-black/40 backdrop-blur-md border-white/[0.08] shadow-2xl w-[min(100vw,380px)]"
          showCloseButton={false}
        >
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col min-h-0 h-full pt-12 pb-6 px-6 gap-8"
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <h2
                className="text-xl font-bold text-white tracking-tight mb-1 select-none"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
              >
                {t("settings.title")}
              </h2>
              <p className="text-sm text-white/40 select-none">
                {t("settings.subtitle")}
              </p>
            </motion.div>
            {!ready ? (
              <div className="w-full flex flex-col gap-8 animate-pulse">
                <div className="flex flex-col gap-3">
                  <div className="w-24 h-4 bg-white/[0.08] rounded-md" />
                  <div className="w-full h-12 bg-white/[0.08] rounded-xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-24 h-4 bg-white/[0.08] rounded-md" />
                  <div className="w-full h-12 bg-white/[0.08] rounded-xl" />
                </div>
                <div className="flex flex-col gap-3">
                  <div className="w-24 h-4 bg-white/[0.08] rounded-md" />
                  <div className="w-full h-12 bg-white/[0.08] rounded-xl" />
                </div>
              </div>
            ) : (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="flex flex-col gap-4"
                >
                  <div className="flex items-center justify-between">
                    <label
                      className="text-sm font-medium text-white/80 select-none"
                      htmlFor="scroll-speed"
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      {t("settings.textSpeed")}
                    </label>
                    <span className="text-xs font-mono text-white/60 bg-white/[0.06] px-2.5 py-1 rounded-lg tabular-nums">
                      {settings.scrollSpeed}
                    </span>
                  </div>
                  <div className="px-1">
                    <input
                      id="scroll-speed"
                      type="range"
                      min={SPEEDS.min}
                      max={SPEEDS.max}
                      step={SPEEDS.step}
                      value={settings.scrollSpeed}
                      className="ps-range"
                      style={{
                        background: `linear-gradient(to right,
                          #a855f7 0%,
                          #a855f7 ${speedPct}%,
                          rgba(255,255,255,0.12) ${speedPct}%,
                          rgba(255,255,255,0.12) 100%)`,
                      }}
                      onChange={(e) => void update({ scrollSpeed: Number(e.target.value) })}
                    />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.25 }}
                  className="flex flex-col gap-3"
                >
                  <span
                    className="text-sm font-medium text-white/80 select-none"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {t("settings.textSize")}
                  </span>
                  <div className="flex gap-2">
                    {TEXT_SIZE_VALUES.map((value) => {
                      const active = settings.textSize === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => void update({ textSize: value })}
                          className={cn(
                            "flex-1 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-[0.96]",
                            active
                              ? "bg-purple-500/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10"
                              : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/80",
                          )}
                          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                        >
                          {t(`settings.sizes.${value}`)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="flex flex-col gap-3"
                >
                  <span
                    className="text-sm font-medium text-white/80 select-none"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                  >
                    {t("settings.textColor")}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {TEXT_COLORS.map(({ value, swatch, hex }) => {
                      const active = settings.textColor === value;
                      return (
                        <button
                          key={value}
                          type="button"
                          onClick={() => void update({ textColor: value })}
                          className={cn(
                            "flex items-center gap-2.5 py-2.5 px-3 rounded-xl text-sm font-medium transition-all duration-200 border active:scale-[0.96]",
                            active
                              ? "bg-purple-500/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10"
                              : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/80",
                          )}
                          style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                        >
                          <span
                            className={cn(
                              "size-3 rounded-full ring-2 ring-black/20 transition-all duration-200",
                              swatch,
                              active && "scale-110",
                            )}
                            style={active ? { boxShadow: `0 0 0 2px ${hex}40` } : undefined}
                            aria-hidden
                          />
                          {t(`settings.colors.${value}`)}
                        </button>
                      );
                    })}
                  </div>
                </motion.div>
              </>
            )}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="flex flex-col gap-3"
            >
              <span
                className="text-sm font-medium text-white/80 select-none"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                {t("settings.language")}
              </span>
              <div className="flex gap-2">
                {APP_LOCALES.map((locale) => {
                  const active = activeLocale === locale;
                  return (
                    <button
                      key={locale}
                      type="button"
                      onClick={() => void selectLocale(locale)}
                      className={cn(
                        "flex-1 py-2.5 px-2 rounded-xl text-xs font-medium transition-all duration-200 border active:scale-[0.96] sm:text-sm",
                        active
                          ? "bg-purple-500/20 border-purple-500/40 text-white shadow-lg shadow-purple-500/10"
                          : "bg-white/[0.04] border-white/[0.08] text-white/60 hover:bg-white/[0.08] hover:border-white/[0.12] hover:text-white/80",
                      )}
                      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
                    >
                      {t(LOCALE_LABEL_KEYS[locale])}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        </SheetContent>
      </Sheet>
    </>
  );
}
