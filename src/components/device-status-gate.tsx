import { fetchDeviceStatus } from "@/lib/api";
import { cn } from "@/lib/utils";
import { clearDevice, getDevice } from "@/storage/device";
import { DeviceStatus } from "@/types/device";
import { motion } from "framer-motion";
import { Loader2, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

interface DeviceStatusGateProps {
  onClearedDevice?: () => void;
}

export function DeviceStatusGate({ onClearedDevice }: DeviceStatusGateProps) {
  const [showInactive, setShowInactive] = useState(false);
  const [isRechecking, setIsRechecking] = useState(false);

  const verify = useCallback(async () => {
    const device = await getDevice();
    if (!device.id) {
      setShowInactive(false);
      return;
    }

    try {
      const result = await fetchDeviceStatus(device.id);

      const isActive = result.status === DeviceStatus.ACTIVE;

      if (isActive) setShowInactive(false);
      else setShowInactive(true);
    } catch (error) {
      const isActive = device.status === DeviceStatus.ACTIVE;
      if (isActive) setShowInactive(false);
      else setShowInactive(true);
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

  if (!showInactive) return null;

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
            alt="Logo"
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
          Device not active
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
        >
          This device is no longer active on your license. Try again or sign in
          with a different license key.
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
            disabled={isRechecking}
            whileTap={{ scale: 0.98 }}
            className={cn(
              "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200 flex items-center justify-center gap-2",
              isRechecking
                ? "bg-purple-500/60 cursor-not-allowed"
                : "bg-purple-500 hover:bg-purple-600 cursor-pointer"
            )}
          >
            {isRechecking ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Checking…
              </>
            ) : (
              <>
                <RefreshCw className="size-4" />
                Try again
              </>
            )}
          </motion.button>
          <button
            type="button"
            onClick={() => void handleReactivate()}
            disabled={isRechecking}
            className={cn(
              "w-full rounded-xl py-3 text-sm font-medium transition-all duration-200 border",
              isRechecking
                ? "border-white/10 text-white/30 cursor-not-allowed"
                : "border-white/[0.12] text-white/70 hover:bg-white/[0.06] cursor-pointer"
            )}
          >
            Use another license key
          </button>
        </motion.div>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.35 }}
          className="text-xs text-white/25 text-center leading-relaxed mb-5 select-none"
        >
          If you need help, please contact us at{" "}
          <span className="text-purple-500">support@usetelea.online</span>
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
