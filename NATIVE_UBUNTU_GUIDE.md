# Ragnarok MVP Timer - Tauri Desktop Guide for Native Ubuntu

คู่มือนี้จะอธิบายขั้นตอนการตั้งค่า, build, และรันแอปพลิเคชัน Ragnarok MVP Timer เวอร์ชัน Desktop ที่สร้างด้วย Tauri บนระบบปฏิบัติการ Ubuntu แท้ๆ (Native Ubuntu)

---

## 1. สิ่งที่ต้องเตรียม (Prerequisites)

ก่อนที่คุณจะสามารถ build หรือรันแอปพลิเคชันได้ คุณต้องติดตั้งสิ่งต่อไปนี้:

### 1.1. Node.js และ npm

ตรวจสอบว่าติดตั้งแล้ว:
```bash
node -v
npm -v
```

### 1.2. Rust และ Cargo

ติดตั้ง Rust Toolchain โดยใช้ rustup:
```bash
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
```
(ทำตามขั้นตอนบนหน้าจอ และเลือกติดตั้งแบบ Default)
หลังจากติดตั้งเสร็จ ให้ปิดและเปิด Terminal ใหม่ หรือรันคำสั่ง:
```bash
source "$HOME/.cargo/env"
```

### 1.3. System Dependencies สำหรับ Tauri บน Linux

Tauri ต้องการไลบรารีของระบบบางตัวสำหรับการแสดงผลและฟังก์ชันอื่นๆ ติดตั้งได้ด้วยคำสั่ง:
```bash
sudo apt-get update
sudo apt-get install -y build-essential libwebkit2gtk-4.1-dev libappindicator3-dev librsvg2-dev patchelf
```

---

## 2. การเตรียมโค้ดโปรเจกต์

### 2.1. Clone Repository (หากยังไม่มีโค้ด)

```bash
git clone <URL ของ Repository ของคุณ>
cd ragnarokmvptimer
```

### 2.2. Checkout Branch (หากต้องการใช้ branch ที่เราทำกันวันนี้)

```bash
git checkout feat/tauri-desktop
```

### 2.3. ติดตั้ง Node.js Dependencies

```bash
npm install
```

---

## 3. การรันในโหมดพัฒนา (Development Mode)

หากต้องการรันแอปพลิเคชันในโหมดพัฒนา ซึ่งจะมีการ Hot-reloading (อัปเดตอัตโนมัติเมื่อแก้ไขโค้ด) ให้ใช้คำสั่ง:
```bash
npx tauri dev
```

หน้าต่างแอปพลิเคชันจะเปิดขึ้นมา และจะรีโหลดเมื่อคุณแก้ไขโค้ด

---

## 4. การ Build สำหรับใช้งานจริง (Production Build)

หากต้องการสร้างไฟล์ติดตั้งสำหรับใช้งานจริง ให้ใช้คำสั่ง:
```bash
npx tauri build
```

คำสั่งนี้จะสร้างไฟล์ติดตั้งและไฟล์โปรแกรมสำหรับ Linux ในโฟลเดอร์ `src-tauri/target/release/bundle/` โดยจะมี:
*   ไฟล์ .deb (สำหรับ Debian/Ubuntu)
*   ไฟล์ .AppImage (โปรแกรมแบบพกพา)
*   ไฟล์ .rpm (สำหรับ Red Hat)

---

## 5. การรันแอปพลิเคชันที่ Build แล้ว

### 5.1. การติดตั้งไฟล์ .deb

ไปที่โฟลเดอร์ `src-tauri/target/release/bundle/deb/`
```bash
sudo dpkg -i ragnarokmvptimer_0.1.0_amd64.deb
```
หลังจากติดตั้ง คุณสามารถรันโปรแกรมได้จาก Application Menu หรือพิมพ์ `ragnarokmvptimer` ใน Terminal

### 5.2. การรันไฟล์ .AppImage

ไปที่โฟลเดอร์ `src-tauri/target/release/bundle/appimage/`
ทำให้ไฟล์สามารถรันได้:
```bash
chmod +x ragnarokmvptimer_0.1.0_amd64.AppImage
```
รันโปรแกรม:
```bash
./ragnarokmvptimer_0.1.0_amd64.AppImage
```

---

## 6. ข้อสังเกตด้านประสิทธิภาพ (บน Native Ubuntu)

บน Native Ubuntu แอปพลิเคชันควรจะทำงานได้อย่างลื่นไหลและมีประสิทธิภาพสูงกว่าบน WSL อย่างเห็นได้ชัด โดยเฉพาะอย่างยิ่งสำหรับ Canvas animation ที่มีการใช้ GPU เนื่องจากแอปพลิเคชันจะสามารถเข้าถึงฮาร์ดแวร์ (GPU) ได้โดยตรงและเต็มประสิทธิภาพครับ
