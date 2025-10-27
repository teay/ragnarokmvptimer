# Ragnarok MVP Timer - Tauri Desktop Version

This document provides instructions on how to set up the development environment, run, and build the Tauri-based desktop version of the Ragnarok MVP Timer.

## Prerequisites

Before you can build or run this application, you need to ensure the following dependencies are installed on your system.

### 1. Standard Web Development Environment

- [Node.js](https://nodejs.org/) and npm

### 2. Rust Environment

The Tauri backend is written in Rust. Install it using `rustup`:

```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
After installation, restart your terminal or run `source "$HOME/.cargo/env"`.

### 3. System Dependencies (for Linux/WSL)

Tauri relies on several system libraries for its webview and other functionalities. On Debian/Ubuntu-based systems, install them with the following command:

```bash
sudo apt-get update && sudo apt-get install -y build-essential libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

### 4. (For Windows Builds Only) WiX Toolset

To build the Windows installer (`.msi`), you must be on a Windows machine and have the [WiX Toolset v3](https://wixtoolset.org/releases/) installed.

---

## Development

To run the application in development mode with hot-reloading for both the frontend and backend, use the following command:

```bash
npx tauri dev
```

The application window will open and automatically reload when you make changes to the code.

---

## Building for Production

To build the final, optimized, and bundled application, run:

```bash
npx tauri build
```

This command will generate the platform-specific installers and bundles in the `src-tauri/target/release/bundle/` directory.

- On **Linux**, it will create `.deb`, `.AppImage`, and `.rpm` files.
- On **Windows**, it will create an `.exe` and an `.msi` installer.
- On **macOS**, it will create `.app` and `.dmg` files.

---

## Platform-Specific Notes

### Running on Linux

- **`.deb` file:** Install system-wide using `sudo dpkg -i <filename>.deb`. The application can then be launched from the application menu or by typing its name (`ragnarokmvptimer`) in the terminal.
- **`.AppImage` file:** This is a portable executable. Make it runnable (`chmod +x <filename>.AppImage`) and then run it directly (`./<filename>.AppImage`).

### Running on WSL (Windows Subsystem for Linux)

- The Linux version can be built and run on WSL.
- **Performance:** Be aware that graphically-intensive animations (like the background effects in this app) may appear laggy. This is a known architectural limitation of GPU acceleration within the WSLg environment and not a bug in the application itself. For full performance, run the native build on its corresponding OS (e.g., the `.exe` on Windows).
