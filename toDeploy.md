# Deployment Checklist 🚀

ก่อนทำการ Deploy ไปยัง Hosting ให้ตรวจสอบ Checklist นี้เพื่อให้มั่นใจว่าระบบ Web และ CLI ทำงานร่วมกันได้สมบูรณ์:

## 1. Environment Verification
- [ ] **Secret Check:** ตรวจสอบว่า `VITE_FIREBASE_...` ทุกตัวใน GitHub Secrets (หรือระบบ Deploy ของคุณ) เป็นค่าปัจจุบันและถูกต้อง
- [ ] **.env Safety:** ตรวจสอบให้แน่ใจว่าไฟล์ `.env` ที่มีข้อมูลจริง **ไม่ได้** ถูก Push ขึ้น Git

## 2. Cross-Platform Consistency
- [ ] **Sync Test:** กด "I killed now" ในหน้าเว็บ -> ตรวจสอบว่า CLI อัปเดตทันที
- [ ] **Reverse Sync:** กด "ฆ่า/ลบ" ใน CLI -> ตรวจสอบว่าหน้าเว็บอัปเดตทันที
- [ ] **Server Check:** ตรวจสอบว่าในหน้าเว็บและ CLI เลือกเซิร์ฟเวอร์เดียวกัน (เช่น `thROG`) และเห็นข้อมูลตรงกัน
- [ ] **Sorting Test:** ยืนยันว่าหน้าเว็บเรียงลำดับบอส (Active/Pinned) ตามเวลาที่ใกล้เกิดที่สุด

## 3. Data Integrity
- [ ] **No Duplicates:** ยืนยันว่าไม่มีชื่อบอสซ้ำซ้อนในรายการ
- [ ] **Coordinate Cleanliness:** ยืนยันว่าไม่มีจุดมาร์คหลอก (-1, -1) ขึ้นบนแผนที่หน้าเว็บ
- [ ] **Local Clean:** ไฟล์ `cli/data/mvp-save.json` ถูกลบออกแล้ว

## 4. Final Verification
- [ ] **Build Check:** รัน `npm run build` ผ่านโดยไม่มี Error
- [ ] **Commit Status:** โค้ดล่าสุด Commit และ Push แล้ว
