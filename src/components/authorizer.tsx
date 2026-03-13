import { cn } from "@/lib/utils";
import { getDevice, setDevice } from "@/storage/device";
import { fetch } from "@tauri-apps/plugin-http";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Loader2, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

export function Authorizer() {
    const [isVisible, setIsVisible] = useState<boolean>(false);

    const [key, setKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    async function checkDevice() {
        const device = await getDevice();
        if (!device.id) setIsVisible(true);
    }

    async function handleSubmit() {
        if (!key.trim() || isLoading || isSuccess) return;

        setIsLoading(true);
        setError("");

        try {
            const platform = getPlatform().toUpperCase();
            const response = await fetch("https://telea-server-production.up.railway.app/devices", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ licenseKey: key.trim(), platform }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Invalid license key.");
            }

            const data = await response.json();
            setIsSuccess(true);

            await setDevice({
                id: data.device.id,
                name: data.device.name,
                licenseKey: key.trim(),
            });

            setTimeout(() => setIsVisible(false), 1800);
        } catch (err: any) {
            setError(err.message || "Failed to activate. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        checkDevice();
    }, []);

    if (!isVisible) return null;

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
                    className="text-2xl font-bold text-white tracking-tight mb-1 select-none"
                    style={{ fontFamily: "'Inter', system-ui, sans-serif", letterSpacing: "-0.02em" }}
                >
                    Enter your license key
                </motion.h1>
                <motion.p
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.25 }}
                    className="text-sm text-white/40 text-center mb-6 leading-relaxed select-none"
                >
                    To continue, please enter your license key.
                </motion.p>
                <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                    className="w-full mb-3"
                >
                    <div className={cn(
                        "relative w-full rounded-xl border overflow-hidden transition-all duration-200",
                        error
                            ? "border-red-500/30 bg-red-500/5"
                            : isSuccess
                                ? "border-green-500/30 bg-green-500/5"
                                : "border-white/[0.08] bg-white/[0.04] focus-within:border-purple-500/40 focus-within:bg-white/[0.06]"
                    )}>
                        <input
                            type="text"
                            value={key}
                            onChange={(e) => {
                                setKey(e.target.value);
                                setError("");
                            }}
                            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                            placeholder="License key..."
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
                        onClick={handleSubmit}
                        disabled={!key.trim() || isLoading || isSuccess}
                        whileTap={{ scale: 0.98 }}
                        className={cn(
                            "relative w-full rounded-xl py-3.5 text-sm font-semibold text-white overflow-hidden transition-all duration-200",
                            (!key.trim() || isLoading || isSuccess)
                                ? "bg-purple-500/60 cursor-not-allowed"
                                : "bg-purple-500 hover:bg-purple-600 cursor-pointer"
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
                                    Activating...
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
                                    You are all set! <PartyPopper className="size-4" />
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
                                    Enter license key <ArrowRight className="size-4" />
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
                    If you need help, please contact us at <span className="text-purple-500">support@telea.com</span>
                </motion.p>
            </motion.div>
        </motion.div>
    );
}