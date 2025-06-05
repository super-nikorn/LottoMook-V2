document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("formContainer");

  // โหลดไฟล์ HTML ที่เป็นฟอร์ม
  const response = await fetch("home.html");
  const html = await response.text();
  container.innerHTML = html;

  // เมื่อโหลดเสร็จ ค่อยผูก event ต่างๆ
  const openBtn = document.getElementById("openFormBtn");
  const closeBtn = document.getElementById("closeFormBtn");
  const dialog = document.getElementById("formDialog");
  const form = document.getElementById("lottoForm");

  openBtn.addEventListener("click", () => {
    dialog.style.display = "flex";
  });

  closeBtn.addEventListener("click", () => {
    dialog.style.display = "none";
  });

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const number = form.number.value;
    const price = form.price.value;
    console.log("ส่งโพย:", { number, price });
    form.reset();
    dialog.style.display = "none";
  });
});
