import { db } from "../api/firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const select = document.getElementById("lottoSelect");
const firstPrizeEl = document.getElementById("firstPrize");
const twoDigitEl = document.getElementById("twoDigit");

async function loadAllLottoDates() {
  const snapshot = await getDocs(collection(db, "recordLotteryResults"));

  select.innerHTML = ""; // ล้าง option เดิม
  const sortedDocs = [];

  snapshot.forEach((docSnap) => {
    sortedDocs.push({ id: docSnap.id });
  });

  // เรียงวันที่ย้อนหลัง (โดย assume ว่า id เป็น "1 มิถุนายน 2568" แบบไทย)
  sortedDocs.sort((a, b) => {
    // แปลงวันที่ไทยให้เรียงได้ (แนะนำให้เก็บ timestamp จะเรียงง่ายกว่า)
    return b.id.localeCompare(a.id, "th"); // เรียงจากหลังไปหน้า
  });

  for (const doc of sortedDocs) {
    const option = document.createElement("option");
    option.value = doc.id;
    option.textContent = doc.id;
    select.appendChild(option);
  }

  // โหลดข้อมูลเริ่มต้น (ล่าสุด)
  if (select.options.length > 0) {
    select.selectedIndex = 0;
    loadLottoByDate(select.value);
  }
}

async function loadLottoByDate(dateStr) {
  const ref = doc(db, "recordLotteryResults", dateStr);
  const snap = await getDoc(ref);

  if (snap.exists()) {
    const data = snap.data();
    firstPrizeEl.textContent = data.firstPrize || "-";
    twoDigitEl.textContent = data.twoDigit || "-";
  } else {
    firstPrizeEl.textContent = "-";
    twoDigitEl.textContent = "-";
  }
}

// เปลี่ยนงวด
select.addEventListener("change", () => {
  const selectedDate = select.value;
  loadLottoByDate(selectedDate);
});

// เริ่มโหลด
loadAllLottoDates();
