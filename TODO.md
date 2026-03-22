# TODO - Ragnarok MVP Timer

## Features

### High Priority

- [ ] **Fallback/Offline Mode** - สำรองข้อมูลเวลา Firebase ล่ม (ใช้ localStorage)
- [ ] **Firebase Analytics** - ติดตามว่าใครใช้งาน, ดู statistics

### Medium Priority

- [ ] **Import data จาก Party → Solo** - Copy MVP data ข้าม mode
- [ ] **Firebase Analytics Integration** - ดูว่า user ใช้งานเท่าไหร่

## Known Issues

- ถ้า 2 คนฆ่าบอสเดียวกันเกือบเวลาเดียวกัน → คนเน็ตเร็วกว่าชนะ

## Ideas

- [ ] User Analytics - ดูว่าใครใช้ server ไหน, เล่น Solo หรือ Party
- [ ] Notification หลายเครื่อง - ถ้าฆ่าบอสใน party ให้แจ้งทุกเครื่อง
- [ ] Copy MVP data จาก party ไป solo ได้

## Completed ✅

- [x] Cloud-first data flow (Firebase เป็น source of truth)
- [x] Solo/Party mode
- [x] Firebase path: hunting/solo/ และ hunting/party/
- [x] ลบ backup system
- [x] ลบ CI/CD ที่ไม่ใช้
- [x] Firebase rules อัปเดต
- [x] Export/Import JSON buttons
- [x] Remember nickname/party checkbox
- [x] ลบปุ่มสุ่มชื่อ

---

_Updated: $(date)_
