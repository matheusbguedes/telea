import { cn } from "@/lib/utils";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";

interface CountdownProps {
    initialValue?: number;
    onComplete: () => void;
}

export function Countdown({ initialValue = 3, onComplete }: CountdownProps) {
    const platform = getPlatform().toUpperCase();
    const [countdown, setCountdown] = useState<number>(initialValue);
    const [visible, setVisible] = useState(true);
    const onCompleteRef = useRef(onComplete);

    useEffect(() => {
        onCompleteRef.current = onComplete;
    }, [onComplete]);

    useEffect(() => {
        if (countdown <= 0) return;

        const timer = setTimeout(() => {
            if (countdown > 1) {
                setCountdown((c) => c - 1);
            } else {
                setVisible(false);
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown]);

    return (
        <AnimatePresence onExitComplete={() => onCompleteRef.current()}>
            {visible && (
                <motion.div
                    className={cn("absolute inset-0 flex items-center justify-center z-50 bg-black backdrop-blur-xl rounded-b-2xl", platform === "MACOS" && "pt-5")}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                >
                    <AnimatePresence mode="popLayout">
                        <motion.div
                            key={countdown}
                            initial={{ scale: 0.4, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.4 }}
                            className="text-purple-500 text-4xl font-bold select-none cursor-default"
                        >
                            {countdown}
                        </motion.div>
                    </AnimatePresence>
                </motion.div>
            )}
        </AnimatePresence>
    );
}