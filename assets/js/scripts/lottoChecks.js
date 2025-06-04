import { db } from "../api/firebaseConfig.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ฟังก์ชันโหลดข้อมูลงวดทั้งหมดไปยัง dropdown
async function loadAllRoundsToSelect() {
  try {
    const ref = collection(db, "recordLotteryResults");
    const snap = await getDocs(ref);

    // เรียงลำดับงวดจากใหม่ไปเก่า
    const rounds = [];
    snap.forEach(doc => {
      rounds.push({
        id: doc.id,
        date: doc.data().date
      });
    });

    console.log(rounds); // Fixed: changed 'data' to 'rounds' which is the variable you defined
  } catch (error) {
    console.error("Error loading rounds:", error);
    // You might want to handle the error here, like showing a user notification
  }
}

// Don't forget to call your function
loadAllRoundsToSelect();