import { db } from "../api/firebaseConfig.js";
import {
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  where
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// DOM Elements
const select = document.getElementById("lottoSelect");
const firstPrizeEl = document.getElementById("firstPrize");
const twoDigitEl = document.getElementById("twoDigit");
const resultArea = document.getElementById("resultArea");

async function loadAllLottoDates() {
  try {
    const snapshot = await getDocs(collection(db, "recordLotteryResults"));
    select.innerHTML = '<option disabled selected>เลือกงวดหวย...</option>';

    const sortedDocs = [];
    snapshot.forEach((docSnap) => {
      sortedDocs.push({ id: docSnap.id });
    });

    // เรียงลำดับงวดจากใหม่ไปเก่า
    sortedDocs.sort((a, b) => b.id.localeCompare(a.id, "th"));

    // เพิ่ม options
    sortedDocs.forEach(doc => {
      const option = document.createElement("option");
      option.value = doc.id;
      option.textContent = `งวดวันที่ ${doc.id}`;
      select.appendChild(option);
    });

    // โหลดข้อมูลงวดล่าสุดอัตโนมัติ
    if (select.options.length > 1) {
      select.selectedIndex = 1;
      loadLottoByDate(select.value);
    }
  } catch (error) {
    console.error("Error loading lottery dates:", error);
    select.innerHTML = '<option disabled selected>เกิดข้อผิดพลาดในการโหลดงวดหวย</option>';
  }
}

async function loadLottoByDate(dateStr) {
  try {
    resultArea.innerHTML = `
      <div class="text-center py-8">
        <i class="fas fa-spinner fa-spin text-2xl text-indigo-600"></i>
        <p class="mt-3">กำลังตรวจผลรางวัล...</p>
      </div>
    `;

    const ref = doc(db, "recordLotteryResults", dateStr);
    const snap = await getDoc(ref);

    if (!snap.exists()) {
      firstPrizeEl.textContent = "-";
      twoDigitEl.textContent = "-";
      resultArea.innerHTML = `
        <div class="text-center py-12 text-red-500">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-3">ไม่พบข้อมูลงวดที่เลือก</p>
        </div>
      `;
      return;
    }

    const data = snap.data();
    firstPrizeEl.textContent = data.firstPrize || "-";
    twoDigitEl.textContent = data.twoDigit || "-";

    // ตรวจรางวัล
    await checkTicketsAgainstResults(dateStr, data);
  } catch (error) {
    console.error("Error loading lottery data:", error);
    resultArea.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-triangle text-3xl"></i>
        <p class="mt-3">เกิดข้อผิดพลาดในการโหลดข้อมูล</p>
      </div>
    `;
  }
}

function getDateRangeFor(dateStr) {
  const [day, monthThai, yearThai] = dateStr.split(" ");
  const monthMap = {
    "มกราคม": 0, "กุมภาพันธ์": 1, "มีนาคม": 2, "เมษายน": 3,
    "พฤษภาคม": 4, "มิถุนายน": 5, "กรกฎาคม": 6, "สิงหาคม": 7,
    "กันยายน": 8, "ตุลาคม": 9, "พฤศจิกายน": 10, "ธันวาคม": 11,
  };

  const dayNum = parseInt(day);
  const monthNum = monthMap[monthThai];
  const yearNum = parseInt(yearThai) - 543;

  const targetDate = new Date(yearNum, monthNum, dayNum);
  let start, end;

  if (dayNum === 1) {
    start = new Date(targetDate);
    start.setDate(start.getDate() - 7);
    end = new Date(targetDate);
    end.setDate(end.getDate() + 4);
  } else if (dayNum === 16) {
    start = new Date(targetDate);
    start.setDate(start.getDate() - 6);
    end = new Date(targetDate);
    end.setDate(end.getDate() + 4);
  } else {
    start = new Date(targetDate);
    start.setDate(start.getDate() - 5);
    end = new Date(targetDate);
    end.setDate(end.getDate() + 5);
  }

  return { start, end };
}

async function checkTicketsAgainstResults(dateStr, resultData) {
  try {
    const dateRange = getDateRangeFor(dateStr);
    if (!dateRange) {
      resultArea.innerHTML = `
        <div class="text-center py-12 text-yellow-600">
          <i class="fas fa-exclamation-circle text-3xl"></i>
          <p class="mt-3">ไม่พบช่วงวันที่สำหรับงวดนี้</p>
        </div>
      `;
      return;
    }

    // ✅ ใช้ collection ตามชื่อผู้ใช้
    const user = localStorage.getItem("activeUser") || "default";
    const collectionName = `lottoTickets${capitalize(user)}`;

    const ticketsRef = collection(db, collectionName);
    const ticketsQuery = query(
      ticketsRef,
      where("timestamp", ">=", dateRange.start),
      where("timestamp", "<=", dateRange.end)
    );
    const ticketsSnapshot = await getDocs(ticketsQuery);

    resultArea.innerHTML = "";

    if (ticketsSnapshot.empty) {
      resultArea.innerHTML = `
        <div class="text-center py-12 text-gray-400">
          <i class="fas fa-ticket-alt text-3xl"></i>
          <p class="mt-3">ไม่พบบิลหวยในช่วงเวลานี้</p>
        </div>
      `;
      return;
    }
    function capitalize(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const firstPrize = resultData.firstPrize || "";
    const twoDigit = resultData.twoDigit || "--";
    const บน = firstPrize.slice(-2);
    const ล่าง = twoDigit;
    const สามตัวตรง = firstPrize.slice(0, 3);
    const สามตัวโต๊ด = firstPrize.slice(-3);

    let hasWinningTickets = false;

    ticketsSnapshot.forEach((docSnap) => {
      const data = docSnap.data();
      const ts = data.timestamp?.toDate?.();
      if (!ts || ts < dateRange.start || ts > dateRange.end) return;

      const name = data["ชื่อผู้ซื้อ"] || "ไม่ระบุชื่อ";
      const phone = data["เบอร์โทร"] || "ไม่ระบุ";
      const type = data["ประเภท"] || {};
      const results = [];

      // ตรวจสอบรางวัล
      (type["บน"] || []).forEach(item => {
        if (String(item.เลข).padStart(2, '0') === บน) {
          results.push({
            type: "บน",
            number: String(item.เลข).padStart(2, '0'),
            amount: item.เงิน
          });
        }
      });

      (type["ล่าง"] || []).forEach(item => {
        if (String(item.เลข).padStart(2, '0') === ล่าง) {
          results.push({
            type: "ล่าง",
            number: String(item.เลข).padStart(2, '0'),
            amount: item.เงิน
          });
        }
      });

      (type["สามตัวตรง"] || []).forEach(item => {
        if (String(item.เลข).padStart(3, '0') === สามตัวตรง) {
          results.push({
            type: "สามตัวตรง",
            number: String(item.เลข).padStart(3, '0'),
            amount: item.เงิน
          });
        }
      });

      (type["สามตัวโต๊ด"] || []).forEach(item => {
        if (isPermutation(String(item.เลข).padStart(3, '0'), สามตัวโต๊ด)) {
          results.push({
            type: "สามตัวโต๊ด",
            number: String(item.เลข).padStart(3, '0'),
            amount: item.เงิน
          });
        }
      });

      // สร้างการ์ดแสดงผล
      const block = document.createElement("div");
      block.className = "result-card bg-white border border-gray-200 rounded-lg overflow-hidden";

      // ส่วนหัวการ์ด
      const header = document.createElement("div");
      header.className = "border-b border-gray-200 px-4 py-3 bg-gray-50 flex justify-between items-center";

      const nameEl = document.createElement("div");
      nameEl.className = "font-medium text-gray-800";
      nameEl.innerHTML = `<i class="fas fa-user mr-2 text-indigo-600"></i> ${name}`;

      const phoneEl = document.createElement("div");
      phoneEl.className = "text-sm text-gray-500";
      phoneEl.innerHTML = `<i class="fas fa-phone mr-1"></i> ${phone}`;

      header.appendChild(nameEl);
      header.appendChild(phoneEl);
      block.appendChild(header);

      // ส่วนเนื้อหาการ์ด
      const body = document.createElement("div");
      body.className = "p-4";

      if (results.length > 0) {
        hasWinningTickets = true;
        const winningHeader = document.createElement("div");
        winningHeader.className = "flex items-center mb-3";
        winningHeader.innerHTML = `
          <span class="winning-badge mr-2">
            <i class="fas fa-trophy mr-1"></i> ถูกรางวัล
          </span>
          <span class="text-sm text-gray-500">
            ${results.length} รางวัล
          </span>
        `;
        body.appendChild(winningHeader);

        results.forEach(result => {
          const prizeEl = document.createElement("div");
          prizeEl.className = "mb-2 last:mb-0";
          prizeEl.innerHTML = `
            <div class="flex items-center justify-between">
              <div>
                <span class="font-medium text-gray-700">${result.type}</span>
                <span class="prize-number ml-2">${result.number}</span>
              </div>
              <span class="font-bold text-green-600">${result.amount.toLocaleString('th-TH')} บาท</span>
            </div>
          `;
          body.appendChild(prizeEl);
        });
      } else {
        const losingEl = document.createElement("div");
        losingEl.className = "flex items-center justify-center py-2";
        losingEl.innerHTML = `
          <span class="losing-badge">
            <i class="fas fa-times-circle mr-1"></i> ไม่ถูกรางวัล
          </span>
        `;
        body.appendChild(losingEl);
      }

      block.appendChild(body);
      resultArea.appendChild(block);
    });

    if (!hasWinningTickets) {
      const infoBox = document.createElement("div");
      infoBox.className = "text-center py-4 bg-blue-50 rounded-lg";
      infoBox.innerHTML = `
        <i class="fas fa-info-circle text-blue-500 text-2xl mb-2"></i>
        <p class="text-blue-800">ไม่พบบิลที่ถูกรางวัลในงวดนี้</p>
      `;
      resultArea.prepend(infoBox);
    }

  } catch (error) {
    console.error("Error checking tickets:", error);
    resultArea.innerHTML = `
      <div class="text-center py-12 text-red-500">
        <i class="fas fa-exclamation-triangle text-3xl"></i>
        <p class="mt-3">เกิดข้อผิดพลาดในการตรวจผลรางวัล</p>
      </div>
    `;
  }
}

function isPermutation(a, b) {
  return a.split('').sort().join('') === b.split('').sort().join('');
}

// Event Listeners
select.addEventListener("change", () => {
  const selectedDate = select.value;
  loadLottoByDate(selectedDate);
});

// Initialize
loadAllLottoDates();