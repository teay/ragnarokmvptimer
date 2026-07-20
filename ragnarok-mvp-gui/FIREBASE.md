# Firebase Integration — Rust GUI App

## Overview

Rust GUI app ใช้ Firebase Realtime Database (RTDB) path เดียวกับ webapp เพื่อแชร์ข้อมูล MVP timer แบบ real-time

## Firebase Credentials

เก็บใน `.env` ของ webapp (ใช้ร่วมกับ Rust app ได้):

| Field | Value |
|---|---|
| Project ID | `ragnarokmvptimer-ace0a` |
| Database URL | `https://ragnarokmvptimer-ace0a-default-rtdb.asia-southeast1.firebasedatabase.app` |
| API Key | `AIzaSyB5dlmAu0_yThhHr8_qNHDlfe1o40rQ69U` |

> API Key ถูก hardcode ใน `app.rs` (`init_firebase()`) — security model ของ Firebase คือ公開 key ได้ (client-side key)

## Database Path

```
hunting/solo/{nickname}/{server}/mvps        # Solo mode
hunting/party/{partyRoom}/{server}/mvps      # Party mode
```

## Data Format (JSON Array)

```json
[
  {
    "id": 1147,
    "deathTime": "2025-07-20T12:00:00.000Z",
    "deathMap": "prt_fild01",
    "deathPosition": { "x": 120.5, "y": 240.3 },
    "isPinned": false,
    "updatedBy": "PlayerName"
  }
]
```

เฉพาะ `id`, `deathTime`, `deathMap`, `deathPosition`, `isPinned`, `updatedBy` — `name`, `spawn`, `stats` ไม่อยู่ใน Firebase (merge จาก local JSON `data/{server}.json` ตอนอ่าน)

## สิ่งที่สร้าง/แก้ไข

### ไฟล์ใหม่

| File | หน้าที่ |
|---|---|
| `firebase/client.rs` | Firebase REST API client + struct `FirebaseMvp` + conversion functions |
| `firebase/sync.rs` | `FirebaseSync` struct — path management, pull/push, merge logic |

### ไฟล์ที่แก้ไข

| File | แก้ไขอะไร |
|---|---|
| `firebase/client.rs` | จาก stub → full implementation (sign-in anonymously, read/write RTDB) |
| `firebase/sync.rs` | จาก stub → full implementation with merge function |
| `app.rs` | เพิ่ม `fb_sync`, `tokio_runtime` fields + `init_firebase()`, `push_to_firebase()` + เรียกทุกครั้งที่ nickname/server/party เปลี่ยน |

### การทำงาน

```
App เริ่ม → settings.nickname เซ็ต → init_firebase()
  ├── สร้าง FirebaseSync instance
  ├── sign-in anonymously (Firebase Auth REST API)
  ├── block_on(fb.pull()) — ดึงข้อมูลจาก Firebase path
  └── merge กับ all_server_mvps → set เป็น active_mvps

User ทำ action (kill/edit/remove/pin/back)
  └── persist() บันทึก local + push_to_firebase()
       └── tokio::spawn(async { sign-in → write to Firebase })

เปลี่ยน server / party room / nickname
  └── init_firebase() — re-init ดึงข้อมูลใหม่

Logout
  └── fb_sync = None
```

### Key Conversion

| Rust (struct Mvp) | Firebase (JSON) | ตรงกัน? |
|---|---|---|
| `id: u32` | `id: number` | ✅ |
| `death_time: Option<i64>` (epoch ms) | `deathTime: string \| null` (ISO 8601) | ✅ แปลงด้วย `chrono` |
| `death_map: Option<String>` | `deathMap: string \| null` | ✅ |
| `death_position: Option<MapMark>` | `deathPosition: {x,y} \| null` | ✅ |
| `is_pinned: bool` | `isPinned: boolean` | ✅ |
| — | `updatedBy: string` | ✅ เวลาเขียน |
| `name`, `spawn`, `stats` | — | ✅ ได้จาก local JSON |

### ข้อจำกัด (TODO)

- [ ] No periodic polling — ต้อง restart app ถึงเห็นการเปลี่ยนแปลงจาก webapp
- [ ] Push แต่ละครั้ง sign-in ใหม่ทุกครั้ง (ใช้ cached idToken ได้)
- [ ] ไม่มี error handling UI (push/pull ล้มเหลวแค่ log)
- [ ] `block_on` ใน `init_firebase()` อาจกระตุก UI ชั่วครู่
