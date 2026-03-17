# ทางเลือกที่เบาและเร็วกว่า Tauri สำหรับแอปเดสก์ท็อป

ถ้าคุณกำลังมองหาทางเลือกที่เบาและ/หรือเร็วกว่า Tauri สำหรับการสร้างแอปเดสก์ท็อปที่เรียบง่าย (เช่น Ragnarok MVP Timer) นี่คือบางตัวเลือกที่คุณอาจพิจารณา

## 1. Neutralino.js

- **คืออะไร**: ทางเลือกที่มีน้ำหนักเบากว่า Tauri/Electron ที่ใช้เว็บวิวของระบบ (เหมือน Tauri) แต่มีรันไทม์ที่เล็กกว่า
- **ข้อดี**:
  - ไฟล์ไบนารีมีขนาดเล็กมาก (มักจะอยู่ที่ 1–3 MB สำหรับแอปง่ายๆ)
  - ขั้นตอนการพัฒนาเหมือนกับการพัฒนาเว็บทั่วไป (HTML/CSS/JS/TS)
  - มี API ง่ายๆ สำหรับคุณสมบัติระดับระบบปฏิบัติการ (ไฟล์, การแจ้งเตือน, คลิปบอร์ด เป็นต้น)
  - ไม่จำเป็นต้องมี Rust toolchain ในการพัฒนา; ต้องการแค่ Node.js เท่านั้น
- **ข้อเสีย**:
  - ระบบนิเวศและปลั๊กอินน้อยกว่า Tauri
  - ฟีเจอร์ขั้นสูงบางอย่างของ Tauri (เช่น อัปเดตอัตโนมัติ, ระบบสิทธิ์เชิงลึก) อาจขาดหายไปหรือต้องทำเอง
  - หากย้ายจาก Tauri จำเป็นต้องเปลี่ยนการเรียก API ของ Tauri เป็น Neutralino.js
- **เหมาะสำหรับ**: นักพัฒนาที่ต้องการอยู่กับเทคโนโลยีเว็บแต่ต้องการรอยเท้าที่เล็กกว่า Tauri

## 2. Wails

- **คืออะไร**: คล้ายกับ Tauri แต่ใช้ภาษา Go สำหรับบัคเอนด์แทนที่จะเป็น Rust
- **ข้อดี**:
  - Go เป็นภาษาที่เรียนรู้ง่ายและมีประสิทธิภาพดีเยี่ยม
  - การผสานงานกับฟรอนท์เอนด์เว็บที่ดี
  - ขนาดไบนารีโดยทั่วไปอยู่ที่ 3–6 MB (ขึ้นกับการตั้งค่า)
- **ข้อเสีย**:
  - ขนาดไบนารีอาจไม่เล็กกว่า Tauri อย่างมีนัยสำคัญ และอาจใหญ่กว่าในบางกรณี
  - ระบบนิเวศมีขนาดเล็กกว่า Tauri (แม้ว่าจะเติบโตเร็ว)
  - การย้ายจาก Tauri หมายถึงต้องเขียนบัคเอนด์ใหม่เป็น Go
- **เหมาะสำหรับ**: นักพัฒนาที่ชอบภาษา Go หรือต้องการลองทางเลือกที่ใช้ Golang

## 3. เฟรมเวิร์ก GUI เนทีฟ (เช่น eGUI, Iced ใน Rust)

- **คืออะไร**: สร้าง GUI ทั้งหมดโดยไม่ใช้เว็บวิว โดยใช้ไลบรารี GUI ทันทีโหมด (immediate-mode) ใน Rust
- **ข้อดี**:
  - ไฟล์ไบนารีมีขนาดเล็กมาก (มักจะน้อยกว่า 1 MB สำหรับแอปง่ายๆ)
  - โอเวอร์เฮดเวลาทำงานต่ำมาก – เหมาะกับฮาร์ดแวร์ที่มีทรัพยากรจำกัด
  - ไม่ต้องพึ่งเว็บวิวของระบบ จึงหลีกเลี่ยงปัญหาความเข้ากันได้ที่เกี่ยวข้อง
- **ข้อเสีย**:
  - คุณต้องเขียน UI ใหม่ทั้งหมดด้วย Rust (ไม่สามารถนำโค้ด React/Vite ของคุณมาใช้ซ้ำได้)
  - จำเป็นต้องเรียนรู้แนวคิดทันทีโหมด (ซึ่งแตกต่างจาก GUI แบบ retained‑mode แบบดั้งเดิม)
  - ถูกจำกัดด้วยสิ่งที่ไลบรารี GUI สามารถให้ได้ (ไม่มีไลบรารี CSS/JS ที่ซับซ้อน)
- **เหมาะสำหรับ**: นักพัฒนาที่เต็มใจเขียน UI ด้วย Rust เพื่อให้ได้ไฟล์ที่เล็กที่สุดและความเร็วสูงสุด

## 4. Electron (สำหรับการเปรียบเทียบเท่านั้น)

- **คืออะไร**: รวม Chromium และ Node.js เข้าด้วยกัน
- **ข้อดี**: มีความ 成熟, มีปลั๊กอินมากมาย, ใช้งานง่ายหากคุณคุ้นเคยกับ Node.js
- **ข้อเสีย**: ขนาดไบนารีใหญ่มาก (มักจะอยู่ที่ 40–100 MB+), ใช้หน่วยความจำและ CPU สูง
- **สรุป**: ไม่ใช่ทางเลือกที่เบา รวมไว้เพียงเพื่อเป็นจุดอ้างอิงเท่านั้น

## คำแนะนำสำหรับ Ragnarok MVP Timer

- **หากคุณพอใจกับ Tauri แล้ว**: อยู่กับมันต่อไป – มันมีน้ำหนักเบาและเร็วเพียงพอสำหรับแอปตัวจับเวลาที่เรียบง่ายนี้อยู่แล้ว
- **หากคุณต้องการลองทางเลือกที่เบากว่าโดยไม่ต้องออกจากเทคโนโลยีเว็บ**: ลอง **Neutralino.js** เป็นอันดับแรก เพราะคุณสามารถนำโค้ดหน้าเว็บส่วนหน้ามาใช้ซ้ำได้เกือบทั้งหมด
- **หากคุณต้องการไฟล์ไบนารีที่เล็กที่สุดและเร็วที่สุดเท่าที่จะเป็นไปได้** และไม่มีปัญหากับการเขียน UI ใหม่ด้วย Rust: ให้พิจารณา **eGUI** หรือ **Iced**

หากคุณต้องการตัวอย่างโครงการหรือคำแนะนำในการย้ายไปยังทางเลือกใดๆ เหล่านี้ โปรดแจ้งมาได้เลย!

---

# Lightweight Alternatives to Tauri for Desktop Apps

If you're looking for options that are lighter and/or faster than Tauri for building a simple desktop app (like the Ragnarok MVP Timer), here are some alternatives you might consider.

## 1. Neutralino.js

- **What it is**: A lightweight alternative to Tauri/Electron that uses the system's webview (like Tauri) but with a smaller runtime.
- **Pros**:
  - Very small binary size (often 1–3 MB for simple apps).
  - Familiar web‑dev workflow (HTML/CSS/JS/TS).
  - Simple API for OS‑level features (filesystem, notifications, clipboard, etc.).
  - No Rust toolchain required for development; only Node.js is needed.
- **Cons**:
  - Smaller ecosystem and fewer plugins compared to Tauri.
  - Some advanced Tauri features (autoupdate, deep permission system) are missing or need manual work.
  - If you migrate from Tauri, you’ll need to replace Tauri API calls with Neutralino.js equivalents.
- **Best for**: Developers who want to stay with web technologies but want an even lighter footprint than Tauri.

## 2. Wails

- **What it is**: Similar to Tauri but uses Go for the backend instead of Rust.
- **Pros**:
  - Go is easy to learn and has excellent performance.
  - Good integration with web front‑ends.
  - Binary size typically 3–6 MB (depending on settings).
- **Cons**:
  - Binary size may not be significantly smaller than Tauri and can be larger in some cases.
  - Ecosystem is smaller than Tauri’s (though growing).
  - Moving from Tauri means rewriting the backend in Go.
- **Best for**: Developers who prefer Go or want to try a Golang‑based solution.

## 3. Native GUI Frameworks (e.g., eGUI, Iced in Rust)

- **What it is**: Build the entire GUI natively without a webview, using immediate‑mode GUI libraries in Rust.
- **Pros**:
  - Extremely small binaries (often < 1 MB for simple apps).
  - Very low runtime overhead – ideal for low‑end hardware.
  - No dependence on system webview; avoids related compatibility issues.
- **Cons**:
  - You must rewrite the UI completely in Rust (cannot reuse your React/Vite code).
  - Requires learning an immediate‑mode GUI paradigm (different from traditional retained‑mode GUI).
  - Limited to what the GUI library can provide (no complex CSS/JS libraries).
- **Best for**: Developers willing to write UI in Rust to achieve the smallest possible footprint and maximum speed.

## 4. Electron (for comparison)

- **What it is**: Packages Chromium and Node.js together.
- **Pros**: Mature, lots of plugins, easy to use if you already know Node.
- **Cons**: Large binary size (often 40–100 MB+), higher memory and CPU usage.
- **Verdict**: Not a lightweight choice; included only for reference.

## Recommendation for Ragnarok MVP Timer

- **If you’re happy with Tauri**: Stay with it – it’s already lightweight and fast enough for a simple timer app.
- **If you want to try something lighter without leaving web tech**: Give **Neutralino.js** a try first; you can reuse most of your frontend code.
- **If you want the absolute smallest and fastest possible binary** and don’t mind rewriting the UI in Rust: Look at **eGUI** or **Iced**.

Feel free to ask if you’d like a sample project or guidance on migrating to any of these alternatives!
