const KEYS = {
  masuk: "inv_barang_masuk_v3",
  pesanan: "inv_proses_pesanan_v3"
};

const sampleMasuk = [
  {id:"bm1",tanggal:"2026-02-15",sku:"02-AFO/Oxynic-Air-Fryer-23L",lokasi:"59",milik:"JA",jumlah:2,catatan:""},
  {id:"bm2",tanggal:"2026-02-15",sku:"02-AFO/Oxynic-Air-Fryer-23L",lokasi:"61",milik:"JA",jumlah:1,catatan:""},
  {id:"bm3",tanggal:"2026-02-15",sku:"1180C/INTACH",lokasi:"59",milik:"JA",jumlah:1,catatan:""},
  {id:"bm4",tanggal:"2026-02-15",sku:"1400PTGETRA",lokasi:"59",milik:"JA",jumlah:6,catatan:""}
];

// Sengaja kosong: belum ada Proses Pesanan.
const samplePesanan = [];

const NAV_ITEMS = [
  ["index.html","Dashboard","dashboard"],
  ["barang-masuk.html","Barang Masuk","barang-masuk"],
  ["titip-vendords.html","Titip VendorDS","titip-vendords"],
  ["proses-pesanan.html","Proses Pesanan","proses-pesanan"],
  ["stok-realtime.html","Stok Realtime","stok-realtime"],
  ["pesanan-ds.html","PESANAN DS","pesanan-ds"],
  ["stok-ds.html","Stok DS (ON PROGRESS)","stok-ds"],
  ["sku-master.html","SKU Master","sku-master"],
  ["ds-smntara.html","DS smntara","ds-smntara"]
];

function renderNavigation(activePage){
  const el=document.getElementById("sidebar");
  if(!el)return;
  el.innerHTML=`<div class="brand">Inventori JADS</div><nav class="nav">${
    NAV_ITEMS.map(([href,label,key])=>`<a href="${href}" class="${key===activePage?"active":""}">${label}</a>`).join("")
  }</nav>`;
}

function uid(){
  return (window.crypto&&crypto.randomUUID)?crypto.randomUUID():Date.now().toString(36)+Math.random().toString(36).slice(2);
}
function readData(key,fallback){
  const raw=localStorage.getItem(key);
  if(!raw){localStorage.setItem(key,JSON.stringify(fallback));return [...fallback]}
  try{return JSON.parse(raw)}catch{return [...fallback]}
}
function saveData(key,data){localStorage.setItem(key,JSON.stringify(data))}
function esc(value=""){return String(value).replace(/[&<>"']/g,s=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[s]))}
function formatDate(value){if(!value)return"-";return new Date(value+"T00:00:00").toLocaleDateString("id-ID")}
function setNotice(id,text,type="success"){
  const el=document.getElementById(id);if(!el)return;
  el.textContent=text;el.className=`notice show ${type}`;
  setTimeout(()=>el.className="notice",2600);
}
function statusBadge(status){
  const s=String(status||"").toLowerCase();
  if(s.includes("dikirim"))return"green";if(s.includes("pesanan"))return"blue";if(s.includes("qc"))return"amber";return"gray";
}
function setupSkuSuggestions(inputId,listId){
  const input=document.getElementById(inputId);const list=document.getElementById(listId);
  if(!input||!list||typeof SKU_MASTER==="undefined")return;
  list.innerHTML=SKU_MASTER.map(x=>`<option value="${esc(x.sku)}">${esc(x.nama)}</option>`).join("");
}
function hitungStokRealtime(dataMasuk,dataPesanan){
  const map=new Map();
  for(const item of dataMasuk){
    const sku=String(item.sku||"").trim();if(!sku)continue;const key=sku.toLowerCase();
    if(!map.has(key))map.set(key,{sku,totalMasuk:0,totalKeluar:0,lokasi:new Set(),milik:new Set()});
    const row=map.get(key);row.totalMasuk+=Number(item.jumlah||0);
    if(item.lokasi)row.lokasi.add(String(item.lokasi));if(item.milik)row.milik.add(String(item.milik));
  }
  for(const item of dataPesanan){
    const sku=String(item.sku||"").trim();if(!sku)continue;const key=sku.toLowerCase();
    if(!map.has(key))map.set(key,{sku,totalMasuk:0,totalKeluar:0,lokasi:new Set(),milik:new Set()});
    const row=map.get(key);row.totalKeluar+=Number(item.jumlah||0);
    if(item.lokasi)row.lokasi.add(String(item.lokasi));if(item.penjual)row.milik.add(String(item.penjual));
  }
  return [...map.values()].map(x=>({...x,lokasi:[...x.lokasi].sort(),milik:[...x.milik].sort(),stokAkhir:x.totalMasuk-x.totalKeluar}))
    .sort((a,b)=>a.sku.localeCompare(b.sku));
}
