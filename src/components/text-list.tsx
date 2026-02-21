import { Button } from "@/components/animate-ui/components/buttons/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { useTextContext } from "@/contexts/text-context";
import { getTexts } from "@/storage/text";
import { Text } from "@/types/text";
import { PanelLeftIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { TextCard } from "./text-card";

export function TextList() {
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

      const isVisible =
        card.offsetTop >= container.scrollTop &&
        card.offsetTop + card.offsetHeight <= container.scrollTop + container.clientHeight;

      if (!isVisible) card.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen]);

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu lateral">
          <PanelLeftIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="h-full bg-transparent border-none shadow-none outline-none"
        showCloseButton={false}
      >
        <div className="flex flex-col min-h-0 h-full pt-12 pb-4 px-4 gap-2">
          <div ref={scrollContainerRef} className="flex-1 overflow-y-auto hidden-scrollbar min-h-0">
            {texts.map((text) => (
              <div key={text.id} className="mb-2">
                <TextCard
                  ref={text.id === selectedText?.id ? activeCardRef : undefined}
                  text={text}
                  onSelect={() => setIsOpen(false)}
                  onDelete={() => setTexts((prev) => prev.filter((t) => t.id !== text.id))}
                />
              </div>
            ))}
          </div>
          <Button variant="outline" onClick={() => { setSelectedText(null); setIsOpen(false); }} className="w-full shrink-0">
            <PlusIcon className="size-4" />
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}