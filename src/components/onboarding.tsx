import { getDevice } from "@/storage/device";
import { hasCompletedOnboarding, setOnboardingCompleted } from "@/storage/onboarding";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "./animate-ui/components/buttons/button";
import { AudioLinesIcon } from "./ui/audio-lines";
import { FilePenLineIcon } from "./ui/file-pen-line";

const slides = [
    {
        id: 0,
        illustration: (
            <img
                src="/icon.png"
                alt="Telea"
                className="size-24 object-contain select-none"
                draggable={false}
            />
        ),
        title: "Welcome to Telea",
        description: "Speak like you always know what to say.",
    },
    {
        id: 1,
        illustration: <FilePenLineIcon size={68} className="text-white" />,
        title: "Write your script",
        description: "Add a title and your content.",
    },
    {
        id: 2,
        illustration: <AudioLinesIcon size={68} className="text-white" />,
        title: "Press play and speak",
        description: "Telea follows your voice and scrolls for you.",
    },
] as const;

// ─── Constants ────────────────────────────────────────────────────────────────

const slideVariants = {
    enter: (dir: number) => ({ opacity: 0, x: dir * 28 }),
    center: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: -dir * 28 }),
};

const easing = [0.22, 1, 0.36, 1] as const;

// ─── Component ────────────────────────────────────────────────────────────────

interface OnboardingProps {
    shouldCheckNow?: boolean;
}

export function Onboarding({ shouldCheckNow }: OnboardingProps) {
    const [isVisible, setIsVisible] = useState(false);
    const [current, setCurrent] = useState(0);
    const [direction, setDirection] = useState(1);

    const isLast = current === slides.length - 1;

    useEffect(() => {
        async function checkIfShouldShow() {
            const device = await getDevice();
            if (!device.id) return;

            const completed = await hasCompletedOnboarding();
            if (!completed) setIsVisible(true);
        }

        checkIfShouldShow();
    }, [shouldCheckNow]);

    function goTo(index: number) {
        setDirection(index > current ? 1 : -1);
        setCurrent(index);
    }

    async function next() {
        if (isLast) {
            await setOnboardingCompleted();
            setIsVisible(false);
        } else {
            goTo(current + 1);
        }
    }

    function prev() {
        if (current > 0) goTo(current - 1);
    }

    if (!isVisible) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md"
        >
            <div data-tauri-drag-region className="absolute inset-x-0 top-0 z-50 h-7" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: easing }}
                className="relative z-10 flex w-full max-w-md flex-col items-center px-6"
            >
                {/* Illustration */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.35, ease: easing }}
                        className="mb-8 flex size-24 items-center justify-center"
                    >
                        {slides[current].illustration}
                    </motion.div>
                </AnimatePresence>

                {/* Text */}
                <AnimatePresence mode="wait" custom={direction}>
                    <motion.div
                        key={current}
                        custom={direction}
                        variants={slideVariants}
                        initial="enter"
                        animate="center"
                        exit="exit"
                        transition={{ duration: 0.3, ease: easing }}
                        className="mb-8 flex w-full flex-col items-center text-center"
                    >
                        <h2
                            className="mb-1.5 select-none text-2xl font-bold tracking-tight text-white"
                            style={{ letterSpacing: "-0.02em" }}
                        >
                            {slides[current].title}
                        </h2>
                        <p className="select-none text-sm leading-relaxed text-white/35">
                            {slides[current].description}
                        </p>
                    </motion.div>
                </AnimatePresence>

                {/* Navigation */}
                <div className="flex w-full items-center justify-between">
                    <Button size="icon" variant="outline" onClick={prev} disabled={current === 0}>
                        <ArrowLeft className="size-4" />
                    </Button>

                    <div className="flex items-center gap-2">
                        {slides.map((_, i) => (
                            <motion.button
                                key={i}
                                onClick={() => goTo(i)}
                                animate={{
                                    width: i === current ? 20 : 6,
                                    opacity: i === current ? 1 : 0.25,
                                }}
                                transition={{ duration: 0.3, ease: easing }}
                                className="h-1.5 cursor-pointer rounded-full bg-purple-400"
                            />
                        ))}
                    </div>

                    {isLast ? (
                        <Button size="icon" variant="default" onClick={next}>
                            <CheckCheck className="size-3.5" />
                        </Button>
                    ) : (
                        <Button size="icon" variant="outline" onClick={next}>
                            <ArrowRight className="size-3.5" />
                        </Button>
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}