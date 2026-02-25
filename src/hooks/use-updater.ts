import { check, type Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useCallback, useEffect, useState } from 'react';

type UpdaterStatus = 'idle' | 'checking' | 'downloading';

interface UseUpdaterReturn {
  status: UpdaterStatus;
  checkForUpdates: () => Promise<void>;
}

export function useUpdater(): UseUpdaterReturn {
  const [status, setStatus] = useState<UpdaterStatus>('idle');

  const downloadAndInstall = useCallback(async (update: Update) => {
    setStatus('downloading');
    await update.downloadAndInstall();
    await relaunch();
  }, []);

  const checkForUpdates = useCallback(async () => {
    setStatus('checking');

    try {
    const update = await check();

      if (update?.available) {
        await downloadAndInstall(update);
      } else {
        setStatus('idle');
      }
    } catch (error) {
      console.error(error);
      setStatus('idle');
    }
  }, [downloadAndInstall]);

  useEffect(() => {
    checkForUpdates();
  }, [checkForUpdates]);

  return {
    status,
    checkForUpdates,
  };
}