import { fetchAllRounds, fetchRoundData } from "../api/firestore.js";


function parseThaiTextDate(thaiDateStr) {
    const monthsThai = {
        "มกราคม": 1, "กุมภาพันธ์": 2, "มีนาคม": 3, "เมษายน": 4,
        "พฤษภาคม": 5, "มิถุนายน": 6, "กรกฎาคม": 7, "สิงหาคม": 8,
        "กันยายน": 9, "ตุลาคม": 10, "พฤศจิกายน": 11, "ธันวาคม": 12,
    };

    const parts = thaiDateStr.trim().split(" ");
    if (parts.length !== 3) return null;

    const [dayStr, monthStr, yearStr] = parts;
    const day = parseInt(dayStr);
    const month = monthsThai[monthStr];
    const year = parseInt(yearStr) - 543;

    if (!day || !month || !year) return null;

    const pad = (n) => n.toString().padStart(2, "0");
    return `${year}-${pad(month)}-${pad(day)}`;
}


export async function setupLottoDisplay() {
    const roundSelect = document.getElementById("round-select");
    const roundText = document.getElementById("lotto-round");

    const firstPrize = document.getElementById("firstPrize");
    const threeFront = document.getElementById("threeFront");
    const threeBack = document.getElementById("threeBack");
    const twoDigit = document.getElementById("twoDigit");

    const allRawDates = await fetchAllRounds(); // ["1 เมษายน 2568", "16 พฤษภาคม 2568", ...]
    const rounds = allRawDates
        .map(d => ({
            display: d,
            value: parseThaiTextDate(d)
        }))
        .filter(item => item.value !== null)
        .sort((a, b) => b.value.localeCompare(a.value)); // เรียงล่าสุดก่อน

    // Mapping สำหรับแปลงกลับ
    const dateMap = new Map();
    rounds.forEach(r => dateMap.set(r.value, r.display));

    // สร้าง <option>
    roundSelect.innerHTML = rounds.map(r =>
        `<option value="${r.value}">${r.display}</option>`
    ).join("");

    const latest = rounds[0];
    roundSelect.value = latest.value;
    updateDisplay(latest.value);

    roundSelect.addEventListener("change", (e) => {
        updateDisplay(e.target.value);
    });

    async function updateDisplay(dateValue) {
        const dateDisplay = dateMap.get(dateValue);
        if (!dateDisplay) return;

        const data = await fetchRoundData(dateDisplay);
        if (!data) return;

        roundText.textContent = dateDisplay;
        firstPrize.textContent = data.firstPrize || "--";
        threeFront.textContent = (data.threeFront || []).join(" ");
        threeBack.textContent = (data.threeBack || []).join(" ");
        twoDigit.textContent = data.twoDigit || "--";
    }
}
