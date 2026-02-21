import { Button } from "@/components/animate-ui/components/buttons/button";
import { useTextContext } from "@/contexts/text-context";
import { getTextById } from "@/storage/text";
import { Window } from "@/types/window";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor } from "@tauri-apps/api/window";
import { PlayIcon, SquareIcon } from "lucide-react";
import { useState } from "react";

export function PrompeteerButton() {
  const { selectedText } = useTextContext();

  const [isWindowOpen, setIsWindowOpen] = useState(false);
  const [windowRef, setWindowRef] = useState<WebviewWindow | null>(null);

  const handleWindow = () => {
    if (isWindowOpen) return closeWindow();
    return openWindow();
  };

  const openWindow = async () => {
    if (!selectedText) {
      console.warn('Nenhum texto selecionado');
      return;
    }

    const monitor = await currentMonitor();
    if (!monitor) return;

    const scaleFactor = monitor.scaleFactor;

    const windowWidth = 325;
    const windowHeight = 80;

    const screenWidth = monitor.size.width / scaleFactor;
    const screenX = monitor.position.x / scaleFactor;

    const x = screenX + (screenWidth - windowWidth) / 2;
    const y = 28;

    const window = new WebviewWindow(Window.PROMPT, {
      url: "/",
      title: "Prompeteer",
      width: windowWidth,
      height: windowHeight,
      x: Math.round(x),
      y,
      center: false,
      decorations: false,
      transparent: true,
      alwaysOnTop: true,
      skipTaskbar: true,
      resizable: false,
      visible: false,
    });

    setWindowRef(window);

    await window.once("tauri://created", () => {
      setIsWindowOpen(true);
    });

    const unlistenReady = await window.listen("prompter-ready", async () => {
      const text = await getTextById(selectedText.id);
      await window.emit("content-loaded", { content: text?.content || "" });
    });

    await window.once("tauri://destroyed", () => {
      setIsWindowOpen(false);
      unlistenReady();
    });
  };

  const closeWindow = async () => {
    if (windowRef) await windowRef.close();

    setIsWindowOpen(false);
    setWindowRef(null);
  };

  return (
    <Button variant="outline" size="icon" onClick={handleWindow}>
      {isWindowOpen ? (
        <SquareIcon className="size-4" fill="currentColor" />
      ) : (
        <PlayIcon className="size-4" fill="currentColor" />
      )}
    </Button>
  );
}
