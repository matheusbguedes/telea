import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

interface CountdownProps {
    initialValue?: number;
    onComplete: () => void;
}

export function Countdown({ initialValue = 3, onComplete }: CountdownProps) {
    const [countdown, setCountdown] = useState<number | null>(initialValue);

    useEffect(() => {
        if (countdown === null || countdown === 0) return;

        const timer = setTimeout(() => {
            if (countdown > 1) {
                setCountdown(countdown - 1);
            } else {
                setCountdown(null);
                onComplete();
            }
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, onComplete]);

    return (
        <AnimatePresence>
            {countdown && (
                <motion.div
                    className="absolute inset-0 flex items-center justify-center z-50 bg-black backdrop-blur-xl rounded-b-xl"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                >
                    <motion.div
                        key={countdown}
                        initial={{ scale: 0.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        exit={{ scale: 1.5, opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="text-purple-500 text-3xl font-bold select-none cursor-default"
                    >
                        {countdown}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );
}
