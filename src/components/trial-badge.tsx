import { MAX_TRIAL_ATTEMPTS, getTrialAttempts } from "@/storage/trial";
import { getUser } from "@/storage/user";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export function TrialBadge() {
  const { t } = useTranslation();
  const [attempts, setAttempts] = useState<number | null>(null);

  async function refresh() {
    const user = await getUser();
    if (user.is_paid || !user.id) {
      setAttempts(null);
      return;
    }
    const count = await getTrialAttempts();
    setAttempts(count);
  }

  useEffect(() => {
    void refresh();
    window.addEventListener("trial:updated", refresh);
    return () => window.removeEventListener("trial:updated", refresh);
  }, []);

  if (attempts === null) return null;

  const remaining = Math.max(0, MAX_TRIAL_ATTEMPTS - attempts);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
      className="w-fit px-3 py-1.5 bg-white/5 rounded-xl border border-white/10"
    >
      <span className="flex items-center gap-1.5 text-xs select-none cursor-default">
        <span className="text-white/30">{t("trialBadge.label")}</span>
        <span className={remaining === 0 ? "text-red-400/70" : remaining <= 2 ? "text-yellow-400/70" : "text-white/50"}>
          {remaining}/{MAX_TRIAL_ATTEMPTS}
        </span>
      </span>
    </motion.div>
  );
}
