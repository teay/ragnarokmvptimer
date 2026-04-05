# 🧪 Ragnarok MVP Timer - Test Execution Report

**Project Status:** ✅ 31 Tests Passed
**Last Updated:** 2026-04-05
**Framework:** Vitest v4.1.2
**Environment:** WSL 2 (Ubuntu) on Windows 11

---

## 📊 Test Summary Dashboard
| Category | Test Files | Passed | Status |
| :--- | :--- | :--- | :--- |
| **Contexts** | 2 | 6 | 🟢 Pass |
| **Components** | 2 | 6 | 🟢 Pass |
| **Utilities** | 2 | 19 | 🟢 Pass |
| **Total** | **6** | **31** | **Success** |

---

## 🔍 Detailed Test Coverage

### 1. State & Logic (Contexts)
* **`SettingsContext.test.tsx`**: ทดสอบระบบการตั้งค่าผู้ใช้
    * ตรวจสอบการบันทึก `partyRoom` ลงใน `sessionStorage` และ `localStorage` เพื่อให้จำค่าได้หลัง Refresh
    * ทดสอบโหมด **UltraLite** (Low Performance Mode) ว่าสามารถปิด Background Animation ได้ถูกต้องเพื่อประหยัดทรัพยากรเครื่อง
* **`MvpsContext.test.tsx`**: ทดสอบหัวใจหลักของระบบจัดการข้อมูล MVP
    * **Data Rehydration**: ทดสอบการ Merge ข้อมูลระหว่างค่าคงที่ (Static) และข้อมูลจาก Firebase (Dynamic)
    * **Firebase Integration**: ตรวจสอบฟังก์ชัน `killMvp` ว่ามีการเรียกใช้คำสั่ง `set` ของ Firebase SDK ได้แม่นยำ

### 2. User Interface (Components)
* **`MvpCard.test.tsx`**: ทดสอบการแสดงผลการ์ด MVP
    * ตรวจสอบการ Render ข้อมูลชื่อและแผนที่
    * ทดสอบปุ่ม **Remove MVP** เพื่อย้ายสถานะกลับไปยังรายการรอคอย
* **`DateTimePicker.test.tsx`**: ทดสอบระบบเลือกเวลา
    * ตรวจสอบความแม่นยำในการเลือกเวลาตาย (Death Time) เพื่อนำไปคำนวณเวลาเกิดใหม่

### 3. Core Logic (Utilities)
* **`utils/index.test.ts`**: ทดสอบฟังก์ชันพื้นฐาน 14 เคส
    * ตรวจสอบการคำนวณ `Respawn Window` (ช่วงเวลาสุ่มสปอน)
    * ตรวจสอบการจัดรูปแบบข้อความเวลา (Time Formatting)
* **`utils/sort.test.ts`**: ทดสอบระบบการเรียงลำดับ (Sorting)
    * **Priority Logic**: เรียงตามเวลาที่จะเกิดก่อน (มากไปน้อย)
    * **Fallback Logic**: กรณีเวลาเกิดเท่ากัน ให้เรียงตาม Alphabetical หรือ ID เพื่อไม่ให้ UI กระโดดไปมา

---

## ⚙️ Technical Environment
* **Mocking Strategy**: ใช้ `vi.mock` จำลอง Firebase API และ Web Storage เพื่อให้เทสรันได้เร็วโดยไม่ต้องต่ออินเทอร์เน็ต
* **Timer Logic**: ใช้ `vi.useFakeTimers` ในบางเคสเพื่อทดสอบการนับถอยหลังของเวลาเกิด MVP
* **Type Safety**: รองรับ TypeScript เต็มรูปแบบตามโครงสร้างโปรเจกต์ที่ทำมา 4 ปี

---

## 🚀 How to Run Tests
หากมีการแก้ไขโค้ดในอนาคต ให้รันคำสั่งนี้เพื่อตรวจสอบความปลอดภัย:
```bash
npx vitest run
