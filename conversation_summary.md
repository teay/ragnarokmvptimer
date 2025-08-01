# สรุปบทสนทนาการพัฒนาโปรเจกต์ Ragnarok MVP Timer

บทสรุปนี้ครอบคลุมการทำงานร่วมกันของเราตั้งแต่เริ่มต้น จนถึงการแก้ไขปัญหาต่างๆ และการเรียนรู้แนวคิดใหม่ๆ

## 1. การตั้งค่าเริ่มต้นและบริบทโปรเจกต์
- ทำความเข้าใจโครงสร้างไฟล์และโฟลเดอร์ของโปรเจกต์ `ragnarokmvptimer`
- ยืนยันระบบปฏิบัติการ (Linux) และ Current Working Directory

## 2. การเปลี่ยนชื่อ Repository และการ Deploy
- **ปัญหา:** ต้องการเปลี่ยนชื่อ Repository บน GitHub และปรับ Path ในโปรเจกต์
- **การแก้ไข:**
    - แก้ไข `homepage` และ `repository.url` ใน `package.json`
    - แก้ไข `base` path ใน `vite.config.ts` (รวมถึงใน `wyw` และ `VitePWA` config)
- **การเรียนรู้:**
    - ทำความเข้าใจความแตกต่างระหว่าง `git push` (ส่ง Source Code) และ `npm run deploy` (Build และ Deploy ไฟล์ที่พร้อมใช้งานจริงไปยัง GitHub Pages)
    - `predeploy` script ใน `package.json` ที่เรียก `npm run build` โดยอัตโนมัติก่อน Deploy

## 3. การปรับ Layout ของ MVP Card (การ์ดข้อมูล MVP)
- **ปัญหา:**
    - ต้องการจัด Layout ของ MVP Card ใหม่ (ID/ชื่อ, รูป Boss, แผนที่, ข้อมูลเวลา, ปุ่มควบคุม)
    - ปุ่ม "Respawn in" ไม่กึ่งกลาง
    - รูป Boss ไม่กึ่งกลาง
    - ปุ่ม "Remove MVP" และ "Edit MVP" สีสลับกัน
- **การแก้ไข:**
    - ปรับ `flex-direction` และ `align-items` ใน `MvpCard/styles.ts`
    - สร้าง `TopSection`, `TopLeft`, `BottomControls` styled components เพื่อจัดกลุ่ม Element
    - ปรับ `width` และ `margin` ของปุ่มและ Container ต่างๆ เพื่อให้จัดกึ่งกลางและมีขนาดที่สอดคล้องกัน
    - สลับ `background-color` ของปุ่ม "Remove MVP" และ "Edit MVP" ใน `MvpCard/styles.ts`

## 4. การปรับ Layout ของ MvpsContainerFilter (ช่องค้นหาและจัดเรียง)
- **ปัญหา:**
    - ช่องค้นหาและจัดเรียงกว้างเกินไป ชิดขอบจอ
    - ต้องการให้ปุ่ม "I killed now !" และ "Edit" เรียงแนวตั้งและมีขนาดเท่ากัน
- **การแก้ไข:**
    - กำหนด `max-width` และ `margin: 0 auto;` ให้กับ `Container` ของ `MvpsContainerFilter` เพื่อจำกัดความกว้างและจัดกึ่งกลาง
    - ปรับ `flex-direction: column` และ `width: 100%` ให้กับ `Controls` ใน `MvpCard/styles.ts` เพื่อให้ปุ่มเรียงแนวตั้งและกว้างเต็มพื้นที่
    - ปรับ `padding` ของปุ่มเพื่อให้มีสัดส่วนที่เหมาะสม

## 5. การแก้ไขปัญหา Responsive Design
- **ปัญหา:** เมื่อบีบหน้าจอ การ์ด MVP ไม่เรียงเป็นแนวตั้ง แต่ยังคงเป็นแนวนอน
- **การแก้ไข:**
    - เพิ่ม Media Queries ใน `MvpsContainer` ใน `src/pages/Main/styles.ts` เพื่อปรับจำนวนคอลัมน์ตามขนาดหน้าจอ (4 -> 3 -> 2 -> 1 คอลัมน์)

## 6. การดีบั๊กด้วยกรอบสีแดง
- **เทคนิค:** เพิ่ม `border: 2px solid red;` ให้กับ Component ต่างๆ (Container, Section, MvpsContainer, MvpCard, MvpsContainerFilter, ปุ่มต่างๆ) เพื่อช่วยในการมองเห็นขอบเขตและปัญหา Layout
- **การเรียนรู้:** การใช้กรอบช่วยให้เห็นว่า Element ต่างๆ กินพื้นที่เท่าไหร่ และมี `padding`/`margin` อย่างไร การดีบั๊กด้วยภาพช่วยให้เข้าใจปัญหา CSS Layout ที่ซับซ้อนได้ง่ายขึ้น

## 7. การพยายามทำ Inline Editing และปัญหาที่ตามมา
- **แนวคิด:** เปลี่ยนการแก้ไข MVP จาก Modal เป็นการแก้ไขโดยตรงบนการ์ด (Inline Editing)
- **การแก้ไข:**
    - ลบ `ModalEditMvp` ออกจาก `src/pages/Main/index.tsx` และลบไฟล์ `ModalEditMvp`
    - เพิ่ม `isEditing` state และ `editedMvp` state ใน `MvpCard`
    - ปรับเปลี่ยน JSX ใน `MvpCard` เพื่อแสดง Input fields และปุ่ม "Save"/"Cancel" ในโหมดแก้ไข
    - เพิ่ม `Input` styled component ใน `MvpCard/styles.ts`
    - เชื่อมต่อ `updateMvp` function จาก Context
- **ปัญหาที่พบ:**
    - `MapPlaceholder` และ `editedMvp` ไม่ถูก `import`/`defined` (แก้ไขโดยการเพิ่ม `import` และ `useState`)
    - `mvp.deathMap` เป็น `undefined` สำหรับการ์ด Non-Active (เป็นพฤติกรรมปกติ)
    - **ปัญหาหลัก:** การแก้ไขแบบ Inline ทำให้รูปแผนที่หายไป ทำให้ผู้ใช้ไม่สามารถอ้างอิงรูปแผนที่ได้เมื่อแก้ไขข้อมูล
    - ปุ่ม "I killed now !" และ "Edit" ในการ์ด Non-Active กดไม่ได้ (เนื่องจาก Logic เปลี่ยนไป)
- **ข้อสรุป:** แนวคิด Inline Editing ที่ทำไปไม่ตอบโจทย์การใช้งานจริง เนื่องจากจำเป็นต้องเห็นรูปแผนที่ประกอบการแก้ไข การทดลองนี้แสดงให้เห็นว่าแม้แนวคิดจะดูดีบนกระดาษ แต่การใช้งานจริงอาจมีข้อจำกัดที่ไม่คาดคิด

## 8. การย้อนกลับการแก้ไข Inline Editing
- **การตัดสินใจ:** ย้อนกลับไปใช้ระบบแก้ไขแบบ Modal เหมือนเดิม เนื่องจากปัญหาเรื่องการแสดงผลแผนที่และการใช้งาน
- **การแก้ไข:**
    - คืนค่า `src/components/MvpCard/index.tsx` ให้กลับไปใช้ Modal สำหรับการแก้ไข
    - ลบ `Input` styled component ออกจาก `src/components/MvpCard/styles.ts`
    - คืนค่า `src/pages/Main/index.tsx` และ `src/modals/index.ts` ให้กลับมาใช้ `ModalEditMvp`

## 9. การแก้ไข Bug การเรียงลำดับการ์ด Active MVP
- **ปัญหา:** การ์ด MVP ที่ Active ไม่เรียงลำดับตามเวลา Respawn (การ์ดที่มีเวลาน้อยที่สุดควรอยู่ซ้ายสุด)
- **การแก้ไข:**
    - สร้างฟังก์ชัน `sortMvpsByRespawnTime` แยกต่างหากใน `src/contexts/MvpsContext.tsx`
    - เรียกใช้ฟังก์ชันนี้เมื่อโหลด `activeMvps` จาก `localStorage` และหลังจาก `killMvp` หรือ `updateMvp`

## 10. การลบ Vercel Analytics/Speed Insights
- **ปัญหา:** มี Error 404 (Not Found) ใน Console สำหรับ script ของ Vercel Analytics/Speed Insights เนื่องจาก Deploy บน GitHub Pages ไม่ใช่ Vercel
- **การแก้ไข:**
    - ลบ `<SpeedInsights />` และ `<Analytics />` ออกจาก `src/index.tsx`
    - ลบ `import` statement ที่เกี่ยวข้องใน `src/index.tsx`
    - ลบ `@vercel/speed-insights` และ `@vercel/analytics` ออกจาก `package.json`
    - ลบ `node_modules` และ `package-lock.json` (หรือ `bun.lockb`) แล้วรัน `npm install` ใหม่
- **การเรียนรู้:**
    - ความสำคัญของการล้าง Build Cache (`rm -rf dist .vite`) เมื่อเกิดปัญหา `Cannot find module` หรือ `Unexpected token` หลังจากแก้ไขโค้ดแล้ว
    - ความแตกต่างระหว่าง `npm install` (สร้าง `package-lock.json`) และ `bun install` (สร้าง `bun.lockb`)

## 11. การจัดการ Git และ CI/CD
- **การเรียนรู้:**
    - ความสำคัญของการ `commit` บ่อยๆ เพื่อให้ย้อนกลับได้ง่าย
    - การใช้ `git diff <commit_เก่า> <commit_ใหม่>` เพื่อเปรียบเทียบการเปลี่ยนแปลง
    - การใช้ `git bisect` เพื่อค้นหา commit ที่เป็นต้นเหตุของ Bug (Binary Search ในประวัติ commit)
    - การใช้ `git cherry-pick` เพื่อนำ commit จาก branch หนึ่งมาใช้ในอีก branch หนึ่ง
    - ทำความเข้าใจกระบวนการ CI/CD (`git push` vs. `npm run deploy`) และการทำงานของ GitHub Pages

## 12. การสะท้อนความคิดและการเรียนรู้
- **ข้อสรุป:** การลงมือทำจริงทำให้เกิดความเข้าใจที่ลึกซึ้งกว่าทฤษฎี
- **ศักยภาพของโปรเจกต์:** โปรเจกต์นี้สามารถนำไปใช้เป็นพื้นฐานสำหรับแอปพลิเคชันอื่นๆ ที่ต้องการแสดงผลและค้นหาข้อมูลในลักษณะเดียวกันได้ เนื่องจากโครงสร้างที่แยกส่วนและ Component ที่นำกลับมาใช้ใหม่ได้
- **ความสำคัญของ Computer Science:** การมีพื้นฐานที่แข็งแกร่งช่วยในการมองภาพรวมของระบบและแก้ไขปัญหาที่ซับซ้อน
- **กระบวนการแก้ปัญหาแบบวนซ้ำ (Iterative Problem-Solving):** การแก้ไขปัญหาบางอย่างไม่ได้สำเร็จในครั้งแรก แต่ต้องมีการปรับปรุงและทดลองซ้ำๆ โดยอาศัย Feedback จากการทดสอบ การเรียนรู้จากข้อผิดพลาดและปรับแนวทางเป็นสิ่งสำคัญ
- **บทบาทของการสื่อสารและ Feedback:** Feedback ที่ชัดเจนและละเอียดจากผู้ใช้งานมีความสำคัญอย่างยิ่งในการช่วยให้ระบุและแก้ไขปัญหาได้อย่างถูกต้อง
- **ความสำคัญของการทดสอบอัตโนมัติ (Automated Testing) ในอนาคต:** การทดสอบด้วยตนเอง (Manual Testing) มีข้อจำกัด การนำ Unit Test, Integration Test, หรือ E2E Test มาใช้ จะช่วยให้มั่นใจในคุณภาพของโค้ดในระยะยาว และป้องกัน Bug ที่อาจเกิดขึ้นจากการเปลี่ยนแปลงในอนาคต

หวังว่าสรุปนี้จะเป็นประโยชน์กับคุณนะครับ!