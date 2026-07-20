# Build Guide — Ragnarok MVP Timer GUI

## Build on Windows (Native)

### Prerequisites

1. **Install Rust** via [rustup.rs](https://rustup.rs/)
   ```powershell
   rustup default stable
   ```

2. **Install MSVC build tools** (required by egui/eframe)
   - Option A: Install [Visual Studio 2022 Build Tools](https://visualstudio.microsoft.com/downloads/#build-tools-for-visual-studio-2022) with "Desktop development with C++" workload
   - Option B: Install [MSVC Build Tools](https://visualstudio.microsoft.com/downloads/#microsoft-build-tools) (lighter)

### Build & Run

```powershell
cd ragnarok-mvp-gui
cargo run --release
```

The `--release` flag is important — debug builds are significantly slower for GUI apps.

---

## Cross-compile from WSL (Ubuntu) → Windows

This is the recommended workflow if you primarily develop on Linux/WSL.

### Prerequisites (WSL)

```bash
# Install MinGW cross-compiler
sudo apt install gcc-mingw-w64-x86-64

# Add Windows target to Rust
rustup target add x86_64-pc-windows-gnu
```

### Build

```bash
cd ragnarok-mvp-gui
cargo build --release --target x86_64-pc-windows-gnu
```

### Deploy to Windows

```bash
# Copy binary to Windows partition
cp ragnarok-mvp-gui/target/x86_64-pc-windows-gnu/release/ragnarok_mvp_gui.exe /mnt/c/Temp/mvp-timer/

# Run on Windows (close existing instance first)
# From Windows Command Prompt:
# C:\Temp\mvp-timer\ragnarok_mvp_gui.exe
```

> **Note:** The `.exe` must be closed on Windows before WSL can overwrite it.

---

## Assets

The app expects these files next to the `.exe` or in the Cargo workspace:

```
ragnarok-mvp-gui/
├── assets/
│   ├── NotoSansThai.ttf      # Thai font
│   ├── favicon.ico            # App icon (webapp favicon)
│   ├── icons/*.png            # MVP sprites (by id, e.g. 1086.png)
│   ├── icons/*.gif            # Animated MVP sprites
│   └── maps/*.png             # Map thumbnails (by mapname, e.g. prt_fild01.png)
└── data/{server}.json         # MVP data files (same as webapp src/data/)
```

Assets are copied from the webapp project. The `data/` directory must be in the **working directory** or next to the `.exe`.

### Server Data Files

The app loads MVP definitions from `data/{server}.json` (same format as `src/data/` in the webapp). These files contain `id`, `name`, `spawn`, `stats` for each MVP.

If missing, the card list will be empty.

---

## Local Save Data

Save files are stored in the OS-standard config directory:

- **Windows:** `C:\Users\{user}\AppData\Roaming\ragnarok-mvp-timer\{server}.json`
- **Linux:** `~/.config/ragnarok-mvp-timer/{server}.json`

Each save file contains the full list of active/respawned/pinned MVPs with their `deathTime`, `deathMap`, `deathPosition`, `isPinned` fields.

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `linker cc not found` (WSL build) | Install MinGW: `sudo apt install gcc-mingw-w64-x86-64` |
| `cannot find -lgdi32` (MSVC build) | Install Visual Studio C++ tools or `gcc-mingw-w64` |
| Thai text shows as boxes | Ensure `NotoSansThai.ttf` is in `assets/` next to the exe |
| Map images not showing | Check `assets/maps/` has PNGs matching the map names in `data/{server}.json` |
| White screen / crash on startup | Run from terminal to see error output; check `debug.log` next to the exe |
