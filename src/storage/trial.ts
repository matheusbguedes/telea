import { load } from "@tauri-apps/plugin-store";

const store = await load("trial.json", { autoSave: false, defaults: {} });

const MAX_TRIAL_ATTEMPTS = 5;

export async function getTrialAttempts(): Promise<number> {
  return (await store.get<number>("attempts")) ?? 0;
}

export async function incrementTrialAttempts(): Promise<number> {
  const current = await getTrialAttempts();
  const next = current + 1;
  await store.set("attempts", next);
  await store.save();
  return next;
}

export async function isTrialExpired(): Promise<boolean> {
  const attempts = await getTrialAttempts();
  return attempts >= MAX_TRIAL_ATTEMPTS;
}

export { MAX_TRIAL_ATTEMPTS };
