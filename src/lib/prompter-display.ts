import type {
  PrompterTextColor,
  PrompterTextSize,
} from "@/types/prompter-settings";

export const PROMPTER_TEXT_SIZE_CLASS: Record<PrompterTextSize, string> = {
  small: "text-base",
  medium: "text-xl",
  large: "text-2xl",
};

export const PROMPTER_TEXT_COLOR_CLASS: Record<PrompterTextColor, string> = {
  white: "text-white",
  purple: "text-purple-500",
  yellow: "text-yellow-400",
  green: "text-green-400",
};
