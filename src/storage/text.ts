import { Text } from "@/types/text";
import { load } from "@tauri-apps/plugin-store";

const store = await load("texts.json", { autoSave: false, defaults: {} });

export async function getTexts(): Promise<Text[]> {
  return (await store.get<Text[]>("texts")) ?? [];
}

export async function getTextById(id: string): Promise<Text | null> {
  const texts = await getTexts();
  return texts.find((text) => text.id === id) ?? null;
}

export async function createText(
  title: string,
  content: string
): Promise<Text> {
  const texts = await getTexts();

  const newText = {
    id: crypto.randomUUID(),
    title,
    content,
    createdAt: new Date(),
  };
  await store.set("texts", [...texts, newText]);

  await store.save();

  return newText;
}

export async function updateText({
  id,
  title,
  content,
}: {
  id: string;
  title?: string;
  content?: string;
}): Promise<void> {
  const texts = await getTexts();

  await store.set(
    "texts",
    texts.map((text) =>
      text.id === id
        ? {
          ...text,
          ...(title !== undefined && { title }),
          ...(content !== undefined && { content }),
        }
        : text
    )
  );

  await store.save();
}

export async function deleteText(id: string): Promise<void> {
  const texts = await getTexts();
  await store.set(
    "texts",
    texts.filter((text) => text.id !== id)
  );

  await store.save();
}
