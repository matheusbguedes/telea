import { useTextContext } from "@/contexts/text-context";
import { createText, updateText } from "@/storage/text";
import { Text } from "@/types/text";
import { useCallback, useEffect, useRef, useState } from "react";

const DEBOUNCE_DELAY = 1000;

export function TextEditor() {
    const { selectedText } = useTextContext();

    const [text, setText] = useState<Text | null>(null);

    const isInitializedRef = useRef(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    const saveText = useCallback(async (title: string, content: string) => {
        if (!content.trim()) return;

        try {
            if (text?.id) {
                await updateText({
                    id: text.id,
                    title,
                    content,
                });
            } else {
                const newText = await createText(title, content);
                setText(newText);
            }
        } catch (error) {
            console.error("Erro ao salvar texto:", error);
        }
    }, [text?.id]);

    const handleTextChange = useCallback((title: string, content: string) => {
        if (!isInitializedRef.current) return;

        setText((prev) => ({
            ...prev!,
            title,
            content,
        }));

        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

        debounceTimerRef.current = setTimeout(() => {
            saveText(title, content);
        }, DEBOUNCE_DELAY);
    }, [saveText]);

    const handleTitleChange = useCallback((value: string) => {
        handleTextChange(value, text?.content || "");
    }, [handleTextChange, text?.content]);

    const handleContentChange = useCallback((value: string) => {
        handleTextChange(text?.title || "", value);
    }, [handleTextChange, text?.title]);

    useEffect(() => {
        isInitializedRef.current = true;
    }, []);

    useEffect(() => {
        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, []);

    useEffect(() => {
        setText(selectedText);
    }, [selectedText]);

    return (
        <div className="w-full h-full flex flex-1 flex-col gap-1">
            <input
                type="text"
                value={text?.title || ""}
                onChange={(e) => handleTitleChange(e.target.value)}
                className="w-full bg-transparent border border-transparent hover:border-white/10 rounded-2xl px-4 py-2 text-xl font-bold outline-none resize-none text-white transition-colors duration-300 placeholder:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <textarea
                value={text?.content || ""}
                onChange={(e) => handleContentChange(e.target.value)}
                className="w-full h-full bg-transparent border border-transparent hover:border-white/10 rounded-2xl px-4 py-3 outline-none resize-none text-white transition-colors duration-300 placeholder:text-zinc-500 disabled:opacity-50 disabled:cursor-not-allowed"
            />
        </div>
    );
}