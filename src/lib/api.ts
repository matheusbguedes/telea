import { setDevice } from "@/storage/device";
import { Device } from "@/types/device";
import { fetch } from "@tauri-apps/plugin-http";

export const TELEA_API_BASE = "https://telea-server-production.up.railway.app";

export async function fetchDeviceStatus(deviceId: string): Promise<Device> {
  try {
    const response = await fetch(
      `${TELEA_API_BASE}/devices/${encodeURIComponent(deviceId)}`,
      {
        method: "GET",
        headers: { Accept: "application/json" },
      },
    );

    const { device } = await response.json();

    if (!device) throw new Error("Device not found");

    await setDevice(device);

    return device;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
