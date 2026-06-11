// FashModa – App Logic
// Roles: Buyer, MSME Merchant, Admin
// Flow: Home → Catalog (filter/sort) → Product Detail (recommendations) → Cart → Checkout → Success → Rating

// ─── STATE ────────────────────────────────────────────────────────────
let state = {
  currentPage: 'home',
  prevPage: 'home',
  user: null,
  cart: [],
  wishlist: [],
  orders: [],
  ratings: {},
  currentProduct: null,
  selectedRole: 'buyer',
  selectedRating: 0,
  ratingProductId: null,
  catalogFilter: { cat: 'all', price: 'all', rating: 'all', sort: 'default', search: '' },
};

// ─── INIT ──────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
  renderFeatured();
  renderTopRated();
  renderCatalog();
  updateBadges();
  // close dropdown on outside click
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-actions')) {
      document.getElementById('userDropdown').classList.remove('open');
    }
  });
});

// ─── PAGE NAVIGATION ───────────────────────────────────────────────────
function showPage(page) {
  // guard: cart/checkout/orders need login
  if (['cart','checkout','orders','profile','merchant','admin'].includes(page) && !state.user) {
    showToast('Silakan masuk terlebih dahulu');
    showPage('login');
    return;
  }
  // guard: merchant dashboard only for merchant/admin
  if (page === 'merchant' && state.user && state.user.role === 'buyer') {
    showToast('Halaman khusus Penjual');
    return;
  }
  if (page === 'admin' && state.user && state.user.role !== 'admin') {
    showToast('Halaman khusus Admin');
    return;
  }

  state.prevPage = state.currentPage;
  state.currentPage = page;

  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  const el = document.getElementById('page-' + page);
  if (el) el.classList.add('active');

  // scroll to top
  window.scrollTo(0, 0);

  // page-specific renders
  if (page === 'catalog') renderCatalog();
  if (page === 'cart') renderCart();
  if (page === 'wishlist') renderWishlist();
  if (page === 'orders') renderOrders();
  if (page === 'profile') renderProfile();
  if (page === 'checkout') renderCheckoutSummary();
  if (page === 'merchant') renderMerchantDash();
  if (page === 'admin') renderAdminDash();
}

function goBack() {
  showPage(state.prevPage || 'home');
}

// ─── NAVIGATION FILTER ─────────────────────────────────────────────────
function filterByNav(cat, el) {
  document.querySelectorAll('.nav-cat').forEach(a => a.classList.remove('active'));
  if (el) el.classList.add('active');
  state.catalogFilter.cat = cat;
  // sync sidebar radio
  const radios = document.querySelectorAll('input[name="catF"]');
  radios.forEach(r => { if (r.value === cat) r.checked = true; });
  showPage('catalog');
}

// ─── PRODUCT CARD BUILDER ──────────────────────────────────────────────
function formatRp(n) {
  return 'Rp' + n.toLocaleString('id-ID');
}

function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5 ? 1 : 0;
  let s = '';
  for (let i = 0; i < full; i++) s += '<span class="s-fill">★</span>';
  if (half) s += '<span class="s-half">★</span>';
  for (let i = full + half; i < 5; i++) s += '<span class="s-empty">★</span>';
  return s;
}

function buildCard(p) {
  const inWish = state.wishlist.some(w => w.id === p.id);
  const emoji = { Pakaian:'👗', 'Baju Muslim':'🧕', Sepatu:'👟', Tas:'👜', Sports:'🏃', Beauty:'💄', Kids:'🧒', Batik:'🪆', 'Jam dan Aksesoris':'⌚' };
  const simBadge = p.similarity ? `<span class="sim-badge">${(p.similarity * 100).toFixed(0)}% match</span>` : '';

  return `
  <div class="product-card" onclick="showProduct(${p.id})">
    <div class="card-img" style="background:${p.color || '#f5f5f5'}">
      <span class="card-emoji">${emoji[p.sub] || '👕'}</span>
      ${simBadge}
      <button class="wish-btn ${inWish ? 'wished' : ''}" onclick="toggleWishItem(event,${p.id})" title="${inWish ? 'Hapus dari wishlist' : 'Tambah ke wishlist'}">
        ${inWish ? '❤️' : '🤍'}
      </button>
    </div>
    <div class="card-body">
      <p class="card-merchant">${p.merchant}</p>
      <p class="card-name">${p.name}</p>
      <div class="card-stars">${renderStars(p.rating)} <span class="card-rating">${p.rating}</span></div>
      <div class="card-meta">${Number(p.sold).toLocaleString('id-ID')} terjual</div>
      <p class="card-price">${formatRp(p.price)}</p>
      <button class="card-cart-btn" onclick="quickAddCart(event,${p.id})">+ Keranjang</button>
    </div>
  </div>`;
}

// ─── HOME RENDERS ──────────────────────────────────────────────────────
function renderFeatured() {
  const featured = [...PRODUCTS].sort((a,b) => b.sold - a.sold).slice(0, 8);
  document.getElementById('featuredGrid').innerHTML = featured.map(buildCard).join('');
}

function renderTopRated() {
  const top = [...PRODUCTS].sort((a,b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4);
  document.getElementById('topRatedGrid').innerHTML = top.map(buildCard).join('');
}

// ─── CATALOG ───────────────────────────────────────────────────────────
function applyFilters() {
  const catRadio = document.querySelector('input[name="catF"]:checked');
  const priceRadio = document.querySelector('input[name="priceF"]:checked');
  const ratingRadio = document.querySelector('input[name="ratingF"]:checked');
  const sort = document.getElementById('sortSelect').value;

  state.catalogFilter.cat = catRadio ? catRadio.value : 'all';
  state.catalogFilter.price = priceRadio ? priceRadio.value : 'all';
  state.catalogFilter.rating = ratingRadio ? ratingRadio.value : 'all';
  state.catalogFilter.sort = sort;
  renderCatalog();
}

function renderCatalog() {
  let products = [...PRODUCTS];
  const f = state.catalogFilter;

  // search
  if (f.search && f.search.length > 0) {
    const q = f.search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.sub.toLowerCase().includes(q) ||
      p.detail.toLowerCase().includes(q) ||
      p.merchant.toLowerCase().includes(q)
    );
  }

  // category
  if (f.cat && f.cat !== 'all') {
    products = products.filter(p => p.sub === f.cat);
  }

  // price
  if (f.price && f.price !== 'all') {
    const [min, max] = f.price.split('-').map(Number);
    products = products.filter(p => p.price >= min && p.price <= max);
  }

  // rating
  if (f.rating && f.rating !== 'all') {
    const minR = parseFloat(f.rating);
    products = products.filter(p => p.rating >= minR);
  }

  // sort
  if (f.sort === 'price-asc') products.sort((a,b) => a.price - b.price);
  else if (f.sort === 'price-desc') products.sort((a,b) => b.price - a.price);
  else if (f.sort === 'rating') products.sort((a,b) => b.rating - a.rating);
  else if (f.sort === 'sold') products.sort((a,b) => b.sold - a.sold);

  const grid = document.getElementById('catalogGrid');
  const empty = document.getElementById('catalogEmpty');
  const count = document.getElementById('catalogCount');

  if (products.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'block';
    count.textContent = '0 produk ditemukan';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = products.map(buildCard).join('');
    const label = f.cat && f.cat !== 'all' ? f.cat : 'semua kategori';
    count.textContent = `${products.length} produk ditemukan di ${label}`;
  }
}

function resetFilters() {
  document.querySelectorAll('input[name="catF"]')[0].checked = true;
  document.querySelectorAll('input[name="priceF"]')[0].checked = true;
  document.querySelectorAll('input[name="ratingF"]')[0].checked = true;
  document.getElementById('sortSelect').value = 'default';
  document.getElementById('searchInput').value = '';
  state.catalogFilter = { cat: 'all', price: 'all', rating: 'all', sort: 'default', search: '' };
  renderCatalog();
}

function toggleFilter(id) {
  const el = document.getElementById(id);
  el.classList.toggle('open');
}

// ─── SEARCH ────────────────────────────────────────────────────────────
function liveSearch() {
  const q = document.getElementById('searchInput').value;
  state.catalogFilter.search = q;
  if (state.currentPage !== 'catalog') showPage('catalog');
  else renderCatalog();
}

function doSearch() {
  liveSearch();
}

// ─── PRODUCT DETAIL ────────────────────────────────────────────────────
function showProduct(id) {
  const p = PRODUCTS.find(x => x.id === id);
  if (!p) return;
  state.currentProduct = p;
  state.prevPage = state.currentPage;

  const recs = getRecommendations(id, 6);
  const emoji = { Pakaian:'👗', 'Baju Muslim':'🧕', Sepatu:'👟', Tas:'👜', Sports:'🏃', Beauty:'💄', Kids:'🧒', Batik:'🪆', 'Jam dan Aksesoris':'⌚' };
  const userRating = state.ratings[id];

  document.getElementById('productDetailContent').innerHTML = `
    <div class="pd-top">
      <div class="pd-img" style="background:${p.color || '#f5f5f5'}">
        <span style="font-size:80px">${emoji[p.sub] || '👕'}</span>
      </div>
      <div class="pd-info">
        <p class="pd-merchant">${p.merchant}</p>
        <h1 class="pd-name">${p.name}</h1>
        <div class="pd-stars">${renderStars(p.rating)} <span>${p.rating} / 5.0</span> &nbsp; <span style="color:#999">(${Number(p.reviews).toLocaleString('id-ID')} ulasan)</span></div>
        <div class="pd-sold">${Number(p.sold).toLocaleString('id-ID')} terjual</div>
        <div class="pd-price">${formatRp(p.price)}</div>
        <div class="pd-tags">
          <span class="tag">${p.sub}</span>
          <span class="tag">${p.detail}</span>
        </div>
        <div class="pd-desc">
          <p><strong>Spesifikasi Produk:</strong></p>
          <p>• Kategori: ${p.sub} – ${p.detail}</p>
          <p>• Brand/Toko: ${p.merchant}</p>
          <p>• Rating: ${p.rating} dari 5.0</p>
          <p>• Total terjual: ${Number(p.sold).toLocaleString('id-ID')} unit</p>
          <p>• Garansi: 30 hari pengembalian</p>
        </div>
        <div class="pd-actions">
          <button class="btn-primary" onclick="addToCart(${p.id})">🛒 Tambah ke Keranjang</button>
          <button class="btn-outline" onclick="buyNow(${p.id})">Beli Sekarang</button>
          <button class="wish-detail-btn ${state.wishlist.some(w=>w.id===p.id) ? 'wished' : ''}" onclick="toggleWishItem(event,${p.id})">
            ${state.wishlist.some(w=>w.id===p.id) ? '❤️ Wishlist' : '🤍 Wishlist'}
          </button>
        </div>
        ${userRating ? `<div class="user-rated">Kamu memberi rating <strong>${userRating} ★</strong> untuk produk ini</div>` : ''}
      </div>
    </div>

    <!-- Recommendations from CF model -->
    <div class="pd-recs">
      <div class="pd-recs-header">
        <h2>Rekomendasi Produk Serupa</h2>
        <span class="algo-badge">✨ TF-IDF + Cosine Similarity</span>
      </div>
      <p class="algo-note">Produk di bawah dipilih berdasarkan kemiripan karakteristik dengan "${p.name}" menggunakan Content-Based Filtering.</p>
      <div class="products-grid">
        ${recs.map(buildCard).join('')}
      </div>
    </div>
  `;

  document.querySelectorAll('.page').forEach(el => el.classList.remove('active'));
  document.getElementById('page-product').classList.add('active');
  state.currentPage = 'product';
  window.scrollTo(0, 0);
}

// ─── CART ──────────────────────────────────────────────────────────────
function addToCart(id) {
  if (!state.user) { showToast('Masuk dulu untuk belanja'); showPage('login'); return; }
  const p = PRODUCTS.find(x => x.id === id);
  const exists = state.cart.find(c => c.id === id);
  if (exists) { exists.qty += 1; }
  else { state.cart.push({ ...p, qty: 1 }); }
  updateBadges();
  showToast('Ditambahkan ke keranjang 🛒');
}

function quickAddCart(e, id) {
  e.stopPropagation();
  addToCart(id);
}

function buyNow(id) {
  addToCart(id);
  showPage('checkout');
}

function removeFromCart(id) {
  state.cart = state.cart.filter(c => c.id !== id);
  updateBadges();
  renderCart();
}

function changeQty(id, delta) {
  const item = state.cart.find(c => c.id === id);
  if (!item) return;
  item.qty += delta;
  if (item.qty <= 0) removeFromCart(id);
  else renderCart();
  updateBadges();
}

function renderCart() {
  const cartItems = document.getElementById('cartItems');
  const cartSummary = document.getElementById('cartSummary');
  const cartEmpty = document.getElementById('cartEmpty');

  if (state.cart.length === 0) {
    cartItems.innerHTML = '';
    cartSummary.innerHTML = '';
    cartEmpty.style.display = 'flex';
    return;
  }
  cartEmpty.style.display = 'none';

  const total = state.cart.reduce((s, c) => s + c.price * c.qty, 0);
  const itemCount = state.cart.reduce((s, c) => s + c.qty, 0);
  const emoji = { Pakaian:'👗', 'Baju Muslim':'🧕', Sepatu:'👟', Tas:'👜', Sports:'🏃', Beauty:'💄', Kids:'🧒', Batik:'🪆', 'Jam dan Aksesoris':'⌚' };

  cartItems.innerHTML = state.cart.map(item => `
    <div class="cart-item">
      <div class="cart-item-img" style="background:${item.color||'#f5f5f5'}">${emoji[item.sub]||'👕'}</div>
      <div class="cart-item-info">
        <p class="cart-item-name">${item.name}</p>
        <p class="cart-item-merchant">${item.merchant}</p>
        <p class="cart-item-price">${formatRp(item.price)}</p>
      </div>
      <div class="cart-item-qty">
        <button onclick="changeQty(${item.id},-1)">−</button>
        <span>${item.qty}</span>
        <button onclick="changeQty(${item.id},1)">+</button>
      </div>
      <div class="cart-item-total">${formatRp(item.price * item.qty)}</div>
      <button class="cart-remove" onclick="removeFromCart(${item.id})">✕</button>
    </div>
  `).join('');

  cartSummary.innerHTML = `
    <div class="summary-card">
      <h3>Ringkasan Pesanan</h3>
      <div class="summary-row"><span>Subtotal (${itemCount} item)</span><span>${formatRp(total)}</span></div>
      <div class="summary-row"><span>Ongkos Kirim</span><span class="free">Gratis</span></div>
      <div class="summary-row total-row"><span>Total</span><span>${formatRp(total)}</span></div>
      <button class="btn-primary full" onclick="showPage('checkout')">Lanjut Checkout</button>
      <button class="btn-outline full" style="margin-top:8px" onclick="showPage('catalog')">Lanjut Belanja</button>
    </div>
  `;
}

function showCart() {
  if (!state.user) { showPage('login'); return; }
  showPage('cart');
}

// ─── WISHLIST ─────────────────────────────────────────────────────────
function toggleWishlist() {
  if (!state.user) { showPage('login'); return; }
  showPage('wishlist');
}

function toggleWishItem(e, id) {
  e.stopPropagation();
  if (!state.user) { showToast('Masuk dulu untuk wishlist'); showPage('login'); return; }
  const exists = state.wishlist.findIndex(w => w.id === id);
  if (exists >= 0) { state.wishlist.splice(exists, 1); showToast('Dihapus dari wishlist'); }
  else { state.wishlist.push(PRODUCTS.find(p => p.id === id)); showToast('Ditambahkan ke wishlist ❤️'); }
  updateBadges();
  if (state.currentPage === 'wishlist') renderWishlist();
  if (state.currentPage === 'product') showProduct(id);
}

function renderWishlist() {
  const grid = document.getElementById('wishlistGrid');
  const empty = document.getElementById('wishlistEmpty');
  if (state.wishlist.length === 0) {
    grid.innerHTML = '';
    empty.style.display = 'flex';
  } else {
    empty.style.display = 'none';
    grid.innerHTML = state.wishlist.map(buildCard).join('');
  }
}

// ─── BADGES ────────────────────────────────────────────────────────────
function updateBadges() {
  const cartCount = state.cart.reduce((s, c) => s + c.qty, 0);
  document.getElementById('cartBadge').textContent = cartCount;
  document.getElementById('wishBadge').textContent = state.wishlist.length;
}

// ─── AUTH ──────────────────────────────────────────────────────────────
function toggleUserMenu() {
  document.getElementById('userDropdown').classList.toggle('open');
}

function demoLogin(role) {
  const user = USERS_DEMO[role];
  state.user = { ...user };
  applyUserUI();
  showToast(`Masuk sebagai ${user.name} ✓`);
  if (role === 'merchant') showPage('merchant');
  else if (role === 'admin') showPage('admin');
  else showPage('home');
}

function doLogin() {
  const email = document.getElementById('loginEmail').value;
  const pass = document.getElementById('loginPass').value;
  if (!email || !pass) { showToast('Isi email dan password'); return; }
  // simulate
  state.user = { name: email.split('@')[0], email, role: 'buyer' };
  applyUserUI();
  showToast('Berhasil masuk!');
  showPage('home');
}

function doLogout() {
  state.user = null;
  state.cart = [];
  state.wishlist = [];
  applyUserUI();
  updateBadges();
  document.getElementById('userDropdown').classList.remove('open');
  showToast('Berhasil keluar');
  showPage('home');
}

function doRegister() {
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const pass = document.getElementById('regPass').value;
  if (!name || !email || !pass) { showToast('Lengkapi semua field'); return; }
  state.user = { name, email, role: state.selectedRole };
  if (state.selectedRole === 'merchant') state.user.store = document.getElementById('regStore').value || 'Toko ' + name;
  applyUserUI();
  showToast('Akun berhasil dibuat! Selamat datang 🎉');
  showPage(state.selectedRole === 'merchant' ? 'merchant' : 'home');
}

function selectRole(role, el) {
  state.selectedRole = role;
  document.querySelectorAll('.role-tab').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  const merchantOnly = document.querySelector('.merchant-only');
  if (merchantOnly) merchantOnly.style.display = role === 'merchant' ? 'block' : 'none';
}

function applyUserUI() {
  const guest = document.getElementById('userMenuGuest');
  const loggedIn = document.getElementById('userMenuLoggedIn');
  if (state.user) {
    guest.style.display = 'none';
    loggedIn.style.display = 'block';
    document.getElementById('userGreeting').textContent = state.user.name + ' (' + state.user.role + ')';
  } else {
    guest.style.display = 'block';
    loggedIn.style.display = 'none';
  }
}

// ─── PROFILE ───────────────────────────────────────────────────────────
function renderProfile() {
  const u = state.user;
  if (!u) return;
  document.getElementById('profileContent').innerHTML = `
    <div class="profile-row">
      <div class="profile-avatar">${u.name[0].toUpperCase()}</div>
      <div>
        <h3>${u.name}</h3>
        <p style="color:#999">${u.email}</p>
        <span class="tag">${u.role}</span>
        ${u.store ? `<span class="tag" style="margin-left:4px">${u.store}</span>` : ''}
      </div>
    </div>
    <div class="profile-stats">
      <div class="pstat"><span>${state.orders.length}</span><label>Pesanan</label></div>
      <div class="pstat"><span>${state.wishlist.length}</span><label>Wishlist</label></div>
      <div class="pstat"><span>${state.cart.reduce((s,c)=>s+c.qty,0)}</span><label>Di Keranjang</label></div>
    </div>
    ${u.role === 'merchant' ? `<button class="btn-outline" style="margin-top:16px" onclick="showPage('merchant')">Dashboard Penjual →</button>` : ''}
    ${u.role === 'admin' ? `<button class="btn-outline" style="margin-top:16px" onclick="showPage('admin')">Dashboard Admin →</button>` : ''}
  `;
}

// ─── CHECKOUT ─────────────────────────────────────────────────────────
function renderCheckoutSummary() {
  const total = state.cart.reduce((s,c) => s+c.price*c.qty, 0);
  const emoji = { Pakaian:'👗','Baju Muslim':'🧕',Sepatu:'👟',Tas:'👜',Sports:'🏃',Beauty:'💄',Kids:'🧒',Batik:'🪆','Jam dan Aksesoris':'⌚'};

  if (state.user) {
    document.getElementById('ckName').value = state.user.name || '';
    document.getElementById('ckEmail') && (document.getElementById('ckEmail').value = state.user.email || '');
  }

  document.getElementById('checkoutSummary').innerHTML = `
    <div class="summary-card">
      <h3>Pesanan Kamu</h3>
      ${state.cart.map(c => `
        <div class="ck-item">
          <div style="display:flex;align-items:center;gap:10px">
            <div class="ck-img" style="background:${c.color||'#f5f5f5'}">${emoji[c.sub]||'👕'}</div>
            <div>
              <p style="font-size:13px;font-weight:500;margin:0">${c.name}</p>
              <p style="font-size:12px;color:#999;margin:0">x${c.qty}</p>
            </div>
          </div>
          <span style="font-size:13px;font-weight:500">${formatRp(c.price*c.qty)}</span>
        </div>
      `).join('')}
      <hr style="border:none;border-top:1px solid #f0f0f0;margin:12px 0">
      <div class="summary-row"><span>Ongkir</span><span class="free">Gratis</span></div>
      <div class="summary-row total-row"><span>Total</span><span>${formatRp(total)}</span></div>
    </div>
  `;
}

function confirmOrder() {
  const name = document.getElementById('ckName').value;
  const phone = document.getElementById('ckPhone').value;
  const address = document.getElementById('ckAddress').value;
  const city = document.getElementById('ckCity').value;
  if (!name || !phone || !address || !city) { showToast('Lengkapi data pengiriman'); return; }

  const orderId = 'FM-' + Date.now().toString(36).toUpperCase();
  const order = {
    id: orderId,
    items: [...state.cart],
    total: state.cart.reduce((s,c) => s+c.price*c.qty, 0),
    address: { name, phone, address, city },
    date: new Date().toLocaleDateString('id-ID'),
    status: 'Diproses',
  };
  state.orders.unshift(order);
  state.cart = [];
  updateBadges();

  document.getElementById('successOrderId').textContent = 'Order ID: ' + orderId;
  showPage('success');

  // Prompt rating after order
  setTimeout(() => {
    if (order.items.length > 0) {
      openRatingModal(order.items[0].id, order.items[0].name);
    }
  }, 3000);
}

// ─── ORDERS ────────────────────────────────────────────────────────────
function renderOrders() {
  const content = document.getElementById('ordersContent');
  const empty = document.getElementById('ordersEmpty');
  if (state.orders.length === 0) {
    content.innerHTML = '';
    empty.style.display = 'flex';
    return;
  }
  empty.style.display = 'none';
  const statusColors = { 'Diproses':'#FF8F00', 'Dikirim':'#1565C0', 'Selesai':'#2E7D32', 'Dibatalkan':'#C62828' };
  content.innerHTML = state.orders.map(o => `
    <div class="order-card">
      <div class="order-header">
        <span class="order-id">${o.id}</span>
        <span class="order-status" style="color:${statusColors[o.status]||'#999'}">${o.status}</span>
      </div>
      <div class="order-items">
        ${o.items.slice(0,3).map(i=>`<span class="order-item-pill">${i.name.substring(0,30)}...</span>`).join('')}
        ${o.items.length > 3 ? `<span style="font-size:12px;color:#999">+${o.items.length-3} lainnya</span>` : ''}
      </div>
      <div class="order-footer">
        <span style="font-size:13px;color:#999">${o.date}</span>
        <span style="font-weight:600">${formatRp(o.total)}</span>
      </div>
      ${o.status === 'Selesai' ? `<button class="btn-outline" style="margin-top:10px;font-size:12px" onclick="openRatingModal(${o.items[0].id},'${o.items[0].name}')">★ Beri Rating</button>` : ''}
    </div>
  `).join('');
}

// ─── RATING ────────────────────────────────────────────────────────────
function openRatingModal(productId, productName) {
  state.ratingProductId = productId;
  state.selectedRating = 0;
  document.getElementById('ratingProductName').textContent = productName;
  document.getElementById('ratingReview').value = '';
  updateStars(0);
  document.getElementById('ratingModal').style.display = 'flex';
}

function setRating(val) {
  state.selectedRating = val;
  updateStars(val);
}

function updateStars(val) {
  document.querySelectorAll('.star').forEach((s, i) => {
    s.classList.toggle('active', i < val);
  });
}

function submitRating() {
  if (!state.selectedRating) { showToast('Pilih rating terlebih dahulu'); return; }
  state.ratings[state.ratingProductId] = state.selectedRating;
  showToast(`Rating ${state.selectedRating} ★ berhasil dikirim!`);
  closeModal();
  if (state.currentPage === 'product' && state.currentProduct?.id === state.ratingProductId) {
    showProduct(state.ratingProductId);
  }
}

function closeModal() {
  document.getElementById('ratingModal').style.display = 'none';
  document.getElementById('addProductModal').style.display = 'none';
}

// ─── MERCHANT DASHBOARD ────────────────────────────────────────────────
function renderMerchantDash() {
  const myProducts = PRODUCTS.filter((_, i) => i % 5 === 0).slice(0, 6); // simulate merchant's products
  document.getElementById('merchantStats').innerHTML = `
    <div class="dash-stat"><span class="dash-num">${myProducts.length}</span><span class="dash-lbl">Produk Aktif</span></div>
    <div class="dash-stat"><span class="dash-num">Rp2,4 jt</span><span class="dash-lbl">Omzet Bulan Ini</span></div>
    <div class="dash-stat"><span class="dash-num">38</span><span class="dash-lbl">Pesanan Masuk</span></div>
    <div class="dash-stat"><span class="dash-num">4.7★</span><span class="dash-lbl">Rating Toko</span></div>
  `;
  const rows = myProducts.map(p => `
    <div class="merchant-product-row">
      <span>${p.name.substring(0,45)}...</span>
      <span class="tag">${p.sub}</span>
      <span>${formatRp(p.price)}</span>
      <span style="color:#2e7d32">${p.sold} terjual</span>
      <div>
        <button class="btn-sm" onclick="showToast('Edit produk')">Edit</button>
        <button class="btn-sm danger" onclick="showToast('Produk dihapus')">Hapus</button>
      </div>
    </div>
  `).join('');
  document.getElementById('merchantProducts').innerHTML = `<div class="merchant-product-list">${rows}</div>`;
}

function showAddProduct() {
  document.getElementById('addProductModal').style.display = 'flex';
}

function addProduct() {
  const name = document.getElementById('newProdName').value;
  const cat = document.getElementById('newProdCat').value;
  const price = parseInt(document.getElementById('newProdPrice').value);
  if (!name || !price) { showToast('Lengkapi nama dan harga produk'); return; }
  showToast(`Produk "${name}" berhasil ditambahkan!`);
  closeModal();
  renderMerchantDash();
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────
function renderAdminDash() {
  document.getElementById('adminStats').innerHTML = `
    <div class="dash-stat"><span class="dash-num">${PRODUCTS.length}</span><span class="dash-lbl">Total Produk</span></div>
    <div class="dash-stat"><span class="dash-num">5</span><span class="dash-lbl">UMKM Aktif</span></div>
    <div class="dash-stat"><span class="dash-num">128</span><span class="dash-lbl">Pengguna</span></div>
    <div class="dash-stat"><span class="dash-num">Rp18,2 jt</span><span class="dash-lbl">Total Transaksi</span></div>
  `;
  const rows = MERCHANTS.map(m => `
    <div class="admin-user-row">
      <span class="admin-avatar">${m.name[0]}</span>
      <div>
        <p style="margin:0;font-weight:500">${m.name}</p>
        <p style="margin:0;font-size:12px;color:#999">Pemilik: ${m.owner}</p>
      </div>
      <span>${m.sales} penjualan</span>
      <span>${m.rating}★</span>
      <button class="btn-sm danger" onclick="showToast('Akun dinonaktifkan')">Nonaktifkan</button>
    </div>
  `).join('');
  document.getElementById('adminUsers').innerHTML = `<div class="admin-user-list">${rows}</div>`;
}

// ─── TOAST ─────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}
