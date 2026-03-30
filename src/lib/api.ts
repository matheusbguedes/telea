import { setDevice } from "@/storage/device";
import { getUser, setUser } from "@/storage/user";
import { Device, DeviceListItem, DeviceStatus } from "@/types/device";
import { fetch } from "@tauri-apps/plugin-http";

export const TELEA_API_BASE = "https://telea-server-production.up.railway.app";

export async function updateDeviceStatus(
  deviceId: string,
  status: DeviceStatus,
): Promise<void> {
  const response = await fetch(
    `${TELEA_API_BASE}/devices/${encodeURIComponent(deviceId)}`,
    {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    },
  );
  if (!response.ok) throw new Error("Failed to update device status");
}

type ProbeResult =
  | { type: "activated"; device: Device }
  | { type: "max_devices"; devices: DeviceListItem[] };

export async function probeDevicesForLicenseKey(
  licenseKey: string,
  platform: string,
): Promise<ProbeResult> {
  const response = await fetch(`${TELEA_API_BASE}/devices`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ licenseKey, platform }),
  });

  if (response.ok) {
    const { device } = (await response.json()) as { device: Device };
    return { type: "activated", device };
  }

  if (response.status === 400) {
    const data = (await response.json()) as {
      error: string;
      user?: { devices: DeviceListItem[] };
    };
    if (data.error === "Max devices reached" && data.user?.devices) {
      const active = data.user.devices.filter(
        (d) => d.status === DeviceStatus.ACTIVE,
      );
      return { type: "max_devices", devices: active };
    }
  }

  throw new Error("Failed to probe devices");
}

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

    const user = await getUser();
    if (!user.id || user.is_paid !== device.user?.is_paid)
      await setUser(device.user);

    return device;
  } catch (error) {
    console.error(error);
    throw error;
  }
}
