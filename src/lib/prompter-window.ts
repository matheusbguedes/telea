import { Window } from "@/types/window";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { currentMonitor, getCurrentWindow } from "@tauri-apps/api/window";

export const STANDARD_PROMPT_WINDOW = {
  width: 380,
  height: 125,
  y: 0,
} as const;

export const FLOATING_PROMPT_WINDOW = {
  width: 440,
  height: 360,
  minWidth: 320,
  minHeight: 200,
  maxWidth: 600,
  maxHeight: 500,
} as const;

export const PROMPT_WINDOW_OPENED_EVENT = "prompt-window-opened";
export const FLOATING_PROMPTER_READY_EVENT = "floating-prompter-ready";

export type ContentLoadedPayload = {
  content: string;
  skipCountdown?: boolean;
  initialY?: number;
};

export async function getStandardPromptWindowX(): Promise<number | null> {
  const monitor = await currentMonitor();
  if (!monitor) return null;
  const { scaleFactor, size, position } = monitor;
  const screenWidth = size.width / scaleFactor;
  const screenX = position.x / scaleFactor;
  return Math.round(screenX + (screenWidth - STANDARD_PROMPT_WINDOW.width) / 2);
}

async function getLogicalOuterOrigin(): Promise<{ x: number; y: number }> {
  const w = getCurrentWindow();
  const pos = await w.outerPosition();
  return { x: pos.x, y: pos.y };
}

export function createStandardPromptWebview(x: number): WebviewWindow {
  return new WebviewWindow(Window.PROMPT, {
    url: "/",
    title: "Prompter",
    width: STANDARD_PROMPT_WINDOW.width,
    height: STANDARD_PROMPT_WINDOW.height,
    x,
    y: STANDARD_PROMPT_WINDOW.y,
    center: false,
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    visible: false,
    shadow: false,
    contentProtected: true,
  });
}

export function createFloatingPromptWebviewAt(
  x: number,
  y: number,
): WebviewWindow {
  return new WebviewWindow(Window.FLOATING_PROMPT, {
    url: "/",
    title: "Prompter flutuante",
    width: FLOATING_PROMPT_WINDOW.width,
    height: FLOATING_PROMPT_WINDOW.height,
    minWidth: FLOATING_PROMPT_WINDOW.minWidth,
    minHeight: FLOATING_PROMPT_WINDOW.minHeight,
    maxWidth: FLOATING_PROMPT_WINDOW.maxWidth,
    maxHeight: FLOATING_PROMPT_WINDOW.maxHeight,
    x,
    y,
    center: false,
    decorations: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: true,
    visible: false,
    shadow: false,
    contentProtected: true,
  });
}

export async function applyPromptWindowAboveMenubar(
  label: string,
): Promise<void> {
  await invoke("set_window_above_menubar", { label });
}

export async function closeFloatingPromptIfExists(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(Window.FLOATING_PROMPT);
  if (existing) await existing.close();
}

export async function closeStandardPromptIfExists(): Promise<void> {
  const existing = await WebviewWindow.getByLabel(Window.PROMPT);
  if (existing) await existing.close();
}

export async function transferPromptToFloating(
  payload: ContentLoadedPayload,
): Promise<void> {
  const { x: ox, y: oy } = await getLogicalOuterOrigin();
  const floating = createFloatingPromptWebviewAt(
    Math.round(ox + 24),
    Math.round(oy + 24),
  );

  await floating.once(FLOATING_PROMPTER_READY_EVENT, async () => {
    await floating.emit("content-loaded", payload);
    await getCurrentWindow().close();
  });

  await floating.once("tauri://created", async () => {
    try {
      await applyPromptWindowAboveMenubar(Window.FLOATING_PROMPT);
    } catch (error) {
      console.error("Failed to set floating window above menubar:", error);
    }
  });
}

export async function restoreStandardPrompterFromFloating(
  payload: ContentLoadedPayload,
): Promise<void> {
  await closeStandardPromptIfExists();

  const x = await getStandardPromptWindowX();
  if (x === null) return;

  const win = createStandardPromptWebview(x);

  await win.once("prompter-ready", async () => {
    await win.emit("content-loaded", {
      content: payload.content,
      skipCountdown: true,
      initialY: 0,
    });

    await new Promise((resolve) => setTimeout(resolve, 40));
    try {
      await applyPromptWindowAboveMenubar(Window.PROMPT);
    } catch (error) {
      console.error("Failed to reassert prompt window level:", error);
    }

    await emit(PROMPT_WINDOW_OPENED_EVENT, {});
    await getCurrentWindow().close();
  });

  await win.once("tauri://created", async () => {
    try {
      await applyPromptWindowAboveMenubar(Window.PROMPT);
    } catch (error) {
      console.error("Failed to set prompt window above menubar:", error);
    }
  });
}
