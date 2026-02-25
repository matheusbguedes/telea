import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { useEffect, useState } from 'react';

export function useUpdater() {
  const [isChecking, setIsChecking] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    checkForUpdates();
  }, []);

  async function checkForUpdates() {
    try {
      setIsChecking(true);
      const update = await check();

      if (update?.available) {
        console.log(`Update available: ${update.version}`);
        await downloadAndInstall(update);
      } else {
        console.log('No updates available');
      }
    } catch (error) {
      console.error('Failed to check for updates:', error);
    } finally {
      setIsChecking(false);
    }
  }

  async function downloadAndInstall(update: Awaited<ReturnType<typeof check>>) {
    if (!update) return;

    try {
      setIsDownloading(true);
      
      await update.downloadAndInstall((event) => {
        switch (event.event) {
          case 'Started':
            console.log(`Started downloading ${event.data.contentLength} bytes`);
            break;
          case 'Progress':
            console.log(`Downloaded ${event.data.chunkLength} bytes`);
            break;
          case 'Finished':
            console.log('Download finished');
            break;
        }
      });

      console.log('Update installed, relaunching app...');
      await relaunch();
    } catch (error) {
      console.error('Failed to download and install update:', error);
    } finally {
      setIsDownloading(false);
    }
  }

  return {
    isChecking,
    isDownloading,
    checkForUpdates,
  };
}
