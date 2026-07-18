# Ragnarok MVP Timer — Rust GUI (egui) Plan

---

## สถานะ: รอทำ (Plan Phase)

> บันทึกไว้ทำทีหลัง — วันที่ 19 กรกฎาคม 2026

---

## เป้าหมาย

สร้าง **Rust Desktop GUI** ด้วย `egui` ที่:
- แสดง Map images + Sprite images จริง (ไม่ใช่ ASCII)
- Firebase sync ตรง (ไม่ต้อง daemon)
- Binary ~10-15MB, memory ~20-50MB
- เปิดเร็ว (<0.5s) ไม่ต้องพึ่ง browser
- ทำงาน offline ได้ 100%

---

## Rust GUI = Lite โดยธรรมชาติ (ไม่ต้องเลือก build)

Rust GUI จะเป็น **lite version โดยปริยาย** ไม่ต้องมี build profile แยก เพราะ egui เป็น native GUI ที่เน้น functional ไม่ใช่ visual effects

### สิ่งที่ Webapp Full Build มี แต่ Rust GUI ทำไม่ได้

| Feature | ทำใน egui ได้ไหม | เหตุผล |
|---------|-----------------|--------|
| Animated particles (LuminousParticlesBackground) | ❌ | egui ไม่มี canvas / WebGL |
| Sparkle effect (1000+ DOM) | ❌ | egui ไม่มี DOM concept |
| Glass UI / backdrop-filter | ❌ | ไม่มี CSS |
| Animated gradient background | ❌ | ไม่มี CSS animation |
| Falling elements | ❌ | ไม่มี DOM |
| Welcome screen onboarding | ทำได้แต่ไม่จำเป็น | native app ไม่ต้อง onboarding |

### เปรียบเทียบทุก version

| Feature | Webapp Full | Webapp Lite | Rust GUI |
|---------|-------------|-------------|----------|
| Animated particles | ✅ | ❌ | ❌ |
| Sparkle effect | ✅ | ❌ | ❌ |
| Glass UI | ✅ | ❌ | ❌ |
| Map images | ✅ | ✅ | ✅ |
| Sprite images | ✅ | ✅ | ✅ |
| Firebase sync | ✅ | ✅ | ✅ |
| MVP tracking (kill/edit/pin/sort) | ✅ | ✅ | ✅ |
| Search/filter | ✅ | ✅ | ✅ |
| Notification | ✅ browser | ✅ browser | ✅ OS native |
| Party mode | ✅ | ✅ | ✅ |
| Startup speed | ช้า (2.0s) | เร็ว (2.0s) | **เร็วสุด (<0.5s)** |
| Memory usage | สูง (50-100MB) | กลาง (50-100MB) | **ต่ำสุด (20-50MB)** |
| Binary/Bundle size | ~15MB | ~8MB | ~10-15MB |
| ต้องติดตั้ง | ❌ แค่เปิดเว็บ | ❌ แค่เปิดเว็บ | ต้อง download |
| ทำงาน offline | ต้อง cache | ต้อง cache | **✅ 100%** |

### ถ้าอยากได้ Full Effects ใน Native App

ต้องใช้ **Tauri** (ที่ทำอยู่แล้ว) ซึ่ง wrap webapp เดิม — ได้ full effects ครบ แต่ binary ใหญ่กว่า + memory สูงกว่า

**สรุป:** เลือกตามความต้องการ
- ต้องการ **visual effects ครบ** → Tauri (webapp wrapper)
- ต้องการ **เบาที่สุด + เร็วสุด + native** → Rust GUI (egui)
- ต้องการ **ไม่ต้องติดตั้ง** → Webapp Lite

---

## สิ่งที่ reuse ได้จาก codebase เดิม

| สิ่งที่มี | ไฟล์ต้นฉบับ | สถานะ |
|-----------|-------------|-------|
| Core logic (`formatTime`, `getMvpRespawnTime`, `getMvpRespawnWindow`) | `src/utils/shared.ts` | เขียนใหม่ ~50 บรรทัด (คณิตศาสตร์ล้วน) |
| Data format (JSON) | `src/data/*.json` | ใช้ได้เลย + `serde` deserialize |
| Data structures (`IMvp`, `ISpawn`, `IMapMark`) | `src/interfaces/index.ts` | แปลงเป็น Rust struct ~30 บรรทัด |
| Business logic (kill, edit, pin, sort, rehydrate) | `src/contexts/MvpsContext.tsx` (475 บรรทัด) | เขียนใหม่ ~200 บรรทัด |
| Settings (server, nickname, party, preferences) | `src/contexts/SettingsContext.tsx` (685 บรรทัด) | เขียนใหม่ ~100 บรรทัด |
| Firebase sync | `src/contexts/MvpsContext.tsx` + `firebaseLazy.ts` | ใช้ `reqwest` + Firebase REST API ~150 บรรทัด |
| Map images (188 files, ~11MB) | `src/assets/mvp_maps/` | คัดลอกมาใช้ได้เลย |
| Sprite images (PNG/GIF, ~4.5MB) | `src/assets/mvp_icons*/` | คัดลอกมาใช้ได้เลย |
| Server list (15 servers) | `src/constants/index.ts` | เขียนใหม่ ~10 บรรทัด |

---

## โครงสร้างโปรเจค

```
ragnarok-mvp-gui/
├── Cargo.toml
├── assets/                    # คัดลอกจาก src/assets/
│   ├── maps/                  # PNG map images (~11MB)
│   ├── icons/                 # PNG sprite images (~2MB)
│   └── icons/anim/            # Animated sprites (~2.5MB)
├── data/                      # คัดลอกจาก src/data/
│   ├── iRO.json
│   ├── thROG.json
│   └── ... (15 servers)
└── src/
    ├── main.rs                # entry point + egui app loop
    ├── app.rs                 # MyApp struct + update() + view()
    ├── data/
    │   ├── mod.rs
    │   ├── mvp.rs             # IMvp, ISpawn, IMapMark structs
    │   ├── settings.rs        # Settings struct
    │   └── servers.rs         # Server list + defaults
    ├── core/
    │   ├── mod.rs
    │   ├── timer.rs           # formatTime, getMvpRespawnTime, getMvpRespawnWindow
    │   ├── sort.rs            # sortMvpsByRespawnTime
    │   └── rehydrate.rs       # rehydrateMvps (merge remote + local)
    ├── firebase/
    │   ├── mod.rs
    │   ├── client.rs          # Firebase REST API (GET/PUT/SET)
    │   └── sync.rs            # Real-time listener (SSE or polling)
    ├── ui/
    │   ├── mod.rs
    │   ├── header.rs          # Server selector, clock, nickname
    │   ├── mvp_card.rs        # MVP card (image, countdown, kill/edit buttons)
    │   ├── mvp_list.rs        # Active/Pinned/All sections
    │   ├── map_view.rs        # Map image + death position marker
    │   ├── modals.rs          # Kill/Edit/Settings modals
    │   └── notification.rs    # OS notification (notify-rust)
    └── storage/
        ├── mod.rs
        └── local.rs           # Local JSON file save/load (offline fallback)
```

---

## Dependencies

```toml
[package]
name = "ragnarok-mvp-gui"
version = "0.1.0"
edition = "2021"

[dependencies]
eframe = "0.31"           # egui framework (includes egui, epi)
image = "0.25"            # PNG/GIF decoder
serde = { version = "1", features = ["derive"] }
serde_json = "1"
reqwest = { version = "0.12", features = ["json", "stream"] }
tokio = { version = "1", features = ["full"] }
chrono = "0.4"            # Date/time handling
notify-rust = "4"         # OS notification
dirs = "6"                # Config/data directory paths
```

**Binary size คาดการณ์:** ~8-15MB (รวม image decoder + TLS)

---

## Phase 1: Core (ไม่ต้องมี Firebase) — ~2-3 วัน

- [ ] สร้างโปรเจค + Cargo.toml
- [ ] แปลง data structures (IMvp, ISpawn, IMapMark) → Rust structs
- [ ] เขียน core logic (formatTime, getMvpRespawnTime, sort)
- [ ] โหลด JSON data ได้ (serde)
- [ ] egui UI: แสดง MVP list แบบ card (ชื่อ, countdown, zone)
- [ ] egui UI: แสดง map image (ไม่มี marker ยัง)
- [ ] Kill/Edit MVP (เปลี่ยน deathTime)
- [ ] Local save/load (JSON file)

**สิ่งที่ได้:** Desktop app ที่ทำ MVP tracking ได้ครบ + แสดงภาพจริง แต่ไม่มี sync

---

## Phase 2: Firebase Sync — ~1-2 วัน

- [ ] Firebase REST API client (reqwest)
  - GET ดึง data
  - PUT/SET เขียน data
  - SSE (Server-Sent Events) สำหรับ real-time listener
- [ ] Solo mode: connect Firebase path `hunting/solo/{nickname}/{server}/mvps`
- [ ] Party mode: connect Firebase path `hunting/party/{room}/{server}/mvps`
- [ ] Heartbeat (ส่ง lastSeen ทุก 30 วินาที)
- [ ] Rehydrate logic (merge remote data กับ original server data)

**สิ่งที่ได้:** sync กับ webapp ได้ real-time

---

## Phase 3: UI Polish — ~1-2 วัน

- [ ] Map view: แสดง map image + death position marker
- [ ] Sprite images: แสดง MVP icon ใน card
- [ ] Search/filter MVP
- [ ] Sort options (7 แบบ เหมือน webapp)
- [ ] Settings modal (server, nickname, party room, 24h format)
- [ ] Party mode UI (QR code / room ID sharing)
- [ ] OS notification เมื่อ MVP respawn
- [ ] Keyboard shortcuts

---

## Phase 4: Distribution — ~1 วัน

- [ ] Cross-compile: Windows, macOS, Linux
- [ ] Bundle assets (images, JSON) เข้า binary หรือ accompany directory
- [ ] GitHub Actions: auto-build ทุก platform
- [ ] Auto-update mechanism (optional)

---

## เปรียบเทียบ final result

| | **Lite Build (ตอนนี้)** | **Rust GUI (เป้าหมาย)** |
|---|---|---|
| **Size** | ~8MB dist + browser | ~10-15MB binary |
| **Memory** | ~50-100MB (browser tab) | ~20-50MB |
| **Startup** | FCP 2.0s | <0.5s |
| **Firebase sync** | ✅ | ✅ (REST ตรง) |
| **Map images** | ✅ | ✅ |
| **Sprite images** | ✅ | ✅ |
| **Notification** | ✅ browser | ✅ OS native |
| **Offline** | ต้อง cache | ✅ 100% |
| **Party mode** | ✅ | ✅ |
| **ต้องติดตั้ง** | ❌ แค่เปิดเว็บ | ต้อง download |
| **SSH remote** | ❌ | ❌ |
| **Maintain** | codebase เดียวกัน | แยก codebase |

---

## ข้อควรระวัง

1. **Codebase แยก** — Rust GUI จะเป็นโปรเจคแยก ไม่ใช่ส่วนหนึ่งของ webapp ต้อง maintain 2 ที่
2. **Firebase REST vs SDK** — ใช้ REST API ตรงได้ แต่ real-time listener ต้องใช้ SSE (Server-Sent Events) ซึ่งยุ่งกว่า Firebase SDK
3. **Assets sync** — ถ้าเพิ่ม MVP ใหม่ใน webapp ต้อง copy images/data เข้า Rust GUI ด้วย (หรือ bundle ไปด้วย)
4. **UI framework** — egui เรียนรู้เร็ว แต่ custom UI สวยเท่า web ได้ยาก

---

## สรุป

**ควรทำ Phase 1 ก่อน** (Core ไม่ต้องมี Firebase) ใช้เวลา ~2-3 วัน ถ้าได้ result ที่น่าพอใจค่อยต่อ Phase 2-4
