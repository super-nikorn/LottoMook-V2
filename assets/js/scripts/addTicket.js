import { db } from '../api/firebaseConfig.js';
import {
  collection, doc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('./components/addTicket.html');
  const html = await response.text();
  document.getElementById('dialog-placeholder').innerHTML = html;

  const dialog = document.getElementById('dialogAddTicket');
  const form = document.getElementById('dialogAddTicketForm');
  const buyerInput = document.getElementById('buyerName');
  const currentDate = document.getElementById('currentDate');

  currentDate.textContent = new Date().toLocaleDateString('th-TH', {
    day: 'numeric', month: 'long', year: 'numeric'
  });

  const openButton = document.getElementById('openFormAddTicket');
  openButton?.addEventListener('click', () => dialog.showModal());

  const categories = [
    "บน", "ล่าง", "สามตัวหน้า", "สามตัวท้าย", "สามตัวตรง", "สามตัวโต๊ด"
  ];

  const fieldsContainer = document.getElementById("fieldsContainer");

  categories.forEach(type => {
    const typeId = type + "Fields";
    const section = document.createElement("div");
    section.className = "border p-3 rounded mb-3";
    section.innerHTML = `
      <div class="flex justify-between items-center mb-2">
        <h3 class="font-medium">${type}</h3>
        <button type="button" class="text-blue-600 text-sm" data-add-field="${type}">+ เพิ่ม</button>
      </div>
      <div id="${typeId}"></div>
    `;
    fieldsContainer.appendChild(section);
  });

  // Add / Remove Field Handler
  document.addEventListener('click', e => {
    if (e.target.dataset.addField) {
      addField(e.target.dataset.addField);
    }
    if (e.target.dataset.removeField) {
      removeField(e.target.dataset.removeField);
    }
  });

  function addField(type) {
    const container = document.getElementById(`${type}Fields`);
    const fieldId = `${type}_${Date.now()}`;
    const field = document.createElement("div");
    field.id = fieldId;
    field.className = "flex gap-2 mb-2 items-end";
    field.innerHTML = `
      <div class="flex-1">
        <label class="block text-xs mb-1">เลข</label>
        <input type="text" class="w-full p-2 border rounded" placeholder="กรอกเลข" pattern="\\d{1,3}" required>
      </div>
      <div class="flex-1">
        <label class="block text-xs mb-1">จำนวนเงิน (บาท)</label>
        <input type="number" class="w-full p-2 border rounded" min="1" required>
      </div>
      <button type="button" data-remove-field="${fieldId}" class="text-red-500 p-2">×</button>
    `;
    container.appendChild(field);
  }

  function removeField(fieldId) {
    document.getElementById(fieldId)?.remove();
  }

  function collectFieldData(containerId) {
    const container = document.getElementById(containerId);
    const fields = container.querySelectorAll('div');
    const data = [];

    fields.forEach(field => {
      const inputs = field.querySelectorAll('input');
      if (inputs.length === 2) {
        const number = inputs[0].value.trim();
        const amount = parseInt(inputs[1].value);
        if (number && amount > 0) {
          data.push({ เลข: number, เงิน: amount });
        }
      }
    });

    return data;
  }

  form?.addEventListener('submit', async e => {
    e.preventDefault();

    const buyerName = buyerInput.value.trim();
    if (!buyerName) return alert("กรุณากรอกชื่อผู้ซื้อ");

    const ticketData = {
      ผู้ซื้อ: buyerName,
      วันที่: serverTimestamp(),
      ประเภท: {},
      สถานะ: "ยังไม่ประกาศผล"
    };

    categories.forEach(cat => {
      ticketData.ประเภท[cat] = collectFieldData(`${cat}Fields`);
    });

    try {
      const docId = `${buyerName}_${Date.now()}`;
      await setDoc(doc(collection(db, "lottery"), docId), ticketData);

      alert("บันทึกข้อมูลเรียบร้อยแล้ว");
      dialog.close();
      form.reset();

      // ลบฟิลด์ทั้งหมด
      document.querySelectorAll('[id$="Fields"]').forEach(c => c.innerHTML = "");
    } catch (err) {
      console.error("Firestore Error:", err);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    }
  });
});
