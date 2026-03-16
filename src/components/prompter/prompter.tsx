import { cn } from "@/lib/utils";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { platform as getPlatform } from "@tauri-apps/plugin-os";
import { motion, useAnimation } from "framer-motion";
import { ArrowUpIcon, PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../animate-ui/components/buttons/button";
import { Countdown } from "./countdown";
import VoiceIndicator from "./voice-indicator";

const SCROLL_SPEED = 22;
const VOICE_THRESHOLD = 45;
const VOICE_HISTORY_SIZE = 10;
const VOICE_FREQ_MIN = 85;
const VOICE_FREQ_MAX = 2000;

export default function Prompter() {
    const platform = getPlatform().toUpperCase();

    const [content, setContent] = useState<string>("");
    const [showCountdown, setShowCountdown] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isManuallyPaused, setIsManuallyPaused] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const voiceHistoryRef = useRef<number[]>([]);
    const pausedAtRef = useRef<number>(0);
    const isSpeakingRef = useRef<boolean>(false);
    const isManuallyPausedRef = useRef<boolean>(false);
    const isScrollingRef = useRef<boolean>(false);
    const isResettingToTopRef = useRef<boolean>(false);

    // Keep refs in sync with state for use inside event handlers
    useEffect(() => { isSpeakingRef.current = isSpeaking; }, [isSpeaking]);
    useEffect(() => { isManuallyPausedRef.current = isManuallyPaused; }, [isManuallyPaused]);
    useEffect(() => { isScrollingRef.current = isScrolling; }, [isScrolling]);

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

                detectVoice();
            } catch (error) {
                console.error("Microphone error:", error);
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
            const unlistenContent = await appWindow.listen<{ content: string }>(
                "content-loaded",
                (event) => setContent(event.payload.content)
            );

            const unlistenClose = await appWindow.listen("close-prompter", async () => {
                setIsClosing(true);
                setTimeout(() => appWindow.close(), 1000);
            });

            await appWindow.emit("prompter-ready", {});
            return { unlistenContent, unlistenClose };
        };

        const unlistenPromise = setupListeners();
        setTimeout(() => appWindow.show(), 15);

        return () => {
            unlistenPromise.then(({ unlistenContent, unlistenClose }) => {
                unlistenContent();
                unlistenClose();
            });
        };
    }, []);

    const handleCountdownComplete = () => {
        setShowCountdown(false);
        setIsScrolling(true);
    };

    useEffect(() => {
        if (!isScrolling || !containerRef.current) return;

        const container = containerRef.current;
        const scrollHeight = container.scrollHeight - container.clientHeight;
        const duration = scrollHeight / SCROLL_SPEED;

        controls.start({ y: -scrollHeight, transition: { duration, ease: "linear" } });
    }, [isScrolling, content]);

    useEffect(() => {
        if (!isScrolling || isPaused || isManuallyPaused || isResettingToTopRef.current) return;

        if (isSpeaking) {
            const container = containerRef.current;
            if (!container) return;

            const scrollHeight = container.scrollHeight - container.clientHeight;
            const remainingDistance = scrollHeight - Math.abs(pausedAtRef.current);
            const remainingDuration = remainingDistance / SCROLL_SPEED;

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
        const remainingDuration = remainingDistance / SCROLL_SPEED;
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

        // Resume auto-scroll if speaking and not manually paused
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

    const handleScrollUp = () => {
        if (!isScrolling) return;
        isResettingToTopRef.current = true;
        controls.stop();
        pausedAtRef.current = 0;
        controls
            .start({ y: 0, transition: { duration: 0.3, ease: "easeIn" } })
            .then(() => {
                isResettingToTopRef.current = false;
                if (!isManuallyPausedRef.current && isSpeakingRef.current) {
                    resumeFrom(0);
                }
            })
            .catch(() => {
                isResettingToTopRef.current = false;
            });
    };

    return (
        <div
            className="w-screen h-screen relative flex items-start justify-center bg-transparent px-5 group"
        >
            <motion.div
                key="prompter-window"
                className="w-full h-full bg-black relative rounded-b-2xl"
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
                <div className="absolute top-0 -left-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                    <div className="absolute top-0 right-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                </div>
                <div className="absolute top-0 -right-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                    <div className="absolute top-0 left-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                </div>
                <div className={cn("absolute top-0 left-0 right-0 z-50", platform === "MACOS" ? "h-[72px]" : "h-10")} style={{ background: 'linear-gradient(to bottom, black 0%, black 40%, rgba(0,0,0,0.8) 60%, rgba(0,0,0,0.4) 80%, transparent 100%)' }} />
                <VoiceIndicator isSpeaking={isSpeaking} visible={!showCountdown} />
                {showCountdown && <Countdown onComplete={handleCountdownComplete} />}
                <div
                    ref={containerRef}
                    className={cn("w-full absolute bottom-0 left-0 overflow-hidden px-6 pt-5 pb-2 rounded-b-2xl z-10", platform === "MACOS" ? "h-[calc(100%-32px)]" : "h-full")}
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
                        <p className="text-white text-xl text-center text-balance font-medium leading-normal select-none cursor-default">
                            {content}
                        </p>
                    </motion.div>
                </div>
                {!showCountdown && (
                    <div className="absolute bottom-0 left-0 right-0 h-14 flex items-end justify-between p-2 rounded-b-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-50 pointer-events-none">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={handleToggleManualPause}
                            className="pointer-events-auto"
                        >
                            {isManuallyPaused ? <PlayIcon className="size-3" fill="currentColor" /> : <PauseIcon className="size-3" fill="currentColor" />}
                        </Button>
                        <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={handleScrollUp}
                            className="pointer-events-auto"
                        >
                            <ArrowUpIcon className="size-3" />
                        </Button>
                    </div>
                )}
            </motion.div>
        </div>
    );
}