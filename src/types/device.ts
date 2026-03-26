export enum DeviceStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

export type Device = {
  id: string;
  name?: string;
  licenseKey: string;
  platform?: string;
  status?: DeviceStatus;
};
