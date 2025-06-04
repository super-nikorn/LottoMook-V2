import { db } from "../api/firebaseConfig.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ฟังก์ชันแปลงวันที่ไทยเป็น Date Object
function thaiDateToDate(thaiDate) {
  const months = {
    'มกราคม': 0, 'กุมภาพันธ์': 1, 'มีนาคม': 2, 'เมษายน': 3,
    'พฤษภาคม': 4, 'มิถุนายน': 5, 'กรกฎาคม': 6, 'สิงหาคม': 7,
    'กันยายน': 8, 'ตุลาคม': 9, 'พฤศจิกายน': 10, 'ธันวาคม': 11
  };

  const parts = thaiDate.split(' ');
  const day = parseInt(parts[0]);
  const month = months[parts[1]];
  const year = parseInt(parts[2]) - 543; // แปลง พ.ศ. เป็น ค.ศ.

  return new Date(year, month, day);
}

// ฟังก์ชันคำนวณช่วงเวลาที่ควรแสดงข้อมูล
function calculateDateRange(selectedDate) {
  const selectedDateObj = thaiDateToDate(selectedDate);

  // กรณีวันที่เลือกอยู่ในช่วง 10-20 ของเดือน
  if (selectedDateObj.getDate() >= 10 && selectedDateObj.getDate() <= 20) {
    const startDate = new Date(selectedDateObj);
    startDate.setDate(10);

    const endDate = new Date(selectedDateObj);
    endDate.setDate(18);
    endDate.setHours(23, 59, 59);

    return { start: startDate, end: endDate };
  }
  // กรณีวันที่เลือกอยู่ในช่วง 25-5 ของเดือน
  else {
    const startDate = new Date(selectedDateObj);
    startDate.setMonth(startDate.getMonth() - 1);
    startDate.setDate(25);

    const endDate = new Date(selectedDateObj);
    endDate.setDate(5);
    endDate.setHours(23, 59, 59);

    return { start: startDate, end: endDate };
  }
}

// ฟังก์ชันจัดรูปแบบวันที่ไทย
function formatThaiDate(date) {
  const options = {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  };
  return date.toLocaleString('th-TH', options);
}

// ฟังก์ชันโหลดข้อมูลงวดทั้งหมดไปยัง dropdown
async function loadAllRoundsToSelect() {
  try {
    const ref = collection(db, "recordLotteryResults");
    const snap = await getDocs(ref);
    const select = document.getElementById("selectDateRenderData");

    // เรียงลำดับงวดจากใหม่ไปเก่า
    const rounds = [];
    snap.forEach(doc => {
      rounds.push({
        id: doc.id,
        date: doc.data().date
      });
    });

    // เรียงลำดับตามวันที่ (ใหม่สุดขึ้นก่อน)
    rounds.sort((a, b) => {
      return thaiDateToDate(b.date) - thaiDateToDate(a.date);
    });

    // เพิ่ม options
    rounds.forEach(round => {
      const option = document.createElement("option");
      option.value = round.id;
      option.textContent = `งวดวันที่ ${round.date}`;
      select.appendChild(option);
    });

    // เพิ่ม event listener เมื่อเลือกงวด
    select.addEventListener('change', async (e) => {
      const selectedRound = e.target.value;
      await loadReportData(selectedRound);
    });

    // เพิ่ม event listener สำหรับปุ่ม export Excel
    document.getElementById('exportExcelBtn').addEventListener('click', exportToExcel);

  } catch (error) {
    console.error("Error loading rounds:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลงวดหวย");
  }
}

function formatLottoNumber(number) {
  const num = number.toString();
  if (num.length === 1) return num.padStart(2, '0'); // 0 → 00
  if (num.length === 2) return num;                 // 85 → 85
  return num.padStart(3, '0');                      // 1 → 001, 25 → 025, 123 → 123
}

// เพิ่มฟังก์ชันแสดงรายละเอียดบิล
function showBillDetail(entry) {
  let content = `ชื่อผู้ซื้อ: ${entry["ชื่อผู้ซื้อ"] || "-"}\n`;
  content += `เบอร์โทร: ${entry["เบอร์โทร"] || "-"}\n`;
  content += `วันที่บันทึก: ${entry.timestamp.toDate().toLocaleString("th-TH")}\n\n`;

  content += "รายการหวย:\n";
  content += "-----------------------------------\n";

  Object.entries(entry["ประเภท"] || {}).forEach(([type, items]) => {
    if (items && items.length > 0) {
      content += `\n${type}:\n`;
      items.forEach((item) => {
        content += `- เลข ${formatLottoNumber(item.เลข)} (${item.เงิน.toLocaleString("th-TH")} บาท)\n`;
      });
    }
  });

  content += "\n-----------------------------------\n";
  content += `ยอดรวม: ${entry["ยอดรวม"].toLocaleString("th-TH")} บาท`;

  document.getElementById("modalContent").textContent = content;
  document.getElementById("detailModal").classList.remove("hidden");
}

// ปิด Modal
document.getElementById("closeModal").addEventListener("click", () => {
  document.getElementById("detailModal").classList.add("hidden");
});


// ฟังก์ชันโหลดข้อมูลรายงาน
async function loadReportData(selectedRound) {
  try {
    const reportResults = document.getElementById("reportResults");
    reportResults.innerHTML = '<div class="text-center py-8"><i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i><p class="mt-3">กำลังโหลดข้อมูล...</p></div>';

    // ดึงข้อมูลงวดที่เลือกเพื่อหาวันที่
    const roundRef = collection(db, "recordLotteryResults");
    const roundSnap = await getDocs(query(roundRef, where("__name__", "==", selectedRound)));

    if (roundSnap.empty) {
      reportResults.innerHTML = '<div class="text-center py-12 text-red-500"><i class="fas fa-exclamation-circle text-3xl"></i><p class="mt-3">ไม่พบข้อมูลงวดที่เลือก</p></div>';
      return;
    }

    const roundData = roundSnap.docs[0].data();
    const roundDate = thaiDateToDate(roundData.date);
    const dateRange = calculateDateRange(roundData.date);

    // ดึงข้อมูลการซื้อลอตเตอรี่ในช่วงเวลาที่กำหนด
    const ticketsRef = collection(db, "lottoTickets");
    const ticketsQuery = query(
      ticketsRef,
      where("timestamp", ">=", dateRange.start),
      where("timestamp", "<=", dateRange.end)
    );

    const ticketsSnap = await getDocs(ticketsQuery);

    // สร้างตารางแสดงผล
    const table = document.createElement("table");
    table.className = "min-w-full divide-y divide-gray-200";

    // สร้างหัวตาราง
    const thead = document.createElement("thead");
    thead.className = "bg-gray-50";
    thead.innerHTML = `
      <tr>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ชื่อผู้ซื้อ</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">วันที่ซื้อ</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ประเภท</th>
        <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ยอดรวม</th>
      </tr>
    `;
    table.appendChild(thead);

    // สร้างเนื้อตาราง
    const tbody = document.createElement("tbody");
    tbody.className = "bg-white divide-y divide-gray-200";

    let totalAmount = 0;
    ticketsSnap.forEach((doc, index) => {
      const data = doc.data();
      totalAmount += data.ยอดรวม || 0;

      const row = document.createElement("tr");
      row.className = "table-row hover:bg-gray-50 cursor-pointer";
      row.addEventListener('click', () => showBillDetail(data));

      // แปลงประเภทการซื้อเป็นข้อความ
      const types = [];
      if (data.ประเภท.สามตัวตรง?.length > 0) types.push("สามตัวตรง");
      if (data.ประเภท.สามตัวโต๊ด?.length > 0) types.push("สามตัวโต๊ด");
      if (data.ประเภท.บน?.length > 0) types.push("บน");
      if (data.ประเภท.ล่าง?.length > 0) types.push("ล่าง");

      row.innerHTML = `
  
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${data['ชื่อผู้ซื้อ'] || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${formatThaiDate(data.timestamp.toDate())}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${types.join(', ') || '-'}</td>
        <td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-green-600">${(data.ยอดรวม || 0).toLocaleString('th-TH')} บาท</td>
      `;

      tbody.appendChild(row);
    });



    table.appendChild(tbody);

    // แสดงผลข้อมูล
    reportResults.innerHTML = '';
    reportResults.appendChild(table);

    // แสดงข้อมูลสรุป
    const summarySection = document.getElementById("reportSummary");
    summarySection.classList.remove("hidden");

    document.getElementById("totalOrders").textContent = ticketsSnap.size.toLocaleString('th-TH');
    document.getElementById("totalAmount").textContent = totalAmount.toLocaleString('th-TH') + ' บาท';

    const dateOptions = {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    const startDateStr = dateRange.start.toLocaleDateString('th-TH', dateOptions);
    const endDateStr = dateRange.end.toLocaleDateString('th-TH', dateOptions);
    document.getElementById("dateRange").textContent = `${startDateStr} - ${endDateStr}`;

    // บันทึกข้อมูลสำหรับการ export
    reportResults.setAttribute('data-current-round', selectedRound);
    reportResults.setAttribute('data-total-amount', totalAmount);
    reportResults.setAttribute('data-total-orders', ticketsSnap.size);

  } catch (error) {
    console.error("Error loading report data:", error);
    reportResults.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-triangle text-3xl"></i>
        <p class="mt-3">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
        <p class="text-sm mt-2">${error.message}</p>
      </div>
    `;
  }
}



// ฟังก์ชัน export เป็น Excel
function exportToExcel() {
  const reportResults = document.getElementById("reportResults");
  const currentRound = reportResults.getAttribute('data-current-round');

  if (!currentRound) {
    alert("กรุณาเลือกงวดหวยก่อนการ export");
    return;
  }

  try {
    // สร้าง workbook
    const wb = XLSX.utils.book_new();

    // ดึงข้อมูลจากตาราง
    const table = reportResults.querySelector('table');
    const ws = XLSX.utils.table_to_sheet(table);

    // เพิ่มข้อมูลลงใน workbook
    XLSX.utils.book_append_sheet(wb, ws, "รายงานหวย");

    // สร้างชื่อไฟล์
    const fileName = `รายงานหวย_งวด${currentRound}_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // ดาวน์โหลดไฟล์
    XLSX.writeFile(wb, fileName);

  } catch (error) {
    console.error("Error exporting to Excel:", error);
    alert("เกิดข้อผิดพลาดในการ export ไฟล์ Excel");
  }
}

// โหลดข้อมูลเมื่อหน้าเว็บโหลดเสร็จ
window.addEventListener('DOMContentLoaded', () => {
  loadAllRoundsToSelect();
});
