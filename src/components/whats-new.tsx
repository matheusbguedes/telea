import { getLastSeenVersion, setLastSeenVersion } from "@/storage/whats-new";
import { getVersion } from "@tauri-apps/api/app";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCheck, Rocket } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "./animate-ui/components/buttons/button";

const slideVariants = {
  enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
  center: { opacity: 1, x: 0 },
  exit: (dir: number) => ({ opacity: 0, x: -dir * 28 }),
};

const easing = [0.22, 1, 0.36, 1] as const;

interface Slide {
  image: string;
  titleKey: string;
  descriptionKey: string;
}

// Add new version slides here when releasing updates.
// Images go in public/whats-new/{version}/slide-{index}.png
const SLIDES_BY_VERSION: Record<string, Slide[]> = {
  "1.0.2": [
    {
      image: "/whats-new/1.0.2/slide-0.png",
      titleKey: "whatsNew.v1_0_2.slide0.title",
      descriptionKey: "whatsNew.v1_0_2.slide0.description",
    },
  ],
};

export function WhatsNew() {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [appVersion, setAppVersion] = useState<string | null>(null);
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(1);

  useEffect(() => {
    async function check() {
      const version = await getVersion();
      const lastSeen = await getLastSeenVersion();

      setAppVersion(version);

      if (lastSeen === null) {
        await setLastSeenVersion(version);
        return;
      }

      if (lastSeen === version) return;

      const slides = SLIDES_BY_VERSION[version];
      if (slides && slides.length > 0) {
        setIsVisible(true);
      } else {
        await setLastSeenVersion(version);
      }
    }

    void check();
  }, []);

  const slides = useMemo(
    () => (appVersion ? (SLIDES_BY_VERSION[appVersion] ?? []) : []),
    [appVersion],
  );

  const isLast = current === slides.length - 1;

  function goTo(index: number) {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  }

  async function dismiss() {
    if (appVersion) await setLastSeenVersion(appVersion);
    setIsVisible(false);
  }

  if (!isVisible || slides.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <div data-tauri-drag-region className="absolute inset-x-0 top-0 z-50 h-7" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: easing }}
        className="relative z-10 flex w-full max-w-md flex-col items-center px-6"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4, ease: easing, delay: 0.1 }}
          className="mb-5 w-fit rounded-xl border border-purple-500/20 bg-purple-500/10 px-3 py-1.5"
        >
          <span className="flex cursor-default select-none items-center gap-1.5 text-xs text-purple-400/70">
            {t("whatsNew.badge", { version: appVersion })}
            <Rocket className="size-3" />
          </span>
        </motion.div>
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`img-${current}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.35, ease: easing }}
            className="mb-6 w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.04]"
          >
            <img
              src={slides[current].image}
              alt={t(slides[current].titleKey)}
              className="aspect-video w-full select-none object-cover"
              draggable={false}
            />
          </motion.div>
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`text-${current}`}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: easing }}
            className="mb-8 flex w-full flex-col items-center text-center"
          >
            <h2
              className="mb-1.5 select-none text-2xl font-bold tracking-tight text-white"
              style={{ letterSpacing: "-0.02em" }}
            >
              {t(slides[current].titleKey)}
            </h2>
            <p className="select-none text-sm leading-relaxed text-white/35">
              {t(slides[current].descriptionKey)}
            </p>
          </motion.div>
        </AnimatePresence>

        <div className="flex w-full items-center justify-between">
          <Button
            size="icon"
            variant="outline"
            onClick={() => goTo(current - 1)}
            disabled={current === 0}
          >
            <ArrowLeft className="size-4" />
          </Button>

          <div className="flex items-center gap-2">
            {slides.map((_, i) => (
              <motion.button
                key={i}
                type="button"
                onClick={() => goTo(i)}
                animate={{
                  width: i === current ? 20 : 6,
                  opacity: i === current ? 1 : 0.25,
                }}
                transition={{ duration: 0.3, ease: easing }}
                className="h-1.5 cursor-pointer rounded-full bg-purple-400"
              />
            ))}
          </div>

          {isLast ? (
            <Button size="icon" variant="default" onClick={() => void dismiss()}>
              <CheckCheck className="size-3.5" />
            </Button>
          ) : (
            <Button size="icon" variant="outline" onClick={() => goTo(current + 1)}>
              <ArrowRight className="size-3.5" />
            </Button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
