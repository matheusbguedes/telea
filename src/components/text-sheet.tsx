import { Button } from "@/components/animate-ui/components/buttons/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/animate-ui/components/radix/sheet";
import { useTextContext } from "@/contexts/text-context";
import { getTexts } from "@/storage/text";
import { Text } from "@/types/text";
import { PanelLeftIcon, PlusIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { TextCard } from "./text-card";

export function TextSheet() {
  const { setSelectedText } = useTextContext();

  const [texts, setTexts] = useState<Text[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const loadTexts = useCallback(async () => {
    try {
      const loadedTexts = await getTexts();
      setTexts(loadedTexts);
    } catch (error) {
      console.error("Erro ao carregar textos:", error);
      setTexts([]);
    }
  }, []);

  const handleCreateNewText = useCallback(() => {
    setSelectedText(null);
    setIsOpen(false);
  }, [setSelectedText]);

  const handleTextSelect = useCallback(() => {
    setIsOpen(false);
  }, []);

  const handleTextDelete = useCallback(() => {
    loadTexts();
  }, [loadTexts]);

  const handleOpenChange = useCallback((open: boolean) => {
    setIsOpen(open);
    if (open) loadTexts();
  }, [loadTexts]);

  useEffect(() => {
    loadTexts();
  }, [loadTexts]);

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" aria-label="Abrir menu lateral">
          <PanelLeftIcon className="size-4" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="bg-transparent border-none shadow-none outline-none flex flex-col gap-2 overflow-y-auto hidden-scrollbar py-10 px-3"
        showCloseButton={false}
      >
        <Button
          variant="outline"
          size="icon"
          onClick={handleCreateNewText}
          aria-label="Criar novo texto"
        >
          <PlusIcon className="size-4" />
        </Button>
        {texts.length > 0 && (
          <>
            {texts.map((text) => (
              <TextCard
                key={text.id}
                text={text}
                onSelect={handleTextSelect}
                onDelete={handleTextDelete}
              />
            ))}
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}