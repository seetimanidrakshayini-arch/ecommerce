/* ══════════════════════════════════════════
   data.js  —  Product data store
   Mirrors the C backend's catalog[] array
   Uses localStorage for persistence
   ══════════════════════════════════════════ */

const DB_KEY = 'ecs_products';
let nextId   = 1;

/* Load from localStorage or seed demo data */
function loadData() {
  const raw = localStorage.getItem(DB_KEY);
  if (raw) {
    const parsed = JSON.parse(raw);
    nextId = parsed.nextId || 1;
    return parsed.products || [];
  }
  return seedData();
}

function saveData(products) {
  localStorage.setItem(DB_KEY, JSON.stringify({ products, nextId }));
}

function seedData() {
  nextId = 1;
  const demo = [
    { id:1,  name:'Nike Air Zoom Running Shoes',   price:4999,  rating:4.5 },
    { id:2,  name:'Adidas Ultraboost 22',           price:6499,  rating:4.3 },
    { id:3,  name:'Puma Running Pro Shoes',         price:3299,  rating:4.1 },
    { id:4,  name:'Reebok Floatride Energy',        price:5199,  rating:3.9 },
    { id:5,  name:'Samsung Galaxy S24 Ultra',       price:89999, rating:4.7 },
    { id:6,  name:'Apple iPhone 15 Pro',            price:99999, rating:4.8 },
    { id:7,  name:'OnePlus 12 5G',                  price:64999, rating:4.4 },
    { id:8,  name:'Sony WH-1000XM5 Headphones',     price:29999, rating:4.6 },
    { id:9,  name:'Boat Airdopes 141',              price:1499,  rating:3.8 },
    { id:10, name:'Dell Inspiron 15 Laptop',        price:55000, rating:4.2 },
  ];
  nextId = 11;
  saveData(demo);
  return demo;
}

/* ── CRUD ── */

function dbGetAll() {
  return loadData();
}

function dbGetById(id) {
  return loadData().find(p => p.id === id) || null;
}

function dbAdd(name, price, rating) {
  const products = loadData();
  const p = { id: nextId++, name: name.trim(), price, rating };
  products.push(p);
  saveData(products);
  return p;
}

function dbUpdate(id, name, price, rating) {
  const products = loadData();
  const idx = products.findIndex(p => p.id === id);
  if (idx === -1) return null;
  products[idx] = { ...products[idx], name, price, rating };
  saveData(products);
  return products[idx];
}

function dbDelete(id) {
  let products = loadData();
  const exists = products.find(p => p.id === id);
  if (!exists) return false;
  products = products.filter(p => p.id !== id);
  saveData(products);
  return true;
}

function dbCount() {
  return loadData().length;
}