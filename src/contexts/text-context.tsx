import { getStrictContext } from "@/lib/get-strict-context";
import { Text } from "@/types/text";
import { useState } from "react";

type TextContextValue = {
  selectedText: Text | null;
  setSelectedText: (text: Text | null) => void;
};

const [TextProvider, useTextContext] = getStrictContext<TextContextValue>("TextProvider");

function TextProviderWithState({ children }: { children: React.ReactNode }) {
  const [selectedText, setSelectedText] = useState<Text | null>(null);

  return (
    <TextProvider value={{ selectedText, setSelectedText }}>
      {children}
    </TextProvider>
  );
}

export { TextProviderWithState as TextProvider, useTextContext };
