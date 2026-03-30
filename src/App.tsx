import "@/App.css";
import { PrompterButton } from "@/components/prompter-button";
import { PrompterSettingsSheet } from "@/components/prompter-settings-sheet";
import Prompter from "@/components/prompter/prompter";
import Aurora from "@/components/reactbits/aurora";
import { TextEditor } from "@/components/text-editor";
import { TextList } from "@/components/text-list";
import { Window } from "@/types/window";
import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
import { useEffect, useState } from "react";
import { Authorizer } from "./components/authorizer";
import { DeviceStatusGate } from "./components/device-status-gate";
import { Onboarding } from "./components/onboarding";
import { TrialBadge } from "./components/trial-badge";
import { Updater } from "./components/updater";
import { VersionBadge } from "./components/version-badge";
import { useUpdater } from "./hooks/use-updater";

const currentWindow = getCurrentWebviewWindow();

function MainApp() {
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authorizerRecheck, setAuthorizerRecheck] = useState(0);

  useEffect(() => {
    const handler = () => setAuthorizerRecheck((n) => n + 1);
    window.addEventListener("authorizer:recheck", handler);
    return () => window.removeEventListener("authorizer:recheck", handler);
  }, []);
  const [showUpdater, setShowUpdater] = useState(false);
  const { status, update, downloadAndInstall } = useUpdater();

  useEffect(() => {
    if (update) {
      setShowUpdater(true);
    }
  }, [update]);

  return (
    <div className="w-screen h-screen flex bg-black rounded-xl overflow-hidden">
      <Aurora />
      <div data-tauri-drag-region className="w-screen h-7 absolute top-0 left-0 z-50" />
      <div className="w-full h-full flex flex-col gap-4 pt-12 pb-4 px-4 z-10">
        <header className="w-full flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TextList />
            <PrompterSettingsSheet />
          </div>
          <div className="flex items-center gap-2">
            <VersionBadge />
            <TrialBadge />
          </div>
          <PrompterButton />
        </header>
        <TextEditor />
      </div>
      <Authorizer
        onAuthorized={() => setIsAuthorized(true)}
        recheckTrigger={authorizerRecheck}
      />
      <DeviceStatusGate
        onClearedDevice={() => setAuthorizerRecheck((n) => n + 1)}
      />
      <Onboarding shouldCheckNow={isAuthorized} />
      <Updater
        isVisible={showUpdater && !!update}
        currentVersion={update?.currentVersion}
        newVersion={update?.version}
        isDownloading={status === "downloading"}
        onUpdate={downloadAndInstall}
        onSkip={() => setShowUpdater(false)}
      />
    </div>
  );
}

function App() {
  if (currentWindow.label === Window.PROMPT) {
    return <Prompter variant="standard" />;
  }
  if (currentWindow.label === Window.FLOATING_PROMPT) {
    return <Prompter variant="floating" />;
  }

  return <MainApp />;
}

export default App;