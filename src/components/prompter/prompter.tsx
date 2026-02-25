import { getCurrentWindow } from "@tauri-apps/api/window";
import { motion, useAnimation } from "framer-motion";
import { PauseIcon, PlayIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../animate-ui/components/buttons/button";
import { Countdown } from "./countdown";
import VoiceIndicator from "./voice-indicator";

const SCROLL_SPEED = 25;
const VOICE_THRESHOLD = 45;
const VOICE_HISTORY_SIZE = 10;
const VOICE_FREQ_MIN = 85;
const VOICE_FREQ_MAX = 2000;

export default function Prompter() {
    const [content, setContent] = useState<string>("");
    const [showCountdown, setShowCountdown] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isManuallyPaused, setIsManuallyPaused] = useState(false);

    const containerRef = useRef<HTMLDivElement>(null);
    const controls = useAnimation();

    const audioContextRef = useRef<AudioContext | null>(null);
    const analyserRef = useRef<AnalyserNode | null>(null);
    const microphoneRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const animationFrameRef = useRef<number | null>(null);
    const voiceHistoryRef = useRef<number[]>([]);
    const pausedAtRef = useRef<number>(0);

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
            const unlisten = await appWindow.listen<{ content: string }>(
                "content-loaded",
                (event) => setContent(event.payload.content)
            );
            await appWindow.emit("prompter-ready", {});
            return unlisten;
        };

        const unlistenPromise = setupListeners();
        setTimeout(() => appWindow.show(), 15);

        return () => { unlistenPromise.then((u) => u()); };
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
        if (!isScrolling || isPaused || isManuallyPaused) return;

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

    const handleMouseEnter = () => { setIsPaused(true); controls.stop(); };
    const handleMouseLeave = () => { if (isScrolling) setIsPaused(false); };

    const handleToggleManualPause = () => {
        if (!isScrolling) return;

        if (isManuallyPaused) {
            setIsManuallyPaused(false);
            const container = containerRef.current;
            if (!container) return;
            const scrollHeight = container.scrollHeight - container.clientHeight;
            const remainingDistance = scrollHeight - Math.abs(pausedAtRef.current);
            const remainingDuration = remainingDistance / SCROLL_SPEED;
            if (remainingDuration > 0) {
                controls.start({ y: -scrollHeight, transition: { duration: remainingDuration, ease: "linear" } });
            }
        } else {
            setIsManuallyPaused(true);
            controls.stop();
            const el = containerRef.current?.firstElementChild as HTMLElement | null;
            if (el) {
                const matrix = getComputedStyle(el).transform.match(/matrix.*\((.+)\)/);
                if (matrix) {
                    pausedAtRef.current = parseFloat(matrix[1].split(", ")[5] ?? "0");
                }
            }
        }
    };

    return (
        <div
            className="w-screen h-screen relative flex items-start justify-center bg-transparent px-5 group"
        >
            <motion.div
                key="prompter-window"
                className="w-full h-full bg-black rounded-b-xl relative"
                style={{ willChange: "transform, opacity" }}
                initial={{ y: "-100%", opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: [0.43, 0.13, 0.23, 0.96], delay: 0.05 }}
            >
                <div className="absolute top-0 -left-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                    <div className="absolute top-0 right-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                </div>
                <div className="absolute top-0 -right-5 w-5 h-5 overflow-hidden pointer-events-none z-50">
                    <div className="absolute top-0 left-0 w-10 h-10 rounded-full" style={{ boxShadow: "0 0 0 100px black" }} />
                </div>
                <div className="absolute top-0 left-0 right-0 h-4 bg-gradient-to-b from-black to-transparent pointer-events-none z-50" />
                <VoiceIndicator isSpeaking={isSpeaking} visible={!showCountdown} />
                {showCountdown && <Countdown onComplete={handleCountdownComplete} />}
                <div
                    ref={containerRef}
                    className="w-full h-full absolute top-0 left-0 overflow-hidden px-6 py-2 rounded-b-xl z-10"
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                >
                    <motion.div animate={controls} initial={{ y: 0 }}>
                        <p className="text-white text-xl text-center text-balance font-medium leading-normal select-none cursor-default">
                            {content}
                        </p>
                    </motion.div>
                </div>
                {!showCountdown && (
                    <div className="relative h-full bg-black/40 backdrop-blur-sm z-50 rounded-b-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <Button
                            size="icon-sm"
                            variant="outline"
                            onClick={handleToggleManualPause}
                            className="absolute bottom-2 left-2"
                        >
                            {isManuallyPaused ? <PlayIcon className="size-3" fill="currentColor" /> : <PauseIcon className="size-3" fill="currentColor" />}
                        </Button>
                    </div>
                )}
            </motion.div>
        </div >
    );
}