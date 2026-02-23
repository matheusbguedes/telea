import "@/App.css";
import { PrompterButton } from "@/components/prompter-button";
import Prompter from "@/components/prompter/prompter";
import Aurora from "@/components/reactbits/aurora";
import { TextEditor } from "@/components/text-editor";
import { TextList } from "@/components/text-list";
import { Window } from "@/types/window";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";

const currentWindow = getCurrentWebviewWindow();

function App() {
  if (currentWindow.label === Window.PROMPT) return <Prompter />;

  return (
    <div className="w-screen h-screen flex bg-black rounded-xl overflow-hidden">
      <Aurora />
      <div data-tauri-drag-region className="w-screen h-7 absolute top-0 left-0 z-50" />
      <div className="w-full h-full flex flex-col gap-4 pt-12 pb-4 px-4 z-10">
        <header className="w-full flex items-center justify-between">
          <TextList />
          <PrompterButton />
        </header>
        <TextEditor />
      </div>
    </div>
  );
}

export default App;