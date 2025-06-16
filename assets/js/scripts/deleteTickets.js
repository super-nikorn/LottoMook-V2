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
  const month = now.getMonth();

  const startA = new Date(year, month, 5);
  const endA = new Date(year, month, 18, 23, 59, 59);

  const prevMonth = month === 0 ? 11 : month - 1;
  const prevYear = month === 0 ? year - 1 : year;

  const startB = new Date(prevYear, prevMonth, 25);
  const endB = new Date(year, month, 5, 23, 59, 59);

  return { rangeA: { start: startA, end: endA }, rangeB: { start: startB, end: endB } };
}

let allFilteredTickets = [];
let currentDocIdToDelete = null;

export async function loadTickets() {
  try {
    const select = document.getElementById("ticketSelect");
    select.innerHTML = '<option disabled selected>กำลังโหลดงวดหวย...</option>';

    // ✅ ดึงชื่อ collection ตาม user
    const user = localStorage.getItem("activeUser") || "default";
    const collectionName = `lottoTickets${capitalize(user)}`;

    const { rangeA, rangeB } = getDateRangesToday();
    const snapshot = await getDocs(collection(db, collectionName));

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
  } catch (error) {
    console.error("Error loading tickets:", error);
    const select = document.getElementById("ticketSelect");
    select.innerHTML = '<option disabled selected>เกิดข้อผิดพลาดในการโหลดข้อมูล</option>';
  }
}


function renderSelectOptions(tickets) {
  const select = document.getElementById("ticketSelect");
  select.innerHTML = '<option disabled selected>เลือกงวดหวย</option>';

  if (tickets.length === 0) {
    select.innerHTML = '<option disabled selected>ไม่พบโพยหวย</option>';
    return;
  }

  const uniqueDates = new Set();
  tickets.forEach((t) => {
    const dateStr = t.timestamp.toDate().toLocaleDateString("th-TH", {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    uniqueDates.add(dateStr);
  });

  Array.from(uniqueDates).sort((a, b) => {
    return new Date(b) - new Date(a);
  }).forEach(dateStr => {
    const opt = document.createElement("option");
    opt.value = dateStr;
    opt.textContent = `งวดวันที่ ${dateStr}`;
    select.appendChild(opt);
  });

  select.addEventListener("change", () => {
    const selectedDate = select.value;
    const filtered = allFilteredTickets.filter(t => {
      const d = t.timestamp.toDate().toLocaleDateString("th-TH", {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
      return d === selectedDate;
    });
    renderTicketRows(filtered);
  });
}

function renderTicketRows(tickets) {
  const tbody = document.getElementById("ticketTableBody");
  tbody.innerHTML = "";

  if (tickets.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          ไม่พบโพยหวยในงวดที่เลือก
        </td>
      </tr>
    `;
    return;
  }

  tickets.forEach((t, index) => {
    const row = document.createElement("tr");
    row.className = "table-row";

    const dateOptions = {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
        ${t["ชื่อผู้ซื้อ"] || "ไม่ระบุชื่อ"}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-bold">
        ${(t["ยอดรวม"] || 0).toLocaleString("th-TH")} บาท
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${t.timestamp.toDate().toLocaleDateString("th-TH", dateOptions)}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-center">
        <button 
          class="delete-btn text-red-600 hover:text-red-800 font-medium"
          data-id="${t.id}"
        >
          <i class="fas fa-trash-alt mr-1"></i> ลบ
        </button>
      </td>
    `;

    tbody.appendChild(row);
  });

  // Add event listeners to all delete buttons
  document.querySelectorAll('.delete-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      currentDocIdToDelete = btn.getAttribute('data-id');
      showDeleteModal();
    });
  });
}


function formatLottoNumber(number) {
  const num = number.toString();
  if (num.length === 1) return num.padStart(2, '0'); // 0 → 00
  if (num.length === 2) return num;                 // 85 → 85
  return num.padStart(3, '0');        
}
function showDeleteModal() {
  const modal = document.getElementById('deleteModal');
  const detailContainer = document.getElementById('deleteTicketDetails');
  const ticket = allFilteredTickets.find(t => t.id === currentDocIdToDelete);

  if (ticket) {
    let content = `👤 ชื่อผู้ซื้อ: ${ticket["ชื่อผู้ซื้อ"] || "ไม่ระบุ"}\n`;
    content += `💰 ยอดรวม: ${(ticket["ยอดรวม"] || 0).toLocaleString("th-TH")} บาท\n`;

    // 🧾 รายการประเภทและเลข
    Object.entries(ticket["ประเภท"] || {}).forEach(([type, items]) => {
      if (items && items.length > 0) {
        content += `\n🔸 ประเภท: ${type}\n`;
        items.forEach((item) => {
          const number = formatLottoNumber(item.เลข);
          const money = item.เงิน.toLocaleString("th-TH");
        content += `- เลข ${formatLottoNumber(item.เลข)} (${item.เงิน.toLocaleString("th-TH")} บาท)\n`;

        });
      }
    });

    // แสดงใน modal
    detailContainer.textContent = content;
  }

  modal.classList.remove('hidden');

  document.getElementById('confirmDeleteBtn').addEventListener('click', async () => {
    modal.classList.add('hidden');
    await deleteTicket();
  });

  document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
    modal.classList.add('hidden');
    currentDocIdToDelete = null;
  });
}


async function deleteTicket() {
  if (!currentDocIdToDelete) return;

  try {
    // ✅ ใช้ collection ของ user
    const user = localStorage.getItem("activeUser") || "default";
    const collectionName = `lottoTickets${capitalize(user)}`;

    await deleteDoc(doc(db, collectionName, currentDocIdToDelete));

    // Show success message
    const tbody = document.getElementById("ticketTableBody");
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center">
          <div class="bg-green-50 text-green-700 p-3 rounded-md inline-flex items-center">
            <i class="fas fa-check-circle mr-2"></i> ลบโพยเรียบร้อยแล้ว
          </div>
        </td>
      </tr>
    `;

    setTimeout(() => {
      loadTickets(); // ✅ โหลดใหม่หลังลบ
    }, 1500);

  } catch (error) {
    console.error("Error deleting ticket:", error);
    const tbody = document.getElementById("ticketTableBody");
    tbody.innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center">
          <div class="bg-red-50 text-red-700 p-3 rounded-md inline-flex items-center">
            <i class="fas fa-exclamation-circle mr-2"></i> เกิดข้อผิดพลาดในการลบโพย
          </div>
        </td>
      </tr>
    `;
  } finally {
    currentDocIdToDelete = null;
  }
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadTickets();

  document.getElementById("clearSelect").addEventListener("click", () => {
    const select = document.getElementById("ticketSelect");
    select.selectedIndex = 0;
    document.getElementById("ticketTableBody").innerHTML = `
      <tr>
        <td colspan="4" class="px-6 py-4 text-center text-gray-500">
          กรุณาเลือกงวดเพื่อแสดงรายการโพย
        </td>
      </tr>
    `;
  });
});