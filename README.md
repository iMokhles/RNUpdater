# RNUpdater

A powerful Electron application for updating React Native applications, built with React, TypeScript, and Zustand for state management.

## Features

- Modern Electron app with React UI
- TypeScript for type safety
- Zustand for state management
- Tailwind CSS for styling
- Hot reload in development
- Cross-platform support (macOS, Windows, Linux)

## Tech Stack

- **Electron** - Desktop app framework
- **React 19** - UI library
- **TypeScript** - Type safety
- **Zustand** - State management
- **Tailwind CSS** - Styling
- **Vite** - Build tool
- **Electron Vite** - Electron + Vite integration

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm (recommended) or npm

### Installation

1. Install dependencies:

   ```bash
   pnpm install
   ```

2. Start development server:

   ```bash
   pnpm dev
   ```

3. Build for production:
   ```bash
   pnpm build
   ```

## Available Scripts

- `pnpm dev` - Start development server with hot reload
- `pnpm build` - Build the application for production
- `pnpm start` - Start the built application
- `pnpm lint` - Run linting
- `pnpm lint:fix` - Fix linting issues

## Project Structure

```
src/
├── main/           # Electron main process
├── preload/        # Preload scripts for secure IPC
├── renderer/       # React renderer process
│   ├── components/ # Reusable UI components
│   ├── screens/    # Main application screens
│   └── lib/        # Utilities and stores
├── shared/         # Shared types and utilities
└── resources/      # Static assets and icons
```

## Development

The app uses electron-vite for development, which provides:

- Hot reload for both main and renderer processes
- TypeScript support
- Vite's fast build system
- Code inspection tools

## Building

The app can be built for multiple platforms:

- macOS (DMG)
- Windows (NSIS installer)
- Linux (AppImage)

Run `pnpm build` to create production builds.

## License

MIT
