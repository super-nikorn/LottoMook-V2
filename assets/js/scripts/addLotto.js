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
  // เพิ่ม timestamp ลงใน payload
  payload.timestamp = Timestamp.now(); // ✅ ใส่ timestamp อย่างเดียว

  try {
    await setDoc(doc(db, "lottoTickets", documentId), payload);
    alert("✅ บันทึกโพยลง Firestore เรียบร้อยแล้ว");
  } catch (error) {
    console.error("❌ บันทึกไม่สำเร็จ:", error);
    alert("❌ เกิดข้อผิดพลาดในการบันทึกข้อมูล");
  }
}
