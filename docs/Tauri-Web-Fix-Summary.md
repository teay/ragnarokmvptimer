# สรุปการแก้ไขปัญหา Tauri Black Screen และ Asset Loading (Falling Leaves)

เอกสารนี้สรุปสาเหตุและแนวทางการแก้ไขปัญหาที่พบระหว่างการพัฒนาแอปพลิเคชันให้รันได้ทั้งบน Web (GitHub Pages) และ Desktop (Tauri) โดยรักษาความสวยงามและฟีเจอร์ให้ครบถ้วน

---

## 1. ปัญหาจอดำ (Black Screen) ใน Tauri App
### สาเหตุ (Root Causes):
1.  **Absolute Paths (`/`)**: ใน `vite.config.ts` และ `index.html` เดิมมีการใช้เครื่องหมาย `/` นำหน้า Path (เช่น `/src/index.tsx` หรือ `/assets/...`) ซึ่งในระบบเว็บปกติมันหมายถึง Root ของโดเมน แต่ใน Tauri ซึ่งรันแบบ Local File System ระบบจะหา Root ไม่เจอหรือติดปัญหาความปลอดภัย (CORS) ทำให้โหลดสคริปต์หลักไม่ได้
2.  **Base Path Mismatch**: การตั้งค่า `base: '/ragnarokmvptimer/'` สำหรับ GitHub Pages ทำให้ไฟล์ใน Tauri พยายามวิ่งไปหาโฟลเดอร์ชื่อนั้น ซึ่งไม่มีอยู่ในเครื่องคอมพิวเตอร์
3.  **UI Hiding Logic**: ใน `index.html` มีการใช้ `display: none` บน `#root` และรอให้ JavaScript สั่งเปิด (Show) เมื่อโหลดเสร็จ หาก JavaScript ตัวแรกโหลดไม่ขึ้น (จากสาเหตุข้อ 1) หน้าจอก็จะค้างอยู่ที่สีดำตลอดกาล

### สิ่งที่แก้ไขแล้วได้ผล:
*   **ใช้ Relative Base (`./`)**: ปรับ `vite.config.ts` ให้ใช้ `base: './'` ในโหมด Production ทำให้ไฟล์ต่างๆ เรียกหากันผ่านตำแหน่งปัจจุบัน (Relative) ไม่ว่าจะรันที่ไหนก็ตาม
*   **ลบ Leading Slash (`/`)**: ใน `index.html` ปรับ Path ทั้งหมดให้ไม่มี `/` นำหน้า (เช่น `src="src/index.tsx"`) เพื่อให้ Vite จัดการดึงไฟล์ตามตำแหน่งจริง
*   **ปรับปรุง `index.html` ให้ Robust**: ยกเลิกการซ่อน `#root` และเพิ่มระบบ Loading Spinner ที่มี Safety Timeout (5 วินาที) เพื่อป้องกันการค้างกรณีเกิด Error เงียบ

---

## 2. ปัญหาใบไม้ไม่ร่วง (Assets Not Loading)
### สาเหตุ (Root Causes):
1.  **Hardcoded Repository Path**: ในโค้ด React เดิมมีการเติม `/ragnarokmvptimer/` เข้าไปใน Path รูปภาพใบไม้โดยตรง เพื่อให้รองรับ GitHub Pages แต่ใน Tauri Path นี้ไม่มีอยู่จริง ทำให้รูปภาพขึ้น 404
2.  **Environment Detection Fail**: การเช็ก `window.location.hostname` เพื่อแยกแยะว่าเป็น Web หรือ Local ไม่ครอบคลุมถึง Tauri (ซึ่งใช้ `tauri.localhost` หรือ Protocol พิเศษ) ทำให้โปรแกรมเลือก Path ผิด

### สิ่งที่แก้ไขแล้วได้ผล:
*   **ใช้ Pure Relative Paths**: ปรับใน `LuminousParticlesBackground/index.tsx` ให้ใช้ Path ตรงๆ อย่าง `assets/leaves/leaf1.png` (ไม่มี `/` นำหน้า)
*   **Vite Magic**: เนื่องจากเราตั้ง `base: './'` ใน Vite แล้ว ตัว Vite จะฉลาดพอที่จะจัดการ Map รูปภาพเหล่านี้ให้ถูกต้องทั้งบน Web และ Desktop โดยที่เราไม่ต้องเขียน Logic เช็ก Environment ให้ซับซ้อนอีกต่อไป

---

## 3. สรุปแนวทางปฏิบัติที่ดีที่สุด (Best Practices)
เพื่อให้แอปพลิเคชันรองรับ Multi-platform (Web + Desktop) ได้อย่างราบรื่น:
1.  **Vite Config**: ใช้ `base: mode === 'production' ? './' : '/'`
2.  **HTML**: หลีกเลี่ยงการใช้ `/` นำหน้า Path ของไฟล์ Assets/Scripts
3.  **React Code**: ใช้ Path แบบ Relative เสมอสำหรับรูปภาพที่อยู่ใน `public`
4.  **Error Handling**: อย่าซ่อน UI หลักด้วย CSS จนกว่าจะมั่นใจว่า JavaScript ตัวสำคัญโหลดขึ้นมาทำงานแล้วจริงๆ

---
**บันทึกโดย:** Gemini CLI (Senior Developer Assistant)
**วันที่:** 11 มีนาคม 2026
