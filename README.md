# TR REMAP Firebase Multi-Page Starter

ไฟล์ชุดนี้มี:
- `index.html` รีไดเรกต์ไปหน้า login
- `login.html` หน้าเข้าสู่ระบบ
- `register.html` หน้าสมัครสมาชิก
- `app.html` หน้าใช้งานหลักหลังล็อกอิน
- `styles.css` สไตล์รวม
- `auth.js` ลอจิกสมัคร/ล็อกอินด้วย Firebase
- `app.js` ตรวจ session และใช้งานหน้า app
- `firebase-config.example.js` ตัวอย่าง config
- `firestore.rules` กฎ Firestore เบื้องต้น

## วิธีใช้
1. สร้าง Firebase project
2. เปิดใช้ Authentication > Email/Password
3. สร้าง Cloud Firestore
4. เปลี่ยนชื่อ `firebase-config.example.js` เป็น `firebase-config.js`
5. ใส่ค่า config จริงจาก Firebase Console
6. อัปโหลดทุกไฟล์ขึ้น GitHub repo
7. เปิด GitHub Pages

## หมายเหตุ
- หน้า app ตอนนี้มีตัวอย่าง calculator 2 โมดูล
- ถ้าต้องการย้าย calculator เดิมทั้งหมด ให้เอาการ์ดเพิ่มลง `app.html`
