import { useTextContext } from "@/contexts/text-context";
import { cn } from "@/lib/utils";
import { deleteText } from "@/storage/text";
import { Text } from "@/types/text";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { motion } from "framer-motion";
import { TrashIcon } from "lucide-react";
import { useState } from "react";
import { Button } from "./animate-ui/components/buttons/button";

interface TextCardProps {
  ref?: React.RefObject<HTMLDivElement | null>;
  text: Text;
  onSelect: () => void;
  onDelete: () => void;
}

export function TextCard({ ref, text, onSelect, onDelete }: TextCardProps) {
  const { selectedText, setSelectedText } = useTextContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const isActive = selectedText?.id === text.id;

  const handleClick = () => {
    if (isActive || isDeleting) return;
    setSelectedText(text);
    onSelect();
  };

  const handleDelete = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isDeleting) return;

    setIsDeleting(true);

    await new Promise((resolve) => setTimeout(resolve, 320));
    await deleteText(text.id);
    if (selectedText?.id === text.id) setSelectedText(null);
    onDelete();
  };

  return (
    <motion.div
      ref={ref}
      layout
      initial={{ opacity: 0, x: -12, scale: 0.97 }}
      animate={
        isDeleting
          ? { opacity: 0, x: -20, scale: 0.95, height: 0, marginBottom: 0 }
          : { opacity: 1, x: 0, scale: 1 }
      }
      transition={{ duration: 0.32, ease: [0.4, 0, 0.2, 1] }}
      className="w-full overflow-hidden"
    >
      <div
        onClick={handleClick}
        className={cn(
          "group relative w-full flex items-center justify-between gap-3 rounded-2xl p-4 cursor-pointer",
          "border transition-all duration-200",
          isActive
            ? "border-purple-500/40 bg-purple-500/10"
            : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
        )}
      >
        <div className="flex flex-col gap-1.5 flex-1 min-w-0">
          <div className="flex flex-col gap-0.5">
            <h2 className="text-zinc-200 font-semibold truncate transition-colors duration-200 select-none">
              {text.title}
            </h2>
            <p className="text-zinc-400 text-sm line-clamp-1 leading-snug select-none">
              {text.content}
            </p>
          </div>
          <time className="text-zinc-500 text-xs select-none">
            {format(text.createdAt, "d 'de' MMM '•' HH:mm", { locale: ptBR })}
          </time>
        </div>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={isDeleting}
          className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        >
          <TrashIcon className="size-4" />
        </Button>
      </div>
    </motion.div >
  );
}