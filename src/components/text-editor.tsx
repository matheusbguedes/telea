import { useTextContext } from "@/contexts/text-context";
import { createText, updateText } from "@/storage/text";
import { Text } from "@/types/text";
import { useEffect, useRef, useState } from "react";

const DEBOUNCE_DELAY = 1000;

export function TextEditor() {
    const { selectedText, setSelectedText } = useTextContext();

    const [text, setText] = useState<Text | null>(null);

    const isInitializedRef = useRef(false);
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    const textRef = useRef<Text | null>(null);

    textRef.current = text;

    const scheduleDebounce = (title: string, content: string) => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => save(title, content), DEBOUNCE_DELAY);
    };

    const save = async (title: string, content: string) => {
        if (!content.trim()) return;

        try {
            const current = textRef.current;
            if (current?.id) {
                await updateText({ id: current.id, title, content });
            } else {
                const newText = await createText(title, content);
                setText(newText);
                setSelectedText(newText);
            }
        } catch (error) {
            console.error("Erro ao salvar texto:", error);
        }
    };

    const handleChange = (field: "title" | "content", value: string) => {
        if (!isInitializedRef.current) return;

        const updated = {
            ...textRef.current!,
            [field]: value,
        };

        setText(updated);
        scheduleDebounce(updated.title, updated.content);
    };

    useEffect(() => {
        isInitializedRef.current = true;
        return () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); };
    }, []);

    useEffect(() => {
        setText(selectedText);
    }, [selectedText]);

    return (
        <div className="w-full h-full flex flex-1 flex-col gap-1">
            <input
                type="text"
                value={text?.title ?? ""}
                onChange={(e) => handleChange("title", e.target.value)}
                className="w-full resize-none rounded-2xl bg-transparent text-white outline-none transition-colors duration-300 placeholder:text-zinc-500 border border-transparent hover:border-white/10 px-4 py-2 text-xl font-bold"
            />
            <textarea
                value={text?.content ?? ""}
                onChange={(e) => handleChange("content", e.target.value)}
                className="w-full h-full resize-none rounded-2xl bg-transparent text-white outline-none transition-colors duration-300 placeholder:text-zinc-500 border border-transparent hover:border-white/10 px-4 py-2 hidden-scrollbar"
            />
        </div>
    );
}