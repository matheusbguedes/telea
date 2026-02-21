import { useTextContext } from "@/contexts/text-context";
import { deleteText } from "@/storage/text";
import { Text } from "@/types/text";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { TrashIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Button } from "./animate-ui/components/buttons/button";
import { cn } from "@/lib/utils";

export function TextCard({ text, onSelect, onDelete }: { text: Text, onSelect: () => void, onDelete: () => void }) {
  const { selectedText, setSelectedText } = useTextContext();

  const [isHovered, setIsHovered] = useState(false);

  const isActive = selectedText?.id === text.id;

  const handleClick = () => {
    if (isActive) return;

    setSelectedText(text);
    onSelect();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    await new Promise(resolve => setTimeout(resolve, 300));

    await deleteText(text.id);
    if (selectedText?.id === text.id) setSelectedText(null);
    onDelete();
  };

  return (
    <AnimatePresence>
      <motion.div
        layout
        initial={{ opacity: 0, x: -20, scale: 0.95 }}
        animate={{
          opacity: 1,
          x: 0,
          scale: 1,
        }}
        exit={{
          opacity: 0,
          x: -20,
          scale: 0.9,
          height: 0,
          marginBottom: 0,
        }}
        transition={{
          duration: 0.3,
          ease: [0.4, 0, 0.2, 1]
        }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        className="w-full"
      >
        <motion.div
          className={cn(
            "w-full flex items-center justify-between gap-2 border rounded-2xl p-4 cursor-pointer transition-colors duration-300",
            isActive ? "border-purple-500/50 bg-purple-500/10" : "border-white/10 hover:border-white/20"
          )}
          animate={{
            x: isHovered && !isActive ? 8 : 0,
          }}
          transition={{
            duration: 0.2,
            ease: "easeOut"
          }}
          onClick={handleClick}
        >
          <div className="flex flex-col gap-2 flex-1 min-w-0">
            <div className="flex flex-col">
              <h1
                className="text-white text-xl font-bold truncate"
              >
                {text.title}
              </h1>
              <p className="text-zinc-400 text-sm line-clamp-1">{text.content}</p>
            </div>
            <time className="text-zinc-400 text-xs">
              {format(text.createdAt, "d 'de' MMM '•' HH:mm", { locale: ptBR })}
            </time>
          </div>
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
          >
            <TrashIcon className="size-4" />
          </Button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}