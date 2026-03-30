import { DeviceManagerOverlay } from "@/components/device-manager-overlay";
import { TELEA_API_BASE } from "@/lib/api";
import { cn } from "@/lib/utils";
import { getDevice, setDevice } from "@/storage/device";
import { setUser } from "@/storage/user";
import { Device, DeviceListItem, DeviceStatus } from "@/types/device";
import { fetch } from "@tauri-apps/plugin-http";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { openUrl } from "@tauri-apps/plugin-opener";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";
import { Trans, useTranslation } from "react-i18next";

interface AuthorizerProps {
  onAuthorized?: () => void;
  recheckTrigger?: number;
}

function mapAuthorizerApiError(message: string, translate: (key: string) => string): string {
  const known: Record<string, string> = {
    "Invalid license key": translate("authorizer.errors.invalidKey"),
    "Failed to activate device": translate("authorizer.errors.failed"),
  };
  return known[message] ?? translate("authorizer.errors.generic");
}

export function Authorizer({ onAuthorized, recheckTrigger = 0 }: AuthorizerProps) {
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState<boolean>(false);

  const [key, setKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [maxDevicesData, setMaxDevicesData] = useState<{ devices: DeviceListItem[]; licenseKey: string } | null>(null);

  async function checkDevice() {
    const device = await getDevice();
    if (!device.id) {
      setIsVisible(true);
      setKey("");
      setIsLoading(false);
      setIsSuccess(false);
      setError("");
      setMaxDevicesData(null);
    } else {
      setIsVisible(false);
    }
  }

  async function handleSubmit() {
    if (!key.trim() || isLoading || isSuccess) return;

    setIsLoading(true);
    setError("");

    const timeout = setTimeout(() => {
      setIsLoading(false);
      setError(t("authorizer.errors.timeout"));
    }, 15000);

    try {
      const platform = getPlatform().toUpperCase();
      const response = await fetch(`${TELEA_API_BASE}/devices`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ licenseKey: key.trim(), platform }),
      });

      clearTimeout(timeout);

      if (!response.ok) {
        const data = (await response.json().catch(() => null)) as {
          error?: string;
          user?: { devices: DeviceListItem[] };
        } | null;
        const errorMsg = typeof data?.error === "string" ? data.error : "";

        if (errorMsg === "Max devices reached" && data?.user?.devices) {
          const active = data.user.devices.filter((d) => d.status === DeviceStatus.ACTIVE);
          setMaxDevicesData({ devices: active, licenseKey: key.trim() });
          setIsLoading(false);
          return;
        }

        if (errorMsg === "Max devices reached for trial user") {
          setError(t("authorizer.errors.maxDevicesForTrial"));
          setIsLoading(false);
          return;
        }

        throw new Error(errorMsg);
      }

      const data = (await response.json()) as { device: Device };
      await activateWithDevice(data.device, key.trim());
    } catch (err: unknown) {
      clearTimeout(timeout);
      const raw = err instanceof Error ? err.message : "";
      setError(mapAuthorizerApiError(raw || t("authorizer.errors.failed"), t));
    } finally {
      setIsLoading(false);
    }
  }

  async function activateWithDevice(device: Device, licenseKey: string) {
    setIsSuccess(true);

    await setUser({
      id: device.user?.id ?? "",
      name: device.user?.name ?? "",
      email: device.user?.email ?? "",
      license_key: licenseKey,
      is_paid: device.user?.is_paid ?? false,
    });

    await setDevice({
      id: device.id,
      name: device.name,
      licenseKey,
    });

    setTimeout(() => {
      setIsVisible(false);
      setMaxDevicesData(null);
      onAuthorized?.();
    }, 1500);
  }

  useEffect(() => {
    void checkDevice();
  }, [recheckTrigger]);

  if (!isVisible) return null;

  if (maxDevicesData) {
    return (
      <DeviceManagerOverlay
        devices={maxDevicesData.devices}
        licenseKey={maxDevicesData.licenseKey}
        onSuccess={async (device) => {
          if (!device) return;
          await activateWithDevice(device, maxDevicesData.licenseKey);
        }}
        onBack={() => setMaxDevicesData(null)}
      />
    );
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
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 relative"
        >
          <img
            src="/icon.png"
            alt={t("authorizer.logoAlt")}
            className="relative size-20 object-contain"
          />
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-2xl font-bold text-white tracking-tight mb-1 select-none"
          style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
        >
          {t("authorizer.title")}
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
        >
          {t("authorizer.subtitle")}
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="w-full mb-3"
        >
          <div
            className={cn(
              "relative w-full rounded-xl border overflow-hidden transition-all duration-200",
              error
                ? "border-red-500/30 bg-red-500/5"
                : isSuccess
                  ? "border-green-500/30 bg-green-500/5"
                  : "border-white/[0.08] bg-white/[0.04] focus-within:border-purple-500/40 focus-within:bg-white/[0.06]",
            )}
          >
            <input
              type="text"
              value={key}
              onChange={(e) => {
                setKey(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => e.key === "Enter" && void handleSubmit()}
              placeholder={t("authorizer.placeholder")}
              spellCheck={false}
              autoComplete="off"
              autoFocus
              className="w-full bg-transparent px-4 py-3.5 text-sm font-mono placeholder:text-white/20 text-white/80 outline-none"
            />
          </div>
          <AnimatePresence>
            {error && (
              <motion.p
                key="error"
                initial={{ opacity: 0, y: -4, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -4, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-xs text-red-400 mt-2 px-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="w-full mb-4"
        >
          <motion.button
            type="button"
            onClick={() => void handleSubmit()}
            disabled={!key.trim() || isLoading || isSuccess}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200",
              (!key.trim() || isLoading || isSuccess)
                ? "bg-purple-500/60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer",
            )}
          >
            {!isLoading && !isSuccess && key.trim() && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                initial={{ x: "-100%" }}
                whileHover={{ x: "200%" }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            )}
            <AnimatePresence mode="wait">
              {isLoading && (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="size-4 animate-spin" />
                  {t("authorizer.activating")}
                </div>
              )}
              {isSuccess && (
                <motion.span
                  key="success"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  {t("authorizer.success")} <PartyPopper className="size-4" />
                </motion.span>
              )}
              {!isLoading && !isSuccess && (
                <motion.span
                  key="idle"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.15 }}
                  className="flex items-center justify-center gap-2"
                >
                  {t("authorizer.submit")} <ArrowRight className="size-4" />
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-xs text-white/25 text-center leading-relaxed mb-5 select-none"
        >
          <Trans
            i18nKey="authorizer.help"
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
