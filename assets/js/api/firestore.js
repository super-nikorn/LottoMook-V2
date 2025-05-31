import { db } from "./firebaseConfig.js";
import {
    doc,
    getDoc,
    setDoc,
    getDocs,
    collection
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import { fetchLatestLottoResults } from "./lotteryAPI.js";

// ตรวจว่าข้อมูลงวดนี้มีหรือยัง
export async function checkIfRoundExists(date) {
    const ref = doc(db, "recordLotteryResults", date);
    const snap = await getDoc(ref);
    return snap.exists();
}

// ✅ บันทึกเฉพาะข้อมูลที่ต้องการ
export async function saveLottoResultFiltered() {
    const data = await fetchLatestLottoResults();

    if (!data) {
        console.log("❌ ไม่สามารถดึงข้อมูลหวยได้");
        return;
    }

    const exists = await checkIfRoundExists(data.date);
    if (exists) {
        console.log(`ℹ️ งวด ${data.date} มีอยู่แล้วในฐานข้อมูล`);
    }

    const filtered = {
        date: data.date,
        firstPrize: data.prizes.find(p => p.id === "prizeFirst")?.number[0] || "--",
        threeFront: data.runningNumbers.find(p => p.id === "runningNumberFrontThree")?.number || [],
        threeBack: data.runningNumbers.find(p => p.id === "runningNumberBackThree")?.number || [],
        twoDigit: data.runningNumbers.find(p => p.id === "runningNumberBackTwo")?.number[0] || "--",
    };

    const ref = doc(db, "recordLotteryResults", filtered.date);
    await setDoc(ref, filtered);
    // แสดงข้อมูลใน console
    console.log(`✅ บันทึกงวด ${filtered.date} แล้ว`);
    console.log(`🎯 รางวัลที่ 1: ${filtered.firstPrize}`);
    console.log(`🔢 3 ตัวหน้า: ${filtered.threeFront.join(", ")}`);
    console.log(`🔢 3 ตัวท้าย: ${filtered.threeBack.join(", ")}`);
    console.log(`🔚 2 ตัวท้าย: ${filtered.twoDigit}`);
    return

}
saveLottoResultFiltered();


export async function fetchAllRounds() {
    const snapshot = await getDocs(collection(db, "recordLotteryResults"));
    const rounds = [];
    snapshot.forEach(doc => {
        rounds.push(doc.id); // doc.id คือวันที่ของงวด
    });
    // เรียงจากล่าสุดไปเก่าสุด
    return rounds.sort((a, b) => new Date(b) - new Date(a));
}

// ดึงข้อมูลรางวัลของงวดที่เลือก
export async function fetchRoundData(date) {
    const ref = doc(db, "recordLotteryResults", date);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return snap.data();
}