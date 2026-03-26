import { Button } from "@/components/animate-ui/components/buttons/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { useTextContext } from "@/contexts/text-context";
import { getTexts } from "@/storage/text";
import { Text } from "@/types/text";
import { motion } from "framer-motion";
import { PanelLeftIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { TextCard } from "./text-card";

export function TextList() {
  const { t } = useTranslation();
  const { selectedText, setSelectedText } = useTextContext();

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const activeCardRef = useRef<HTMLDivElement>(null);

  const [texts, setTexts] = useState<Text[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadTexts = async () => {
    try {
      setTexts(await getTexts());
    } catch {
      console.error("Error loading texts");
    }
  };

  useEffect(() => {
    if (!isOpen) return;

    loadTexts();

    const timer = setTimeout(() => {
      const card = activeCardRef.current;
      const container = scrollContainerRef.current;

      if (!card || !container) return;

      card.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 400);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label={t("textList.openMenuAria")}>
          <PanelLeftIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="h-full bg-black/40 backdrop-blur-md border-white/[0.08] shadow-2xl w-[min(100vw,400px)]"
        showCloseButton={false}
      >
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col min-h-0 h-full pt-12 pb-6 px-6 gap-6"
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
              {t("textList.title")}
            </h2>
            <p className="text-sm text-white/40 select-none">
              {t("textList.subtitle")}
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            ref={scrollContainerRef}
            className="flex-1 overflow-y-auto hidden-scrollbar min-h-0 -mx-2 px-2"
          >
            {texts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col items-center justify-center h-full text-center py-12"
              >
                <p className="text-sm text-white/40 select-none mb-2">
                  {t("textList.emptyTitle")}
                </p>
                <p className="text-xs text-white/25 select-none">
                  {t("textList.emptyHint")}
                </p>
              </motion.div>
            ) : (
              texts.map((text, index) => (
                <motion.div
                  key={text.id}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.25 + index * 0.05 }}
                  className="mb-3"
                >
                  <TextCard
                    ref={text.id === selectedText?.id ? activeCardRef : undefined}
                    text={text}
                    onSelect={() => setIsOpen(false)}
                    onDelete={() => setTexts((prev) => prev.filter((t) => t.id !== text.id))}
                  />
                </motion.div>
              ))
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="relative"
          >
            <Button
              variant="outline"
              onClick={() => {
                setSelectedText(null);
                setIsOpen(false);
              }}
              className="w-full shrink-0 h-12 bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12] text-white/80 hover:text-white transition-all duration-200 active:scale-[0.98]"
            >
              <span
                className="font-medium"
              >
                {t("textList.newScript")}
              </span>
              <PlusIcon className="size-5" />
            </Button>
          </motion.div>
        </motion.div>
      </SheetContent>
    </Sheet>
  );
}