// 📁 assets/js/date.js

export function setCurrentDate() {
    const now = new Date();
    const formattedDate = now.toLocaleDateString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });

    const dateElement = document.getElementById("currentDate");
    if (dateElement) {
        dateElement.textContent = formattedDate;
    }
}
