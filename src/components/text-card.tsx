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
      initial={{ opacity: 0, x: -12 }}
      animate={
        isDeleting
          ? { opacity: 0, x: -20, height: 0, marginBottom: 0 }
          : { opacity: 1, x: 0 }
      }
      transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
      className="w-full overflow-hidden"
    >
      <div
        onClick={handleClick}
        className={cn(
          "group relative w-full flex items-center justify-between gap-4 rounded-xl p-4 cursor-pointer",
          "border transition-all duration-200",
          !isActive && !isDeleting && "active:scale-[0.98]",
          isActive
            ? "bg-purple-500/20 border-purple-500/40 shadow-lg shadow-purple-500/10"
            : "bg-white/[0.04] border-white/[0.08] hover:bg-white/[0.08] hover:border-white/[0.12]"
        )}
      >
        <div className="flex flex-col gap-2 flex-1 min-w-0">
          <div className="flex flex-col gap-1">
            <h2 
              className="text-white font-semibold truncate transition-colors duration-200 select-none"
              style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.01em" }}
            >
              {text.title}
            </h2>
            <p className="text-white/50 text-sm line-clamp-2 leading-relaxed select-none">
              {text.content}
            </p>
          </div>
          <time className="text-white/30 text-xs select-none font-medium">
            {format(text.createdAt, "d 'de' MMM '•' HH:mm", { locale: ptBR })}
          </time>
        </div>
        <div className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <Button
            variant="outline"
            size="icon"
            onClick={handleDelete}
            disabled={isDeleting}
            className="bg-white/[0.04] border-white/[0.08] hover:bg-red-500/20 hover:border-red-500/40 hover:text-red-400 transition-all duration-200"
          >
            <TrashIcon className="size-4" />
          </Button>
        </div>
      </div>
    </motion.div>
  );
}