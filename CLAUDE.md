# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Telea is a desktop teleprompter application built with **React 19 + Tauri 2**. It features voice-activated scrolling via Web Audio API, multi-window support (main dashboard, standard prompter, floating prompter), device-based licensing, auto-updates, and i18n (English, Portuguese, Spanish).

## Development Commands

```bash
# Run in development (Tauri + Vite dev server on port 1420)
npm run tauri dev

# Build for production
npm run tauri build

# Frontend-only dev server (no Tauri shell)
npm run dev

# TypeScript check + Vite production build (frontend only)
npm run build
```

There is no test framework configured.

## Architecture

### Dependency Direction

UI (`components/`) → Hooks (`hooks/`) → Lib (`lib/`) → Types (`types/`)

Domain logic must not depend on JSX or Tauri specifics. Tauri `invoke`/plugin calls are centralized in `lib/` or hooks, not scattered across components.

### Multi-Window System

`App.tsx` detects the current Tauri webview label and renders the appropriate component:
- **Main window** (800x600, non-resizable): dashboard with text editor, text list, settings
- **Prompt window**: standard teleprompter with countdown
- **Floating prompt**: resizable floating teleprompter

Window lifecycle and positioning logic lives in `lib/prompter-window.ts`.

### Storage Layer

All persistence uses `@tauri-apps/plugin-store` with separate JSON files per domain. Storage modules in `storage/` provide typed CRUD operations over: `user.json`, `device.json`, `text.json`, `prompter-settings.json`, `app-locale.json`, `onboarding.json`.

### API & Backend

`lib/api.ts` is the HTTP client for the Telea backend (Railway-hosted). It handles device registration, license validation, and user data.

### Rust Backend (src-tauri)

Minimal Rust layer — primarily Tauri plugin orchestration. Custom commands in `lib.rs`:
- `set_window_above_menubar` — macOS-specific NSWindow manipulation via `cocoa`/`objc` crates

### Key Patterns

- **Voice detection**: Web Audio API with frequency-based analysis in the prompter components
- **Debounced saves**: Text editor uses 1-second debounce before persisting
- **Context for global state**: `TextContext` manages selected text across components
- **Prompter settings**: Zustand-like hook in `stores/use-prompter-settings.ts`

## TypeScript & Code Style

- Avoid `any`; use `unknown` + narrowing or generics
- Dedicated `interface`/`type` for component props
- Discriminated unions for mutually exclusive state
- Explicit return types on public functions/hooks when inference isn't obvious
- Path alias: `@/*` maps to `src/*`

## i18n

Three locales: `en`, `pt`, `es`. Translation files in `src/locales/{lang}/translation.json`. Initialized in `lib/i18n.ts` with `i18next` + `react-i18next`. Default locale is English.

## Build & Release

- GitHub Actions workflow (`.github/workflows/release.yml`) triggers on `v*` tags
- Builds for macOS (universal), Ubuntu, Windows
- macOS: code signing with Developer ID, notarization, stapling
- Auto-updater checks GitHub releases on startup

## UI Stack

- **shadcn/ui** (New York style) with Radix UI primitives — config in `components.json`
- **Tailwind CSS** with custom fonts and colors in `tailwind.config.js`
- **Framer Motion** / **Motion** for animations
- Custom animated components in `components/animate-ui/`
