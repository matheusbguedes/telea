export type PrompterTextSize = "small" | "medium" | "large";

export type PrompterTextColor = "white" | "purple" | "yellow" | "green";

export type PrompterSettings = {
  scrollSpeed: number;
  textSize: PrompterTextSize;
  textColor: PrompterTextColor;
  preserveFormatting: boolean;
};

export const PROMPTER_SETTINGS_DEFAULTS: PrompterSettings = {
  scrollSpeed: 22,
  textSize: "medium",
  textColor: "white",
  preserveFormatting: false,
};
