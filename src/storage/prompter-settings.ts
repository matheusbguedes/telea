import {
  PROMPTER_SETTINGS_DEFAULTS,
  type PrompterSettings,
} from "@/types/prompter-settings";
import { emit } from "@tauri-apps/api/event";
import { load } from "@tauri-apps/plugin-store";

const store = await load("prompter-settings.json", { autoSave: false, defaults: {} });

export async function getPrompterSettings(): Promise<PrompterSettings> {
  const saved = await store.get<Partial<PrompterSettings>>("settings");
  return { ...PROMPTER_SETTINGS_DEFAULTS, ...saved };
}

export async function savePrompterSettings(settings: PrompterSettings): Promise<void> {
  await store.set("settings", settings);
  await store.save();
  await emit("prompter-settings-updated", {});
}
