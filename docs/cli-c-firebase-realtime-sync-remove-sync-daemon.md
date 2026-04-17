# แผน: CLI-C Direct Firebase Integration

## วัตถุประสงค์
ปรับปรุงแอปพลิเคชัน `cli-c` ให้เชื่อมต่อกับ Firebase Realtime Database ได้โดยตรง โดยตัด `sync-daemon.js` และการพึ่งพาไฟล์ JSON ในเครื่องออกไป เพื่อลด Latency และทำให้สถาปัตยกรรมเรียบง่ายขึ้น

## ข้อกำหนดและข้อควรพิจารณา
- **การเชื่อมต่อ Firebase โดยตรง:** `cli-c` ต้องเชื่อมต่อกับ Firebase REST API โดยตรง
- **การยืนยันตัวตน (Authentication):** ต้อง Implement การยืนยันตัวตนที่ปลอดภัยสำหรับแอป CLI
- **การจัดการข้อมูล:**
    - ฟังก์ชันสำหรับดึงข้อมูล MVP จาก Firebase (Read)
    - ฟังก์ชันสำหรับส่งการเปลี่ยนแปลงกลับไป Firebase (Write)
- **Real-time Updates:** รองรับการรับข้อมูลอัปเดตจาก Firebase แบบ Real-time (ใช้ SSE ผ่าน `libcurl`)
- **การจัดการข้อผิดพลาด:** การจัดการ Network, Auth, Firebase API Errors
- **Dependencies:** ต้องใช้ `libcurl` (สำหรับ HTTP/HTTPS) และ `cJSON` (สำหรับ JSON)
- **การลบ `sync-daemon.js`:** สคริปต์ Node.js นี้จะถูกยกเลิก
- **เลิกใช้ Local JSON Sync:** `cli-c` จะไม่พึ่งพา `mvp-save.json` สำหรับการซิงค์ข้อมูลหลัก

## ขั้นตอนการดำเนินการ (Proposed Steps)
1. **วิจัยและตั้งค่า:**
    * ศึกษา Firebase REST API สำหรับ C
    * ตั้งค่า `libcurl` สำหรับ HTTPS และการจัดการ Authentication
2. **Implement Authentication:** สร้างกลไกการยืนยันตัวตนที่ปลอดภัย
3. **Data Access (Read/Write):**
    * พัฒนาฟังก์ชันอ่านข้อมูล MVP จาก Firebase
    * พัฒนาฟังก์ชันส่งข้อมูลอัปเดตกลับ Firebase
4. **Real-time Listener:** สร้างระบบรับ Real-time Updates จาก Firebase (SSE)
5. **Integration:** ปรับโค้ด `main.c`, `mvp.c` ให้ใช้ Firebase API แทน File I/O
6. **Cleanup:** ลบ `sync-daemon.js` และส่วนที่เกี่ยวข้อง
7. **Testing:** Unit tests และ Integration tests

## การตรวจสอบ (Verification)
- **Unit Tests:** สำหรับ Firebase API interaction, JSON parsing, time calculations.
- **Integration Tests:** ทดสอบ Sync ระหว่าง `cli-c` <-> Firebase, และ Web App <-> Firebase