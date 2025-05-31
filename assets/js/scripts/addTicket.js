document.addEventListener('DOMContentLoaded', async function() {
  // โหลดเนื้อหา dialog จากไฟล์ addTicket.html
  const response = await fetch('./components/addTicket.html');
  const html = await response.text();
  document.getElementById('dialog-placeholder').innerHTML = html;

  // หาปุ่มและ dialog หลังจากโหลดเสร็จ
  const openButton = document.getElementById('openFormAddTicket');
  const dialog = document.getElementById('dialogAddTicket');

  if (openButton && dialog) {
    openButton.addEventListener('click', () => {
      dialog.showModal();
    });
  }
});