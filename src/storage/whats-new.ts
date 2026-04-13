import { load } from "@tauri-apps/plugin-store";

const store = await load("whats-new.json", { autoSave: false, defaults: {} });

export async function getLastSeenVersion(): Promise<string | null> {
  return (await store.get<string>("lastSeenVersion")) ?? null;
}

export async function setLastSeenVersion(version: string): Promise<void> {
  await store.set("lastSeenVersion", version);
  await store.save();
}
