# ระยะที่เหลือของโปรเจกต์ - ฟีเจอร์จัดการและแบ่งปันห้อง

**วันที่:** 16 มีนาคม 2566

เอกสารนี้สรุปภาพรวมของระยะต่างๆ ที่จะดำเนินการหลังจากฟีเจอร์การเข้าร่วมห้องแบบใหม่เสร็จสมบูรณ์

---

## Phase 3: ดำเนินการซิงโครไนซ์ตัวจับเวลาบอสแบบเรียลไทม์

### วัตถุประสงค์

เพื่อให้สามารถซิงโครไนซ์ตัวจับเวลาการเกิดบอสแบบเรียลไทม์ระหว่างสมาชิกทุกคนในห้องที่แบ่งปันกันได้ โดยให้ทุกคนเห็น Countdown และข้อมูลการเกิดที่เหมือนกัน

### งานหลัก

1. **การออกแบบโครงสร้างข้อมูล:**
    * กำหนดโครงสร้างข้อมูลสำหรับ Firebase (หรือ Backend ที่เทียบเท่า) เพื่อจัดเก็บตัวจับเวลาบอสที่กำลังทำงานภายในห้อง โครงสร้างนี้ควรรวมถึงชื่อบอส, เวลาที่บอสจะเกิด, Server, และ ID ห้อง
2. **การเชื่อมต่อ Firebase:**
    * อัปเดต `src/services/firebase.ts` หรือไฟล์ Service Backend ที่เกี่ยวข้อง เพื่อจัดการ Real-time Listeners สำหรับข้อมูลตัวจับเวลาบอสภายในห้องที่เฉพาะเจาะจง
    * นำฟังก์ชันสำหรับเพิ่ม, อัปเดต, และลบรายการตัวจับเวลาบอสไปใช้
3. **การปรับปรุง `MvpsContext.tsx`:**
    * ปรับปรุง `MvpsContext.tsx` เพื่อ Subscribe รับการอัปเดตแบบเรียลไทม์สำหรับตัวจับเวลาบอสจาก Firebase
    * เมื่อผู้ใช้สร้างตัวจับเวลาบอส ให้ Push ข้อมูลไปยัง Firebase
    * เมื่อข้อมูล Firebase เปลี่ยนแปลง (ตัวจับเวลาใหม่, การสิ้นสุดตัวจับเวลา) ให้ อัปเดต State ใน `MvpsContext.tsx` ให้สอดคล้องกันสำหรับสมาชิกทุกคนในห้อง
4. **การซิงโครไนซ์ UI:**
    * ตรวจสอบให้แน่ใจว่า UI Component ที่แสดงตัวจับเวลาบอส (เช่น `MvpCardCountdown`, `MvpsContainerFilter`) สะท้อนข้อมูลแบบเรียลไทม์ที่ซิงโครไนซ์กันโดยอัตโนมัติ
    * จัดการกรณีที่ผู้ใช้เข้าร่วมห้องในขณะที่ตัวจับเวลาทำงานอยู่

### การพึ่งพา (Dependencies)

- การดำเนินการ Phase 1 และ Phase 2 (Joining flow) ให้สำเร็จ
- การตั้งค่า Firebase Project และการยืนยันตัวตน (Authentication) ที่พร้อมใช้งาน

### ผลลัพธ์ที่คาดหวัง

* ผู้ใช้ทุกคนในห้องเดียวกันจะเห็นตัวจับเวลาบอสที่เหมือนกันและอัปเดตแบบเรียลไทม์
* การเข้าร่วมห้องจะโหลดตัวจับเวลาที่มีอยู่ได้อย่างถูกต้อง

---

## Phase 4: การปรับปรุงและการทดสอบ

### วัตถุประสงค์

เพื่อขัดเกลาประสบการณ์ผู้ใช้ แก้ไขข้อผิดพลาดที่ระบุ และให้แน่ใจว่ามีการครอบคลุมการทดสอบอย่างครบถ้วนสำหรับฟีเจอร์การจัดการและแบ่งปันห้อง

### งานหลัก

1. **การแก้ไขข้อผิดพลาด (Bug Fixing):**
    * แก้ไขข้อผิดพลาดที่พบระหว่างการพัฒนาหรือการทดสอบใน Phase ก่อนหน้า
2. **การปรับปรุง UI/UX:**
    * ปรับปรุง Styling และ Animation สำหรับ UI Elements ใหม่ทั้งหมดที่เพิ่มเข้ามาใน Joining flow
    * ตรวจสอบให้แน่ใจว่าการเปลี่ยนผ่าน (Transitions) และ Feedback ของผู้ใช้ราบรื่น
    * ทบทวนและปรับปรุงการเข้าถึง (Accessibility)
3. **การบังคับใช้ชื่อห้องที่ไม่เปลี่ยนแปลง (Immutable Room Names):**
    * ดำเนินการ Logic เพื่อให้แน่ใจว่าชื่อห้องจะไม่เปลี่ยนแปลงหลังจากการสร้าง เว้นแต่จะได้รับอนุญาตจากผู้สร้างอย่างชัดเจน (ตามข้อกำหนดของผู้ใช้) ซึ่งอาจเกี่ยวข้องกับการตรวจสอบ Backend หรือ Client-side ก่อนการสร้างห้อง
4. **การสร้างลิงก์เชิญ (Invite Link Generation):**
    * พัฒนากลไกในการสร้างลิงก์เชิญที่ไม่ซ้ำกันสำหรับแต่ละห้อง ซึ่งอาจเกี่ยวข้องกับการสร้าง Room ID หรือ Token ที่ไม่ซ้ำกัน
5. **การทดสอบ (Testing):**
    * เขียน Unit Tests สำหรับ Component ใหม่และ Logic ของ Context
    * เขียน Integration Tests เพื่อตรวจสอบ Flow การสร้างห้อง การเข้าร่วม และการซิงโครไนซ์ตัวจับเวลาตั้งแต่ต้นจนจบ
    * ดำเนินการทดสอบด้วยตนเองในสถานการณ์ต่างๆ และบนอุปกรณ์ต่างๆ
6. **การปรับปรุงประสิทธิภาพ (Performance Optimization):**
    * ทำการ Profile Application และปรับปรุง Performance Bottlenecks ใดๆ โดยเฉพาะที่เกี่ยวข้องกับการจัดการข้อมูลแบบเรียลไทม์

### การพึ่งพา (Dependencies)

- การดำเนินการ Phase 1, 2, และ 3 ให้สำเร็จ

### ผลลัพธ์ที่คาดหวัง

* ฟีเจอร์การจัดการและแบ่งปันห้องที่เสถียร ขัดเกลา และทำงานได้อย่างสมบูรณ์
* ความมั่นใจสูงในความน่าเชื่อถือของฟีเจอร์ผ่านการทดสอบที่ครอบคลุม
* การปฏิบัติตามข้อกำหนดดั้งเดิมทั้งหมด (ชื่อห้องที่ไม่เปลี่ยนแปลง, ลิงก์เชิญ, การซิงโครไนซ์แบบเรียลไทม์, Joining flow โดยเฉพาะ)

---

# Remaining Phases - Room Management and Sharing Feature

**Date:** March 16, 2026

This document outlines the phases that follow the completion of the new joining flow.

---

## Phase 3: Implement Real-time Boss Timer Synchronization

### Objective

To enable real-time synchronization of boss spawn timers among all members of a shared room, ensuring everyone sees the same countdowns and spawn information.

### Key Tasks

1. **Data Structure Design:**
    * Define a Firebase (or equivalent backend) data structure for storing active boss timers within a room. This structure should include boss name, spawn time, server, and room ID.
2. **Firebase Integration:**
    * Update `src/services/firebase.ts` or relevant backend service files to handle real-time listeners for boss timer data within a specific room.
    * Implement functions to add, update, and remove boss timer entries.
3. **`MvpsContext.tsx` Modifications:**
    * Modify `MvpsContext.tsx` to subscribe to real-time updates for boss timers from Firebase.
    * When a user creates a boss timer, push the data to Firebase.
    * When Firebase data changes (new timer, timer completion), update the local state in `MvpsContext.tsx` accordingly for all room members.
4. **UI Synchronization:**
    * Ensure that UI components displaying boss timers (e.g., `MvpCardCountdown`, `MvpsContainerFilter`) automatically reflect the synchronized real-time data.
    * Handle cases where a user joins a room mid-timer.

### Dependencies

- Successful completion of Phase 1 and Phase 2 (joining flow).
- Established Firebase project and authentication setup.

### Expected Outcomes

* All users in the same room will see the same boss spawn timers updating in real-time.
* Joining a room will correctly load existing active timers.

---

## Phase 4: Refinement and Testing

### Objective

To polish the user experience, fix any identified bugs, and ensure comprehensive test coverage for the room management and sharing feature.

### Key Tasks

1. **Bug Fixing:**
    * Address any bugs discovered during development or testing of previous phases.
2. **UI/UX Polish:**
    * Refine styling and animations for all new UI elements introduced in the joining flow.
    * Ensure smooth transitions and user feedback.
    * Review and improve accessibility.
3. **Immutable Room Names Enforcement:**
    * Implement logic to ensure room names are immutable after creation, unless explicitly allowed by the creator (as per user requirement). This might involve backend validation or client-side checks before room creation.
4. **Invite Link Generation:**
    * Develop a mechanism to generate unique invite links for rooms. This might involve generating unique room IDs or tokens.
5. **Testing:**
    * Write unit tests for new components and context logic.
    * Write integration tests to verify the end-to-end flow of room creation, joining, and timer synchronization.
    * Conduct manual testing across different scenarios and devices.
6. **Performance Optimization:**
    * Profile the application and optimize any performance bottlenecks, particularly related to real-time data handling.

### Dependencies

- Completion of Phases 1, 2, and 3.

### Expected Outcomes

* A stable, polished, and fully functional room management and sharing feature.
* High confidence in the feature's reliability through comprehensive testing.
* Adherence to all original requirements (immutable room names, invite links, real-time sync, dedicated joining flow).