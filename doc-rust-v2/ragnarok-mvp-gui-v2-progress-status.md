# Rust egui v2 — Progress Status

## ✅ Done

| Component | Detail |
|-----------|--------|
| **Core timer logic** | `src/core/timer.rs` — respawn ETA, window, sort |
| **Firebase sync (no race)** | `src/firebase/` — PATCH with keyed objects `{id}-{deathMap}`, no `set(array)` |
| **Rehydrate** | `src/core/rehydrate.rs` — merge remote Firebase data with local `mvps.json` |
| **Map preview** | `assets/maps/*.png` — แสดง map ของ MVP (`spawn[0].mapname` fallback ถ้าไม่มี `death_map`) |
| **Icon loading** | `assets/icons/{id}.png` — โหลด icon ของแต่ละ MVP |
| **Asset paths** | relative from exe: `assets/icons/`, `assets/maps/`, `assets/fonts/` |
| **Build cross-compile** | `x86_64-pc-windows-gnu` → `.exe` ใช้ WSL build, วางที่ `/mnt/d/mvp-timer/` |

## ⚠️ Partial / Code exists but not wired

| Component | Detail |
|-----------|--------|
| **SSE real-time subscribe** | `FirebaseSync::subscribe()` in `sync.rs` มี code พร้อม แต่ **ไม่ถูกเรียก** ตอน runtime ใช้ `pull_blocking()` แทน |

## ❌ Not started

| Component | Detail |
|-----------|--------|
| **Fonts ไทย/JP/KR** | `assets/fonts/` มีไฟล์แต่ไม่มี font loading เข้า egui (`ctx.fonts()` etc.) |
| **Animated sprites** | `settings.animated_sprites` มี toggle แต่แค่เปลี่ยน icon size (48→64) ไม่มี sprite sheet / animation จริง |
| **Notification** | `settings.notification_sound` มี toggle แต่ไม่มี implementation (ไม่มีเสียง, no toast/popup) |
| **Layout polish** | ยังไม่ได้จัด UI ให้สวยแบบ v1 (card layout, colors, spacing) |
