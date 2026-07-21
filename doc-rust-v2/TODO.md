# Rust egui v2 — TODO

Base: `d8429d4` (search bar all tabs + center, icon sizing 100px, multi-map expansion)

## Critical — ต้องทำก่อน (กระทบ data ร่วมกับ webapp)

- [ ] **Kill modal + map selection** — v2 kill ปุ๊บเลย, ไม่เลือก map → webapp เห็น `deathMap` พลุ๊บๆ ต้องมี modal เลือก map เมื่อ multi-spawn (เหมือน webapp `ModalKillMvp` + `ModalSelectMap`)
- [ ] **Edit time → date picker** — ปัจจุบันแค่ "Set to now" → เขียนทับเวลาที่ webapp ตั้งไว้
- [ ] **Push space halving** — layout ห่วย (พื้นที่ว่างเหนือปุ่มเยอะไป) `* 0.5`

## Race condition (Firebase)

- [x] **PATCH แทน PUT/POST** — v2 ใช้ PATCH อยู่แล้ว, แก้เฉพาะ key ที่เปลี่ยน
- [ ] **`updatedAt` timestamp** — ส่งทุก write → webapp ใช้ resolve conflict
- [ ] **Optimistic lock** — webapp อาจเขียนทับ v2 ถ้า sync พร้อมกัน ต้องใช้ `updatedAt` เปรียบเทียบ

## Missing features (v2 ไม่มี = webapp หาย)

- [ ] **Map position marker** — v2 ไม่ส่ง `deathPosition` → webapp marker หาย
- [ ] **SSE real-time subscribe** — v2 pull ตอน login เท่านั้น ไม่เห็น update จาก webapp
- [ ] **Notification sound** — `settings.notification_sound` มี toggle แต่ไม่มี implement
- [ ] **Backup/reset** — webapp มี `clearData`, v2 ไม่มี

## แผนแนะนำ (feature branch จาก `d8429d4`)

```
experiment/rust-egui-v2 ← d8429d4 (base)
 ├─ feat/push-space-half     → (เล็ก) ใส่ * 0.5
 ├─ feat/kill-modal          → (กลาง) modal + map selection + edit time picker
 ├─ feat/updated-at          → (เล็ก) ส่ง updatedAt ทุก write
 ├─ feat/map-marker          → (กลาง) marker x,y
 ├─ feat/sse-subscribe       → (ใหญ่) real-time sync
 └─ feat/notification        → (เล็ก) notify-rust
```

Test แต่ล่ะ branch ก่อน merge กลับ base

## Done

- [x] Multi-map expansion — Baphomet-type แตกเป็น card ละ map ใน ALL tab
- [x] Icon sizing — scan pixel dims จริง, fixed height 100px, `fit_to_exact_size` รักษาสัดส่วน
- [x] Search bar — visible ทุก tab, center `with_layout(Align::Center)`
- [x] Layout fixed-height sections — sprite 100px, map preview capped 120px, timer/pinned 22px เสมอ
- [x] Firebase sync — PATCH keyed-object `{id}-{deathMap}`, blocking pull + async push
- [x] Rehydrate — merge remote Firebase + local JSON
- [x] Animated sprites — GIF + APNG frame decode, cycle timing
- [x] Fonts ไทย/JP/KR — NotoSans
- [x] Cross-compile — `x86_64-pc-windows-gnu` → `.exe`
