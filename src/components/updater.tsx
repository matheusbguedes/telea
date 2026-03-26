import { cn } from "@/lib/utils";
import { AnimatePresence, motion } from "framer-motion";
import { Download, Loader2, RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";

interface UpdaterProps {
  isVisible: boolean;
  currentVersion?: string;
  newVersion?: string;
  isDownloading: boolean;
  onUpdate: () => void;
  onSkip?: () => void;
}

export function Updater({
  isVisible,
  currentVersion,
  newVersion,
  isDownloading,
  onUpdate,
  onSkip,
}: UpdaterProps) {
  const { t } = useTranslation();

  if (!isVisible) return null;

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
            alt={t("updater.logoAlt")}
            className="relative size-20 object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-white tracking-tight mb-1 select-none"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
        >
          {t("updater.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
        >
          {t("updater.subtitle")}
        </motion.p>

        {(currentVersion || newVersion) && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="w-full mb-6 flex items-center justify-center gap-3"
          >
            {currentVersion && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-white/30 mb-1 select-none">{t("updater.current")}</span>
                <div className="px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08]">
                  <span className="text-sm font-mono text-white/60 select-none">{currentVersion}</span>
                </div>
              </div>
            )}
            {currentVersion && newVersion && <RefreshCw className="size-4 text-white/60 mt-5" />}
            {newVersion && (
              <div className="flex flex-col items-center">
                <span className="text-xs text-white/30 mb-1 select-none">{t("updater.newVersion")}</span>
                <div className="px-3 py-1.5 rounded-lg bg-purple-500/10 border border-purple-500/30">
                  <span className="text-sm font-mono text-purple-400 select-none">{newVersion}</span>
                </div>
              </div>
            )}
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full mb-3"
        >
          <motion.button
            type="button"
            onClick={onUpdate}
            disabled={isDownloading}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200",
              isDownloading
                ? "bg-purple-500/60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer",
            )}
          >
            {!isDownloading && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
            <AnimatePresence mode="wait">
              {isDownloading ? (
                <motion.span
                  key="downloading"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  <Loader2 className="size-4 animate-spin" />
                  {t("updater.downloading")}
                </motion.span>
              ) : (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  {t("updater.updateNow")} <Download className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>

        {onSkip && !isDownloading && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            onClick={onSkip}
            className="text-xs text-white/30 hover:text-white/50 transition-colors select-none"
          >
            {t("updater.updateLater")}
          </motion.button>
        )}

        {isDownloading && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="text-xs text-white/25 text-center leading-relaxed select-none"
          >
            {t("updater.restartHint")}
          </motion.p>
        )}
      </motion.div>
    </motion.div>
  );
}
