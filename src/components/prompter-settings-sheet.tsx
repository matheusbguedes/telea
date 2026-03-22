import { Button } from "@/components/animate-ui/components/buttons/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/animate-ui/components/radix/sheet";
import { cn } from "@/lib/utils";
import { usePrompterSettings } from "@/stores/use-prompter-settings";
import type { PrompterTextColor, PrompterTextSize } from "@/types/prompter-settings";
import { Settings2Icon } from "lucide-react";
import { useState } from "react";

const SPEEDS = { min: 10, max: 50, step: 1 } as const;

const TEXT_SIZES: { value: PrompterTextSize; label: string }[] = [
  { value: "small", label: "Small" },
  { value: "medium", label: "Medium" },
  { value: "large", label: "Large" },
];

const TEXT_COLORS: { value: PrompterTextColor; label: string; swatch: string; hex: string }[] = [
  { value: "white", label: "White", swatch: "bg-white", hex: "#ffffff" },
  { value: "purple", label: "Purple", swatch: "bg-purple-400", hex: "#c084fc" },
  { value: "yellow", label: "Yellow", swatch: "bg-yellow-400", hex: "#facc15" },
  { value: "green", label: "Green", swatch: "bg-green-400", hex: "#4ade80" },
];

export function PrompterSettingsSheet() {
  const { settings, ready, update } = usePrompterSettings();
  const [isOpen, setIsOpen] = useState(false);

  const speedPct =
    ((settings.scrollSpeed - SPEEDS.min) / (SPEEDS.max - SPEEDS.min)) * 100;

  return (
    <>
      <style>{`
        /* ── Slider ── */
        .ps-range {
          -webkit-appearance: none;
          appearance: none;
          width: 100%;
          height: 3px;
          border-radius: 99px;
          outline: none;
          cursor: pointer;
        }
        .ps-range::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #a855f7;
          box-shadow: 0 0 0 3px rgba(168,85,247,0.25), 0 2px 6px rgba(0,0,0,0.5);
          transition: transform 0.15s, box-shadow 0.15s;
          cursor: grab;
        }
        .ps-range::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 0 0 5px rgba(168,85,247,0.20), 0 2px 8px rgba(0,0,0,0.6);
        }
        .ps-range::-webkit-slider-thumb:active { cursor: grabbing; }
        .ps-range::-moz-range-thumb {
          width: 16px; height: 16px;
          border-radius: 50%;
          background: #a855f7;
          border: none;
          box-shadow: 0 2px 6px rgba(0,0,0,0.5);
        }
        .ps-color-dot-active {
          box-shadow: 0 0 7px 1px var(--dot-color), 0 0 0 2px rgba(0,0,0,0.25);
          transform: scale(1.2);
        }
      `}</style>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" size="icon" aria-label="Prompter settings">
            <Settings2Icon className="size-4" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="left"
          className="h-full bg-transparent border-none shadow-none outline-none w-[min(100vw,320px)]"
          showCloseButton={false}
        >
          <div className="flex flex-col min-h-0 h-full pt-12 pb-4 px-4 gap-6">
            {!ready ? (
              <div className="w-full h-full flex flex-col gap-6 animate-pulse">
                <div className="flex flex-col gap-2">
                  <div className="w-20 h-4 bg-zinc-400/15 rounded-md" />
                  <div className="w-full h-10 bg-zinc-400/15 rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-20 h-4 bg-zinc-400/15 rounded-md" />
                  <div className="w-full h-10 bg-zinc-400/15 rounded-lg" />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-20 h-4 bg-zinc-400/15 rounded-md" />
                  <div className="w-full h-10 bg-zinc-400/15 rounded-lg" />
                </div>
              </div>
            ) : (
              <>
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/60" htmlFor="scroll-speed">
                      Text speed
                    </label>
                    <span className="text-xs font-mono text-white/80 tabular-nums">
                      {settings.scrollSpeed}
                    </span>
                  </div>
                  <input
                    id="scroll-speed"
                    type="range"
                    min={SPEEDS.min}
                    max={SPEEDS.max}
                    step={SPEEDS.step}
                    value={settings.scrollSpeed}
                    className="ps-range"
                    style={{
                      background: `linear-gradient(to right,
                        #a855f7 0%,
                        #a855f7 ${speedPct}%,
                        rgba(255,255,255,0.15) ${speedPct}%,
                        rgba(255,255,255,0.15) 100%)`,
                    }}
                    onChange={(e) => void update({ scrollSpeed: Number(e.target.value) })}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-white/60">Text size</span>
                  <div className="flex flex-wrap gap-2">
                    {TEXT_SIZES.map(({ value, label }) => (
                      <Button
                        key={value}
                        type="button"
                        size="sm"
                        variant="outline"
                        className={`flex-1 min-w-[5rem] transition-colors ${settings.textSize === value
                          ? "border-purple-400 text-purple-400 hover:border-purple-400 hover:text-purple-400"
                          : ""
                          }`}
                        onClick={() => void update({ textSize: value })}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <span className="text-xs text-white/60">Text color</span>
                  <div className="grid grid-cols-2 gap-2">
                    {TEXT_COLORS.map(({ value, label, swatch, hex }) => {
                      const active = settings.textColor === value;
                      return (
                        <Button
                          key={value}
                          size="sm"
                          type="button"
                          variant="outline"
                          className={cn("justify-start gap-3 transition-colors",
                            active && "border-purple-400 text-purple-400 hover:border-purple-400 hover:text-purple-400"
                          )}
                          onClick={() => void update({ textColor: value })}
                        >
                          <span
                            className={cn("size-2 rounded-full transition-all duration-150",
                              active && "ps-color-dot-active",
                              swatch
                            )}
                            style={active ? ({ "--dot-color": hex } as React.CSSProperties) : undefined}
                            aria-hidden
                          />
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}