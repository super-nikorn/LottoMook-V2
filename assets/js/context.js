// context.js

// 1. ดึงพารามิเตอร์จาก URL ถ้ามี
const params = new URLSearchParams(window.location.search);
const urlUser = params.get("user");

// 2. ถ้าเจอใน URL → เซ็ตเข้า localStorage (ใช้รอบต่อ ๆ ไป)
if (urlUser) {
  localStorage.setItem("activeUser", urlUser);
}

// 3. ดึงจาก localStorage เป็นค่าเริ่มต้น
export const user = localStorage.getItem("activeUser");

// 4. ถ้าไม่เจอ user → redirect กลับหน้าเริ่มต้น
if (!user) {
  alert("ไม่พบข้อมูลผู้ใช้งาน กรุณาเริ่มต้นจากหน้า home.html");
  window.location.href = "home.html";
}
