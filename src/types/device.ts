import { User } from "./user";

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
  user?: User;
};

export type DeviceListItem = {
  id: string;
  name?: string;
  platform?: string;
  status: DeviceStatus;
};
