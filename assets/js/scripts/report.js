import { db } from "../api/firebaseConfig.js";
import {
  collection,
  getDocs,
  query,
  orderBy,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

function getDrawPeriod(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate();
  const drawDay = day <= 16 ? "01" : "16";
  return `${year}-${month}-${drawDay}`;
}

async function loadReportData() {
  const q = query(collection(db, "lottoTickets"), orderBy("timestamp", "desc"));
  const snapshot = await getDocs(q);
  const grouped = {};

  snapshot.forEach((doc) => {
    const data = doc.data();
    const datePart = doc.id.split("_")[0];
    const period = getDrawPeriod(datePart);
    if (!grouped[period]) grouped[period] = [];
    grouped[period].push({ id: doc.id, ...data });
  });

  return grouped;
}

function renderDropdown(grouped) {
  const dropdown = document.getElementById("draw-date");
  dropdown.innerHTML =
    '<option value="" disabled selected>เลือกงวดที่ต้องการดู</option>';

  const periods = Object.keys(grouped).sort().reverse();

  periods.forEach((period) => {
    const option = document.createElement("option");
    option.value = period;
    option.textContent = `งวดวันที่ ${new Date(period).toLocaleDateString(
      "th-TH",
      {
        year: "numeric",
        month: "long",
        day: "numeric",
      }
    )}`;
    dropdown.appendChild(option);
  });

  dropdown.addEventListener("change", () => {
    if (dropdown.value) {
      renderAll(grouped[dropdown.value]);
    }
  });

  if (periods.length > 0) {
    dropdown.value = periods[0];
    renderAll(grouped[periods[0]]);
  }
}

function renderSummary(data) {
  const summary = {
    บน: 0,
    ล่าง: 0,
    สามตัวตรง: 0,
    สามตัวโต๊ด: 0,
    total: 0,
    count: data.length,
  };

  data.forEach((d) => {
    summary.total += d["ยอดรวม"] || 0;
    const types = d["ประเภท"] || {};
    for (const key in types) {
      types[key].forEach((item) => {
        summary[key] += item.เงิน || 0;
      });
    }
  });

  const summaryDiv = document.getElementById("summary");
  summaryDiv.innerHTML = `
    <div class="col-span-1 bg-red-50 p-4 rounded-lg border border-red-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-red-100 text-red-600 mr-3">
          <i class="fas fa-coins"></i>
        </div>
        <h3 class="font-medium text-gray-700">ยอดรวมทั้งหมด</h3>
      </div>
      <p class="text-2xl font-bold text-red-600">${summary.total.toLocaleString(
    "th-TH"
  )} <span class="text-lg">บาท</span></p>
    </div>
    
    <div class="col-span-1 bg-blue-50 p-4 rounded-lg border border-blue-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
          <i class="fas fa-users"></i>
        </div>
        <h3 class="font-medium text-gray-700">จำนวนบิล</h3>
      </div>
      <p class="text-2xl font-bold text-blue-600">${summary.count
    } <span class="text-lg">บิล</span></p>
    </div>
    
    <div class="col-span-1 bg-green-50 p-4 rounded-lg border border-green-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-green-100 text-green-600 mr-3">
          <i class="fas fa-arrow-up"></i>
        </div>
        <h3 class="font-medium text-gray-700">สองตัวบน</h3>
      </div>
      <p class="text-xl font-bold text-green-600">${summary[
      "บน"
    ].toLocaleString("th-TH")} <span class="text-sm">บาท</span></p>
    </div>
    
    
    <div class="col-span-1 bg-purple-50 p-4 rounded-lg border border-purple-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-purple-100 text-purple-600 mr-3">
          <i class="fas fa-arrow-down"></i>
        </div>
        <h3 class="font-medium text-gray-700">สองตัวล่าง</h3>
      </div>
      <p class="text-xl font-bold text-purple-600">${summary[
      "ล่าง"
    ].toLocaleString("th-TH")} <span class="text-sm">บาท</span></p>
    </div>

        <div class="col-span-1 bg-green-50 p-4 rounded-lg border border-green-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-green-100 text-green-700 mr-3">
          <i class="fas fa-hashtag"></i>
        </div>
        <h3 class="font-medium text-gray-700">สามตัวตรง</h3>
      </div>
      <p class="text-xl font-bold text-green-600">${summary[
      "สามตัวตรง"
    ].toLocaleString("th-TH")} <span class="text-sm">บาท</span></p>
    </div>

        <div class="col-span-1 bg-purple-50 p-4 rounded-lg border border-purple-100">
      <div class="flex items-center mb-2">
        <div class="p-2 rounded-full bg-purple-100 text-purple-650 mr-3">
          <i class="fas fa-random"></i>
        </div>
        <h3 class="font-medium text-gray-700">สามตัวโต๊ด</h3>
      </div>
      <p class="text-xl font-bold text-purple-600">${summary[
      "สามตัวโต๊ด"
    ].toLocaleString("th-TH")} <span class="text-sm">บาท</span></p>
    </div>
  `;
}

function renderTable(data) {
  const tbody = document.getElementById("report-body");
  tbody.innerHTML = "";

  data.forEach((entry, index) => {
    const row = document.createElement("tr");
    row.className = "table-row hover:bg-gray-50 transition-colors";
    row.innerHTML = `
      <td class="px-6 py-4 whitespace-nowrap">
        <div class="flex items-center">
          <div class="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center text-red-600 font-bold">
            ${index + 1}
          </div>
          <div class="ml-4">
            <div class="text-sm font-medium text-gray-900">${entry["ชื่อผู้ซื้อ"] || "-"
      }</div>
            <div class="text-sm text-gray-500">${entry["เบอร์โทร"] || ""}</div>
          </div>
        </div>
      </td>
      <td class="px-6 py-4 whitespace-nowrap">
        <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
          ${entry["ยอดรวม"].toLocaleString("th-TH")} บาท
        </span>
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
        ${entry.timestamp.toDate().toLocaleString("th-TH", {
        dateStyle: "medium",
        timeStyle: "short",
      })}
      </td>
      <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <button onclick='showDetail(${JSON.stringify(entry).replace(
        /'/g,
        "\\'"
      )})'
          class="btn-primary text-white px-4 py-1 rounded-md text-sm hover:bg-red-700 transition-colors">
          <i class="fas fa-eye mr-1"></i> ดูรายละเอียด
        </button>
      </td>
    `;
    tbody.appendChild(row);
  });
}

window.showDetail = function (entry) {
  let content = `ชื่อผู้ซื้อ: ${entry["ชื่อผู้ซื้อ"] || "-"}\n`;
  content += `เบอร์โทร: ${entry["เบอร์โทร"] || "-"}\n`;
  // content += `วันที่บันทึก: ${entry.timestamp.toDate().toLocaleString("th-TH")}\n\n`;

  content += "รายการหวย:\n";
  content += "----------------------------------------\n";

  Object.entries(entry["ประเภท"] || {}).forEach(([type, items]) => {
    content += `\n${type}:\n`;
    items.forEach((item) => {
      content += `- เลข ${item.เลข
        .toString()
        .padStart(3, "0")} (${item.เงิน.toLocaleString("th-TH")} บาท)\n`;
    });
  });

  content += "\n----------------------------------------\n";
  content += `ยอดรวม: ${entry["ยอดรวม"].toLocaleString("th-TH")} บาท`;

  document.getElementById("modal-content").textContent = content;
  document.getElementById("modal").classList.remove("hidden");
};

document.getElementById("close-modal").addEventListener("click", () => {
  document.getElementById("modal").classList.add("hidden");
});

function renderAll(data) {
  renderSummary(data);
  renderTable(data);

  // อัพเดทข้อมูล pagination
  document.getElementById("total-items").textContent = data.length;
  document.getElementById("start-item").textContent = 1;
  document.getElementById("end-item").textContent = Math.min(10, data.length);
}

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const loadingIndicator = document.createElement("div");
    loadingIndicator.className =
      "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50";
    loadingIndicator.innerHTML = `
      <div class="bg-white p-6 rounded-lg flex items-center">
        <i class="fas fa-spinner fa-spin text-red-600 mr-3"></i>
        <span>กำลังโหลดข้อมูล...</span>
      </div>
    `;
    document.body.appendChild(loadingIndicator);

    const grouped = await loadReportData();
    renderDropdown(grouped);

    document.body.removeChild(loadingIndicator);
  } catch (error) {
    console.error("Error loading report data:", error);
    alert("เกิดข้อผิดพลาดในการโหลดข้อมูลรายงาน");
  }
});
