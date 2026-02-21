import "@/App.css";
import { PrompeteerButton } from "@/components/prompeteer-button";
import Prompeteer from "@/components/prompteer/prompeteer";
import { TextEditor } from "@/components/text-editor";
import { TextSheet } from "@/components/text-sheet";
import { getCurrentWebviewWindow, WebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import Aurora from "./components/reactbits/aurora";
import { Window } from "./types/window";

function App() {
  const [window, setWindow] = useState<WebviewWindow | null>(null);

  useEffect(() => {
    setWindow(getCurrentWebviewWindow());
  }, []);

  if (window?.label === Window.PROMPT) return <Prompeteer />;

  return (
    <div className="w-screen h-screen flex bg-black">
      <Aurora />
      <div data-tauri-drag-region className="w-screen h-7 absolute top-0 left-0 z-50" />
      <div className="w-full h-full flex flex-col gap-4 pt-10 pb-6 px-6 z-10">
        <header className="w-full flex items-center justify-between">
          <TextSheet />
          <PrompeteerButton />
        </header>
        <TextEditor />
      </div>
    </div>
  );
}

export default App;
