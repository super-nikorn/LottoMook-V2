export async function fetchLatestLottoResults() {
    try {
        const response = await fetch("https://lotto.api.rayriffy.com/latest");
        const data = await response.json();
        return data.response;
    } catch (error) {
        console.error("❌ ดึงข้อมูลหวยล้มเหลว:", error);
        return null;
    }
}
