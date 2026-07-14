const KEYS = {
  masuk: "inv_barang_masuk",
  pesanan: "inv_proses_pesanan"
};

const sampleMasuk = [
  {id:"bm1", tanggal:"2026-02-15", sku:"02-AFO/Oxynic-Air-Fryer-23L", lokasi:"59", milik:"JA", jumlah:2, catatan:""},
  {id:"bm2", tanggal:"2026-02-15", sku:"02-AFO/Oxynic-Air-Fryer-23L", lokasi:"61", milik:"JA", jumlah:1, catatan:""},
  {id:"bm3", tanggal:"2026-02-15", sku:"1180C/INTACH", lokasi:"59", milik:"JA", jumlah:1, catatan:""},
  {id:"bm4", tanggal:"2026-02-15", sku:"1400PTGETRA", lokasi:"59", milik:"JA", jumlah:6, catatan:""}
];

const samplePesanan = [
  {id:"pp1", tanggal:"2026-04-21", noPo:"PO 56", pelanggan:"Diar Kusuma Putra", sku:"DS-GT-433/SS201", lokasi:"61", penjual:"JA", jumlah:1, status:"04 Dikirim", prioritas:"Segera Kirim", sales:"Wulan", packing:"Standar", pengiriman:"Dibawa Langsung", alamat:"Jl. Manyar Jaya Praja V", tanggalKirim:"2026-04-21", catatan:""},
  {id:"pp2", tanggal:"2026-04-21", noPo:"PO 56", pelanggan:"Hair susanto", sku:"DS-GT-433/SS201", lokasi:"61", penjual:"JA", jumlah:2, status:"04 Dikirim", prioritas:"Segera Kirim", sales:"Kevin", packing:"Standar", pengiriman:"Dibawa Langsung", alamat:"Sunan Mulya No. 42 Tuban", tanggalKirim:"2026-04-21", catatan:""},
  {id:"pp3", tanggal:"2026-04-21", noPo:"", pelanggan:"Rangga", sku:"DS-FP-1/6-4", lokasi:"61", penjual:"JA", jumlah:1, status:"04 Dikirim", prioritas:"Normal", sales:"Wulan", packing:"Standar", pengiriman:"Dibawa Langsung", alamat:"Sepanjang Taman Sidoarjo", tanggalKirim:"2026-04-21", catatan:""}
];

function uid() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function readData(key, fallback) {
  const raw = localStorage.getItem(key);
  if (!raw) {
    localStorage.setItem(key, JSON.stringify(fallback));
    return [...fallback];
  }
  try { return JSON.parse(raw); } catch { return [...fallback]; }
}

function saveData(key, data) {
  localStorage.setItem(key, JSON.stringify(data));
}

function esc(value="") {
  return String(value).replace(/[&<>"']/g, s => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#039;"
  }[s]));
}

function formatDate(value) {
  if (!value) return "-";
  return new Date(value + "T00:00:00").toLocaleDateString("id-ID");
}

function setNotice(id, text, type="success") {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = text;
  el.className = `notice show ${type}`;
  setTimeout(() => el.className = "notice", 2500);
}

function statusBadge(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("dikirim")) return "green";
  if (s.includes("pesanan")) return "blue";
  if (s.includes("qc")) return "amber";
  return "gray";
}

function hitungStokRealtime(dataMasuk, dataPesanan) {
  const map = new Map();

  for (const item of dataMasuk) {
    const sku = String(item.sku || "").trim();
    if (!sku) continue;
    const key = sku.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        sku,
        totalMasuk: 0,
        totalKeluar: 0,
        lokasi: new Set(),
        milik: new Set()
      });
    }

    const row = map.get(key);
    row.totalMasuk += Number(item.jumlah || 0);

    if (item.lokasi) row.lokasi.add(String(item.lokasi));
    if (item.milik) row.milik.add(String(item.milik));
  }

  for (const item of dataPesanan) {
    const sku = String(item.sku || "").trim();
    if (!sku) continue;
    const key = sku.toLowerCase();

    if (!map.has(key)) {
      map.set(key, {
        sku,
        totalMasuk: 0,
        totalKeluar: 0,
        lokasi: new Set(),
        milik: new Set()
      });
    }

    const row = map.get(key);
    row.totalKeluar += Number(item.jumlah || 0);

    if (item.lokasi) row.lokasi.add(String(item.lokasi));
    if (item.penjual) row.milik.add(String(item.penjual));
  }

  return [...map.values()]
    .map(item => ({
      sku: item.sku,
      lokasi: [...item.lokasi].sort(),
      milik: [...item.milik].sort(),
      totalMasuk: item.totalMasuk,
      totalKeluar: item.totalKeluar,
      stokAkhir: item.totalMasuk - item.totalKeluar
    }))
    .sort((a, b) => a.sku.localeCompare(b.sku));
}

