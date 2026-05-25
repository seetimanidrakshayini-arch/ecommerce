/* ══════════════════════════════════════════
   app.js  —  UI Controller
   ══════════════════════════════════════════ */

let currentResults = null; /* after search/sort, table shows these */

/* ── INIT ── */
document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  renderTable();
  updateStats();

  /* search algo toggle */
  document.getElementById('search-algo').addEventListener('change', function() {
    const byId = this.value === 'binary-id';
    document.getElementById('search-kw-group').style.display = byId ? 'none' : '';
    document.getElementById('search-id-group').style.display = byId ? '' : 'none';
  });

  /* del-id preview on input */
  document.getElementById('del-id').addEventListener('input', function() {
    const id = parseInt(this.value);
    const p = dbGetById(id);
    const div = document.getElementById('del-preview');
    if (p) {
      div.style.display = 'block';
      div.innerHTML = `<strong>${p.name}</strong> &nbsp;·&nbsp; ₹${p.price.toLocaleString()} &nbsp;·&nbsp; ★${p.rating}`;
    } else {
      div.style.display = 'none';
    }
  });
});

/* ── TABS ── */
function initTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      tab.classList.add('active');
      document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
    });
  });
}

/* ── STATS ── */
function updateStats() {
  document.getElementById('stat-total').textContent = dbCount();
}

/* ── TOAST ── */
function showToast(msg, type='') {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.className = 'toast show ' + type;
  setTimeout(() => t.className = 'toast', 2500);
}

/* ── TRACE ── */
function renderTrace(traceArr) {
  const log = document.getElementById('trace-log');
  log.innerHTML = traceArr.map(t =>
    `<div class="trace-line ${t.type}">${escHtml(t.msg)}</div>`
  ).join('');
  log.scrollTop = log.scrollHeight;
}

function clearTrace() {
  document.getElementById('trace-log').innerHTML =
    '<div class="trace-line muted">Run a search or sort to see the algorithm steps here…</div>';
}

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

/* ── TABLE ── */
function renderTable(data, highlightIds) {
  const products = data || dbGetAll();
  const tbody = document.getElementById('table-body');

  if (products.length === 0) {
    tbody.innerHTML = '<tr class="no-results"><td colspan="5">No products found.</td></tr>';
    return;
  }

  tbody.innerHTML = products.map(p => {
    const stars = '★'.repeat(Math.floor(p.rating)) + '☆'.repeat(5 - Math.floor(p.rating));
    const highlight = highlightIds && highlightIds.includes(p.id) ? 'highlight-row' : '';
    return `
    <tr class="${highlight}" id="row-${p.id}">
      <td><span class="badge-id">#${p.id}</span></td>
      <td class="product-name">${escHtml(p.name)}</td>
      <td class="price">₹${p.price.toLocaleString()}</td>
      <td>
        <span class="stars">${stars}</span>
        <span class="rating-val">${p.rating.toFixed(1)}</span>
      </td>
      <td>
        <div class="action-btns">
          <button class="edit-btn" onclick="quickEdit(${p.id})">✏ Edit</button>
          <button class="del-btn"  onclick="quickDelete(${p.id})">🗑</button>
        </div>
      </td>
    </tr>`;
  }).join('');

  updateStats();
}

function filterTable() {
  const kw = document.getElementById('live-search').value.toLowerCase();
  const products = (currentResults || dbGetAll()).filter(p =>
    p.name.toLowerCase().includes(kw) ||
    String(p.id).includes(kw) ||
    String(p.price).includes(kw)
  );
  renderTable(products);
}

/* ── COLUMN SORT ── */
let colSortDir = {};
function sortTableCol(col) {
  const products = currentResults || dbGetAll();
  const dir = colSortDir[col] = !(colSortDir[col]);
  const keys = ['id','name','price','rating'];
  const key = keys[col];
  const sorted = [...products].sort((a,b) => {
    if (typeof a[key] === 'string')
      return dir ? a[key].localeCompare(b[key]) : b[key].localeCompare(a[key]);
    return dir ? a[key]-b[key] : b[key]-a[key];
  });
  renderTable(sorted);
}

/* ── CRUD HANDLERS ── */

function addProduct() {
  const name   = document.getElementById('add-name').value.trim();
  const price  = parseFloat(document.getElementById('add-price').value);
  const rating = parseFloat(document.getElementById('add-rating').value);
  const msg    = document.getElementById('add-msg');

  if (!name)               return setMsg(msg, 'Product name is required.', 'error');
  if (isNaN(price) || price < 0)   return setMsg(msg, 'Enter a valid price.', 'error');
  if (isNaN(rating) || rating < 0 || rating > 5)
                           return setMsg(msg, 'Rating must be 0–5.', 'error');

  const p = dbAdd(name, price, rating);
  setMsg(msg, `✔ Added: "${p.name}" (ID: ${p.id})`, 'success');
  showToast('Product added!', 'success');

  document.getElementById('add-name').value  = '';
  document.getElementById('add-price').value = '';
  document.getElementById('add-rating').value= '';

  currentResults = null;
  renderTable();
  updateStats();
}

function loadForUpdate() {
  const id = parseInt(document.getElementById('upd-id').value);
  const p  = dbGetById(id);
  const msg = document.getElementById('upd-msg');

  if (!p) return setMsg(msg, `Product ID ${id} not found.`, 'error');

  document.getElementById('upd-name').value   = p.name;
  document.getElementById('upd-price').value  = p.price;
  document.getElementById('upd-rating').value = p.rating;
  document.getElementById('upd-fields').style.display = 'block';
  setMsg(msg, '', '');
}

function updateProduct() {
  const id     = parseInt(document.getElementById('upd-id').value);
  const name   = document.getElementById('upd-name').value.trim();
  const price  = parseFloat(document.getElementById('upd-price').value);
  const rating = parseFloat(document.getElementById('upd-rating').value);
  const msg    = document.getElementById('upd-msg');

  if (!name)              return setMsg(msg, 'Name cannot be empty.', 'error');
  if (isNaN(price))       return setMsg(msg, 'Invalid price.', 'error');
  if (rating < 0 || rating > 5) return setMsg(msg, 'Rating must be 0–5.', 'error');

  const updated = dbUpdate(id, name, price, rating);
  if (!updated) return setMsg(msg, `ID ${id} not found.`, 'error');

  setMsg(msg, `✔ Updated: "${updated.name}"`, 'success');
  showToast('Product updated!', 'success');
  document.getElementById('upd-fields').style.display = 'none';
  currentResults = null;
  renderTable();
}

function deleteProduct() {
  const id  = parseInt(document.getElementById('del-id').value);
  const msg = document.getElementById('del-msg');
  const p   = dbGetById(id);

  if (!p) return setMsg(msg, `ID ${id} not found.`, 'error');

  if (!confirm(`Delete "${p.name}"?`)) return;

  dbDelete(id);
  setMsg(msg, `✔ Deleted: "${p.name}"`, 'success');
  showToast('Product deleted.', 'error');
  document.getElementById('del-preview').style.display = 'none';
  document.getElementById('del-id').value = '';
  currentResults = null;
  renderTable();
  updateStats();
}

/* ── QUICK EDIT / DELETE from table ── */
function quickEdit(id) {
  const p = dbGetById(id);
  if (!p) return;
  document.getElementById('upd-id').value    = id;
  document.getElementById('upd-name').value  = p.name;
  document.getElementById('upd-price').value = p.price;
  document.getElementById('upd-rating').value= p.rating;
  document.getElementById('upd-fields').style.display = 'block';
  document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
  document.querySelector('[data-tab="update"]').classList.add('active');
  document.getElementById('tab-update').classList.add('active');
}

function quickDelete(id) {
  const p = dbGetById(id);
  if (!p || !confirm(`Delete "${p.name}"?`)) return;
  dbDelete(id);
  showToast('Deleted.', 'error');
  currentResults = null;
  renderTable();
  updateStats();
}

/* ── SEARCH ── */
function runSearch() {
  const algo = document.getElementById('search-algo').value;
  const msg  = document.getElementById('search-msg');
  const products = dbGetAll();

  let res;

  if (algo === 'linear') {
    const kw = document.getElementById('search-kw').value.trim();
    if (!kw) return setMsg(msg, 'Enter a keyword.', 'error');
    res = linearSearch(products, kw);

  } else if (algo === 'binary-name') {
    const kw = document.getElementById('search-kw').value.trim();
    if (!kw) return setMsg(msg, 'Enter a name prefix.', 'error');
    res = binarySearchByName(products, kw);

  } else {
    const id = parseInt(document.getElementById('search-id').value);
    if (isNaN(id)) return setMsg(msg, 'Enter a valid ID.', 'error');
    res = binarySearchById(products, id);
  }

  const algoNames = {
    'linear':      'Linear Search — O(n)',
    'binary-name': 'Binary Search by Name — O(log n)',
    'binary-id':   'Binary Search by ID — O(log n)'
  };
  document.getElementById('last-algo').textContent = algoNames[algo];

  const ids = res.results.map(p => p.id);
  currentResults = res.results.length ? res.results : null;

  renderTable(res.results.length ? res.results : products, ids);
  renderTrace(res.trace);

  if (res.results.length === 0) {
    setMsg(msg, 'No products found.', 'error');
  } else {
    setMsg(msg, `✔ Found ${res.results.length} result(s).`, 'success');
  }
}

/* ── SORT ── */
function runSort(algo) {
  const products = dbGetAll();
  const msg = document.getElementById('sort-msg');
  let res;

  const algoMap = {
    bubble:    { fn: () => bubbleSort(products),    label: 'Bubble Sort — O(n²)' },
    selection: { fn: () => selectionSort(products), label: 'Selection Sort — O(n²)' },
    insertion: { fn: () => insertionSort(products), label: 'Insertion Sort — O(n²)' },
    quick:     { fn: () => quickSort(products),     label: 'Quick Sort — O(n log n)' },
    merge:     { fn: () => mergeSort(products),     label: 'Merge Sort — O(n log n)' },
  };

  res = algoMap[algo].fn();
  document.getElementById('last-algo').textContent = algoMap[algo].label;

  currentResults = res.results;
  renderTable(res.results);
  renderTrace(res.trace);
  setMsg(msg, `✔ Sorted using ${algoMap[algo].label}`, 'success');
}

/* ── HELPER ── */
function setMsg(el, text, type) {
  el.textContent = text;
  el.className   = 'msg ' + type;
}