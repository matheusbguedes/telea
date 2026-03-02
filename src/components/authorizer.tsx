import { Button } from "@/components/animate-ui/components/buttons/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/animate-ui/components/radix/dialog";
import { cn } from "@/lib/utils";
import { getAuthorizer, setAuthorizer } from "@/storage/authorizer";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, KeyRound, PartyPopper } from "lucide-react";
import { useEffect, useState } from "react";

export function Authorizer() {
    const [isOpen, setIsOpen] = useState<boolean>(false);

    const [key, setKey] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState("");

    async function checkAuthorizer() {
        const authorizer = await getAuthorizer();
        if (!authorizer.deviceId) setIsOpen(true);
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();

        if (!key.trim() || isLoading || isSuccess) return;

        setIsLoading(true);
        setError("");

        try {
            const platform = getPlatform().toUpperCase();
            const response = await fetch("https://telea-server-production.up.railway.app/devices/activate", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    accessKey: key.trim(),
                    platform,
                }),
            });

            if (!response.ok) {
                const data = await response.json().catch(() => null);
                throw new Error(data?.message || "Invalid access key.");
            }

            const data = await response.json();
            setIsSuccess(true);

            console.log(data);

            await setAuthorizer({
                deviceId: data.device.id,
                accessKey: key.trim(),
            });

            // Close dialog after short delay on success
            setTimeout(() => setIsOpen(false), 1500);
        } catch (err: any) {
            setError(err.message || "Failed to activate. Please try again.");
        } finally {
            setIsLoading(false);
        }
    }

    useEffect(() => {
        checkAuthorizer();
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent
                from="bottom"
                showCloseButton={false}
                onInteractOutside={(e) => e.preventDefault()}
                className="
                    !fixed !left-1/2 !top-1/2 !-translate-x-1/2 !-translate-y-1/2
                    !bottom-auto !right-auto
                    w-[calc(100vw-2rem)] sm:w-full sm:max-w-sm
                    rounded-2xl border border-purple-500/20 bg-black/80 backdrop-blur-xl
                    shadow-[0_0_60px_-12px_rgba(168,85,247,0.5)]
                    p-6
                "
            >
                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    <DialogHeader className="items-center text-center gap-3">
                        <div className="size-9 flex items-center justify-center rounded-xl border border-purple-500/20 bg-purple-500/20">
                            <KeyRound className="size-4 text-purple-500" />
                        </div>
                        <div className="flex flex-col gap-1 text-center select-none cursor-default">
                            <DialogTitle className="text-sm font-semibold text-white/80">
                                Enter your access key
                            </DialogTitle>
                            <DialogDescription className="w-full text-xs text-muted-foreground text-balance leading-relaxed">
                                You received your key by e-mail after purchase.
                            </DialogDescription>
                        </div>
                    </DialogHeader>
                    <div className="flex flex-col gap-1.5">
                        <div className={cn("flex items-center rounded-xl border transition-all duration-200 overflow-hidden", error ? "border-red-400/20 bg-red-400/10" : isSuccess ? "border-green-500/20 bg-green-500/20" : "border-white/10 bg-white/[0.04] focus-within:border-white/20 focus-within:bg-white/[0.07]")}>
                            <input
                                type="text"
                                id="access-key"
                                value={key}
                                onChange={(e) => {
                                    setKey(e.target.value);
                                    setError("");
                                }}
                                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                                spellCheck={false}
                                autoComplete="off"
                                autoFocus
                                className="flex-1 bg-transparent px-3.5 py-2.5 text-xs font-mono placeholder:text-white/20 text-white/80 outline-none"
                            />
                        </div>
                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    key="error"
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -4 }}
                                    transition={{ duration: 0.15 }}
                                    className="text-xs text-red-400 px-1"
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>
                    </div>
                    <DialogFooter className="flex flex-row gap-2 sm:gap-2">
                        <Button
                            type="submit"
                            disabled={!key.trim() || isLoading || isSuccess}
                            className="relative w-full overflow-hidden text-xs font-semibold bg-purple-500 text-white hover:bg-purple-600 disabled:opacity-50 transition-colors"
                            asChild
                        >
                            <motion.button
                                whileTap={{ scale: 0.97 }}
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                            >
                                <AnimatePresence mode="wait">
                                    {isLoading && (
                                        <motion.span
                                            key="loading"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            Activating...
                                        </motion.span>
                                    )}
                                    {isSuccess && (
                                        <motion.span
                                            key="success"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            You are all set! <PartyPopper className="size-3.5" />
                                        </motion.span>
                                    )}
                                    {!isLoading && !isSuccess && (
                                        <motion.span
                                            key="idle"
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.15 }}
                                            className="flex items-center gap-1.5"
                                        >
                                            <span>Activate</span>
                                            <ArrowRight className="size-3.5" />
                                        </motion.span>
                                    )}
                                </AnimatePresence>
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 pointer-events-none"
                                    initial={{ x: "-100%" }}
                                    whileHover={{ x: "200%" }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                />
                            </motion.button>
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}