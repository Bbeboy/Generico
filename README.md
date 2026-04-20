# Generico 📱

A universal Expo mobile application template for building cross-platform apps (iOS, Android, and Web) with Expo SDK 54.

## Tech Stack

| Category   | Technology                                |
| ---------- | ----------------------------------------- |
| Framework  | Expo SDK 54 with React Native 0.81.5      |
| Routing    | expo-router v6 (file-based routing)       |
| Language   | TypeScript ~5.9.2                         |
| Animations | react-native-reanimated ~4.1.1            |
| Navigation | @react-navigation/native v7 + bottom-tabs |
| Haptics    | expo-haptics                              |
| Icons      | @expo/vector-icons                        |

## Features

- **File-Based Routing** — Tab navigation with Home and Explore screens, plus modal presentation
- **Light/Dark Theme** — System preference detection with custom `ThemedView` and `ThemedText` components
- **Animations** — Parallax scroll effects and wave animations with react-native-reanimated
- **Platform-Specific** — iOS haptics, SF Symbols on iOS, cross-platform icon abstraction
- **Typed Routes** — Type-safe navigation enabled via expo-router

## Project Structure

```
generico/
├── app/                    # expo-router file-based routing
│   ├── _layout.tsx        # Root layout (Stack navigator)
│   ├── modal.tsx          # Modal screen
│   └── (tabs)/            # Tab navigation group
│       ├── _layout.tsx    # Tab navigator setup
│       ├── index.tsx      # Home screen
│       └── explore.tsx    # Explore screen
├── components/             # Reusable UI components
│   ├── ui/                # UI primitives (Collapsible, IconSymbol)
│   ├── external-link.tsx
│   ├── haptic-tab.tsx     # iOS haptic feedback on tab press
│   ├── hello-wave.tsx     # Wave animation component
│   ├── parallax-scroll-view.tsx
│   ├── themed-text.tsx
│   └── themed-view.tsx
├── constants/
│   └── theme.ts            # Colors + Fonts definitions
├── hooks/
│   ├── use-color-scheme.ts
│   └── use-theme-color.ts
└── assets/                # Images and splash screens
```

## Get Started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

3. Open in your preferred platform:
   - **Development build** — `npx expo run:ios` or `npx expo run:android`
   - **Android emulator** — via Android Studio
   - **iOS simulator** — via Xcode
   - **Web** — press `w` in the Expo CLI

## Code Patterns

- **`@/` path alias** — All imports reference root (e.g., `@/components/...`)
- **Themed components** — Accept optional light/dark color overrides
- **Platform-specific** — Use `Platform.select()` for cross-platform logic

## Learn more

- [Expo documentation](https://docs.expo.dev/) — Official docs
- [expo-router](https://docs.expo.dev/router/introduction) — File-based routing
- [React Native Reanimated](https://docs.swmansion.com/react-native-reanimated/) — Animations
