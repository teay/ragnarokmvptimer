# Ragnarok MVP Timer — App Alternatives Comparison

---

## คำถามตั้งต้น

นอกจากพัฒนาเป็น lite version ยังมีแนวทางอื่นๆอีกไหม เช่น ใช้ C หรือใช้ Rust หรือทำเป็น binary เอาไว้ run?

---

## สถานะปัจจุบัน

repo นี้มี **4 app** หลัก:

| # | App | Tech | ที่อยู่ | สถานะ |
|---|-----|------|---------|-------|
| 1 | **Web Frontend (Full)** | React 18 + TypeScript + Vite | `/src/` | ใช้งานได้ ~15MB |
| 2 | **Web Frontend (Lite)** | React 18 + Vite (`LITE=true`) | `/src/` (build profile) | ทำแล้ว ~8MB, Perf score 83 |
| 3 | **Tauri Desktop** | Rust (Tauri v2) wrap web | `/src-tauri/` | ใช้งานได้ |
| 4 | **Node.js CLI** | JavaScript (Node.js) + blessed | `/cli/` | ใช้งานได้ |
| 5 | **C TUI** | C + ncurses | `/cli-c/` | ใช้งานได้ ~1MB binary |

---

## แนวทางเปรียบเทียบ

### 1. Lite Build (ทำแล้ว) — React/Vite

- ลดจาก ~15MB เหลือ ~8MB, Performance 60 → 83
- ข้อดี: codebase เดียวกัน, ไม่ต้อง maintain แยก
- ข้อเสีย: ยังเป็น SPA, ต้องมี browser

### 2. C (มีอยู่แล้วใน `cli-c/`)

- Binary ~1MB, resource ต่ำสุด, ทำงาน offline 100%
- ข้อดี: เบาที่สุด, compile ได้ทุก platform
- ข้อเสีย: ไม่มี Firebase ตรง (ต้องพึ่ง `sync-daemon.js`), ไม่มี map images, ไม่มี notification, ไม่มี UI สวยงาม

### 3. Rust

- **Tauri** ทำแล้ว แต่เป็นแค่ wrapper ของ webapp
- ถ้าเขียน **Rust CLI ใหม่** จะได้:
  - Binary ~2-5MB, compile ได้ทุก platform
  - Memory safety + ประสิทธิภาพสูง
  - ใช้ `reqwest` + `tokio` ต่อ Firebase REST API ได้ตรง (ไม่ต้องพึ่ง daemon)
  - ใช้ `ratatui` หรือ `crossterm` ทำ TUI ที่สวยกว่า ncurses
  - รองรับ notification ผ่าน terminal bell หรือ OS notification

### 4. Binary Distribution (Tauri)

- Tauri build อยู่แล้ว แต่ตอนนี้ build แค่ Windows (GitHub Actions)
- ข้อดี: ได้ native desktop app, auto-update ได้
- ข้อเสีย: ยัง wrap webapp อยู่ (ไม่ได้เบาลงกว่า lite build)

---

## ตารางสรุป

| เป้าหมาย | แนวทางที่ดีที่สุด |
|-----------|-------------------|
| **เบาที่สุด, ไม่ต้องมี browser** | **C TUI** (ทำ Firebase REST ตรง + เพิ่ม feature) |
| **เบาที่สุด + maintain ง่าย + cross-platform** | **Rust CLI** ใหม่ด้วย `ratatui` + `reqwest` |
| **ไม่ต้องติดตั้ง, เปิดเว็บได้เลย** | **Lite Build** (ทำแล้ว) |
| **Desktop app สวยงาม** | **Tauri** (ทำแล้ว) |

---

## Rust TUI vs GUI

### ตัวเลือกใน Rust

#### 1. TUI (Terminal UI) — สวยกว่า C ncurses

ใช้ library เช่น `ratatui`, `cursive`, `crossterm`

```
┌─────────────────────────────────────┐
│  MVP Timer          iRO    14:32   │
│─────────────────────────────────────│
│  ★ ACTIVE                            │
│  Osiris     02:15  ▓▓▓▓▓░░░  72%   │
│  Thanatos   11:42  ▓▓░░░░░░  24%   │
│  Belphegor  00:33  ▓▓▓▓▓▓▓▓  98%   │
│                                     │
│  ◆ PINNED                           │
│  Amdarais   45:10  ▓░░░░░░░  12%   │
│─────────────────────────────────────│
│  [K]ill  [E]dit  [M]ap  [Q]uit     │
└─────────────────────────────────────┘
```

- Binary ~3-5MB
- ยังอยู่ใน terminal
- Firebase REST ตรง
- ไม่ต้อง daemon

#### 2. GUI (Desktop Window) — native app จริงๆ

ใช้ library เช่น `egui`, `iced`, `slint`, `gtk-rs`

```
┌─────────────────────────────────────┐
│  🗡️ MVP Timer          iRO    14:32 │
├─────────────────────────────────────┤
│  ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐  │
│  │     │ │     │ │     │ │     │  │
│  │Osiris│ │Thana│ │Belphe│ │Amdar│  │
│  │2:15  │ │11:42│ │0:33  │ │45:10│  │
│  │▓▓▓▓░░│ │▓▓░░░│ │▓▓▓▓▓▓│ │▓░░░░│  │
│  │[Kill]│ │[Kill]│ │[Kill]│ │[Kill]│  │
│  └─────┘ └─────┘ └─────┘ └─────┘  │
│                                     │
│  🗺️ Map: Prontera  📍 (150, 120)  │
└─────────────────────────────────────┘
```

- Binary ~5-15MB
- มี window, mouse support, sprite images ได้
- Firebase REST ตรง
- Cross-platform (Windows/Mac/Linux)

#### 3. Tauri (ทำแล้ว) — wrap webapp เดิม

- ใช้ Rust backend + React frontend เดิม
- ไม่ได้เบาลงกว่า lite build

---

## เปรียบเทียบ TUI vs GUI vs Tauri

| | TUI (ratatui) | GUI (egui/iced) | Tauri (ทำแล้ว) |
|---|---|---|---|
| **UI** | Terminal | Window | Window |
| **Size** | ~3-5MB | ~5-15MB | ~15MB+ |
| **Sprite/Map images** | ❌ ASCII | ✅ ได้ | ✅ ได้ |
| **Mouse support** | จำกัด | ✅ เต็ม | ✅ เต็ม |
| **Firebase** | REST ตรง | REST ตรง | ผ่าน webapp |
| **ติดตั้ง** | ไม่ต้อง | ต้อง install | ต้อง install |
| **ใช้ SSH/remote** | ✅ ได้ | ❌ ไม่ได้ | ❌ ไม่ได้ |

---

## โครงสร้างโปรเจค Rust CLI (ถ้าทำใหม่)

```
ragnarok-cli-rust/
├── Cargo.toml        # reqwest, tokio, ratatui, serde_json, notify-rust
├── src/
│   ├── main.rs       # entry point
│   ├── firebase.rs   # Firebase REST API client
│   ├── ui.rs         # ratatui TUI rendering
│   ├── mvp.rs        # MVP data + respawn calculation
│   └── notify.rs     # OS notifications
```

---

## สรุป

ถ้าต้องเลือกทางเดียว **Rust CLI ด้วย `ratatui`** จะคุ้มค่าที่สุด แต่ถ้าต้องการ solution ที่เร็วที่สุด ตอนนี้ **Lite Build ที่ทำไว้ก็ใช้ได้ดีอยู่แล้ว**
