# แผนผังเส้นทางการไหลของข้อมูล (Data Flow Map)
## Ragnarok MVP Timer Application

เอกสารนี้แสดงให้เห็นว่าข้อมูลถูกรับเข้า (Input), จัดเก็บ (Storage), และประมวลผล (Processing) อย่างไรภายในระบบ

---

## 1. แหล่งกำเนิดข้อมูล (Data Sources)

ข้อมูลเริ่มต้นในแอปพลิเคชันมาจาก 3 แหล่งหลัก:
1. **Static Data (JSON):** ข้อมูล MVP พื้นฐานจากไฟล์ใน `src/data/` (เช่นรายชื่อบอส, พิกัด, เวลาเกิดมาตรฐาน)
2. **Firebase Cloud:** ข้อมูลที่ Sync อยู่บน Server (เช่น ข้อมูลที่ผู้ใช้อื่นอัปเดต หรือข้อมูลที่เคยบันทึกไว้ข้ามเครื่อง)
3. **User Input:** การโต้ตอบผ่านหน้า UI (เช่น การกด Reset Timer, การแก้ไขชื่อ, หรือการเปลี่ยน Server)

---

## 2. เส้นทางการไหลของข้อมูล (Data Journey)

### 🟢 1. เมื่อเริ่มเปิดแอปพลิเคชัน (Initialization)
1. **Fetch:** แอปฯ จะดึงข้อมูลจาก 2 ทางพร้อมกัน:
   - **Local:** อ่านจาก `localStorage` ผ่าน `controllers/mvp.ts` หรือ `usePersistedState.ts` เพื่อดึงค่าที่ "เคยทำค้างไว้" ในเบราว์เซอร์นี้
   - **Cloud:** เชื่อมต่อกับ Firebase Realtime Database ผ่าน `services/firebase.ts` โดยใช้ฟังก์ชัน `onValue` หรือ `get`
2. **Merge & Store in Memory:** ข้อมูลจากทั้งสองแหล่งจะถูกนำมารวมกัน (Merge) และจัดเก็บไว้ใน **React Context** (`MvpsContext`, `TimerContext`) ซึ่งเปรียบเสมือนหน่วยความจำหลัก (Heap) ที่ UI ใช้แสดงผล

### 🔵 2. เมื่อมีการอัปเดตข้อมูล (Data Update)
เมื่อผู้ใช้กด "บันทึกเวลาบอสตาย" หรือ "แก้ไขสถานะ":
1. **In-Memory Update:** State ใน React จะเปลี่ยนทันทีเพื่อให้ UI ตอบสนองรวดเร็ว
2. **Local Persistence:** `usePersistedState` จะทำการ `setItem` ลงใน `localStorage` อัตโนมัติ เพื่อให้ถ้าปิดเบราว์เซอร์ไป ข้อมูลบนเครื่องนี้ยังอยู่
3. **Cloud Sync:** ฟังก์ชัน `set` หรือ `update` จาก Firebase จะถูกเรียกเพื่อส่งข้อมูลขึ้นไปที่ `asia-southeast1.firebasedatabase.app`

### 🔴 3. เมื่อข้อมูลบน Cloud เปลี่ยนแปลง (Real-time Sync)
- หากมีผู้ใช้อื่นอัปเดตเวลาบอสใน Server เดียวกัน
- Firebase SDK จะส่งสัญญาณผ่าน `onValue` มายังแอปฯ ของเรา
- แอปฯ จะอัปเดต State ในหน่วยความจำทันที ทำให้ตัวเลขบนหน้าจอเปลี่ยนโดยไม่ต้อง Refresh หน้าเว็บ

---

## 3. สรุปประเภทการจัดเก็บข้อมูล (Storage Comparison)

| ประเภทการเก็บ | เทคโนโลยีที่ใช้ | อายุของข้อมูล | วัตถุประสงค์หลัก |
| :--- | :--- | :--- | :--- |
| **In-Memory** | React State / Context | ชั่วคราว (หายเมื่อปิดแท็บ) | ใช้แสดงผล UI และประมวลผล Logic เร็วๆ |
| **Client-side** | **LocalStorage** | ถาวรบนเบราว์เซอร์นี้ | จำสถานะส่วนตัวของผู้ใช้บนเครื่องนั้นๆ |
| **Cloud-based** | **Firebase RTDB** | ถาวรบนเซิร์ฟเวอร์ | ใช้ Sync ข้อมูลข้ามอุปกรณ์ และแชร์ข้อมูลระหว่างผู้ใช้ |

---

## 4. แผนภาพสรุป (Data Flow Diagram)

---

## 5. คำศัพท์ที่เกี่ยวข้อง (Terminology)

- **Data Flow:** เส้นทางการไหลของข้อมูล
- **Data Persistence:** การทำให้ข้อมูลคงอยู่ถาวร
- **Real-time Synchronization:** การประสานข้อมูลให้ตรงกันแบบทันที
- **Merge Logic:** ตรรกะการรวมข้อมูลจากหลายแหล่งเข้าด้วยกัน
- **Environment Variables:** ค่ากำหนด (เช่น API Key) ที่ดึงมาจากไฟล์ `.env`