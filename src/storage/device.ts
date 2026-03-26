import { Device } from "@/types/device";
import { load } from "@tauri-apps/plugin-store";

const store = await load("device.json", { autoSave: false, defaults: {} });

export async function getDevice(): Promise<Device> {
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

export async function clearDevice(): Promise<void> {
  await setDevice({
    id: "",
    name: "",
    licenseKey: "",
  });
}
