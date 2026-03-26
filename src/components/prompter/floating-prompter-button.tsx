import { Button } from "@/components/animate-ui/components/buttons/button";
import {
  transferPromptToFloating,
  type ContentLoadedPayload,
} from "@/lib/prompter-window";
import { SquareArrowOutDownRight } from "lucide-react";
import { useTranslation } from "react-i18next";

type FloatingPrompterButtonProps = {
  getTransferPayload: () => ContentLoadedPayload;
};

export function FloatingPrompterButton({
  getTransferPayload,
}: FloatingPrompterButtonProps) {
  const { t } = useTranslation();
  return (
    <Button
      type="button"
      size="icon-sm"
      variant="outline"
      className="pointer-events-auto"
      onClick={() => void transferPromptToFloating(getTransferPayload())}
      aria-label={t("prompter.openFloatingAria")}
    >
      <SquareArrowOutDownRight className="size-3" />
    </Button>
  );
}
