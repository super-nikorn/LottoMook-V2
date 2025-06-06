import {
  collection,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { db } from "../api/firebaseConfig.js";

function getDateRangesToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-based

  const startA = new Date(year, month, 5);
  const endA = new Date(year, month, 18, 23, 59, 59);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const startB = new Date(prevYear, prevMonth, 25);
  const endB = new Date(year, month, 5, 23, 59, 59);

  return { rangeA: { start: startA, end: endA }, rangeB: { start: startB, end: endB } };
}

let allFilteredTickets = [];

export async function loadTickets() {
  const { rangeA, rangeB } = getDateRangesToday();
  const snapshot = await getDocs(collection(db, "lottoTickets"));

  allFilteredTickets = [];
  snapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const ts = data.timestamp?.toDate();
    if (!ts) return;

    if ((ts >= rangeA.start && ts <= rangeA.end) || (ts >= rangeB.start && ts <= rangeB.end)) {
      allFilteredTickets.push({ id: docSnap.id, ...data });
    }
  });

  renderSelectOptions(allFilteredTickets);
}

function renderSelectOptions(tickets) {
  const select = document.getElementById("ticketSelect");
  select.innerHTML = '<option disabled selected>เลือกงวด</option>';

  const uniqueDates = new Set();
  tickets.forEach((t) => {
    const dateStr = t.timestamp.toDate().toLocaleDateString("th-TH");
    uniqueDates.add(dateStr);
  });

  Array.from(uniqueDates).forEach(dateStr => {
    const opt = document.createElement("option");
    opt.value = dateStr;
    opt.textContent = `งวดวันที่ ${dateStr}`;
    select.appendChild(opt);
  });

  // เมื่อเลือกงวด ค่อยแสดงรายการ
  select.addEventListener("change", () => {
    const selectedDate = select.value;
    const filtered = allFilteredTickets.filter(t => {
      const d = t.timestamp.toDate().toLocaleDateString("th-TH");
      return d === selectedDate;
    });
    renderTicketRows(filtered);
  });
}

function renderTicketRows(tickets) {
  const tbody = document.getElementById("ticketTableBody");
  tbody.innerHTML = "";

  tickets.forEach((t) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td class="p-2 border">${t["ชื่อผู้ซื้อ"] || "-"}</td>
      <td class="p-2 border text-right">${(t["ยอดรวม"] || 0).toLocaleString("th-TH")}</td>
      <td class="p-2 border">${t.timestamp.toDate().toLocaleDateString("th-TH")}</td>
      <td class="p-2 border text-center">
        <button class="text-red-500 hover:underline" onclick="confirmDelete('${t.id}')">ลบ</button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

window.confirmDelete = async function (docId) {
  if (confirm("คุณแน่ใจหรือไม่ว่าต้องการลบโพยนี้?")) {
    await deleteDoc(doc(db, "lottoTickets", docId));
    alert("✅ ลบโพยเรียบร้อย");
    loadTickets(); // โหลดใหม่แล้วจะรีเซ็ต dropdown + รายการ
  }
};

loadTickets();

document.getElementById("clearSelect").addEventListener("click", () => {
  const select = document.getElementById("ticketSelect");
  select.selectedIndex = 0; // กลับไปเป็น "เลือกงวด"
  document.getElementById("ticketTableBody").innerHTML = ""; // เคลียร์ตาราง
});
