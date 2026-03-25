---
name: react-tailwind-typescript
description: >-
  React, Tailwind CSS (always cn from src/lib/utils), TypeScript, and a11y for Vite apps.
  Use when editing TSX, styling, CVA variants, or typing hooks and component props.
---

# React, Tailwind, and TypeScript

## React

- **Functional components**; hooks at the top level (no conditional hook calls).
- **State**: keep it as **close** to usage as possible; lift only when multiple children need the same data.
- **Effects** (`useEffect`): correct dependency arrays; cleanup (`return`) for listeners/timers; do not use effects for logic that belongs in event handlers or pure render-time calculation.
- **Lists**: stable, predictable `key` values (avoid index keys when order changes).
- **Memoization** (`useMemo` / `useCallback`): only when profiling or heavy prop drilling warrants it—not by default.
- **Custom hooks** (`useX`): extract when the same state + effect pattern appears in more than one place or a component grows too large.
- **Performance**: `React.lazy` + `Suspense` for heavy routes or chunks when it makes sense.

## Tailwind CSS

- **Always use `cn()`** from `src/lib/utils.ts` for any `className` that combines literals, conditionals, or variant props.

```tsx
import { cn } from "@/lib/utils";

<div
  className={cn(
    "flex items-center gap-2 rounded-md px-3 py-2",
    disabled && "pointer-events-none opacity-50",
    className
  )}
/>
```

- **Suggested order**: layout → box model → typography → color/background → border → effects; group related lines inside `cn`.
- **External `className`**: accept an optional prop and **merge** with `cn(..., className)` last so parents can override when appropriate.
- **Repeated variants**: use **`class-variance-authority` (cva)** with `cn` (including `compoundVariants`) when `variant` / `size` are stable (project already includes `cva`).

## Types

- Props: `type` or `interface`; handlers typed (`() => void`, React events).
- Prefer **explicit types** on hooks that return tuples or complex objects.
- Avoid **`as` assertions** to silence errors; fix the type at the source.

## Accessibility and Radix

- Use **buttons** for actions (not clickable `div`s); **labels** on inputs; visible focus.
- With **Radix**: follow composition patterns (`asChild` where appropriate); do not drop keyboard/ARIA behavior without a replacement.

## Imports and files

- Use the **`@/`** path alias when configured; keep imports consistent.
- Prefer one main component per file; file name aligned with the primary export (`PrompterSettingsSheet` → `prompter-settings-sheet.tsx`).

## Example: `cva` + `cn` variants

```tsx
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const rootVariants = cva("inline-flex items-center", {
  variants: {
    variant: {
      default: "bg-primary text-primary-foreground",
      ghost: "hover:bg-accent",
    },
    size: { sm: "h-8 px-2", md: "h-10 px-4" },
  },
  defaultVariants: { variant: "default", size: "md" },
});

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof rootVariants>;

export function Button({ className, variant, size, ...props }: ButtonProps) {
  return (
    <button className={cn(rootVariants({ variant, size }), className)} {...props} />
  );
}
```
