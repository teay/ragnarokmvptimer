# Ragnarok MVP Timer — Data Flow & Architecture

## 1. Firebase Schema

```
hunting/
├── solo/
│   └── {NICKNAME}/
│       └── {SERVER}/
│           └── mvps/              # array
├── party/
│   └── {ROOM}/
│       ├── members/
│       │   └── {NICKNAME}/
│       │       ├── name: string
│       │       └── lastSeen: ISO string
│       └── {SERVER}/
│           └── mvps/              # array
```

### MVP object in Firebase (minimal)

```json
{
  "id": 3505,
  "deathTime": "2024-01-15T10:30:00.000Z",
  "deathMap": "gef_fild03",
  "deathPosition": { "x": 120, "y": 45 },
  "isPinned": false,
  "updatedBy": "PLAYERNAME"
}
```

Firebase เก็บเฉพาะ **minimal fields** — เฉพาะข้อมูลที่เปลี่ยนแปลง ไม่มี name, spawn, stats

---

## 2. Local Static Data (src/data/{server}.json)

```json
{
  "id": 3505,
  "name": "Giant Eggring",
  "spawn": [
    { "mapname": "lasa_dun01", "respawnTime": 3600000 }
  ],
  "stats": {
    "level": 25,
    "health": 142480,
    "baseExperience": 150000,
    "jobExperience": 120000
  }
}
```

Static data = **Master reference** มีทุก server (15 servers)

---

## 3. State Machine

```
                    ┌────────────────────────────────────┐
                    │           ALL MVPs                  │
                    │  (full static catalog, filtered)    │
                    └──────────┬─────────────────────────┘
                               │ addToWait / pin
                               ▼
                    ┌────────────────────────────────────┐
              ┌────►│        WAIT (Pinned)                │◄────────────┐
              │     │  isPinned=true, deathTime=null      │             │
              │     │  "Wait for kill" section            │             │
              │     └──────────┬──────────────────────────┘             │
              │                │ killMvp (set deathTime)                │
              │                ▼                                        │
              │     ┌────────────────────────────────────┐              │
              │     │       ACTIVE (Killed)               │─────────────┘
              │     │  deathTime=set, isPinned=false      │  moveToWait
              │     │  "Active" section                   │  (clear deathTime)
              │     └──────────┬──────────────────────────┘
              │                │
              │                ├── killMvp (re-kill) ──► update deathTime
              │                ├── updateMvp ──► edit time/map/position
              │                └── moveToAll / remove ──► back to ALL
              │
              └── removeFromWait ──► back to ALL
```

### Countdown substates (ภายใน ACTIVE)

```
deathTime + respawnTime (min)              deathTime + respawnTime + window (max)
       │                                            │
       ▼                                            ▼
┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐
│ Respawn in   │──►│  Respawning      │──►│ Already Respawned   │
│ HH:mm:ss     │   │  (window range)  │   │ (elapsed since max) │
└──────────────┘   └──────────────────┘   └─────────────────────┘
```

---

## 4. Data Flow (Full Cycle)

```
┌──────────────────────────────────────────────────────────────────────────┐
│  USER ACTION (kill / edit / move / pin / remove)                         │
│      │                                                                   │
│      ▼                                                                   │
│  MvpsContext.killMvp() / updateMvp() / addToWait() / etc.                │
│      │                                                                   │
│      ▼                                                                   │
│  saveMvpsToTarget(newMvps)                                               │
│      │                                                                   │
│      ├──► firebase.set() ──────────────────► Firebase RTDB              │
│      │                                           │                      │
│      │                                     onValue fires                │
│      │                                           │                      │
│      ◄────────────────────────────────────────────┘                      │
│      │                                                                   │
│      ▼                                                                   │
│  rehydrateMvps()                                                         │
│      │                                                                   │
│      │   remote minimal MVP     +     static JSON (name, spawn, stats)   │
│      │   ────────────────             ──────────────────────────         │
│      │   { id, deathTime,             { id, name, spawn[], stats }       │
│      │     deathMap,                                                    │
│      │     deathPosition,                                               │
│      │     isPinned }                                                   │
│      │                                                                   │
│      │   merge → full MVP object                                         │
│      ▼                                                                   │
│  sortMvpsByRespawnTime()                                                 │
│      │                                                                   │
│      ▼                                                                   │
│  setActiveMvps() ──► React re-render ──► UI update                       │
│                                                                          │
│  ── Background (every 30s) ──                                            │
│  heartbeat() ──► firebase.set() ──► hunting/party/{ROOM}/members/{NICK} │
│                                                                          │
│  ── Real-time listener (always on) ──                                     │
│  onValue(hunting/party/{ROOM}/members) ──► partyMembers state ──► UI    │
└──────────────────────────────────────────────────────────────────────────┘
```

### Key insight: Circular sync

```
User Action → firebase.set() → onValue fires → rehydrate → UI update
                                ↑
                    (same listener that was set up at init)
```

ทุก write จะ trigger onValue เดิม → local state อัปเดตซ้ำ → ป้องกัน conflict

---

## 5. Init Sequence

```
index.tsx
  └── <SettingsProvider>
        │  localStorage → nickname, partyRoom, server, settings
        │  ตรวจสอบ nickname TTL (1 วัน)
        │  URL: ?room=ROOMNAME / ?party=ROOMNAME
        └── <TimerProvider>
              │  setInterval 1s → `now`
              │  onValue(hunting/party/{ROOM}/members) → partyMembers
              └── <App>
                    │  NicknamePrompt / SoundChoiceModal / Main
                    └── <MvpProvider>
                          │  getServerData(server) → originalAllMvps (static)
                          │  onValue(solo|party/{path}/mvps) → rehydrate → activeMvps
                          │  heartbeat interval 30s → Firebase members
                          └── Main (Active / Wait / All sections)
```

---

## 6. Firebase Path Resolution

| Mode | Firebase Path |
|------|---------------|
| Solo (nickname set, no party) | `hunting/solo/{NICKNAME}/{SERVER}/mvps` |
| Party (room set) | `hunting/party/{ROOM}/{SERVER}/mvps` |
| Anonymous (no nickname) | **No Firebase** — local state only |

---

## 7. MVP Data Merging (rehydrateMvps logic)

```
remoteMVP[] from Firebase           staticMVP[] from JSON
        │                                   │
        ▼                                   ▼
for each remote MVP:
  ─ find matching staticMVP by id
  ─ ถ้าไม่พบ → skip (data อาจล้าสมัย)
  ─ ถ้าพบ:
      fullMVP = { ...staticMVP, ...remote }
      filter spawn[] → เฉพาะ spawn ที่ deathMap ตรงกัน
      (ถ้า deathMap=null → ใช้ spawn แรก)
```

---

## 8. Pain Points for Rust/Desktop Port

| ปัญหา | สาเหตุ | ผลกระทบ |
|--------|--------|----------|
| Circular sync | `set()` → `onValue()` → state update | อาจเกิด loop หรือ duplicate |
| Minimal schema | Firebase ไม่มี name/spawn/stats | Rust app ต้อง implement rehydrate เอง |
| Party heartbeat | 30s interval + members listener | ต้องมี timer + network |
| Nickname TTL | localStorage `NICKTIME` | ต้อง implement ใน Rust |
| Merge logic | remote + static merge ซับซ้อน | logic ต้องตรงกันทุก platform |
| Window/respawn calc | `deathTime + respawnTime + window` | ต้องตรงกันทุก client |
| Map coordinate | 512-space → CSS pixel conversion | ต้องมี conversion formula |

---

## 9. Race Conditions (Firebase multi-client sync)

ปัญหาทั้งหมดมีรากเดียว: **ใช้ `set(array)` โดยไม่อ่านจาก Firebase จริงก่อนเขียน**

### 9.1 Critical — `modifyMvps` อ่านจาก React state ที่อาจ stale

**File:** `MvpsContext.tsx:282-287`

```typescript
const modifyMvps = useCallback(
  (modifier: (currentMvps: IMvp[]) => IMvp[]) => {
    const newMvps = modifier(activeMvps);          // ◄— อ่านจาก React closure
    saveMvpsToTarget(newMvps);                     // ◄— เขียนทับ Firebase
  },
  [activeMvps, saveMvpsToTarget]
);
```

**ผล:** Client B อ่าน `activeMvps` ที่ยังไม่เห็นการเปลี่ยนแปลงของ Client A → เขียนทับ data ของ Client A เงียบ

### 9.2 Critical — ใช้ `set()` แทน `update()`

**File:** `MvpsContext.tsx:263-276`

```typescript
set(serverRef, minimalMvps);  // ◄— ส่ง array ทั้งก้อนไปทับของเก่า
```

**ผล:** ทุกครั้งที่เขียน = overwrite ข้อมูลทั้งหมดที่ path นั้น Concurrent writes ชนกันตัวสุดท้ายเท่านั้นที่อยู่รอด

### 9.3 High — เก็บเป็น array ไม่ใช่ keyed object

**File:** `MvpsContext.tsx:224-226, 248-259`

```typescript
// Firebase เก็บเป็น:
[ { id: 1, ... }, { id: 2, ... } ]
// ควรเป็น:
{ "1-in_world": { id: 1, ... }, "3-gef_fild03": { id: 3, ... } }
```

**ผล:** แก้ไขทีละ MVP ไม่ได้ ต้องเขียนทั้ง array → concurrent edits ชนกันตลอด

### 9.4 High — ไม่มี merge/deconflict เมื่อสอง client ฆ่าตัวเดียวกัน

**File:** `MvpsContext.tsx:290-308`

**Scenario:** Client A ฆ่า Baphomet 10:00:00, Client B ฆ่า Baphomet 10:00:01 (ยังไม่เห็นของ A)
→ **B ทับ A เงียบ** death time กลายเป็น 10:00:01, respawn timer เพี้ยน

### สรุป

| # | ปัญหา | Severity | ผล |
|---|--------|----------|-----|
| 1 | `modifyMvps` อ่านจาก React closure ที่ stale | **CRITICAL** | เขียนทับ data client อื่นเงียบ |
| 2 | ใช้ `set()` ทั้งก้อนแทน `update()` | **CRITICAL** | ทุกครั้งที่เขียน = overwrite หมด |
| 3 | เก็บเป็น array ไม่ใช่ keyed object | **HIGH** | แก้ทีละตัวไม่ได้ |
| 4 | ไม่มี merge/deconflict | **HIGH** | 2 client ฆ่าตัวเดียวกัน → ตัวหลังทับตัวแรก |

**ทางแก้หลัก:** เปลี่ยนจาก `set(array)` → `update(keyed-object)` + อ่านจาก Firebase จริงตอนจะเขียน (ไม่ใช้ React state) — จบทั้ง 4 ข้อ
