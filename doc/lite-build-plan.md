# Ragnarok MVP Timer — Lite Build Plan

---

## ปัญหา

Webapp ปัจจุบันเน้นความสวยงาม มี effects จำนวนมาก ทำให้:
- Initial load ช้า (~15MB รวม assets)
- JS bundle ใหญ่ (~200KB+ gzipped)
- ไม่เหมาะกับมือถือสเปคต่ำ หรือเน็ตช้า

**เป้าหมาย:** สร้าง build ที่เบาและเร็วที่สุด โดยยอมตัดความสวยงามบางส่วนออก แต่ยังใช้งาน MVP tracking ได้ครบ + map กดปุ๊บมาป๊บ

---

## แนวทาง: Build Profiles

ใช้ codebase เดียว สร้าง 2 build ด้วย env variable:

```bash
npm run build          # Full build (ปัจจุบัน) — สวยงามครบ
npm run build:lite     # Lite build — เบาสุด เร็วสุด
```

ใช้ `__LITE_MODE__` เป็น compile-time constant เพื่อ tree-shake โค้ดที่ไม่ต้องการออกจริงๆ (ไม่ใช่ runtime check):

```ts
// vite.config.ts
const isLite = process.env.LITE === 'true'
export default defineConfig({
  define: { __LITE_MODE__: isLite },
})
```

---

## สิ่งที่ตัดออก

### Dead Weight (ลบได้เลย ไม่กระทบอะไร)

| รายการ | ประหยัด | เหตุผล |
|--------|---------|--------|
| `styled-components` | ~15KB gz | zero imports อยู่แล้ว (ใช้ linaria แทน) |
| `@chenglou/pretext` | เล็กน้อย | zero imports |

### Visual Effects (ตัดใน lite build)

| Component | ทำอะไร | ตัดแล้วกระทบอะไร |
|-----------|--------|-------------------|
| `LuminousParticlesBackground` | Canvas animated particles/waves | ไม่มี background เคลื่อนไหว |
| `SparkleEffect` | Sparkle overlay สูงสุด 1000 DOM | ไม่มี sparkle |
| `Footer` | Credits/links ด้านล่าง | ไม่มี footer |
| `WelcomeScreen` | Onboarding overlay | เข้า app ตรงๆ |

### CSS Effects (ปิดใน lite mode)

- Glass UI / backdrop-filter
- Animated gradient background
- Particle settings
- Main content transparency
- Falling elements

---

## Maps — กดปุ๊บมาป๊บ

### ปัญหา
- Map images มี 188 ไฟล์ (~11MB)
- ถ้า bundle ทั้งหมด → first load ช้ามาก
- ถ้า lazy load ทุกครั้ง → กดทีไรต้องรอ

### วิธีแก้: Preload All Maps + Service Worker Cache

```
┌─────────────────────────────────────────────────┐
│  1. First Load (เร็ว)                            │
│     JS Bundle ~80KB                              │
│                                                  │
│  2. หลัง App Mount (ทันที)                       │
│     preloadMaps(server)                          │
│     → โหลด map ทุกตัวของ server นั้น             │
│       ทีละไฟล์ ไม่ block UI                      │
│     → แสดง progress bar เล็กๆ บน Header        │
│                                                  │
│  3. User กด Map (เร็วมาก)                        │
│     Service Worker → เสิร์ฟจาก cache ทันที       │
│                                                  │
│  4. ครั้งถัดไป (เร็วสุดๆ)                         │
│     ทุก map อยู่ใน Service Worker Cache           │
│     ไม่ต้องรอ network เลย                        │
└─────────────────────────────────────────────────┘
```

### โค้ดตัวอย่าง

```ts
function preloadMaps(server: string) {
  const maps = getMapListForServer(server)
  let loaded = 0

  maps.forEach((map, i) => {
    const img = new Image()
    img.onload = () => {
      loaded++
      updateProgress(loaded, maps.length)
    }
    // stagger ทุก 50ms ไม่ให้ bandwidth กระโดด
    setTimeout(() => { img.src = `/maps/${map}.webp` }, i * 50)
  })
}
```

### ผลลัพธ์

| ช่วง | Map Load Speed |
|------|---------------|
| First load (ยังไม่ preload) | ~200-500ms (fetch) |
| หลัง preload เสร็จ (~5 วินาที) | **ทันที** (<1ms cache) |
| ครั้งถัดไป (Service Worker) | **ทันที** (<1ms cache) |
| Offline | **ทันที** (cached แล้ว) |

---

## Animated Sprites

| Feature | Full Build | Lite Build |
|---------|-----------|-----------|
| Static Icons | ทุกตัว (~2MB) | ตัดออก หรือเหลือเฉพาะที่ใช้ |
| Animated GIF | เปิดเป็นค่าเริ่มต้น | ปิดเป็นค่าเริ่มต้น ให้ user toggle เปิดเอง |

**Key point:** Sprites ไม่ได้หายไป เปลี่ยนจาก "load ตอน build" เป็น "load ตามต้องการ"

---

## Code Splitting (JS Bundle)

| รายการ | วิธี |
|--------|------|
| Firebase SDK | Replace ด้วย minimal REST client (ใช้แค่ Realtime DB) |
| react-intl | Inline translations สำหรับ 3 ภาษา (ไม่โหลด full lib) |
| Google Fonts | โหลด font เดียวที่เลือก (ไม่ใช่ 3 ตัว) |
| dayjs locales | Import เฉพาะภาษาที่ใช้ |
| `@styled-icons/feather` | Tree-shake (ใช้แค่ `Trash` icon) |

---

## Components ที่ตัด/คงเหลือ

| Component | Full | Lite | เหตุผล |
|-----------|------|------|--------|
| MvpCard, MvpCardCountdown | ✅ | ✅ | Core tracking |
| Header, HeaderTimer | ✅ | ✅ | Core UI |
| Map, MapMark | ✅ | ✅ | Lazy-load + Cache |
| MvpsContainerFilter, SortSelect | ✅ | ✅ | Core filtering |
| ModalSettings, ModalKillMvp, ModalEditMvp | ✅ | ✅ | Core modals |
| ModalSelectServer, ModalSelectMap | ✅ | ✅ | Core selection |
| ModalPartySharing | ✅ | ✅ | Party mode |
| LuminousParticlesBackground | ✅ | ❌ | Visual effect |
| SparkleEffect | ✅ | ❌ | Visual effect |
| Footer | ✅ | ❌ | Cosmetic |
| WelcomeScreen | ✅ | ❌ | Onboarding |

---

## ประมาณการ Size

| ตัว | JS Bundle (gz) | Assets | Total |
|-----|----------------|--------|-------|
| **Full Build** (ปัจจุบัน) | ~200KB+ | ~14.6MB | ~15MB |
| **Lite Build** | ~50-80KB | ~2-3MB | ~3MB |

---

## สรุป Flow การใช้งาน Lite Build

```
User เปิด app
    │
    ▼
Load JS Bundle (~80KB) — เร็ว
    │
    ▼
App Mount → preloadMaps() เริ่มทำงาน
    │
    ├─► แสดง Header + MVP List ทันที
    │
    ▼
Background: โหลด map ทุกตัว (~11MB)
    │
    ├─► แสดง progress เล็กๆ บน Header
    │
    ▼
User กด Map → Service Worker เสิร์ฟจาก cache → ทันที
    │
    ▼
ครั้งถัดไป → ทุก map อยู่ใน cache → กดปุ๊บมาป๊บ
```
