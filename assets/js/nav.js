export function setupMenuToggle() {
    const menuBtn = document.getElementById("menuBtn");
    const mobileMenu = document.getElementById("mobileMenu");

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener("click", () => {
            mobileMenu.classList.toggle("hidden");
        });
    }
}

export function setupLogoutButton() {
    const logoutBtns = document.querySelectorAll(".logoutBtn");
    logoutBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            window.location.href = "index.html";
        });
    });
}
