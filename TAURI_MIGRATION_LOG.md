# Tauri Desktop Application Migration Summary

This document summarizes the process of converting the existing React-based web application into a standalone desktop application for Linux using the Tauri framework.

## 1. Project Setup

- A new git branch, `feat/tauri-desktop`, was created to isolate the migration work.
- The Tauri CLI was added to the project, and the project was initialized with `npx tauri init`.
- The initial Tauri configuration (`src-tauri/tauri.conf.json`) was corrected to align with the project's Vite setup:
  - `devUrl` was updated to Vite's default `http://localhost:5173`.
  - `frontendDist` was updated to `../dist`, the correct build output directory for Vite.

## 2. Environment & Dependency Resolution

To enable building a Tauri application on the Linux environment (WSL Ubuntu), several system-level dependencies were installed:

- **Rust:** The Rust toolchain, including the Cargo package manager, was installed via `rustup`. This is a core requirement for compiling Tauri's Rust backend.
- **System Build Tools:** The `build-essential` package was installed to provide a C compiler and linker (`cc`), which Cargo requires.
- **Tauri Linux Dependencies:** Required libraries for rendering web content and creating a system tray icon were installed, including `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, and `librsvg2-dev`.

## 3. Production Build Debugging

Several issues were identified and resolved that only appeared in the production build (`npx tauri build`), not in the development mode (`npx tauri dev`).

- **Black Screen Bug:**
  - **Symptom:** The initial production AppImage launched to a blank/black screen.
  - **Cause:** The `base` path in `vite.config.ts` was set to an absolute path (`/ragnarokmvptimer/`). This works for web deployment but prevents the desktop app from finding its bundled CSS and JS assets.
  - **Fix:** The `base` path was changed to a relative path (`./`), ensuring assets are loaded correctly from within the application bundle.

- **Broken Animation Bug:**
  - **Symptom:** After fixing the black screen, the main application rendered, but the background wave and falling leaf animations were not working.
  - **Cause:** The animation component (`LuminousParticlesBackground`) was loading image assets using hardcoded, absolute string paths (e.g., `/ragnarokmvptimer/assets/leaves/...`). Like the previous issue, these paths are invalid in a production build.
  - **Fix:** The code was refactored to use Vite's `import.meta.glob` feature, which correctly bundles the images and provides valid, relative paths that work in both development and production.

## 4. Finalization & Packaging

- **Incorrect Binary Name:**
  - **Symptom:** After installation, the application's command was `app` instead of the expected `ragnarokmvptimer`.
  - **Cause:** The `name` field in the Rust backend's configuration (`src-tauri/Cargo.toml`) was set to the default value, `"app"`.
  - **Fix:** The `name` in `Cargo.toml` was updated to `"ragnarokmvptimer"`.

- **Successful Build & Installation:**
  - A final production build was executed successfully.
  - This generated three distributable Linux packages:
    1.  **`.deb`:** An installer for Debian/Ubuntu systems.
    2.  **`.AppImage`:** A portable, universal Linux application.
    3.  **`.rpm`:** An installer for Fedora/CentOS systems.
  - The `.deb` package was successfully installed, and the application can now be launched correctly using the `ragnarokmvptimer` command.

## 5. Application Architecture & Startup Flow

A key takeaway from this process is understanding the fundamental architecture of a Tauri application:

- **Core Model:** It consists of a Rust backend (for native operations) that creates and manages a webview (a mini-browser). This webview is then used to render a standard web-based frontend (in this case, a React application).

- **Startup Sequence:** The flow from user action to a running application is as follows:
  1.  The user launches the compiled executable (e.g., `ragnarokmvptimer`).
  2.  The Operating System loads and runs the binary.
  3.  The program's entry point, the `fn main()` in `src-tauri/src/main.rs`, is executed.
  4.  This `main` function initializes and runs the Tauri runtime.
  5.  Tauri creates a native window for the application.
  6.  The webview within the window is directed to load the bundled frontend assets (`index.html` and its related JS/CSS).
  7.  The React application starts, rendering the user interface inside the native window.

This confirms that `fn main()` is the ultimate starting point of the application's backend logic, acting as the "igniter" for the entire process.

## Known Issues & Observations

- **WSL Performance:** The complex canvas animations exhibit some lag when running on WSL. This is not a bug in the application but a known architectural limitation of GPU acceleration support within the WSLg environment. The application is expected to run smoothly on a bare-metal Linux or Windows (via an `.exe` build) environment with direct GPU access.
- **Vite Deprecation Warning:** The build process shows a warning that the `as: 'url'` syntax for `import.meta.glob` is deprecated. This can be updated in the future for improved code hygiene.