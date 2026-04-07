import {
    PROMPTER_TEXT_COLOR_CLASS,
    PROMPTER_TEXT_SIZE_CLASS,
} from "@/lib/prompter-display";
import {
    FLOATING_PROMPTER_READY_EVENT,
    applyPromptWindowAboveMenubar,
    restoreStandardPrompterFromFloating,
    type ContentLoadedPayload,
} from "@/lib/prompter-window";
import { cn } from "@/lib/utils";
import { getPrompterSettings } from "@/storage/prompter-settings";
import { PROMPTER_SETTINGS_DEFAULTS } from "@/types/prompter-settings";
import { Window } from "@/types/window";
import { listen } from "@tauri-apps/api/event";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { motion, useAnimation } from "framer-motion";
import { PauseIcon, PlayIcon, SquareArrowOutUpLeft } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "../animate-ui/components/buttons/button";
import { Countdown } from "./countdown";
import { FloatingPrompterButton } from "./floating-prompter-button";
import VoiceIndicator from "./voice-indicator";

const VOICE_THRESHOLD = 45;
const VOICE_HISTORY_SIZE = 10;
const VOICE_FREQ_MIN = 85;
const VOICE_FREQ_MAX = 2000;

export type PrompterVariant = "standard" | "floating";

type PrompterProps = {
    variant?: PrompterVariant;
};

export default function Prompter({ variant = "standard" }: PrompterProps) {
    const { t } = useTranslation();
    const isFloating = variant === "floating";
    const platform = getPlatform().toUpperCase();

    const [settings, setSettings] = useState(() => PROMPTER_SETTINGS_DEFAULTS);
    const scrollSpeedRef = useRef(settings.scrollSpeed);

    const [content, setContent] = useState<string>("");
    const [showCountdown, setShowCountdown] = useState(!isFloating);
    const [isScrolling, setIsScrolling] = useState(isFloating);
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isManuallyPaused, setIsManuallyPaused] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();
    const pendingInitialYRef = useRef<number | null>(null);
    const audioGateReadyRef = useRef(false);

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const voiceHistoryRef = useRef<number[]>([]);
    const pausedAtRef = useRef<number>(0);
    const isSpeakingRef = useRef<boolean>(false);
    const isManuallyPausedRef = useRef<boolean>(false);
    const isScrollingRef = useRef<boolean>(false);
    const isPausedRef = useRef<boolean>(false);
    const prevMaxScrollRef = useRef<number>(0);

    useEffect(() => {
        scrollSpeedRef.current = settings.scrollSpeed;
    }, [settings.scrollSpeed]);

    useEffect(() => {
        getPrompterSettings().then(setSettings);
    }, []);

    useEffect(() => {
        let unlisten: (() => void) | undefined;
        listen("prompter-settings-updated", () => {
            getPrompterSettings().then(setSettings);
        }).then((fn) => {
            unlisten = fn;
        });
        return () => {
            unlisten?.();
        };
    }, []);

    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
    useEffect(() => { isManuallyPausedRef.current = isManuallyPaused; }, [isManuallyPaused]);
    useEffect(() => { isScrollingRef.current = isScrolling; }, [isScrolling]);
    useEffect(() => { isPausedRef.current = isPaused; }, [isPaused]);

    const detectVoice = () => {
        if (!analyserRef.current) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        const nyquist = analyserRef.current.context.sampleRate / 2;
        const voiceFreqStart = Math.floor((VOICE_FREQ_MIN / nyquist) * bufferLength);
        const voiceFreqEnd = Math.floor((VOICE_FREQ_MAX / nyquist) * bufferLength);
        const voiceBandSize = voiceFreqEnd - voiceFreqStart;

        const checkAudio = () => {
            analyserRef.current!.getByteFrequencyData(dataArray);

            let sum = 0;
            for (let i = voiceFreqStart; i < voiceFreqEnd; i++) sum += dataArray[i];
            const average = sum / voiceBandSize;

            voiceHistoryRef.current.push(average);
            if (voiceHistoryRef.current.length > VOICE_HISTORY_SIZE) voiceHistoryRef.current.shift();

            if (voiceHistoryRef.current.length < VOICE_HISTORY_SIZE) {
                animationFrameRef.current = requestAnimationFrame(checkAudio);
                return;
            }

            audioGateReadyRef.current = true;

            const movingAvg = voiceHistoryRef.current.reduce((a, b) => a + b, 0) / voiceHistoryRef.current.length;

            setIsSpeaking((prev) => {
                if (!prev && movingAvg > VOICE_THRESHOLD * 1.2) return true;
                if (prev && movingAvg < VOICE_THRESHOLD * 0.8) return false;
                return prev;
            });

            animationFrameRef.current = requestAnimationFrame(checkAudio);
        };

        checkAudio();
    };

    useEffect(() => {
        const initAudio = async () => {
            try {
                if (!navigator.mediaDevices?.getUserMedia) {
                    audioGateReadyRef.current = true;
                    setIsSpeaking(true);
                    return;
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
                });

                audioContextRef.current = new AudioContext();
                analyserRef.current = audioContextRef.current.createAnalyser();
                analyserRef.current.smoothingTimeConstant = 0.8;
                analyserRef.current.fftSize = 2048;

                microphoneRef.current = audioContextRef.current.createMediaStreamSource(stream);
                microphoneRef.current.connect(analyserRef.current);

                audioGateReadyRef.current = false;
                detectVoice();
            } catch (error) {
                console.error("Microphone error:", error);
                audioGateReadyRef.current = true;
                setIsSpeaking(true);
            }
        };

        initAudio();

        return () => {
            if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
            microphoneRef.current?.disconnect();
            audioContextRef.current?.close();
        };
    }, []);

    useEffect(() => {
        const appWindow = getCurrentWindow();

        const setupListeners = async () => {
            const applyContent = (payload: ContentLoadedPayload) => {
                setContent(payload.content);
                if (payload.skipCountdown) {
                    setShowCountdown(false);
                    setIsScrolling(true);
                }
                if (payload.initialY !== undefined) {
                    pendingInitialYRef.current = payload.initialY;
                } else {
                    pendingInitialYRef.current = null;
                }
            };

            const unlistenContent = await appWindow.listen<ContentLoadedPayload>(
                "content-loaded",
                (event) => applyContent(event.payload)
            );

            const unlistenClose = await appWindow.listen("close-prompter", async () => {
                setIsClosing(true);
                setTimeout(() => appWindow.close(), 1000);
            });

            await appWindow.emit(
                isFloating ? FLOATING_PROMPTER_READY_EVENT : "prompter-ready",
                {}
            );
            return { unlistenContent, unlistenClose };
        };

        const unlistenPromise = setupListeners();
        setTimeout(async () => {
            appWindow.show();
            if (!isFloating) {
                try {
                    await applyPromptWindowAboveMenubar(Window.PROMPT);
                } catch (error) {
                    console.error("Failed to reassert prompt window level:", error);
                }
            }
        }, 25);

        return () => {
            unlistenPromise.then(({ unlistenContent, unlistenClose }) => {
                unlistenContent();
                unlistenClose();
            });
        };
    }, [isFloating]);

    const handleCountdownComplete = () => {
        setShowCountdown(false);
        setIsScrolling(true);
    };

    useEffect(() => {
        if (!isScrolling || !containerRef.current) return;

        const frame = requestAnimationFrame(() => {
            const container = containerRef.current;
            if (!container) return;

            const scrollHeight = container.scrollHeight - container.clientHeight;
            const pending = pendingInitialYRef.current;

            if (pending !== null) {
                if (scrollHeight <= 0) return;
                const y = Math.min(0, Math.max(-scrollHeight, pending));
                pendingInitialYRef.current = null;
                pausedAtRef.current = y;
                controls.set({ y });
                prevMaxScrollRef.current = scrollHeight;
                if (!isManuallyPausedRef.current && isSpeakingRef.current) {
                    const remainingDistance = scrollHeight - Math.abs(y);
                    const remainingDuration = remainingDistance / scrollSpeedRef.current;
                    if (remainingDuration > 0) {
                        controls.start({ y: -scrollHeight, transition: { duration: remainingDuration, ease: "linear" } });
                    }
                }
                return;
            }

            if (!isSpeakingRef.current) {
                controls.stop();
                controls.set({ y: pausedAtRef.current });
                prevMaxScrollRef.current = scrollHeight;
                return;
            }

            const duration = scrollHeight / scrollSpeedRef.current;
            controls.start({ y: -scrollHeight, transition: { duration, ease: "linear" } });
            prevMaxScrollRef.current = scrollHeight;
        });

        return () => cancelAnimationFrame(frame);
    }, [isScrolling, content]);

    useEffect(() => {
        if (!isScrolling || isPaused || isManuallyPaused) return;

        if (isSpeaking) {
            const container = containerRef.current;
            if (!container) return;

            const scrollHeight = container.scrollHeight - container.clientHeight;
            const remainingDistance = scrollHeight - Math.abs(pausedAtRef.current);
            const remainingDuration = remainingDistance / scrollSpeedRef.current;

            if (remainingDuration > 0) {
                controls.start({ y: -scrollHeight, transition: { duration: remainingDuration, ease: "linear" } });
            }
        } else {
            controls.stop();

            const el = containerRef.current?.firstElementChild as HTMLElement | null;
            if (el) {
                const matrix = getComputedStyle(el).transform.match(/matrix.*\((.+)\)/);
                if (matrix) {
                    pausedAtRef.current = parseFloat(matrix[1].split(", ")[5] ?? "0");
                }
            }
        }
    }, [isSpeaking, isScrolling, isPaused, isManuallyPaused]);

    useEffect(() => {
        if (!isFloating || !isScrolling) return;
        const container = containerRef.current;
        if (!container) return;

        let raf = 0;
        const readMotionY = (root: HTMLDivElement): number => {
            const el = root.firstElementChild as HTMLElement | null;
            if (!el) return pausedAtRef.current;
            const matrix = getComputedStyle(el).transform.match(/matrix.*\((.+)\)/);
            if (matrix) return parseFloat(matrix[1].split(", ")[5] ?? "0");
            return pausedAtRef.current;
        };

        const observer = new ResizeObserver(() => {
            cancelAnimationFrame(raf);
            raf = requestAnimationFrame(() => {
                if (pendingInitialYRef.current !== null) return;
                const el = containerRef.current;
                if (!el) return;

                const prevMax = prevMaxScrollRef.current;
                const y = readMotionY(el);
                const maxNew = Math.max(0, el.scrollHeight - el.clientHeight);
                const progress =
                    prevMax > 0
                        ? Math.min(1, Math.max(0, Math.abs(y) / prevMax))
                        : maxNew > 0
                          ? Math.min(1, Math.max(0, Math.abs(y) / maxNew))
                          : 0;
                const rawY = maxNew <= 0 ? 0 : -Math.round(progress * maxNew);
                const yNew = Math.min(0, Math.max(-maxNew, rawY));

                prevMaxScrollRef.current = maxNew;
                pausedAtRef.current = yNew;
                void controls.stop();
                void controls.set({ y: yNew });

                if (
                    isSpeakingRef.current &&
                    !isPausedRef.current &&
                    !isManuallyPausedRef.current
                ) {
                    const remainingDistance = maxNew - Math.abs(yNew);
                    const remainingDuration = remainingDistance / scrollSpeedRef.current;
                    if (remainingDuration > 0) {
                        void controls.start({
                            y: -maxNew,
                            transition: { duration: remainingDuration, ease: "linear" },
                        });
                    }
                }
            });
        });

        observer.observe(container);
        return () => {
            cancelAnimationFrame(raf);
            observer.disconnect();
        };
    }, [isFloating, isScrolling, controls]);

    const getCurrentY = () => {
        const el = containerRef.current?.firstElementChild as HTMLElement | null;
        if (!el) return pausedAtRef.current;
        const matrix = getComputedStyle(el).transform.match(/matrix.*\((.+)\)/);
        if (matrix) return parseFloat(matrix[1].split(", ")[5] ?? "0");
        return pausedAtRef.current;
    };

    const resumeFrom = (yPosition: number) => {
        const container = containerRef.current;
        if (!container) return;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const remainingDistance = scrollHeight - Math.abs(yPosition);
        const remainingDuration = remainingDistance / scrollSpeedRef.current;
        if (remainingDuration > 0) {
            controls.start({ y: -scrollHeight, transition: { duration: remainingDuration, ease: "linear" } });
        }
    };

    const handleMouseEnter = () => {
        setIsPaused(true);
        controls.stop();
    };

    const handleMouseLeave = () => {
        if (!isScrollingRef.current) return;
        setIsPaused(false);
        if (!isManuallyPausedRef.current && isSpeakingRef.current) {
            const currentY = getCurrentY();
            pausedAtRef.current = currentY;
            resumeFrom(currentY);
        }
    };

    const handleWheel = (e: React.WheelEvent) => {
        if (!isScrollingRef.current) return;

        controls.stop();

        const container = containerRef.current;
        if (!container) return;

        const scrollHeight = container.scrollHeight - container.clientHeight;
        const currentY = getCurrentY();
        const WHEEL_SENSITIVITY = 0.8;
        const newY = Math.min(0, Math.max(-scrollHeight, currentY - e.deltaY * WHEEL_SENSITIVITY));

        pausedAtRef.current = newY;
        controls.set({ y: newY });

        if (!isManuallyPausedRef.current && isSpeakingRef.current) {
            resumeFrom(newY);
        }
    };

    const handleToggleManualPause = () => {
        if (!isScrolling) return;

        if (isManuallyPaused) {
            setIsManuallyPaused(false);
            const currentY = getCurrentY();
            pausedAtRef.current = currentY;
            resumeFrom(currentY);
        } else {
            setIsManuallyPaused(true);
            controls.stop();
            pausedAtRef.current = getCurrentY();
        }
    };

    const handleRestoreStandard = () => {
        void restoreStandardPrompterFromFloating({
            content,
            initialY: 0,
        });
    };

    const textContainerClass = cn(
        "w-full absolute bottom-0 left-0 overflow-hidden px-6 pb-2 z-10",
        isFloating ? "pt-5 h-[calc(100%-44px)] rounded-2xl" : "pt-5 rounded-b-2xl",
        !isFloating && platform === "MACOS"
            ? "h-[calc(100%-32px)]"
            : !isFloating
                ? "h-full"
                : "",
    );

    return (
        <div
            className={cn(
                "w-screen h-screen relative flex items-start justify-center bg-transparent group",
                isFloating ? "px-3 py-2" : "px-5",
            )}
        >
            <motion.div
                key="prompter-window"
                className={cn(
                    "w-full h-full bg-black relative",
                    isFloating ? "rounded-2xl" : "rounded-b-2xl",
                )}
                style={{ willChange: "transform, opacity", transformOrigin: "top center" }}
                initial={{
                    scaleY: 0,
                    scaleX: 0,
                    opacity: 0,
                }}
                animate={isClosing ? {
                    scaleY: 0,
                    scaleX: 0,
                    opacity: 0
                } : {
                    scaleY: 1,
                    scaleX: 1,
                    opacity: 1
                }}
                transition={{
                    scaleY: isClosing ? {
                        type: "tween",
                        duration: 0.45,
                        ease: [0.4, 0, 0.2, 1],
                        delay: 0.5
                    } : {
                        type: "spring",
                        stiffness: 300,
                        damping: 24,
                        mass: 0.8,
                        delay: 0.05
                    },
                    scaleX: isClosing ? {
                        type: "tween",
                        duration: 0.35,
                        ease: [0.4, 0, 0.2, 1],
                        delay: 0.5
                    } : {
                        type: "spring",
                        stiffness: 320,
                        damping: 24,
                        mass: 0.7,
                        delay: 0.05
                    },
                    opacity: {
                        duration: isClosing ? 0.3 : 0.15,
                        delay: isClosing ? 0.5 : 0.05
                    },
                }}
            >
                {isFloating && (
                    <div className="absolute top-0 left-0 right-0 z-[60] flex h-11 items-center justify-start gap-2 rounded-t-2xl bg-transparent px-2">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            className="pointer-events-auto shrink-0"
                            onClick={handleRestoreStandard}
                            aria-label={t("prompter.restoreStandardAria")}
                        >
                            <SquareArrowOutUpLeft className="size-3" />
                        </Button>
                        <div data-tauri-drag-region className="min-h-9 flex-1 flex items-center justify-center cursor-grab active:cursor-grabbing" />
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={handleToggleManualPause}
                            className="pointer-events-auto"
                            aria-label={isManuallyPaused ? t("prompter.resumeAria") : t("prompter.pauseAria")}
                        >
                            {isManuallyPaused ? <PlayIcon className="size-3" fill="currentColor" /> : <PauseIcon className="size-3" fill="currentColor" />}
                        </Button>
                    </div>
                )}
                {!isFloating && (
                    <>
                        <div className="absolute top-0 -left-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                            <div className="absolute top-0 right-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                        </div>
                        <div className="absolute top-0 -right-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                            <div className="absolute top-0 left-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                        </div>
                    </>
                )}
                <div
                    className={cn(
                        "absolute top-0 left-0 right-0 z-50",
                        isFloating ? "top-11 h-[56px]" : platform === "MACOS" ? "h-[72px]" : "h-10",
                    )}
                    style={{
                        background: isFloating
                            ? "linear-gradient(to bottom, rgba(0,0,0,1) 0%, rgba(0,0,0,0.8) 15%, rgba(0,0,0,0.6) 32%, rgba(0,0,0,0.4) 48%, rgba(0,0,0,0.2) 64%, rgba(0,0,0,0.05) 78%, rgba(0,0,0,0.02) 90%, transparent 100%)"
                            : "linear-gradient(to bottom, black 0%, black 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)",
                    }}
                />
                <VoiceIndicator isSpeaking={isSpeaking} visible={!showCountdown} />
                {!isFloating && showCountdown && <Countdown onComplete={handleCountdownComplete} />}
                <div
                    ref={containerRef}
                    className={textContainerClass}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    onWheel={handleWheel}
                >
                    <motion.div
                        animate={isClosing ? { opacity: 0 } : controls}
                        initial={{ opacity: 1 }}
                        transition={isClosing ? {
                            opacity: {
                                duration: 0.3,
                                ease: "easeIn",
                                delay: 0
                            }
                        } : {}}
                    >
                        <p
                            className={cn(
                                "text-center font-medium leading-normal select-none cursor-default",
                                settings.preserveFormatting ? "whitespace-pre-wrap" : "text-balance",
                                PROMPTER_TEXT_SIZE_CLASS[settings.textSize],
                                PROMPTER_TEXT_COLOR_CLASS[settings.textColor],
                            )}
                        >
                            {content}
                        </p>
                    </motion.div>
                </div>
                {!showCountdown && !isFloating && (
                    <div className="absolute bottom-0 left-0 right-0 h-14 flex items-end justify-between p-2 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
                        <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            onClick={handleToggleManualPause}
                            className="pointer-events-auto"
                            aria-label={isManuallyPaused ? t("prompter.resumeAria") : t("prompter.pauseAria")}
                        >
                            {isManuallyPaused ? <PlayIcon className="size-3" fill="currentColor" /> : <PauseIcon className="size-3" fill="currentColor" />}
                        </Button>
                        <FloatingPrompterButton
                            getTransferPayload={() => ({
                                content,
                                initialY: 0,
                            })}
                        />
                    </div>
                )}
            </motion.div>
        </div>
    );
}
