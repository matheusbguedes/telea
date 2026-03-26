import { Button } from "@/components/animate-ui/components/buttons/button";
import {
  transferPromptToFloating,
  type ContentLoadedPayload,
} from "@/lib/prompter-window";
import { SquareArrowOutDownRight } from "lucide-react";

type FloatingPrompterButtonProps = {
  getTransferPayload: () => ContentLoadedPayload;
};

export function FloatingPrompterButton({
  getTransferPayload,
}: FloatingPrompterButtonProps) {
  return (
    <Button
      size="icon-sm"
      variant="outline"
      className="pointer-events-auto"
      onClick={() => void transferPromptToFloating(getTransferPayload())}
    >
      <SquareArrowOutDownRight className="size-3" />
    </Button>
  );
}
