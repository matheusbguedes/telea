import { load } from "@tauri-apps/plugin-store";

const store = await load("onboarding.json", { autoSave: false, defaults: {} });

export async function hasCompletedOnboarding(): Promise<boolean> {
  return (await store.get<boolean>("completed")) ?? false;
}

export async function setOnboardingCompleted(): Promise<void> {
  await store.set("completed", true);
  await store.save();
}
