# Rust egui v2 — TODO

## Priority

### P1 — Core UX (missing features that affect daily use)

- [x] **Fonts ไทย/JP/KR** — `main.rs` โหลด `NotoSansThai/JP/KR.ttf` เข้า egui ตอน start
- [ ] **Layout polish** — จัด UI ให้สวยใช้งานง่ายแบบ v1 (card layout, spacing, colors, responsive grid)

### P2 — Real-time & Engagement

- [ ] **SSE real-time subscribe** — `FirebaseSync::subscribe()` มี code พร้อมใน `sync.rs` แต่ **ไม่ถูกเรียก** ปัจจุบันใช้ `pull_blocking()` ดึง manual แทน
- [ ] **Notification** — `settings.notification_sound` มี toggle แต่ไม่มี implementation (ไม่มีเสียง, no toast/popup แจ้งเตือนเมื่อ MVP respawn)

### P3 — Nice to have

- [ ] **Animated sprites** — `settings.animated_sprites` มี toggle แต่แค่เปลี่ยน icon size (48→64) ไม่มี sprite sheet / animation จริง (v1 มี animated sprite sheet ใช้ Cairo)

## Done

- [x] Core timer logic (respawn ETA, window, sort)
- [x] Firebase sync (PATCH keyed-object `{id}-{deathMap}`, no race condition)
- [x] Rehydrate (merge remote Firebase data + local `mvps.json`)
- [x] Icon loading (`assets/icons/{id}.png`)
- [x] Map preview (`assets/maps/{mapname}.png`, fallback `spawn[0].mapname`)
- [x] Asset paths (relative from exe: `assets/icons/`, `assets/maps/`, `assets/fonts/`)
- [x] Build cross-compile (`x86_64-pc-windows-gnu` → `.exe`)
