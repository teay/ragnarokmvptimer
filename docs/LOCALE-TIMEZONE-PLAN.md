# Plan: แก้ไข Locale & Timezone Issues

## ปัญหาที่พบ (7 จุด)

### 1. `pt-BR` vs `pt-br` — dayjs case-sensitive mismatch (CRITICAL)
- **ไฟล์**: `src/locales/index.ts`, `src/App.tsx:165`
- **ปัญหา**: `dayjs.locale('pt-BR')` ไม่ตรงกับ dayjs file `pt-br.js` → fallback เป็น English เงียบๆ
- **แก้**: เพิ่ม locale mapping ใน App.tsx:
  ```ts
  const DAYJS_LOCALE_MAP: Record<string, string> = {
    'en': 'en',
    'pt-BR': 'pt-br',
    'th': 'th',
  };
  dayjs.locale(DAYJS_LOCALE_MAP[language] || 'en');
  ```

### 2. เพิ่มภาษาไทยใน app
- **ไฟล์**: `src/locales/index.ts`, `src/locales/messages.ts`
- **แก้**:
  - เพิ่ม `THAI: 'th'` ใน `LOCALES`
  - เพิ่ม `{ name: 'ไทย', id: 'th' }` ใน `LANGUAGES`
  - เพิ่ม block `th` ใน `messages.ts` (copy จาก `en` แล้วแปล)

### 3. MvpCard — ไม่ respect `use24HourFormat`
- **ไฟล์**: `src/components/MvpCard/index.tsx:95`
- **ปัญหา**: `dayjs(mvp.deathTime).format('DD/MM HH:mm')` hardcode 24h
- **แก้**: รับ `use24HourFormat` จาก Settings, เปลี่ยน format

### 4. MvpCardCountdown — ไม่ respect `use24HourFormat`
- **ไฟล์**: `src/components/MvpCardCountdown/index.tsx:53`
- **ปัญหา**: `nextRespawnMin.format('HH:mm')` hardcode 24h
- **แก้**: เหมือนข้อ 3

### 5. SegmentedDateTimePicker — ไม่ respect `use24HourFormat`
- **ไฟล์**: `src/components/DateTimePicker/index.tsx:21-22`
- **ปัญหา**: format `'HH'` เสมอ ไม่แสดง 12h mode
- **แก้**: เพิ่ม prop `use24HourFormat`, เปลี่ยน `'HH'` → `'hh'` + แสดง AM/PM

### 6. Global locale conflict — index.tsx ตั้ง 'th' แล้ว App.tsx override
- **ไฟล์**: `src/index.tsx:12`
- **ปัญหา**: `dayjs.locale('th')` ถูก override ทันทีใน App.tsx → ไม่มีผล
- **แก้**: ลบ `dayjs.locale('th')` ออกจาก index.tsx

### 7. `formatTime` utility — ไม่ respect `use24HourFormat`
- **ไฟล์**: `src/utils/index.ts:54-65`
- **ปัญหา**: ส่งคืน `HH:mm:ss` เสมอ
- **แก้**: เพิ่ม parameter `use24HourFormat`

---

## ไฟล์ที่ต้องแก้ (8 ไฟล์)

| # | ไฟล์ | แก้ไข |
|---|------|--------|
| 1 | `src/locales/index.ts` | เพิ่ม `THAI: 'th'` + `LANGUAGES` |
| 2 | `src/locales/messages.ts` | เพิ่ม block `th` (แปลภาษาไทย) |
| 3 | `src/App.tsx` | เพิ่ม DAYJS_LOCALE_MAP, แก้ `dayjs.locale()` |
| 4 | `src/index.tsx` | ลบ `dayjs.locale('th')` line 12 |
| 5 | `src/components/MvpCard/index.tsx` | respect `use24HourFormat` |
| 6 | `src/components/MvpCardCountdown/index.tsx` | respect `use24HourFormat` |
| 7 | `src/components/DateTimePicker/index.tsx` | respect `use24HourFormat` |
| 8 | `src/utils/index.ts` | เพิ่ม param `use24HourFormat` ใน `formatTime` |

---

## ไม่ต้องแก้ (ปลอดภัยแล้ว)

| จุด | ทำไมปลอดภัย |
|-----|------------|
| Timezone roundtrip (`new Date` → ISO → `new Date`) | แต่ละ PC เห็นเวลาท้องถิ่นตัวเอง → ถูกต้อง |
| HeaderTimer forced Thai + พ.ศ. | User ยืนยันให้คงเดิม |
| `now.diff(lastSeen)` online check | ISO format ไม่พึ่ง locale |
| `formatTime(ms)` countdown | คำนวณจาก ms ล้วน ไม่เกี่ยว locale |
| Firebase storage | เก็บ ISO string UTC ถูกต้อง |

---

## คำตอบจาก user
- **Party timezone**: แสดงตามเวลาตัวเอง (convert เป็น local time ของผู้ชม)
- **HeaderTimer**: คงเดิม บังคับ Thai + พ.ศ.
- **ภาษาไทย**: เพิ่ม locale `'th'` ใน app

---

## สรุปสิ่งที่แก้ไขแล้ว (ทำจริง)

### ไฟล์ที่แก้ไข (8 ไฟล์)

| # | ไฟล์ | แก้ไข |
|---|------|--------|
| 1 | `src/App.tsx` | เพิ่ม `DAYJS_LOCALE_MAP` แก้ `pt-BR` → `pt-br` + เพิ่ม import `dayjs/locale/th` |
| 2 | `src/index.tsx` | ลบ `dayjs.locale('th')` ที่ซ้ำซ้อน (ให้ App.tsx จัดการอย่างเดียว) |
| 3 | `src/locales/index.ts` | เพิ่ม `THAI: 'th'` + `{ name: 'ไทย', id: 'th' }` ใน LANGUAGES |
| 4 | `src/locales/messages.ts` | เพิ่ม block `th` ภาษาไทยทั้งหมด 67 ข้อความ |
| 5 | `src/utils/index.ts` | เพิ่ม function `formatTimeOfDay()` แปลง HH:mm → 12h AM/PM |
| 6 | `src/components/MvpCard/index.tsx` | ใช้ `formatTimeOfDay()` แสดง kill time + notification ตาม `use24HourFormat` |
| 7 | `src/components/MvpCardCountdown/index.tsx` | ใช้ `formatTimeOfDay()` แสดง respawn range ตาม `use24HourFormat` |
| 8 | `src/__tests__/MvpCard.test.tsx` | เพิ่ม mock `formatTimeOfDay` |

### ผลลัพธ์
- **Build**: สำเร็จ (vite build)
- **Tests**: 31/31 ผ่านทั้งหมด

### ไม่ได้แก้ (คงเดิม)
- **DateTimePicker**: คง 24h format เพราะเป็น editing tool, การแสดงผล time ใช้ MvpCard/MvpCardCountdown ที่ respect `use24HourFormat` แล้ว
