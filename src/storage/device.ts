import { Device } from "@/types/authorizer";
import { load } from "@tauri-apps/plugin-store";

const store = await load("device.json", { autoSave: false, defaults: {} });

export async function getDevice(): Promise<Device> {
  await store.clear();
  return (
    (await store.get<Device>("device")) ?? {
      id: "",
      name: "",
      licenseKey: "",
    }
  );
}

export async function setDevice(device: Device): Promise<void> {
  await store.set("device", device);
  await store.save();
}
