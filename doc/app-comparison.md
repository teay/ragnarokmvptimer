# Ragnarok MVP Timer - App Comparison

---

## 1. Repository Structure - Apps Overview

Repo นี้มี **4 app** หลัก สำหรับ tracking respawn timer ของ MVP boss ในเกม Ragnarok Online:

| # | App | Tech | ที่อยู่ |
|---|-----|------|----------|
| 1 | **Web Frontend** | React 18 + TypeScript + Vite | `/src/` |
| 2 | **Tauri Desktop** | Rust (Tauri v2) wrap web app | `/src-tauri/` |
| 3 | **Node.js CLI** | JavaScript (Node.js) + terminal-kit | `/cli/` |
| 4 | **C TUI** | C + ncurses | `/cli-c/` |

ทั้ง 4 ตัวเป็น client สำหรับ Ragnarok MVP Timer โดยมี Firebase realtime sync ให้ใช้ร่วมกัน (ยกเว้น C TUI ที่ต้องพึ่ง `sync-daemon.js` เป็น bridge ไปหา Firebase)

### Web Frontend (`/src/`)
- Rich interactive single-page web app
- Card-based UI พร้อม sprite images, interactive maps, particle effects
- รองรับ 15 servers, 3 languages (EN/PT/TH)
- Party mode พร้อม heartbeat + member tracking
- Notification sounds + browser notifications
- ~50+ source files

### Tauri Desktop (`/src-tauri/`)
- Native desktop wrapper ของ webapp (Rust + webview)
- เพิ่มแค่ fullscreen toggle, debug logging, cross-platform bundling
- ไม่มี business logic เพิ่มเติม — inherit ทุกอย่างจาก web

### Node.js CLI (`/cli/`)
- Terminal UI ที่มี Firebase SDK ตรง (party + solo sync)
- Full keyboard navigation, file save/load, export/import
- มี `sync-daemon.js` เป็น bridge ให้ C TUI เชื่อม Firebase ได้
- ไฟล์เดียว ~1098 บรรทัด

### C TUI (`/cli-c/`)
- Lightweight ncurses terminal UI
- ไม่มี Firebase ตรง (ต้องพึ่ง sync-daemon.js)
- มี ASCII map visualization จาก `.col` binary files
- ทำงาน offline ได้ 100%, resource usage ต่ำสุด (~1MB)

---

## 2. Feature Comparison: Webapp vs Others

### 2.1 Tauri Desktop vs Webapp
แทบไม่มี gap — มันแค่ wrap webapp ไว้ใน native window เพิ่มแค่:
- Fullscreen API (`appWindow.setFullscreen()`)
- Debug logging (`tauri-plugin-log`)
- Cross-platform bundling

### 2.2 Node.js CLI — ห่างจาก Webapp

| หมวด | สิ่งที่ขาด |
|------|-----------|
| **Visual** | ไม่มี sprite images, ไม่มี map images, ไม่มี particle/sparkle effects, ไม่มี theme system, ไม่มี glass UI |
| **UI/UX** | ไม่มี modal system, ไม่มี settings modal (~30 settings), ไม่มี interactive tutorial, ไม่มี search/filter, sort ได้แค่ name+map |
| **Map** | ไม่มี interactive map ให้คลิกวางตำแหน่ง, ไม่มี multi-map selection |
| **Notification** | ไม่มี browser notification, ไม่มี notification sound |
| **Party** | ไม่มี heartbeat/member online display, ไม่มี URL sharing, ไม่มี data status badge |
| **i18n** | ไม่มี (ENG only, ไม่มี PT/TH) |
| **Other** | ไม่มี navi command copy, ไม่มี header clock, ไม่มี 24h format toggle, export/import ไม่สมบูรณ์ |

**สิ่งที่ CLI มีแต่ Web ไม่มี:**
- Sort by map name
- Pause rendering (Space bar)
- Manual Firebase sync (U key)

### 2.3 C TUI — ห่างจาก Webapp

| หมวด | สิ่งที่ขาด |
|------|-----------|
| **Firebase** | ไม่ connect Firebase โดยตรง (ต้องพึ่ง sync-daemon.js) |
| **Visual** | ไม่มี sprite/map images, ไม่มี visual effects ใดๆ |
| **UI** | ไม่มี modal, ไม่มี search, ไม่มี sort options, ไม่มี settings UI |
| **Map** | มีแค่ ASCII grid (ไม่ใช่ PNG), ไม่มี click-to-place |
| **Notification** | ไม่มี notification เลย (แม้ terminal bell) |
| **Party** | ไม่มี party mode UI, ไม่มี member tracking |
| **i18n** | ไม่มี (ENG only) |
| **Data** | ไม่มี export/import, ไม่มี server selection UI (ใช้ CLI flag) |

**สิ่งที่ C TUI มีแต่ Web ไม่มี:**
- ทำงาน offline ได้ 100%
- Resource usage ต่ำสุด (~1MB binary)
- ASCII map มี coordinate grid labels
- Zone-based state enum ชัดเจน (`ZONE_UNSELECTED`, `ZONE_WAIT`, `ZONE_ACTIVE`)

---

## 3. Core Feature Parity Matrix

### MVP Tracking
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| สาม zone (Active/Wait/All) | ✅ | ✅ | ✅ |
| Kill MVP (mark dead) | ✅ | ✅ | ✅ |
| Edit death time | ✅ (date picker) | ✅ (text input) | ✅ (text input) |
| Edit death position | ✅ (click map) | ❌ | ✅ (text input) |
| Change death map (multi-map) | ✅ | ❌ | ❌ |
| Move to Wait (pin) | ✅ | ✅ | ✅ |
| Cancel / remove | ✅ | ✅ | ✅ |
| Respawn countdown | ✅ | ✅ | ✅ |
| Respawn window (min/max) | ✅ | ✅ | ✅ |

### Sorting & Filtering
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| Search by name/ID | ✅ | ❌ | ❌ |
| Sort options | 7 ตัว | 2 ตัว (name/map) | ❌ |
| Reverse sort | ✅ | ❌ | ❌ |

### Persistence & Sync
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| Firebase real-time sync | ✅ | ✅ | ❌ (via daemon) |
| Solo mode (Firebase) | ✅ | ✅ | ❌ |
| Party mode (Firebase) | ✅ | ✅ | ❌ |
| Heartbeat / member tracking | ✅ | ❌ | ❌ |
| File-based save/load | ❌ (localStorage) | ✅ | ✅ |
| Export to JSON | ✅ | ✅ | ❌ |
| Import from JSON | ✅ (mock) | ✅ | ❌ |

### Multi-Server
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| Servers supported | 15 | 14 | 15 |
| Server selection UI | ✅ (modal) | ❌ (arrow keys) | ❌ (CLI flag) |

### i18n
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| Languages | 3 (EN/PT/TH) | 1 (EN) | 1 (EN) |

### Notifications
| Feature | Web | Node.js CLI | C TUI |
|---------|-----|-------------|-------|
| Browser notification | ✅ | ❌ | ❌ |
| Notification sound | ✅ | ❌ | ❌ |

---

## 4. Gap Summary

### Gap หลักๆ ที่ควร bridge:

1. **Firebase sync ใน C TUI** — ยังต้องพึ่ง daemon อยู่
2. **Notification ในทั้ง 2 CLI** — ไม่มีเสียง/notification เลย
3. **i18n ใน CLI ทั้งคู่** — ยังเป็น ENG only
4. **Search/filter/sort ใน CLI** — ยังไม่มี
5. **Party features ใน CLI** — ไม่มี heartbeat, member display, URL sharing
6. **Map interaction ใน CLI** — ไม่มี interactive map, ไม่มี multi-map selection

### สิ่งที่ Webapp ขาดจาก CLI:

| Feature | CLI |
|---------|-----|
| Sort by map name | Node.js CLI |
| Pause rendering | Node.js CLI |
| Manual Firebase sync (U key) | Node.js CLI |
| ทำงาน offline 100% | C TUI |
| ASCII map coordinate grid | C TUI |
| Zone-based state enum | C TUI |

---

## 5. Lite Build Plan

### เป้าหมาย
สร้าง build ที่เบาและเร็วที่สุด โดยยอมตัดความสวยงามบางส่วนออก แต่ยังใช้งาน MVP tracking ได้ครบ

### แนวทาง: Build Profiles
ใช้ codebase เดียว สร้าง 2 build ด้วย env variable:

```bash
npm run build          # Full build (ปัจจุบัน)
npm run build:lite     # Lite build (เบาสุด)
```

ใช้ `__LITE_MODE__` เป็น compile-time constant ใน `vite.config.ts` เพื่อ tree-shake โค้ดที่ไม่ต้องการออกจริงๆ:

```ts
const isLite = process.env.LITE === 'true'
export default defineConfig({
  define: { __LITE_MODE__: isLite },
  // ...
})
```

### Phase 1: Dead Weight ที่ตัดออกได้เลย

| รายการ | ประหยัด | วิธี |
|--------|---------|------|
| ลบ `styled-components` ออกจาก package.json | ~15KB gz | zero imports อยู่แล้ว |
| ลบ `@chenglou/pretext` | เล็กน้อย | zero imports |
| Tree-shake `@styled-icons/feather` | ~10KB+ | ใช้แค่ icon `Trash` ตัวเดียว |

### Phase 2: Assets (~14.6MB → เล็กลงมาก)

| รายการ | ประหยัด | วิธี |
|--------|---------|------|
| Map images (188 ไฟล์, ~11MB) | ~11MB | Lazy-load ทีละแผนที่ (ไม่ bundle ทั้งหมด) |
| Animated sprites (66 ไฟล์, ~2.5MB) | ~2.5MB | ปิดเป็นค่าเริ่มต้น ให้ user toggle เปิดเอง |
| Static MVP icons (~2MB) | ~2MB | ตัดออก ใช้ text/emoji แทน (หรือเหลือเฉพาะตัวที่ใช้) |
| Leaf images (16 ไฟล์) | เล็กน้อย | ปิดใน lite mode |

### Phase 3: Code Splitting (JS Bundle)

| รายการ | วิธี |
|--------|------|
| Firebase SDK | Replace ด้วย minimal REST client สำหรับ Realtime DB ตัวเดียว |
| react-intl | Lazy-load หรือ inline translations สำหรับ 3 ภาษา |
| Google Fonts | โหลด font เดียวที่เลือก (ไม่ใช่ 3 ตัว) |
| LuminousParticlesBackground, SparkleEffect | ตัดออกใน lite build |
| Footer, WelcomeScreen | ตัดออกใน lite build |
| dayjs locales | Import เฉพาะภาษาที่ใช้ |

### Maps & Sprites ใน Lite Build

Maps และ Animated Sprites ยังแสดงผลได้ แต่เปลี่ยนวิธีจัดการ:

| Feature | Full Build | Lite Build |
|---------|-----------|-----------|
| **Maps** | Bundle ทุกไฟล์ (~11MB) | Lazy-load ทีละแผนที่ (ไม่ bundle ทั้ง 188 ไฟล์) |
| **Static Icons** | มีทุกตัว (~2MB) | ตัดออก หรือเหลือเฉพาะที่ใช้ |
| **Animated Sprites** | เปิดเป็นค่าเริ่มต้น | ปิดเป็นค่าเริ่มต้น ให้ user toggle เปิดเอง |

**Key point:** Maps + Sprites ไม่ได้หายไป แค่เปลี่ยนจาก "bundle ทุกอย่างตอน build" เป็น "load ตามต้องการตอนใช้" — ทำให้ initial load เล็กลงมาก แต่ยังดู sprites/แผนที่ได้เหมือนเดิม

### ประมาณการ Size

| ตัว | JS Bundle (gz) | Assets | Total |
|-----|----------------|--------|-------|
| **Full Build** (ปัจจุบัน) | ~200KB+ | ~14.6MB | ~15MB |
| **Lite Build** | ~50-80KB | ~2-3MB (icons เฉพาะตัวที่ใช้) | ~3MB |

### Components ที่ตัด/คงเหลือใน Lite

| Component | Full | Lite | เหตุผล |
|-----------|------|------|--------|
| MvpCard, MvpCardCountdown | ✅ | ✅ | Core tracking |
| Header, HeaderTimer | ✅ | ✅ | Core UI |
| Map, MapMark | ✅ | ✅ | Lazy-load |
| MvpsContainerFilter, SortSelect | ✅ | ✅ | Core filtering |
| ModalSettings, ModalKillMvp, ModalEditMvp | ✅ | ✅ | Core modals |
| ModalSelectServer, ModalSelectMap | ✅ | ✅ | Core selection |
| ModalPartySharing | ✅ | ✅ | Party mode |
| LuminousParticlesBackground | ✅ | ❌ | Visual effect |
| SparkleEffect | ✅ | ❌ | Visual effect |
| Footer | ✅ | ❌ | Cosmetic |
| WelcomeScreen | ✅ | ❌ | Onboarding |
