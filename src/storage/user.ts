import { User } from "@/types/user";
import { load } from "@tauri-apps/plugin-store";

const store = await load("user.json", { autoSave: false, defaults: {} });

export async function getUser(): Promise<User> {
  return (
    (await store.get<User>("user")) ?? {
      id: "",
      name: "",
      email: "",
      license_key: "",
      is_paid: false,
    }
  );
}

export async function setUser(user: User): Promise<void> {
  await store.set("user", user);
  await store.save();
}
