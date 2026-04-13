import { cn } from "@/lib/utils";
import { clearDevice } from "@/storage/device";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2 } from "lucide-react";
import { useState } from "react";
import { Trans, useTranslation } from "react-i18next";

const PURCHASE_URL = "https://buy.stripe.com/14A00j5OR17maLE08w6EU02";
const SUPPORT_EMAIL = "mailto:support@usetelea.online";

interface TrialExpiredProps {
  onEnterLicenseKey?: () => void;
}

export function TrialExpired({ onEnterLicenseKey }: TrialExpiredProps) {
  const { t } = useTranslation();
  const [isOpening, setIsOpening] = useState(false);

  async function handleEnterLicenseKey() {
    await clearDevice();
    window.dispatchEvent(new Event("authorizer:recheck"));
    onEnterLicenseKey?.();
  }

  async function handleGetLicense() {
    if (isOpening) return;
    setIsOpening(true);
    try {
      await openUrl(PURCHASE_URL);
    } finally {
      setIsOpening(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <div data-tauri-drag-region className="w-screen h-7 absolute top-0 left-0 z-50" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center w-full max-w-sm px-6"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 relative"
        >
          <img
            src="/icon.png"
            alt={t("trialExpired.logoAlt")}
            className="relative size-20 object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-white tracking-tight mb-1 select-none text-center"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
        >
          {t("trialExpired.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
        >
          {t("trialExpired.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full mb-4"
        >
          <motion.button
            type="button"
            onClick={() => void handleGetLicense()}
            disabled={isOpening}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200",
              isOpening
                ? "bg-purple-500/60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer",
            )}
          >
            {!isOpening && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
            <AnimatePresence mode="wait">
              {isOpening ? (
                <motion.div
                  key="loading"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Loader2 className="size-4 animate-spin" />
                  {t("trialExpired.opening")}
                </motion.div>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  {t("trialExpired.cta")} <ArrowRight className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {onEnterLicenseKey && (
          <motion.button
            type="button"
            onClick={() => void handleEnterLicenseKey()}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="text-xs text-white/30 hover:text-white/55 transition-colors cursor-pointer mb-4 select-none"
          >
            {t("trialExpired.alreadyHaveKey")}
          </motion.button>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.45 }}
          className="text-xs text-white/25 text-center leading-relaxed select-none"
        >
          <Trans
            i18nKey="trialExpired.help"
            components={{
              support: (
                <span
                  className="text-purple-500 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => void openUrl(SUPPORT_EMAIL)}
                />
              ),
            }}
          />
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
