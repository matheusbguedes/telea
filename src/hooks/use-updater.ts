import { relaunch } from "@tauri-apps/plugin-process";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { useCallback, useEffect, useState } from "react";

type UpdaterStatus = "idle" | "checking" | "downloading" | "ready-to-install";

interface UseUpdaterReturn {
  status: UpdaterStatus;
  update: Update | null;
  checkForUpdates: () => Promise<void>;
  downloadAndInstall: () => Promise<void>;
}

export function useUpdater(): UseUpdaterReturn {
  const [status, setStatus] = useState<UpdaterStatus>("idle");
  const [update, setUpdate] = useState<Update | null>(null);

  const downloadAndInstall = useCallback(async () => {
    if (!update) return;

    try {
      setStatus("downloading");
      await update.downloadAndInstall();
      setStatus("ready-to-install");
      await relaunch();
    } catch (error) {
      console.error("Failed to download and install update:", error);
      setStatus("idle");
    }
  }, [update]);

  const checkForUpdates = useCallback(async () => {
    setStatus("checking");

    try {
      const availableUpdate = await check();

      if (availableUpdate?.available) {
        setUpdate(availableUpdate);
        setStatus("idle");
      } else {
        setUpdate(null);
        setStatus("idle");
      }
    } catch (error) {
      console.error("Failed to check for updates:", error);
      setUpdate(null);
      setStatus("idle");
    }
  }, []);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    status,
    update,
    checkForUpdates,
    downloadAndInstall,
  };
}
