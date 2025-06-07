import { db } from '../api/firebaseConfig.js';
import {
  doc,
  setDoc,
  Timestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function saveToDatabase(payload) {
  const buyer = payload["ชื่อผู้ซื้อ"];
  const nowDate = new Date().toISOString().split("T")[0];
  const documentId = `${nowDate}_${buyer.replace(/\s+/g, "_")}`;

  // ✅ ดึงชื่อ user จาก localStorage
  const user = localStorage.getItem("activeUser") || "default";

  // ✅ ตั้งชื่อ collection ตาม user เช่น lottoTicketsNikorn
  const collectionName = `lottoTickets${capitalize(user)}`;

  // ✅ เพิ่ม timestamp ลงใน payload
  payload.timestamp = Timestamp.now();

  try {
    await setDoc(doc(db, collectionName, documentId), payload);
    alert("✅ บันทึกโพยเรียบร้อยแล้ว");
  } catch (error) {
    console.error("❌ บันทึกไม่สำเร็จ:", error);
    alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
  }
}

// ฟังก์ชันช่วยแปลง n → N
function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}
