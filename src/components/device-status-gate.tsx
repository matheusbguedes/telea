import { DeviceManagerOverlay } from "@/components/device-manager-overlay";
import { fetchDeviceStatus, probeDevicesForLicenseKey } from "@/lib/api";
import { cn } from "@/lib/utils";
import { clearDevice, getDevice, setDevice } from "@/storage/device";
import { getUser, setUser } from "@/storage/user";
import { DeviceListItem, DeviceStatus } from "@/types/device";
import { openUrl } from "@tauri-apps/plugin-opener";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, Monitor, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface DeviceStatusGateProps {
  onClearedDevice?: () => void;
}

type GateView = "inactive" | "loading-devices" | "device-manager";

export function DeviceStatusGate({ onClearedDevice }: DeviceStatusGateProps) {
  const { t } = useTranslation();
  const [showInactive, setShowInactive] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);
  const [gateView, setGateView] = useState<GateView>("inactive");
  const [probeError, setProbeError] = useState("");
  const [manageDevices, setManageDevices] = useState<{
    devices: DeviceListItem[];
    currentDeviceId: string;
  } | null>(null);

  const verify = useCallback(async () => {
    const device = await getDevice();
    if (!device.id) {
      setShowInactive(false);
      return;
    }

    try {
      const result = await fetchDeviceStatus(device.id);
      const isActive = result.status === DeviceStatus.ACTIVE;
      setShowInactive(!isActive);
    } catch {
      const isActive = device.status === DeviceStatus.ACTIVE;
      setShowInactive(!isActive);
    }
  }, []);

  useEffect(() => {
    void verify();
  }, [verify]);

  async function handleRetry() {
    setIsRechecking(true);
    try {
      await verify();
    } finally {
      setIsRechecking(false);
    }
  }

  async function handleReactivate() {
    await clearDevice();
    setShowInactive(false);
    onClearedDevice?.();
  }

  async function handleManageDevices() {
    setGateView("loading-devices");
    setProbeError("");

    try {
      const user = await getUser();
      const device = await getDevice();

      if (!user.license_key) {
        setGateView("inactive");
        setProbeError(t("deviceStatus.manageError"));
        return;
      }

      const platform = getPlatform().toUpperCase();
      const result = await probeDevicesForLicenseKey(user.license_key, platform);

      if (result.type === "activated") {
        await setUser({
          id: result.device.user?.id ?? "",
          name: result.device.user?.name ?? "",
          email: result.device.user?.email ?? "",
          license_key: user.license_key,
          is_paid: result.device.user?.is_paid ?? false,
        });
        await setDevice({
          id: result.device.id,
          name: result.device.name,
          licenseKey: user.license_key,
        });
        setShowInactive(false);
        return;
      }

      setManageDevices({ devices: result.devices, currentDeviceId: device.id });
      setGateView("device-manager");
    } catch {
      setGateView("inactive");
      setProbeError(t("deviceStatus.manageError"));
    }
  }

  if (!showInactive) return null;

  if (gateView === "device-manager" && manageDevices) {
    return (
      <DeviceManagerOverlay
        devices={manageDevices.devices}
        reactivateDeviceId={manageDevices.currentDeviceId}
        onSuccess={async () => {
          setShowInactive(false);
          setGateView("inactive");
          setManageDevices(null);
        }}
        onBack={() => {
          setGateView("inactive");
          setManageDevices(null);
        }}
      />
    );
  }

  const isLoadingDevices = gateView === "loading-devices";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
    >
      <div data-tauri-drag-region className="w-screen h-7 absolute top-0 left-0 z-50" />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-10 flex flex-col items-center w-full max-w-sm px-6"
      >
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 relative"
        >
          <img
            src="/icon.png"
            alt={t("deviceStatus.logoAlt")}
            className="relative size-20 object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-white tracking-tight mb-1 select-none text-center"
          style={{
            fontFamily: "'Inter', system-ui, sans-serif",
            letterSpacing: "-0.02em",
          }}
        >
          {t("deviceStatus.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
        >
          {t("deviceStatus.description")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full flex flex-col gap-3 mb-4"
        >
          <motion.button
            type="button"
            onClick={() => void handleRetry()}
            disabled={isRechecking || isLoadingDevices}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200 flex items-center justify-center gap-2",
              isRechecking || isLoadingDevices
                ? "bg-purple-500/60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer",
            )}
          >
            {isRechecking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                {t("deviceStatus.checking")}
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                {t("deviceStatus.tryAgain")}
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={() => void handleManageDevices()}
            disabled={isRechecking || isLoadingDevices}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-medium transition-all duration-200 border flex items-center justify-center gap-2",
              isRechecking || isLoadingDevices
                ? "border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/[0.12] text-white/70 hover:bg-white/[0.06] cursor-pointer",
            )}
          >
            {isLoadingDevices ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Monitor className="size-4" />
            )}
            {isLoadingDevices ? t("deviceStatus.loadingDevices") : t("deviceStatus.manageDevices")}
          </button>
          <button
            type="button"
            onClick={() => void handleReactivate()}
            disabled={isRechecking || isLoadingDevices}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-medium transition-all duration-200",
              isRechecking || isLoadingDevices
                ? "text-white/20 cursor-not-allowed"
                : "text-white/40 hover:text-white/60 cursor-pointer",
            )}
          >
            {t("deviceStatus.useAnotherKey")}
          </button>
          <AnimatePresence>
            {probeError && (
              <motion.p
                key="probe-error"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="text-xs text-red-400 text-center pt-1"
              >
                {probeError}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-xs text-white/25 text-center leading-relaxed mb-5 select-none"
        >
          <Trans
            i18nKey="deviceStatus.help"
            components={{
              support: (
                <span
                  className="text-purple-500 cursor-pointer hover:text-purple-400 transition-colors"
                  onClick={() => void openUrl("mailto:support@usetelea.online")}
                />
              ),
            }}
          />
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
