import { setupMenuToggle, setupLogoutButton } from "./nav.js";
import { setupLottoDisplay } from "../js/scripts/lottoDisplay.js";

async function loadComponent(url, containerId) {
    try {
        const response = await fetch(url);
        if (!response.ok) throw new Error(`ไม่สามารถโหลด ${url}`);
        const html = await response.text();
        document.getElementById(containerId).innerHTML = html;
        return true;
    } catch (error) {
        console.error(`เกิดข้อผิดพลาดในการโหลด ${url}:`, error);
        return false;
    }
}

async function init() {
    await loadComponent("components/nav.html", "nav-placeholder");
    await loadComponent("components/lottoDisplay.html", "lotto-placeholder");
    setupMenuToggle();
    setupLogoutButton();
    setupLottoDisplay(); // 🔁 เพิ่มการเรียกใช้
}
init();
