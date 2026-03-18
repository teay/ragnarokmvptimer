# 🛠️ CI/CD & Build Process Improvement Plan

รายการสิ่งที่ต้องจัดการเพื่อลดความซ้ำซ้อนและทำให้การ Release แอปราบรื่นขึ้น

## 1. Windows Build & Release (.exe) 🪟
- [ ] **รวม Workflow:** ปัจจุบันมี `release.yml` และ `tauri-build.yml` ที่ทับซ้อนกัน ควรยุบรวมเหลืออันเดียวที่ทำงานได้จริง
- [ ] **แก้ปัญหาความซ้ำซ้อน:** ตรวจสอบว่าทำไมมีการ Build หลายรอบ (เช่น Build ทั้งใน GitHub Actions และอาจจะเผลอ Build ในเครื่องแล้ว Push ขึ้นไป)
- [ ] **มาตรฐานการตั้งชื่อ (Naming Convention):** 
    - ปรับการตั้งชื่อไฟล์จาก `0.1.xx` เป็นระบบที่สื่อสารชัดเจน เช่น `Ragnarok-MVP-Timer-v0.1.0-Windows.exe`
    - ตรวจสอบการดึงเวอร์ชันจาก `package.json` หรือ `tauri.conf.json` ให้เป็นที่เดียวกัน
- [ ] **ตรวจสอบไฟล์ที่ใช้งานได้จริง:** ทดสอบดาวน์โหลด Artifact จาก GitHub Actions มาลองรันดูว่าตัวไหนคือ "ของจริง" ที่ไม่พัง

## 2. Deployment & Web Hosting 🌐
- [ ] **GitHub Pages vs Vercel:** ปัจจุบันมีทั้ง `deploy-web.yml`, `vercel-deploy.yml` และ `netlify.toml`
    - ตัดสินใจเลือกใช้เพียงที่เดียว (แนะนำ Vercel หรือ Netlify เพราะจัดการง่ายกว่า GitHub Pages สำหรับ Single Page App)
    - ลบ Workflow ที่ไม่ได้ใช้ออกเพื่อลดความรก
- [ ] **GitHub Pages Cleanup:** หากไม่ใช้แล้ว ให้ลบการตั้งชื่อสาขา (gh-pages) และปิด Service ใน Settings เพื่อไม่ให้สับสน

## 3. Workflow Cleanup (All Workflows) 🧹
- [ ] **ลบ Workflow ที่เสีย:** ไล่เช็คไฟล์ใน `.github/workflows/` อันไหนที่รันแล้วพังตลอดและไม่ได้ใช้ ให้ลบทิ้งทันที
- [ ] **Unified Workflow:** สร้าง Workflow หลักตัวเดียวที่:
    1.  เช็ค Code (Lint/Test)
    2.  Build Web (Deploy ไป Vercel/Netlify)
    3.  Build Desktop (สร้าง Release ใน GitHub พร้อมไฟล์ .exe)

## 4. Versioning Management 🏷️
- [ ] **Automated Versioning:** ศึกษาการใช้ GitHub Tags เพื่อให้เวลาเราสร้าง Tag (เช่น `v0.1.2`) แล้วระบบจะสร้าง Release และตั้งชื่อไฟล์ .exe ให้โดยอัตโนมัติ
- [ ] **Sync Versions:** ตรวจสอบให้มั่นใจว่าเวอร์ชันใน `package.json` ตรงกับที่แสดงในตัวแอป

---
*หมายเหตุ: คราวหน้าเริ่มจากข้อ 1 (Windows Build) ก่อน เพราะเป็นหัวใจหลักของแอป Desktop*
