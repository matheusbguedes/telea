import { Button } from "@/components/animate-ui/components/buttons/button";
import { TrialExpired } from "@/components/trial-expired";
import { useTextContext } from "@/contexts/text-context";
import { cn } from "@/lib/utils";
import {
  FLOATING_PROMPTER_READY_EVENT,
  PROMPT_WINDOW_OPENED_EVENT,
  applyPromptWindowAboveMenubar,
  closeFloatingPromptIfExists,
  closeStandardPromptIfExists,
  createStandardPromptWebview,
  getStandardPromptWindowPosition,
} from "@/lib/prompter-window";
import { getTextById } from "@/storage/text";
import { incrementTrialAttempts, isTrialExpired } from "@/storage/trial";
import { getUser } from "@/storage/user";
import { Window } from "@/types/window";
import { listen } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { PlayIcon, SquareIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";

export function PrompterButton() {
  const { selectedText } = useTextContext();

  const [promptAlive, setPromptAlive] = useState(false);
  const [floatingAlive, setFloatingAlive] = useState(false);
  const [showTrialExpired, setShowTrialExpired] = useState(false);
  const isOpen = promptAlive || floatingAlive;

  const promptWindowRef = useRef<WebviewWindow | null>(null);
  const floatingWindowRef = useRef<WebviewWindow | null>(null);
  const [windowRef, setWindowRef] = useState<WebviewWindow | null>(null);

  const bindDestroyedListener = (w: WebviewWindow, which: "prompt" | "floating") => {
    void w.once("tauri://destroyed", () => {
      if (which === "prompt") {
        promptWindowRef.current = null;
        setPromptAlive(false);
      } else {
        floatingWindowRef.current = null;
        setFloatingAlive(false);
      }

      const nextTarget = promptWindowRef.current ?? floatingWindowRef.current;
      setWindowRef(nextTarget);
    });
  };

  const syncWindowRef = (nextPrompt: WebviewWindow | null, nextFloating: WebviewWindow | null) => {
    const target = nextPrompt ?? nextFloating;
    setWindowRef(target);
  };

  useEffect(() => {
    let unlisten: (() => void) | undefined;
    let unlistenFloating: (() => void) | undefined;

    listen(PROMPT_WINDOW_OPENED_EVENT, async () => {
      const w = await WebviewWindow.getByLabel(Window.PROMPT);
      if (!w) return;
      promptWindowRef.current = w;
      setPromptAlive(true);
      syncWindowRef(w, floatingWindowRef.current);
      bindDestroyedListener(w, "prompt");
    }).then((fn) => {
      unlisten = fn;
    });

    listen(FLOATING_PROMPTER_READY_EVENT, async () => {
      const w = await WebviewWindow.getByLabel(Window.FLOATING_PROMPT);
      if (!w) return;
      floatingWindowRef.current = w;
      setFloatingAlive(true);
      syncWindowRef(promptWindowRef.current, w);
      bindDestroyedListener(w, "floating");
    }).then((fn) => {
      unlistenFloating = fn;
    });

    return () => {
      unlisten?.();
      unlistenFloating?.();
    };
  }, []);

  const openWindow = async () => {
    if (!selectedText) return;

    const user = await getUser();
    if (!user.is_paid) {
      const expired = await isTrialExpired();
      if (expired) {
        setShowTrialExpired(true);
        return;
      }
      await incrementTrialAttempts();
      window.dispatchEvent(new Event("trial:updated"));
    }

    // Evita estado "preso" se houver uma janela anterior.
    setPromptAlive(false);
    setFloatingAlive(false);
    promptWindowRef.current = null;
    floatingWindowRef.current = null;
    setWindowRef(null);

    await closeFloatingPromptIfExists();
    await closeStandardPromptIfExists();

    const pos = await getStandardPromptWindowPosition();
    if (pos === null) return;

    const promptWebview = createStandardPromptWebview(pos.x, pos.y);
    promptWindowRef.current = promptWebview;
    setPromptAlive(true);
    setWindowRef(promptWebview);
    bindDestroyedListener(promptWebview, "prompt");

    await promptWebview.once("tauri://created", async () => {
      try {
        await applyPromptWindowAboveMenubar(Window.PROMPT);
      } catch (error) {
        console.error("Failed to set window above menubar:", error);
      }
    });

    const unlistenReady = await promptWebview.listen("prompter-ready", async () => {
      const text = await getTextById(selectedText.id);
      if (!text) return;

      await promptWebview.emit("content-loaded", { content: text.content });
    });

    await promptWebview.once("tauri://destroyed", () => {
      unlistenReady();
    });
  };

  const closeWindow = async () => {
    const target = windowRef;
    if (!target) return;
    await target.emit("close-prompter", {});
  };

  const isDisabled = !selectedText && !isOpen;

  return (
    <>
      {showTrialExpired && (
        <TrialExpired onEnterLicenseKey={() => setShowTrialExpired(false)} />
      )}
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
    </>
  );
}
