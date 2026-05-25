/* ══════════════════════════════════════════
   algorithms.js
   JS implementations mirroring the C backend:
   • Linear Search
   • Binary Search (by ID and name prefix)
   • Bubble Sort, Selection Sort, Insertion Sort
   • Quick Sort, Merge Sort
   Each function returns { results, trace[] }
   ══════════════════════════════════════════ */

/* ─── SEARCHING ─── */

/* 1. Linear Search — O(n) */
function linearSearch(products, keyword) {
  const trace = [];
  const results = [];
  const kw = keyword.toLowerCase();

  trace.push({ type:'info', msg:`Linear Search: scanning ${products.length} products for "${keyword}"` });
  trace.push({ type:'step', msg:`Complexity: O(n) — checks every product one by one` });

  for (let i = 0; i < products.length; i++) {
    const match = products[i].name.toLowerCase().includes(kw);
    trace.push({
      type: match ? 'found' : 'step',
      msg:  `[${i}] "${products[i].name}" → ${match ? '✔ MATCH' : '✗ skip'}`
    });
    if (match) results.push(products[i]);
  }

  trace.push({ type:'info', msg:`Done. Found ${results.length} result(s).` });
  return { results, trace };
}

/* 2. Binary Search by ID — O(log n) */
function binarySearchById(products, id) {
  const trace = [];
  const sorted = [...products].sort((a, b) => a.id - b.id);

  trace.push({ type:'info', msg:`Binary Search by ID: target = ${id}` });
  trace.push({ type:'step', msg:`Array sorted by ID. Complexity: O(log n)` });

  let lo = 0, hi = sorted.length - 1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    trace.push({ type:'step', msg:`lo=${lo} hi=${hi} mid=${mid} → checking ID ${sorted[mid].id}` });

    if (sorted[mid].id === id) {
      trace.push({ type:'found', msg:`✔ Found: "${sorted[mid].name}" at index ${mid}` });
      return { results: [sorted[mid]], trace };
    } else if (sorted[mid].id < id) {
      trace.push({ type:'step', msg:`${sorted[mid].id} < ${id} → search right half` });
      lo = mid + 1;
    } else {
      trace.push({ type:'step', msg:`${sorted[mid].id} > ${id} → search left half` });
      hi = mid - 1;
    }
  }

  trace.push({ type:'info', msg:`✗ ID ${id} not found.` });
  return { results: [], trace };
}

/* 3. Binary Search by Name Prefix — O(log n) */
function binarySearchByName(products, prefix) {
  const trace = [];
  const sorted = [...products].sort((a, b) => a.name.localeCompare(b.name));
  const kw = prefix.toLowerCase();
  const results = [];

  trace.push({ type:'info', msg:`Binary Search by name prefix: "${prefix}"` });
  trace.push({ type:'step', msg:`Array sorted alphabetically. Complexity: O(log n)` });

  let lo = 0, hi = sorted.length - 1, first = -1;

  while (lo <= hi) {
    const mid = Math.floor((lo + hi) / 2);
    const cmp = sorted[mid].name.toLowerCase().localeCompare(kw);
    trace.push({ type:'step', msg:`lo=${lo} hi=${hi} mid=${mid} → "${sorted[mid].name}"` });

    if (sorted[mid].name.toLowerCase().startsWith(kw)) {
      first = mid; hi = mid - 1;
      trace.push({ type:'found', msg:`Prefix match at index ${mid}` });
    } else if (cmp < 0) {
      trace.push({ type:'step', msg:`"${sorted[mid].name}" < prefix → go right` });
      lo = mid + 1;
    } else {
      trace.push({ type:'step', msg:`"${sorted[mid].name}" > prefix → go left` });
      hi = mid - 1;
    }
  }

  if (first !== -1) {
    for (let i = first; i < sorted.length && sorted[i].name.toLowerCase().startsWith(kw); i++)
      results.push(sorted[i]);
  }

  trace.push({ type:'info', msg:`Done. Found ${results.length} result(s).` });
  return { results, trace };
}

/* ─── SORTING ─── */

/* 1. Bubble Sort — price ascending — O(n²) */
function bubbleSort(products) {
  const trace = [];
  const arr = [...products];
  const n = arr.length;
  let swaps = 0;

  trace.push({ type:'info', msg:`Bubble Sort: sort by price ↑ — O(n²)` });

  for (let i = 0; i < n - 1; i++) {
    for (let j = 0; j < n - i - 1; j++) {
      if (arr[j].price > arr[j+1].price) {
        trace.push({ type:'swap', msg:`Swap [${j}]₹${arr[j].price} ↔ [${j+1}]₹${arr[j+1].price}` });
        [arr[j], arr[j+1]] = [arr[j+1], arr[j]];
        swaps++;
      }
    }
    trace.push({ type:'step', msg:`Pass ${i+1} done. Largest in position ${n-i-1}.` });
  }

  trace.push({ type:'info', msg:`Bubble Sort done. Total swaps: ${swaps}` });
  return { results: arr, trace };
}

/* 2. Selection Sort — rating descending — O(n²) */
function selectionSort(products) {
  const trace = [];
  const arr = [...products];
  const n = arr.length;
  let swaps = 0;

  trace.push({ type:'info', msg:`Selection Sort: sort by rating ↓ — O(n²)` });

  for (let i = 0; i < n - 1; i++) {
    let maxIdx = i;
    for (let j = i + 1; j < n; j++) {
      if (arr[j].rating > arr[maxIdx].rating) maxIdx = j;
    }
    if (maxIdx !== i) {
      trace.push({ type:'swap', msg:`Select max ★${arr[maxIdx].rating} at [${maxIdx}], swap with [${i}]` });
      [arr[i], arr[maxIdx]] = [arr[maxIdx], arr[i]];
      swaps++;
    }
    trace.push({ type:'step', msg:`Pass ${i+1}: position ${i} fixed → ★${arr[i].rating}` });
  }

  trace.push({ type:'info', msg:`Selection Sort done. Total swaps: ${swaps}` });
  return { results: arr, trace };
}

/* 3. Insertion Sort — name A→Z — O(n²) */
function insertionSort(products) {
  const trace = [];
  const arr = [...products];
  const n = arr.length;
  let shifts = 0;

  trace.push({ type:'info', msg:`Insertion Sort: sort by name A→Z — O(n²)` });

  for (let i = 1; i < n; i++) {
    const key = arr[i];
    let j = i - 1;
    trace.push({ type:'step', msg:`Insert "${key.name}" into sorted portion [0..${i-1}]` });
    while (j >= 0 && arr[j].name.localeCompare(key.name) > 0) {
      arr[j+1] = arr[j]; j--; shifts++;
    }
    arr[j+1] = key;
    trace.push({ type:'step', msg:`Placed at index ${j+1}` });
  }

  trace.push({ type:'info', msg:`Insertion Sort done. Total shifts: ${shifts}` });
  return { results: arr, trace };
}

/* 4. Quick Sort — price ascending — O(n log n) avg */
function quickSort(products) {
  const trace = [];
  const arr = [...products];

  trace.push({ type:'info', msg:`Quick Sort: sort by price ↑ — O(n log n) avg` });

  function partition(a, lo, hi) {
    const pivot = a[hi].price;
    trace.push({ type:'step', msg:`Partition [${lo}..${hi}] pivot=₹${pivot}` });
    let i = lo - 1;
    for (let j = lo; j < hi; j++) {
      if (a[j].price <= pivot) {
        i++;
        if (i !== j) {
          trace.push({ type:'swap', msg:`Swap [${i}]₹${a[i].price} ↔ [${j}]₹${a[j].price}` });
          [a[i], a[j]] = [a[j], a[i]];
        }
      }
    }
    [a[i+1], a[hi]] = [a[hi], a[i+1]];
    trace.push({ type:'found', msg:`Pivot ₹${pivot} placed at index ${i+1}` });
    return i + 1;
  }

  function qs(a, lo, hi) {
    if (lo < hi) {
      const pi = partition(a, lo, hi);
      qs(a, lo, pi - 1);
      qs(a, pi + 1, hi);
    }
  }

  qs(arr, 0, arr.length - 1);
  trace.push({ type:'info', msg:`Quick Sort done.` });
  return { results: arr, trace };
}

/* 5. Merge Sort — rating descending — O(n log n) */
function mergeSort(products) {
  const trace = [];
  trace.push({ type:'info', msg:`Merge Sort: sort by rating ↓ — O(n log n)` });

  function merge(a, l, m, r) {
    const L = a.slice(l, m+1), R = a.slice(m+1, r+1);
    trace.push({ type:'step', msg:`Merge [${l}..${m}] and [${m+1}..${r}]` });
    let i=0, j=0, k=l;
    while (i<L.length && j<R.length) {
      if (L[i].rating >= R[j].rating) a[k++] = L[i++];
      else a[k++] = R[j++];
    }
    while (i<L.length) a[k++] = L[i++];
    while (j<R.length) a[k++] = R[j++];
    trace.push({ type:'found', msg:`Merged: ${a.slice(l,r+1).map(p=>'★'+p.rating).join(' ')}` });
  }

  function ms(a, l, r) {
    if (l < r) {
      const m = Math.floor((l+r)/2);
      trace.push({ type:'step', msg:`Divide [${l}..${r}] → [${l}..${m}] and [${m+1}..${r}]` });
      ms(a, l, m); ms(a, m+1, r);
      merge(a, l, m, r);
    }
  }

  const arr = [...products];
  ms(arr, 0, arr.length - 1);
  trace.push({ type:'info', msg:`Merge Sort done.` });
  return { results: arr, trace };
}