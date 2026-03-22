import {
  PROMPTER_SETTINGS_DEFAULTS,
  type PrompterSettings,
} from "@/types/prompter-settings";
import { getPrompterSettings, savePrompterSettings } from "@/storage/prompter-settings";
import { useCallback, useEffect, useState } from "react";

export function usePrompterSettings() {
  const [settings, setSettings] = useState<PrompterSettings>(PROMPTER_SETTINGS_DEFAULTS);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getPrompterSettings().then((s) => {
      if (!cancelled) {
        setSettings(s);
        setReady(true);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const update = useCallback(async (patch: Partial<PrompterSettings>) => {
    const next: PrompterSettings = { ...settings, ...patch };
    await savePrompterSettings(next);
    setSettings(next);
  }, [settings]);

  return { settings, ready, update };
}
