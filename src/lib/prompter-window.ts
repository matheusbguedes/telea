import { Window } from "@/types/window";
import { invoke } from "@tauri-apps/api/core";
import { emit } from "@tauri-apps/api/event";
import { WebviewWindow } from "@tauri-apps/api/webviewWindow";
import {
  type Monitor,
  currentMonitor,
  getCurrentWindow,
  monitorFromPoint,
} from "@tauri-apps/api/window";

export const STANDARD_PROMPT_WINDOW = {
  width: 380,
  height: 125,
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

async function getMainOrCurrentMonitor(): Promise<Monitor | null> {
  const main = await WebviewWindow.getByLabel(Window.MAIN);
  if (main) {
    const pos = await main.outerPosition();
    const size = await main.outerSize();
    const cx = Math.round(pos.x + size.width / 2);
    const cy = Math.round(pos.y + size.height / 2);
    const m = await monitorFromPoint(cx, cy);
    if (m) return m;
  }
  return currentMonitor();
}

export async function getStandardPromptWindowPosition(): Promise<{ x: number; y: number } | null> {
  const monitor = await getMainOrCurrentMonitor();
  if (!monitor) return null;
  const { scaleFactor, workArea } = monitor;
  const waX = workArea.position.x / scaleFactor;
  const waY = workArea.position.y / scaleFactor;
  const waW = workArea.size.width / scaleFactor;
  const x = Math.round(waX + (waW - STANDARD_PROMPT_WINDOW.width) / 2);
  const y = Math.round(waY);
  return { x, y };
}

function getCenteredFloatingPosition(monitor: Monitor): { x: number; y: number } {
  const { scaleFactor, workArea } = monitor;
  const waX = workArea.position.x / scaleFactor;
  const waY = workArea.position.y / scaleFactor;
  const waW = workArea.size.width / scaleFactor;
  const waH = workArea.size.height / scaleFactor;
  const x = Math.round(waX + (waW - FLOATING_PROMPT_WINDOW.width) / 2);
  const y = Math.round(waY + (waH - FLOATING_PROMPT_WINDOW.height) / 2);
  return { x, y };
}

export function createStandardPromptWebview(x: number, y: number): WebviewWindow {
  return new WebviewWindow(Window.PROMPT, {
    url: "/",
    title: "Prompter",
    width: STANDARD_PROMPT_WINDOW.width,
    height: STANDARD_PROMPT_WINDOW.height,
    x,
    y,
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
  let monitor = await currentMonitor();
  if (!monitor) return;

  const { x, y } = getCenteredFloatingPosition(monitor);
  const floating = createFloatingPromptWebviewAt(x, y);

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

  const pos = await getStandardPromptWindowPosition();
  if (pos === null) return;

  const win = createStandardPromptWebview(pos.x, pos.y);

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
