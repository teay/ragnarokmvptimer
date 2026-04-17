# Ragnarok MVP Timer: Version Comparison

| ฟีเจอร์ | Web App (React) | CLI (Node.js) | CLI-C (ncurses) |
| :--- | :---: | :---: | :---: |
| **Data Sync (Firebase)** | ✅ Real-time | ✅ Real-time | ❌ (Local JSON เท่านั้น) |
| **Multi-spawn Support** | ✅ สมบูรณ์ | ✅ สมบูรณ์ | ✅ รองรับแล้ว |
| **การควบคุม (Navigation)** | Mouse / Touch | Scroll / Key input | ✅ Tab / Arrow Keys (ดีสุด) |
| **ความเร็ว/การกินทรัพยากร** | ⚠️ สูง (Browser) | ⚠️ ปานกลาง (Node) | ✅ ต่ำมาก (< 1MB RAM) |
| **Startup Wizard** | ✅ มี (Welcome) | ✅ มี (Ask Name) | ❌ (Hardcoded/Arg) |
| **Color-coding (Status)** | ✅ เขียว/เหลือง/แดง | ✅ มีสีพื้นฐาน | 🚧 กำลังทำ (Doing) |
| **Offline Mode** | ✅ LocalStorage | ✅ JSON Save | ✅ JSON Read |
| **Map / /navi command** | ✅ มีรูปแผนที่ | ❌ มีแต่ข้อความ | ❌ มีแต่ข้อความ |
| **ความสะดวกในการติดตั้ง** | ✅ ไม่ต้องลง (Web) | ❌ ต้องมี Node.js | ✅ Binary ตัวเดียว (Portable) |

---

## วิเคราะห์จุดเด่นและจุดด้อย

### 1. Web App (React)
*   **จุดเด่น:** สวยงามที่สุด, มีเสียงแจ้งเตือน, มีรูปแผนที่ MVP และ Sprite
*   **จุดด้อย:** กินทรัพยากรเครื่องมากที่สุด ถ้าเปิดทิ้งไว้ระหว่างเล่นเกมอาจจะทำให้เครื่องหน่วงในบางสเปค

### 2. CLI (Node.js)
*   **จุดเด่น:** เชื่อมต่อ Firebase ได้สมบูรณ์ที่สุดในบรรดา CLI, พัฒนาง่ายด้วย JavaScript
*   **จุดด้อย:** การแสดงผลเป็นแบบเลื่อนขึ้น (Scroll) ธรรมดา ไม่ใช่ UI แบบนิ่งๆ (Static UI) และยังต้องติดตั้ง Node.js เพื่อใช้งาน

### 3. CLI-C (ncurses)
*   **จุดเด่น:** **UX/UI ดีที่สุดในสาย Terminal** (มี Tab, ใช้ลูกศรเลื่อนได้, ข้อมูลไม่ไหลทิ้ง), เปิดปุ๊บติดปั๊บ, เล็กและเบาที่สุด
*   **จุดขาด (Critical Gap):**
    *   **ยังไม่เชื่อม Firebase:** ปัจจุบันอ่าน/เขียนแค่ไฟล์ JSON ในเครื่อง ทำให้ข้อมูลไม่ซิงค์กับมือถือหรือเว็บ
    *   **ยังไม่มีสี:** หน้าจอยังเป็นขาวดำ (กำลังจะทำ)
    *   **ยังไม่มีระบบ Config:** เช่นการจำค่า Nickname หรือ Party ผ่าน Wizard

---
*บันทึกข้อมูลเมื่อ: 17 เมษายน 2026*
