import { Button } from "@/components/animate-ui/components/buttons/button";
import { useTextContext } from "@/contexts/text-context";
import { cn } from "@/lib/utils";
import { getTextById } from "@/storage/text";
import { Window } from "@/types/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor } from "@tauri-apps/api/window";
import { CommandIcon, PlayIcon, SquareIcon } from "lucide-react";
import { useState } from "react";

const WINDOW_CONFIG = {
  width: 325,
  height: 80,
  y: 28,
} as const;

async function createPromptWindow(x: number): Promise<WebviewWindow> {
  return new WebviewWindow(Window.PROMPT, {
    url: "/",
    title: "Prompeteer",
    width: WINDOW_CONFIG.width,
    height: WINDOW_CONFIG.height,
    x,
    y: WINDOW_CONFIG.y,
    center: false,
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    visible: false,
  });
}

async function getWindowPosition(): Promise<number | null> {
  const monitor = await currentMonitor();

  if (!monitor) return null;

  const { scaleFactor, size, position } = monitor;
  const screenWidth = size.width / scaleFactor;
  const screenX = position.x / scaleFactor;

  return Math.round(screenX + (screenWidth - WINDOW_CONFIG.width) / 2);
}

export function PrompeteerButton() {
  const { selectedText } = useTextContext();

  const [isOpen, setIsOpen] = useState(false);
  const [windowRef, setWindowRef] = useState<WebviewWindow | null>(null);

  const openWindow = async () => {
    if (!selectedText) return;

    const x = await getWindowPosition();
    if (x === null) return;

    const window = await createPromptWindow(x);
    setWindowRef(window);

    await window.once("tauri://created", () => setIsOpen(true));

    const unlistenReady = await window.listen("prompter-ready", async () => {
      const text = await getTextById(selectedText.id);
      if (!text) return;

      await window.emit("content-loaded", { content: text.content });
    });

    await window.once("tauri://destroyed", () => {
      setIsOpen(false);
      unlistenReady();
    });
  };

  const closeWindow = async () => {
    await windowRef?.close();
    setIsOpen(false);
    setWindowRef(null);
  };

  const isDisabled = !selectedText && !isOpen;

  return (
    <div className="flex items-center gap-3">
      <span className="flex items-center gap-1 text-purple-500 text-xs cursor-default select-none">
        <CommandIcon className="size-3" />
        <span>+</span>
        <kbd className="font-sans">T</kbd>
      </span>
      <Button
        size="icon"
        variant="outline"
        onClick={() => isOpen ? closeWindow() : openWindow()}
        disabled={isDisabled}
        className={cn(isOpen ? "text-purple-500 border-purple-500/30" : "")}
      >
        {isOpen
          ? <SquareIcon className="size-4" fill="currentColor" />
          : <PlayIcon className="size-4" fill="currentColor" />
        }
      </Button>
    </div>
  );
}