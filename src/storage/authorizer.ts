import { Authorizer } from "@/types/authorizer";
import { load } from "@tauri-apps/plugin-store";

const store = await load("authorizer.json", { autoSave: false, defaults: {} });

export async function getAuthorizer(): Promise<Authorizer> {
  return (
    (await store.get<Authorizer>("authorizer")) ?? {
      deviceId: "",
      accessKey: "",
    }
  );
}

export async function setAuthorizer(authorizer: Authorizer): Promise<void> {
  await store.set("authorizer", authorizer);
  await store.save();
}
