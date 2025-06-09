import { db } from '../api/firebaseConfig.js';
import {
    doc,
    getDoc,
    setDoc,
    Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export async function saveBlockedNumbers() {
    const text = document.getElementById("blockedNumberInput").value.trim();
    const user = localStorage.getItem("activeUser") || "default";

    if (!text) {
        alert("กรุณาป้อนเลขที่กำหนด")
        return;
    }

    // คำนวณวันที่งวดหวย
    const now = new Date();
    const currentMonth = now.getMonth();
    const day = now.getDate();
    const year = now.getFullYear();
    const lottoRoundDate = new Date(year, currentMonth, day >= 16 ? 1 : 16);
    const roundStr = lottoRoundDate.toISOString().split("T")[0];

    const lines = text.split("\n").map(line => line.trim()).filter(Boolean);
    const blocked = { twoDigits: [], threeDigits: [] };

    lines.forEach(line => {
        const numbers = line.split(/\s+/).map(num => num.trim()).filter(Boolean);

        numbers.forEach(num => {
            if (/^\d{2}$/.test(num)) {
                blocked.twoDigits.push(num);
            } else if (/^\d{3}$/.test(num)) {
                blocked.threeDigits.push(num);
            } else {
                console.warn("❌ ข้ามเลขไม่ถูกต้อง:", num);
            }
        });
    });
    const colName = `blockedNumbers${capitalize(user)}`;
    const docRef = doc(db, colName, roundStr);

    try {
        const existingSnap = await getDoc(docRef);
        let existingData = { twoDigits: [], threeDigits: [] };

        if (existingSnap.exists()) {
            const data = existingSnap.data();
            existingData = {
                twoDigits: data.blocked?.twoDigits || [],
                threeDigits: data.blocked?.threeDigits || [],
            };
        }

        // รวมเลขใหม่ + เก่า โดยเอาเลขไม่ซ้ำ
        const combined = {
            twoDigits: Array.from(new Set([...existingData.twoDigits, ...blocked.twoDigits])),
            threeDigits: Array.from(new Set([...existingData.threeDigits, ...blocked.threeDigits])),
        };

        const payload = {
            user,
            round: roundStr,
            timestamp: Timestamp.now(),
            blocked: combined,
        };

        await setDoc(docRef, payload);
        alert("✅ บันทึกเลขอั้นเรียบร้อยแล้ว");
        document.getElementById("blockedNumberInput").value = "";
        closeBlockDialog();

    } catch (err) {
        console.error("❌ บันทึกเลขอั้นล้มเหลว:", err);
        alert("❌ ไม่สามารถบันทึกเลขอั้นได้");
    }
}

export async function getBlockedNumbers() {
    const user = localStorage.getItem("activeUser") || "default";
    const now = new Date();
    const currentMonth = now.getMonth();
    const day = now.getDate();
    const year = now.getFullYear();
    const lottoRoundDate = new Date(year, currentMonth, day >= 16 ? 1 : 16);
    const roundStr = lottoRoundDate.toISOString().split("T")[0];
    const colName = `blockedNumbers${capitalize(user)}`;
    const docRef = doc(db, colName, roundStr);

    try {
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return docSnap.data().blocked || { twoDigits: [], threeDigits: [] };
        }
        return { twoDigits: [], threeDigits: [] };
    } catch (err) {
        console.error("❌ เกิดข้อผิดพลาดในการดึงเลขอั้น:", err);
        return { twoDigits: [], threeDigits: [] };
    }
}


export function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

export function closeBlockDialog() {
    document.getElementById("blockNumberDialog").close();
}
