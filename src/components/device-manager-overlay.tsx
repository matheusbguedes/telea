import { probeDevicesForLicenseKey, updateDeviceStatus } from "@/lib/api";
import { Device, DeviceListItem, DeviceStatus } from "@/types/device";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, Check, Loader2, Monitor } from "lucide-react";
import { useState } from "react";
import { useTranslation } from "react-i18next";

function formatPlatform(platform?: string): string {
  const map: Record<string, string> = {
    MACOS: "macOS",
    WINDOWS: "Windows",
    LINUX: "Linux",
    IOS: "iOS",
    ANDROID: "Android",
  };
  return platform ? (map[platform.toUpperCase()] ?? platform) : "Unknown";
}

interface DeviceManagerOverlayProps {
  devices: DeviceListItem[];
  /** PATCH this device to ACTIVE after deactivating another (DeviceStatusGate flow) */
  reactivateDeviceId?: string;
  /** POST with this key after deactivating another (Authorizer flow) */
  licenseKey?: string;
  onSuccess: (device?: Device) => void;
  onBack: () => void;
}

export function DeviceManagerOverlay({
  devices,
  reactivateDeviceId,
  licenseKey,
  onSuccess,
  onBack,
}: DeviceManagerOverlayProps) {
  const { t } = useTranslation();
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [succeeded, setSucceeded] = useState(false);

  const displayDevices = reactivateDeviceId
    ? devices.filter((d) => d.id !== reactivateDeviceId)
    : devices;

  async function handleDeactivate(deviceId: string) {
    if (deactivatingId) return;
    setDeactivatingId(deviceId);
    setError("");

    try {
      await updateDeviceStatus(deviceId, DeviceStatus.INACTIVE);

      if (reactivateDeviceId) {
        await updateDeviceStatus(reactivateDeviceId, DeviceStatus.ACTIVE);
        setSucceeded(true);
        setTimeout(() => onSuccess(), 1200);
        return;
      }

      if (licenseKey) {
        const platform = getPlatform().toUpperCase();
        const result = await probeDevicesForLicenseKey(licenseKey, platform);
        if (result.type === "activated") {
          setSucceeded(true);
          setTimeout(() => onSuccess(result.device), 1200);
          return;
        }
        setError(t("deviceManager.errors.activationFailed"));
      }
    } catch {
      setError(t("deviceManager.errors.generic"));
    } finally {
      setDeactivatingId(null);
    }
  }

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
        <AnimatePresence>
          {!succeeded && (
            <>
              <motion.div
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="mb-4"
              >
                <img
                  src="/icon.png"
                  alt={t("deviceManager.logoAlt")}
                  className="size-20 object-contain"
                />
              </motion.div>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-2xl font-bold text-white tracking-tight mb-1 select-none text-center"
                style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
              >
                {t("deviceManager.title")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3 }}
                className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
              >
                {t("deviceManager.subtitle")}
              </motion.p>
            </>
          )}
        </AnimatePresence>
        <AnimatePresence mode="wait">
          {succeeded ? (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.4, delay: 0.15, ease: [0.34, 1.56, 0.64, 1] }}
              role="status"
              aria-live="polite"
              className="w-full py-3 flex flex-col items-center gap-4"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 260,
                  damping: 20,
                  delay: 0.1,
                }}
                className="relative"
              >
                <motion.div
                  className="absolute inset-0 bg-purple-500/20 rounded-3xl blur-xl"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.5, 0.8, 0.5],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative size-20 rounded-3xl bg-purple-500/10 border-2 border-purple-500/30 flex items-center justify-center">
                  <Check className="size-10 text-purple-500"
                    strokeWidth={2.5}
                    aria-hidden
                  />
                </div>
              </motion.div>
            </motion.div>
          ) : (
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="w-full flex flex-col gap-2 mb-3"
            >
              {displayDevices.length === 0 ? (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                  className="text-sm text-white/30 text-center py-6 select-none"
                >
                  {t("deviceManager.noDevices")}
                </motion.p>
              ) : (
                displayDevices.map((device, i) => (
                  <motion.div
                    key={device.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.35, delay: 0.3 + i * 0.06, ease: [0.22, 1, 0.36, 1] }}
                    className="flex items-center justify-between rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="size-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                        <Monitor className="size-4 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm text-white/80 truncate leading-tight">
                          {device.name ?? formatPlatform(device.platform)}
                        </p>
                        {device.name && (
                          <p className="text-xs text-white/30 truncate leading-tight mt-0.5">
                            {formatPlatform(device.platform)}
                          </p>
                        )}
                      </div>
                    </div>
                    <motion.button
                      type="button"
                      onClick={() => void handleDeactivate(device.id)}
                      disabled={!!deactivatingId}
                      whileTap={{ scale: 0.97 }}
                      className="ml-3 shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium border border-red-500/25 text-red-400/80 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-150 cursor-pointer flex items-center gap-1.5"
                    >
                      {deactivatingId === device.id && (
                        <Loader2 className="size-3 animate-spin" />
                      )}
                      {t("deviceManager.deactivate")}
                    </motion.button>
                  </motion.div>
                ))
              )}
              <AnimatePresence>
                {error && (
                  <motion.p
                    key="error"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="text-xs text-red-400 text-center pt-1"
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
        {!succeeded && (
          <motion.button
            type="button"
            onClick={onBack}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="flex items-center gap-1.5 text-xs text-white/25 hover:text-white/50 transition-colors cursor-pointer select-none mt-1"
          >
            <ArrowLeft className="size-3" />
            {t("deviceManager.back")}
          </motion.button>
        )}
      </motion.div>
    </motion.div>
  );
}
