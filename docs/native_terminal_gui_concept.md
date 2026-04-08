# Concept: Native "Terminal-Styled" GUI Tracker

แนวทางการสร้าง MVP Tracker ที่เน้นประสิทธิภาพสูงสุดของเครื่อง (Native Performance) และการใช้งานที่ง่ายที่สุดสำหรับ User (Zero-Config) โดยใช้ดีไซน์หน้าตาเหมือน Terminal แต่ทำงานเป็น Native GUI Application

## 1. ทำไมต้องเป็น "GUI หน้าตา Terminal"?
*   **User Experience (UX):** ผู้ใช้ทั่วไปไม่คุ้นเคยกับการเปิด Command Prompt แต่พวกเขารู้จักการ "ดับเบิลคลิกไฟล์ .exe"
*   **Security & Accessibility:** การเป็นไฟล์ .exe ที่เป็น Native GUI ไม่กระตุ้นการเตือนของ Antivirus เหมือนกับการรันผ่าน CLI และเข้าถึงไฟล์ Screenshot ของเกมได้โดยตรงโดยไม่ต้องขอ Permission ซับซ้อน
*   **Performance:** การใช้ Native UI (Rust + Slint/Iced) จะทำให้แอปทำงานได้เร็วเหมือนแอป C แต่มีความปลอดภัยและพัฒนาได้เร็วกว่า

## 2. ทางเลือกทางเทคนิค (The Tech Stack)
เพื่อให้แอปมีขนาดเล็กและเป็น Native Binary ตัวเดียว:
*   **Language:** Rust (มีความเร็วระดับ C และปลอดภัยสูง)
*   **GUI Library:** 
    *   **Iced:** เน้นความเรียบง่ายและเป็น Native อย่างแท้จริง
    *   **Slint:** ออกแบบมาเพื่อ Embedded/Low-resource devices, กินทรัพยากรน้อยมาก
*   **Deployment:** ปรับแต่งให้คอมไพล์เป็น Static Binary ตัวเดียว (.exe) ไม่ต้องมี dependency อื่นๆ แยก

## 3. หัวใจสำคัญของประสบการณ์ผู้ใช้
*   **Zero-Install:** ไม่ต้องติดตั้ง Node.js หรือสภาพแวดล้อมอื่น ผู้ใช้แค่โหลด .exe ไปวางแล้วรัน
*   **Invisible Background:** ทำงานเงียบๆ ใน Tray Icon หรือหน้าจอ TUI-Style ที่ดูเท่และไม่กวนหน้าจอเกม
*   **Autoplay/Auto-detect:** ตรวจสอบตำแหน่งโฟลเดอร์ Screenshots ของเกมอัตโนมัติเมื่อเปิดแอปครั้งแรก

## 4. แผนการพัฒนาแบบเป็นขั้นเป็นตอน
1.  **Native Scaffold:** สร้างโปรเจกต์ Rust ด้วย `Iced` หรือ `Slint` เพื่อทำหน้าต่างโปรแกรมที่ไม่มีกรอบขอบ (Frameless) หรือออกแบบสไตล์ Retro
2.  **Logic Integration:** นำฟีเจอร์ File Watcher (จาก `notify`) และ OCR (จาก `tesseract-rs`) มาใส่ใน Native App นี้
3.  **Visual Design:** ปรับแต่ง CSS/Layout ของ UI ให้เหมือนกับหน้าจอ Terminal สีเขียว/ขาว บนพื้นหลังดำ (Monospace font)
4.  **Static Compilation:** กำหนดค่าการ build ให้ได้ไฟล์ .exe ตัวเดียวที่พร้อมแจกจ่าย

---
*บทสรุป: นี่คือการผสมผสาน "ประสิทธิภาพระดับ C" เข้ากับ "ความปลอดภัยของ Rust" และ "ความสะดวกสบายของ GUI" ทำให้เป็นทางออกที่ดีที่สุดสำหรับสายพัฒนาที่ต้องการแจกจ่ายซอฟต์แวร์ให้ผู้อื่นใช้งาน*