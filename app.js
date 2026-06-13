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
    sellerProducts: null,
    sellerOrders: null,
    sellerReviews: null,
    adminStores: null,
    adminUsers: null,
    adminSection: 'stores',
    paymentCode: null,
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
    // admin-tab-fix-listener: bikin tombol Kelola Toko/Pengguna tetap bisa diklik walau inline onclick terkena cache browser
    document.querySelectorAll('.admin-tab').forEach(btn => {
        btn.addEventListener('click', () => showAdminSection(btn.dataset.section || 'stores'));
    });
    document.querySelectorAll('input[name="payment"]').forEach(radio => {
        radio.addEventListener('change', updatePaymentDetails);
    });
    updatePaymentDetails();
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
    if (['cart', 'checkout', 'orders', 'profile', 'merchant', 'admin', 'sellerDashboard'].includes(page) && !state.user) {
        showToast('Silakan masuk terlebih dahulu');
        showPage('login');
        return;
    }
    // guard: merchant dashboard only for merchant/admin
    if (['merchant', 'sellerDashboard'].includes(page) && state.user && state.user.role === 'buyer') {
        showToast('Halaman khusus Penjual');
        return;
    }
    if (page === 'admin' && state.user && state.user.role !== 'admin') {
        showToast('Halaman khusus Admin');
        return;
    }

    state.prevPage = state.currentPage;
    state.currentPage = page;
    document.body.classList.toggle('seller-mode', page === 'sellerDashboard');

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
    if (page === 'sellerDashboard') renderSellerDashboard();
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
    const emoji = { Pakaian: '👗', 'Baju Muslim': '🧕', Sepatu: '👟', Tas: '👜', Sports: '🏃', Beauty: '💄', Kids: '🧒', Batik: '🪆', 'Jam dan Aksesoris': '⌚' };
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
    const featured = [...PRODUCTS].sort((a, b) => b.sold - a.sold).slice(0, 8);
    document.getElementById('featuredGrid').innerHTML = featured.map(buildCard).join('');
}

function renderTopRated() {
    const top = [...PRODUCTS].sort((a, b) => b.rating - a.rating || b.reviews - a.reviews).slice(0, 4);
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
    if (f.sort === 'price-asc') products.sort((a, b) => a.price - b.price);
    else if (f.sort === 'price-desc') products.sort((a, b) => b.price - a.price);
    else if (f.sort === 'rating') products.sort((a, b) => b.rating - a.rating);
    else if (f.sort === 'sold') products.sort((a, b) => b.sold - a.sold);

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
    const emoji = { Pakaian: '👗', 'Baju Muslim': '🧕', Sepatu: '👟', Tas: '👜', Sports: '🏃', Beauty: '💄', Kids: '🧒', Batik: '🪆', 'Jam dan Aksesoris': '⌚' };
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

  if (role === 'merchant') {
      showPage('sellerDashboard');
      return;
  }

  if (role === 'admin') {
      showPage('admin');
      return;
  }

  showPage('home');
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
  showPage(state.selectedRole === 'merchant'
    ? 'sellerDashboard'
    : 'home');
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
  updatePaymentDetails();
}

function getCheckoutPaymentCode() {
  if (!state.paymentCode) {
    state.paymentCode = 'STL-' + Date.now().toString(36).toUpperCase().slice(-7) + '-PAY';
  }
  return state.paymentCode;
}

function getPaymentSelection() {
  const selected = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
  const bankSelect = document.getElementById('paymentBankSelect');
  const walletSelect = document.getElementById('paymentWalletSelect');

  if (selected === 'transfer') {
    return {
      type: 'Transfer Bank',
      channel: bankSelect ? bankSelect.value : 'BRI Virtual Account',
      code: getCheckoutPaymentCode()
    };
  }
  if (selected === 'ewallet') {
    return {
      type: 'E-Wallet',
      channel: walletSelect ? walletSelect.value : 'DANA',
      code: getCheckoutPaymentCode()
    };
  }
  return {
    type: 'COD',
    channel: 'Bayar di Tempat',
    code: '-'
  };
}

function updatePaymentDetails() {
  const box = document.getElementById('paymentDetailBox');
  if (!box) return;

  const selected = document.querySelector('input[name="payment"]:checked')?.value || 'transfer';
  const total = state.cart.reduce((s, c) => s + c.price * c.qty, 0);
  const paymentCode = getCheckoutPaymentCode();

  if (selected === 'transfer') {
    box.innerHTML = `
      <div class="payment-panel">
        <div class="payment-panel-head">
          <div>
            <h4>Transfer Antar Bank</h4>
            <p>Pilih bank tujuan, lalu bayar sesuai nominal pesanan.</p>
          </div>
          <span class="pay-status">QR Tersedia</span>
        </div>

        <div class="payment-grid">
          <div class="payment-left">
            <label class="small-label">Pilih Bank</label>
            <select id="paymentBankSelect" class="payment-select">
              <option>BRI Virtual Account</option>
              <option>BCA Virtual Account</option>
              <option>BNI Virtual Account</option>
              <option>Mandiri Virtual Account</option>
            </select>

            <div class="pay-info-list">
              <div><span>Nomor VA</span><strong>8808 1234 5678 90</strong></div>
              <div><span>Atas Nama</span><strong>STILÉ UMKM Indonesia</strong></div>
              <div><span>Nominal</span><strong>${formatRp(total)}</strong></div>
              <div><span>Kode Bayar</span><strong>${paymentCode}</strong></div>
            </div>
          </div>

          <div class="payment-qr-card">
            <p>Scan QR transfer bank</p>
            <img src="images/qr-transfer-bank.png" alt="QR Transfer Bank STILÉ">
            <small>Gunakan mobile banking / internet banking.</small>
          </div>
        </div>
      </div>`;
    return;
  }

  if (selected === 'ewallet') {
    box.innerHTML = `
      <div class="payment-panel">
        <div class="payment-panel-head">
          <div>
            <h4>E-Wallet</h4>
            <p>Pilih dompet digital, lalu scan QR untuk menyelesaikan pembayaran.</p>
          </div>
          <span class="pay-status">QRIS</span>
        </div>

        <div class="payment-grid">
          <div class="payment-left">
            <label class="small-label">Pilih E-Wallet</label>
            <select id="paymentWalletSelect" class="payment-select">
              <option>DANA</option>
              <option>OVO</option>
              <option>GoPay</option>
              <option>ShopeePay</option>
            </select>

            <div class="pay-info-list">
              <div><span>Merchant</span><strong>STILÉ UMKM Indonesia</strong></div>
              <div><span>No. Pembayaran</span><strong>0812 3456 7890</strong></div>
              <div><span>Nominal</span><strong>${formatRp(total)}</strong></div>
              <div><span>Kode Bayar</span><strong>${paymentCode}</strong></div>
            </div>
          </div>

          <div class="payment-qr-card">
            <p>Scan QR e-wallet</p>
            <img src="images/qr-ewallet.png" alt="QR E-Wallet STILÉ">
            <small>Bisa dipakai untuk DANA, OVO, GoPay, dan ShopeePay.</small>
          </div>
        </div>
      </div>`;
    return;
  }

  box.innerHTML = `
    <div class="payment-panel cod-panel">
      <div class="payment-panel-head">
        <div>
          <h4>Bayar di Tempat / COD</h4>
          <p>Pembayaran dilakukan tunai saat paket sampai ke alamat penerima.</p>
        </div>
        <span class="pay-status">Tersedia</span>
      </div>
    </div>`;
}

function confirmOrder() {
  const name = document.getElementById('ckName').value;
  const phone = document.getElementById('ckPhone').value;
  const address = document.getElementById('ckAddress').value;
  const city = document.getElementById('ckCity').value;
  if (!name || !phone || !address || !city) { showToast('Lengkapi data pengiriman'); return; }

  const orderId = 'FM-' + Date.now().toString(36).toUpperCase();
  const payment = getPaymentSelection();
  const order = {
    id: orderId,
    items: [...state.cart],
    total: state.cart.reduce((s,c) => s+c.price*c.qty, 0),
    address: { name, phone, address, city },
    payment,
    date: new Date().toLocaleDateString('id-ID'),
    status: 'Diproses',
  };
  state.orders.unshift(order);
  state.cart = [];
  state.paymentCode = null;
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
      <div class="order-payment">Pembayaran: ${o.payment ? `${o.payment.type} - ${o.payment.channel}` : 'Transfer Bank'}</div>
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
  const reviewText = document.getElementById('ratingReview').value.trim();
  const product = PRODUCTS.find(p => p.id === state.ratingProductId) || state.currentProduct || { id: state.ratingProductId, name: 'Produk STILÉ' };

  state.ratings[state.ratingProductId] = state.selectedRating;
  seedSellerData();
  state.sellerReviews.unshift({
    id: Date.now(),
    productId: product.id,
    product: product.name,
    buyer: state.user?.name || 'Pembeli STILÉ',
    rating: state.selectedRating,
    date: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
    text: reviewText || 'Produk sesuai pesanan dan kualitasnya bagus.',
    reply: '',
    status: 'Tampil'
  });

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


// ─── SELLER DASHBOARD (SIDEBAR) ────────────────────────────────────────
function fallbackSellerProducts() {
  return [
    { id: 9001, name: 'Kemeja Linen Oversize Premium', sub: 'Pakaian', detail: 'Atasan Wanita', price: 129000, rating: 4.8, sold: 82, reviews: 34, stock: 28, status: 'Aktif', merchant: state.user?.store || 'Toko Fashion Demo', color: '#F5F5F5' },
    { id: 9002, name: 'Hijab Pashmina Ceruty Daily', sub: 'Baju Muslim', detail: 'Hijab', price: 45000, rating: 4.7, sold: 146, reviews: 51, stock: 64, status: 'Aktif', merchant: state.user?.store || 'Toko Fashion Demo', color: '#F5F5F5' },
    { id: 9003, name: 'Sneakers Canvas Lokal Unisex', sub: 'Sepatu', detail: 'Sneakers', price: 189000, rating: 4.6, sold: 73, reviews: 22, stock: 19, status: 'Aktif', merchant: state.user?.store || 'Toko Fashion Demo', color: '#F5F5F5' },
    { id: 9004, name: 'Totebag Rajut Handmade', sub: 'Tas', detail: 'Tas Wanita', price: 79000, rating: 4.5, sold: 58, reviews: 18, stock: 12, status: 'Nonaktif', merchant: state.user?.store || 'Toko Fashion Demo', color: '#F5F5F5' }
  ];
}

function seedSellerData() {
  if (!state.sellerProducts) {
    const sourceProducts = PRODUCTS && PRODUCTS.length ? PRODUCTS.slice(0, 6) : fallbackSellerProducts();
    state.sellerProducts = sourceProducts.map((p, i) => ({
      id: p.id || (9000 + i),
      name: p.name,
      sub: p.sub || 'Pakaian',
      detail: p.detail || 'Fashion Lokal',
      price: Number(p.price) || 75000,
      rating: Number(p.rating) || 4.5,
      sold: Number(p.sold) || 0,
      reviews: Number(p.reviews) || 0,
      stock: p.stock ?? (20 + i * 4),
      status: p.status || 'Aktif',
      merchant: state.user?.store || p.merchant || 'Toko Fashion Demo',
      color: p.color || '#F5F5F5'
    }));
  }

  if (!state.sellerOrders) {
    const p1 = state.sellerProducts[0] || fallbackSellerProducts()[0];
    const p2 = state.sellerProducts[1] || fallbackSellerProducts()[1];
    const p3 = state.sellerProducts[2] || fallbackSellerProducts()[2];
    state.sellerOrders = [
      { id: 'ORD-2026-001', buyer: 'Alya Putri', product: p1.name, qty: 1, total: p1.price, date: '10 Jun 2026', status: 'Menunggu Konfirmasi', address: 'Sleman, DIY' },
      { id: 'ORD-2026-002', buyer: 'Raka Pratama', product: p2.name, qty: 2, total: p2.price * 2, date: '09 Jun 2026', status: 'Dikemas', address: 'Bantul, DIY' },
      { id: 'ORD-2026-003', buyer: 'Nadia Kirana', product: p3.name, qty: 1, total: p3.price, date: '08 Jun 2026', status: 'Selesai', address: 'Yogyakarta' }
    ];
  }

  if (!state.sellerReviews) {
    const p1 = state.sellerProducts[0] || fallbackSellerProducts()[0];
    const p2 = state.sellerProducts[1] || fallbackSellerProducts()[1];
    const p3 = state.sellerProducts[2] || fallbackSellerProducts()[2];
    state.sellerReviews = [
      { id: 1, productId: p1.id, product: p1.name, buyer: 'Alya Putri', rating: 5, date: '10 Jun 2026', text: 'Bahannya nyaman, jahitan rapi, dan ukuran sesuai deskripsi.', reply: 'Terima kasih kak, semoga cocok dipakai harian ya.', status: 'Tampil' },
      { id: 2, productId: p2.id, product: p2.name, buyer: 'Raka Pratama', rating: 4, date: '09 Jun 2026', text: 'Produk bagus, warna sesuai. Pengiriman agak lama sedikit.', reply: '', status: 'Tampil' },
      { id: 3, productId: p3.id, product: p3.name, buyer: 'Nadia Kirana', rating: 3, date: '08 Jun 2026', text: 'Modelnya bagus, tapi box sepatu agak penyok saat sampai.', reply: '', status: 'Disembunyikan' }
    ];
  }
}

function renderSellerDashboard() {
  seedSellerData();
  renderSellerOverview();
  renderSellerOrders();
  renderSellerProducts();
  renderSellerReviews();
}

function renderSellerOverview() {
  seedSellerData();
  const activeProducts = state.sellerProducts.filter(p => p.status === 'Aktif').length;
  const revenue = state.sellerOrders.filter(o => o.status !== 'Dibatalkan').reduce((sum, o) => sum + Number(o.total || 0), 0);
  const avgRating = state.sellerReviews.length
    ? (state.sellerReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / state.sellerReviews.length).toFixed(1)
    : '0.0';

  const totalOrdersEl = document.getElementById('sellerTotalOrders');
  const revenueEl = document.getElementById('sellerRevenue');
  const activeProductsEl = document.getElementById('sellerActiveProducts');
  const avgRatingEl = document.getElementById('sellerAvgRating');

  if (totalOrdersEl) totalOrdersEl.textContent = state.sellerOrders.length;
  if (revenueEl) revenueEl.textContent = formatRp(revenue);
  if (activeProductsEl) activeProductsEl.textContent = activeProducts;
  if (avgRatingEl) avgRatingEl.textContent = avgRating + '★';
}

function renderSellerOrders() {
  seedSellerData();
  const wrap = document.getElementById('sellerOrderList');
  if (!wrap) return;
  const filter = document.getElementById('sellerOrderFilter')?.value || 'all';
  const orders = filter === 'all' ? state.sellerOrders : state.sellerOrders.filter(o => o.status === filter);

  if (!orders.length) {
    wrap.innerHTML = `<div class="seller-empty">Belum ada pesanan dengan status ini.</div>`;
    return;
  }

  wrap.innerHTML = orders.map(o => `
    <div class="seller-row order-manage-row">
      <div class="seller-row-main">
        <strong>${o.id}</strong>
        <span>${o.buyer} • ${o.address}</span>
        <p>${o.product} × ${o.qty}</p>
      </div>
      <div class="seller-row-meta">
        <span>${o.date}</span>
        <strong>${formatRp(o.total)}</strong>
      </div>
      <div class="seller-row-action">
        <select id="sellerOrderStatus-${o.id}">
          ${['Menunggu Konfirmasi','Dikemas','Dikirim','Selesai','Dibatalkan'].map(st => `<option value="${st}" ${o.status === st ? 'selected' : ''}>${st}</option>`).join('')}
        </select>
        <button class="btn-sm" onclick="saveSellerOrderStatus('${o.id}')">Simpan</button>
      </div>
    </div>
  `).join('');
}

function saveSellerOrderStatus(orderId) {
  seedSellerData();
  const order = state.sellerOrders.find(o => o.id === orderId);
  const select = document.getElementById(`sellerOrderStatus-${orderId}`);
  if (!order || !select) return;
  order.status = select.value;
  showToast(`Status ${orderId} diubah menjadi ${order.status}`);
  renderSellerOverview();
  renderSellerOrders();
}

function renderSellerProducts() {
  seedSellerData();
  const wrap = document.getElementById('sellerProductList');
  if (!wrap) return;

  if (!state.sellerProducts.length) {
    wrap.innerHTML = `<div class="seller-empty">Belum ada produk. Tambahkan produk melalui form di atas.</div>`;
    return;
  }

  wrap.innerHTML = state.sellerProducts.map(p => `
    <div class="seller-row product-manage-row">
      <div class="seller-row-main">
        <strong>${p.name}</strong>
        <span>${p.sub} • ${p.detail || 'Fashion Lokal'}</span>
        <p>Stok: ${p.stock} • Terjual: ${Number(p.sold || 0).toLocaleString('id-ID')} • Rating: ${p.rating}★</p>
      </div>
      <div class="seller-row-meta">
        <strong>${formatRp(Number(p.price || 0))}</strong>
        <span class="seller-status ${p.status === 'Aktif' ? 'on' : 'off'}">${p.status}</span>
      </div>
      <div class="seller-row-action compact">
        <button class="btn-sm" onclick="fillSellerProductForm(${p.id})">Edit</button>
        <button class="btn-sm" onclick="toggleSellerProduct(${p.id})">${p.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button class="btn-sm danger" onclick="deleteSellerProduct(${p.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

function saveSellerProduct(event) {
  event.preventDefault();
  seedSellerData();

  const id = document.getElementById('sellerProdId').value;
  const name = document.getElementById('sellerProdName').value.trim();
  const sub = document.getElementById('sellerProdCat').value;
  const detail = document.getElementById('sellerProdDetail').value.trim() || 'Fashion Lokal';
  const price = Number(document.getElementById('sellerProdPrice').value);
  const stock = Number(document.getElementById('sellerProdStock').value);

  if (!name || !price) {
    showToast('Nama dan harga produk wajib diisi');
    return;
  }

  if (id) {
    const product = state.sellerProducts.find(p => String(p.id) === String(id));
    if (!product) return;
    product.name = name;
    product.sub = sub;
    product.detail = detail;
    product.price = price;
    product.stock = stock;
    showToast('Produk berhasil diperbarui');
  } else {
    state.sellerProducts.unshift({
      id: Date.now(),
      name,
      sub,
      detail,
      price,
      stock,
      rating: 0,
      sold: 0,
      reviews: 0,
      status: 'Aktif',
      merchant: state.user?.store || 'Toko Fashion Demo',
      color: '#F5F5F5'
    });
    showToast('Produk baru berhasil ditambahkan');
  }

  resetSellerProductForm();
  renderSellerOverview();
  renderSellerProducts();
}

function fillSellerProductForm(id) {
  seedSellerData();
  const p = state.sellerProducts.find(item => item.id === id);
  if (!p) return;
  showSellerSection('products');
  document.getElementById('sellerProdId').value = p.id;
  document.getElementById('sellerProdName').value = p.name;
  document.getElementById('sellerProdCat').value = p.sub;
  document.getElementById('sellerProdDetail').value = p.detail || '';
  document.getElementById('sellerProdPrice').value = p.price;
  document.getElementById('sellerProdStock').value = p.stock;
  document.getElementById('sellerProdSubmit').textContent = 'Update Produk';
  document.getElementById('sellerProdName').focus();
}

function resetSellerProductForm() {
  const formIds = ['sellerProdId','sellerProdName','sellerProdDetail','sellerProdPrice','sellerProdStock'];
  formIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('sellerProdCat');
  if (cat) cat.value = 'Pakaian';
  const submit = document.getElementById('sellerProdSubmit');
  if (submit) submit.textContent = 'Simpan Produk';
}

function toggleSellerProduct(id) {
  seedSellerData();
  const p = state.sellerProducts.find(item => item.id === id);
  if (!p) return;
  p.status = p.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  showToast(`Produk ${p.status === 'Aktif' ? 'diaktifkan' : 'dinonaktifkan'}`);
  renderSellerOverview();
  renderSellerProducts();
}

function deleteSellerProduct(id) {
  seedSellerData();
  const p = state.sellerProducts.find(item => item.id === id);
  if (!p) return;
  if (!confirm(`Hapus produk "${p.name}"?`)) return;
  state.sellerProducts = state.sellerProducts.filter(item => item.id !== id);
  showToast('Produk berhasil dihapus');
  renderSellerOverview();
  renderSellerProducts();
}

function renderSellerReviews() {
  seedSellerData();
  const stats = document.getElementById('sellerReviewStats');
  const wrap = document.getElementById('sellerReviewList');
  if (!wrap) return;

  const avg = state.sellerReviews.length
    ? (state.sellerReviews.reduce((sum, r) => sum + Number(r.rating || 0), 0) / state.sellerReviews.length).toFixed(1)
    : '0.0';
  const visible = state.sellerReviews.filter(r => r.status === 'Tampil').length;
  const needsReply = state.sellerReviews.filter(r => !r.reply).length;

  if (stats) {
    stats.innerHTML = `
      <div class="review-summary-card"><span>${avg}★</span><label>Rata-rata Rating</label></div>
      <div class="review-summary-card"><span>${state.sellerReviews.length}</span><label>Total Ulasan</label></div>
      <div class="review-summary-card"><span>${visible}</span><label>Ulasan Tampil</label></div>
      <div class="review-summary-card"><span>${needsReply}</span><label>Perlu Balasan</label></div>
    `;
  }

  const filter = document.getElementById('sellerReviewFilter')?.value || 'all';
  let reviews = [...state.sellerReviews];
  if (filter === '5') reviews = reviews.filter(r => Number(r.rating) === 5);
  if (filter === '4') reviews = reviews.filter(r => Number(r.rating) === 4);
  if (filter === '3') reviews = reviews.filter(r => Number(r.rating) <= 3);

  if (!reviews.length) {
    wrap.innerHTML = `<div class="seller-empty">Belum ada ulasan pada filter ini.</div>`;
    return;
  }

  wrap.innerHTML = reviews.map(r => `
    <div class="seller-review-card">
      <div class="review-topline">
        <div>
          <strong>${r.buyer}</strong>
          <span>${r.date} • ${r.product}</span>
        </div>
        <div class="review-stars">${renderStars(Number(r.rating))}</div>
      </div>
      <p class="review-text">“${r.text}”</p>
      <div class="review-edit-grid">
        <label>
          Status Ulasan
          <select id="reviewStatus-${r.id}">
            <option value="Tampil" ${r.status === 'Tampil' ? 'selected' : ''}>Tampil</option>
            <option value="Disembunyikan" ${r.status === 'Disembunyikan' ? 'selected' : ''}>Disembunyikan</option>
          </select>
        </label>
        <label>
          Balasan Penjual
          <textarea id="reviewReply-${r.id}" rows="2" placeholder="Tulis balasan untuk pelanggan...">${r.reply || ''}</textarea>
        </label>
      </div>
      <div class="review-actions">
        <button class="btn-sm" onclick="saveReviewResponse(${r.id})">Simpan Perubahan</button>
        <button class="btn-sm danger" onclick="deleteSellerReview(${r.id})">Hapus</button>
      </div>
    </div>
  `).join('');
}

function saveReviewResponse(id) {
  seedSellerData();
  const review = state.sellerReviews.find(r => r.id === id);
  const status = document.getElementById(`reviewStatus-${id}`);
  const reply = document.getElementById(`reviewReply-${id}`);
  if (!review || !status || !reply) return;
  review.status = status.value;
  review.reply = reply.value.trim();
  showToast('Ulasan berhasil diperbarui');
  renderSellerOverview();
  renderSellerReviews();
}

function deleteSellerReview(id) {
  seedSellerData();
  const review = state.sellerReviews.find(r => r.id === id);
  if (!review) return;
  if (!confirm(`Hapus ulasan dari ${review.buyer}?`)) return;
  state.sellerReviews = state.sellerReviews.filter(r => r.id !== id);
  showToast('Ulasan berhasil dihapus');
  renderSellerOverview();
  renderSellerReviews();
}

// ─── ADMIN DASHBOARD ───────────────────────────────────────────────────
function getAdminStorageKey(type) {
  return `stile-admin-${type}-v1`;
}

function loadAdminData(type) {
  try {
    const raw = localStorage.getItem(getAdminStorageKey(type));
    return raw ? JSON.parse(raw) : null;
  } catch (e) {
    return null;
  }
}

function saveAdminData(type, data) {
  try {
    localStorage.setItem(getAdminStorageKey(type), JSON.stringify(data));
  } catch (e) {
    // localStorage bisa gagal di mode private, tapi UI tetap jalan selama sesi browser.
  }
}

function seedAdminData() {
  if (!Array.isArray(state.adminStores)) {
    const savedStores = loadAdminData('stores');
    state.adminStores = Array.isArray(savedStores) ? savedStores : [
      ...(Array.isArray(MERCHANTS) ? MERCHANTS.map((m, i) => ({
        id: 1001 + i,
        name: m.name,
        owner: m.owner,
        category: ['Pakaian', 'Baju Muslim', 'Sepatu', 'Batik'][i] || 'Pakaian',
        sales: Number(m.sales || 0),
        rating: Number(m.rating || 4.5),
        status: 'Aktif',
        joined: ['12 Jan 2026', '18 Jan 2026', '24 Jan 2026', '02 Feb 2026'][i] || '2026'
      })) : []),
      { id: 2001, name: 'Modest Daily Store', owner: 'Sinta Aulia', category: 'Baju Muslim', sales: 31, rating: 4.4, status: 'Menunggu Verifikasi', joined: '16 Mar 2026' }
    ];
  }

  if (!Array.isArray(state.adminUsers)) {
    const savedUsers = loadAdminData('users');
    state.adminUsers = Array.isArray(savedUsers) ? savedUsers : [
      { id: 501, name: 'Demo Pembeli', email: 'buyer@stile.com', role: 'buyer', store: '-', status: 'Aktif', joined: '10 Jan 2026' },
      { id: 502, name: 'Demo Penjual', email: 'merchant@stile.com', role: 'merchant', store: 'Toko Fashion Demo', status: 'Aktif', joined: '12 Jan 2026' },
      { id: 503, name: 'Administrator', email: 'admin@stile.com', role: 'admin', store: '-', status: 'Aktif', joined: '01 Jan 2026' },
      { id: 504, name: 'Alya Putri', email: 'alya@stile.com', role: 'merchant', store: 'Hijab Nusantara', status: 'Aktif', joined: '18 Jan 2026' },
      { id: 505, name: 'Raka Pratama', email: 'raka@stile.com', role: 'merchant', store: 'Sneaker Lokal ID', status: 'Aktif', joined: '24 Jan 2026' },
      { id: 506, name: 'Dimas Fajar', email: 'dimas@stile.com', role: 'buyer', store: '-', status: 'Nonaktif', joined: '03 Feb 2026' }
    ];
  }
}

function adminStatusClass(status) {
  if (status === 'Aktif') return 'on';
  if (status === 'Menunggu Verifikasi') return 'wait';
  return 'off';
}

function adminRoleLabel(role) {
  return role === 'merchant' ? 'Penjual' : role === 'admin' ? 'Admin' : 'Pembeli';
}

function renderAdminDash() {
  seedAdminData();

  const activeStores = state.adminStores.filter(s => s.status === 'Aktif').length;
  const activeUsers = state.adminUsers.filter(u => u.status === 'Aktif').length;
  const totalSales = state.adminStores.reduce((sum, s) => sum + Number(s.sales || 0), 0);
  const avgRating = state.adminStores.length
    ? (state.adminStores.reduce((sum, s) => sum + Number(s.rating || 0), 0) / state.adminStores.length).toFixed(1)
    : '0.0';

  const stats = document.getElementById('adminStats');
  if (stats) {
    stats.innerHTML = `
      <div class="dash-stat"><span class="dash-num">${state.adminStores.length}</span><span class="dash-lbl">Total Toko</span></div>
      <div class="dash-stat"><span class="dash-num">${activeStores}</span><span class="dash-lbl">Toko Aktif</span></div>
      <div class="dash-stat"><span class="dash-num">${state.adminUsers.length}</span><span class="dash-lbl">Total Pengguna</span></div>
      <div class="dash-stat"><span class="dash-num">${avgRating}★</span><span class="dash-lbl">Rata-rata Rating Toko</span></div>
      <div class="dash-stat"><span class="dash-num">${Number(totalSales).toLocaleString('id-ID')}</span><span class="dash-lbl">Total Penjualan</span></div>
      <div class="dash-stat"><span class="dash-num">${activeUsers}</span><span class="dash-lbl">Pengguna Aktif</span></div>
    `;
  }

  renderAdminStores();
  renderAdminUsers();
  showAdminSection(state.adminSection || 'stores', false);
}

function showAdminSection(section, shouldRender = true) {
  state.adminSection = section;

  const stores = document.getElementById('admin-section-stores');
  const users = document.getElementById('admin-section-users');
  if (stores) stores.style.display = section === 'stores' ? 'block' : 'none';
  if (users) users.style.display = section === 'users' ? 'block' : 'none';

  document.querySelectorAll('.admin-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.section === section);
  });

  if (shouldRender) {
    if (section === 'stores') renderAdminStores();
    if (section === 'users') renderAdminUsers();
  }
}

function renderAdminStores() {
  seedAdminData();
  const wrap = document.getElementById('adminStores');
  if (!wrap) return;

  if (!state.adminStores.length) {
    wrap.innerHTML = `<div class="admin-empty">Belum ada toko. Tambahkan toko melalui form di atas.</div>`;
    return;
  }

  const rows = state.adminStores.map(store => `
    <div class="admin-row admin-store-row">
      <span class="admin-avatar">${(store.name || 'T')[0].toUpperCase()}</span>
      <div class="admin-main">
        <strong>${store.name}</strong>
        <p>Pemilik: ${store.owner} • Bergabung: ${store.joined || '-'}</p>
      </div>
      <span class="tag">${store.category}</span>
      <span>${Number(store.sales || 0).toLocaleString('id-ID')} penjualan</span>
      <span>${Number(store.rating || 0).toFixed(1)}★</span>
      <span class="admin-status ${adminStatusClass(store.status)}">${store.status}</span>
      <div class="admin-actions">
        <button class="btn-sm" onclick="editAdminStore(${store.id})">Edit</button>
        <button class="btn-sm" onclick="toggleAdminStore(${store.id})">${store.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button class="btn-sm danger" onclick="deleteAdminStore(${store.id})">Hapus</button>
      </div>
    </div>
  `).join('');

  wrap.innerHTML = `<div class="admin-list">${rows}</div>`;
}

function saveAdminStore(event) {
  event.preventDefault();
  seedAdminData();

  const id = document.getElementById('adminStoreId').value;
  const name = document.getElementById('adminStoreName').value.trim();
  const owner = document.getElementById('adminStoreOwner').value.trim();
  const category = document.getElementById('adminStoreCategory').value;
  const sales = Number(document.getElementById('adminStoreSales').value);
  const rating = Number(document.getElementById('adminStoreRating').value);
  const status = document.getElementById('adminStoreStatus').value;

  if (!name || !owner || Number.isNaN(sales) || Number.isNaN(rating)) {
    showToast('Lengkapi data toko terlebih dahulu');
    return;
  }

  if (rating < 1 || rating > 5) {
    showToast('Rating toko harus 1 sampai 5');
    return;
  }

  if (id) {
    const store = state.adminStores.find(s => String(s.id) === String(id));
    if (store) Object.assign(store, { name, owner, category, sales, rating, status });
    showToast('Data toko berhasil diperbarui');
  } else {
    state.adminStores.unshift({
      id: Date.now(),
      name,
      owner,
      category,
      sales,
      rating,
      status,
      joined: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    showToast('Toko baru berhasil ditambahkan');
  }

  saveAdminData('stores', state.adminStores);
  resetAdminStoreForm();
  renderAdminDash();
}

function editAdminStore(id) {
  seedAdminData();
  const store = state.adminStores.find(s => s.id === id);
  if (!store) return;

  document.getElementById('adminStoreId').value = store.id;
  document.getElementById('adminStoreName').value = store.name;
  document.getElementById('adminStoreOwner').value = store.owner;
  document.getElementById('adminStoreCategory').value = store.category;
  document.getElementById('adminStoreSales').value = store.sales;
  document.getElementById('adminStoreRating').value = store.rating;
  document.getElementById('adminStoreStatus').value = store.status;
  document.getElementById('adminStoreSubmit').textContent = 'Update Toko';
  document.getElementById('adminStoreName').focus();
  showToast('Data toko siap diedit');
}

function resetAdminStoreForm() {
  ['adminStoreId', 'adminStoreName', 'adminStoreOwner', 'adminStoreSales', 'adminStoreRating'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const cat = document.getElementById('adminStoreCategory');
  const status = document.getElementById('adminStoreStatus');
  const submit = document.getElementById('adminStoreSubmit');
  if (cat) cat.value = 'Pakaian';
  if (status) status.value = 'Aktif';
  if (submit) submit.textContent = 'Simpan Toko';
}

function toggleAdminStore(id) {
  seedAdminData();
  const store = state.adminStores.find(s => s.id === id);
  if (!store) return;
  store.status = store.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  saveAdminData('stores', state.adminStores);
  showToast(`Status toko menjadi ${store.status}`);
  renderAdminDash();
}

function deleteAdminStore(id) {
  seedAdminData();
  const store = state.adminStores.find(s => s.id === id);
  if (!store) return;
  if (!confirm(`Hapus toko "${store.name}"?`)) return;
  state.adminStores = state.adminStores.filter(s => s.id !== id);
  saveAdminData('stores', state.adminStores);
  showToast('Toko berhasil dihapus');
  renderAdminDash();
}

function renderAdminUsers() {
  seedAdminData();
  const wrap = document.getElementById('adminUsers');
  if (!wrap) return;

  if (!state.adminUsers.length) {
    wrap.innerHTML = `<div class="admin-empty">Belum ada pengguna. Tambahkan pengguna melalui form di atas.</div>`;
    return;
  }

  const rows = state.adminUsers.map(user => `
    <div class="admin-row admin-user-row">
      <span class="admin-avatar">${(user.name || 'U')[0].toUpperCase()}</span>
      <div class="admin-main">
        <strong>${user.name}</strong>
        <p>${user.email} • Bergabung: ${user.joined || '-'}</p>
      </div>
      <span class="tag">${adminRoleLabel(user.role)}</span>
      <span>${user.store || '-'}</span>
      <span class="admin-status ${adminStatusClass(user.status)}">${user.status}</span>
      <div class="admin-actions">
        <button class="btn-sm" onclick="editAdminUser(${user.id})">Edit</button>
        <button class="btn-sm" onclick="toggleAdminUser(${user.id})">${user.status === 'Aktif' ? 'Nonaktifkan' : 'Aktifkan'}</button>
        <button class="btn-sm danger" onclick="deleteAdminUser(${user.id})">Hapus</button>
      </div>
    </div>
  `).join('');

  wrap.innerHTML = `<div class="admin-list">${rows}</div>`;
}

function syncAdminUserStoreField() {
  const role = document.getElementById('adminUserRole')?.value;
  const storeInput = document.getElementById('adminUserStore');
  if (!storeInput) return;
  storeInput.placeholder = role === 'merchant' ? 'Nama toko penjual' : 'Boleh dikosongkan';
  if (role !== 'merchant' && storeInput.value === '-') storeInput.value = '';
}

function saveAdminUser(event) {
  event.preventDefault();
  seedAdminData();

  const id = document.getElementById('adminUserId').value;
  const name = document.getElementById('adminUserName').value.trim();
  const email = document.getElementById('adminUserEmail').value.trim();
  const role = document.getElementById('adminUserRole').value;
  const store = document.getElementById('adminUserStore').value.trim() || '-';
  const status = document.getElementById('adminUserStatus').value;

  if (!name || !email) {
    showToast('Lengkapi nama dan email pengguna');
    return;
  }

  const emailUsed = state.adminUsers.some(u => u.email.toLowerCase() === email.toLowerCase() && String(u.id) !== String(id));
  if (emailUsed) {
    showToast('Email sudah digunakan pengguna lain');
    return;
  }

  if (id) {
    const user = state.adminUsers.find(u => String(u.id) === String(id));
    if (user) Object.assign(user, { name, email, role, store, status });
    showToast('Data pengguna berhasil diperbarui');
  } else {
    state.adminUsers.unshift({
      id: Date.now(),
      name,
      email,
      role,
      store,
      status,
      joined: new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
    });
    showToast('Pengguna baru berhasil ditambahkan');
  }

  saveAdminData('users', state.adminUsers);
  resetAdminUserForm();
  renderAdminDash();
  showAdminSection('users');
}

function editAdminUser(id) {
  seedAdminData();
  const user = state.adminUsers.find(u => u.id === id);
  if (!user) return;

  document.getElementById('adminUserId').value = user.id;
  document.getElementById('adminUserName').value = user.name;
  document.getElementById('adminUserEmail').value = user.email;
  document.getElementById('adminUserRole').value = user.role;
  document.getElementById('adminUserStore').value = user.store === '-' ? '' : user.store;
  document.getElementById('adminUserStatus').value = user.status;
  document.getElementById('adminUserSubmit').textContent = 'Update Pengguna';
  syncAdminUserStoreField();
  document.getElementById('adminUserName').focus();
  showToast('Data pengguna siap diedit');
}

function resetAdminUserForm() {
  ['adminUserId', 'adminUserName', 'adminUserEmail', 'adminUserStore'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  const role = document.getElementById('adminUserRole');
  const status = document.getElementById('adminUserStatus');
  const submit = document.getElementById('adminUserSubmit');
  if (role) role.value = 'buyer';
  if (status) status.value = 'Aktif';
  if (submit) submit.textContent = 'Simpan Pengguna';
  syncAdminUserStoreField();
}

function toggleAdminUser(id) {
  seedAdminData();
  const user = state.adminUsers.find(u => u.id === id);
  if (!user) return;
  user.status = user.status === 'Aktif' ? 'Nonaktif' : 'Aktif';
  saveAdminData('users', state.adminUsers);
  showToast(`Status pengguna menjadi ${user.status}`);
  renderAdminDash();
  showAdminSection('users');
}

function deleteAdminUser(id) {
  seedAdminData();
  const user = state.adminUsers.find(u => u.id === id);
  if (!user) return;
  if (user.role === 'admin' && state.adminUsers.filter(u => u.role === 'admin').length <= 1) {
    showToast('Minimal harus ada satu admin');
    return;
  }
  if (!confirm(`Hapus pengguna "${user.name}"?`)) return;
  state.adminUsers = state.adminUsers.filter(u => u.id !== id);
  saveAdminData('users', state.adminUsers);
  showToast('Pengguna berhasil dihapus');
  renderAdminDash();
  showAdminSection('users');
}

// ─── TOAST ─────────────────────────────────────────────────────────────
let toastTimer;
function showToast(msg) {
  const t = document.getElementById('toast');
  if (!t) { console.log(msg); return; }
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 2500);
}

function showSellerSection(section) {
  seedSellerData();
  ['dashboard', 'orders', 'products', 'reviews'].forEach(name => {
    const panel = document.getElementById('seller-' + name);
    if (panel) panel.style.display = name === section ? 'block' : 'none';
  });

  document.querySelectorAll('.seller-sidebar li').forEach(item => {
    item.classList.toggle('active', item.dataset.section === section);
  });

  if (section === 'dashboard') renderSellerOverview();
  if (section === 'orders') renderSellerOrders();
  if (section === 'products') renderSellerProducts();
  if (section === 'reviews') renderSellerReviews();
}

// ─── GLOBAL ADMIN EXPORTS ─────────────────────────────────────────────
// Dipasang ke window supaya tombol HTML onclick tetap jalan di semua browser/deploy static.
Object.assign(window, {
  showAdminSection,
  renderAdminDash,
  renderAdminStores,
  renderAdminUsers,
  saveAdminStore,
  editAdminStore,
  resetAdminStoreForm,
  toggleAdminStore,
  deleteAdminStore,
  saveAdminUser,
  editAdminUser,
  resetAdminUserForm,
  toggleAdminUser,
  deleteAdminUser,
  syncAdminUserStoreField,
  updatePaymentDetails,
  getPaymentSelection
});
