// Hapus semua const PRODUCTS = [...] yang lama
// Ganti dengan ini di paling atas data.js:

const USERS_DEMO = {
    buyer: {
        name: "Demo Pembeli",
        email: "buyer@stile.com",
        role: "buyer"
    },

    merchant: {
        name: "Demo Penjual",
        email: "merchant@stile.com",
        role: "merchant",
        store: "Toko Fashion Demo"
    },

    admin: {
        name: "Administrator",
        email: "admin@stile.com",
        role: "admin"
    }
};

const MERCHANTS = [
    { name: "Toko Fashion Demo", owner: "Demo Penjual", sales: 146, rating: 4.7 },
    { name: "Hijab Nusantara", owner: "Alya Putri", sales: 98, rating: 4.8 },
    { name: "Sneaker Lokal ID", owner: "Raka Pratama", sales: 73, rating: 4.6 },
    { name: "Batik Cantik Jogja", owner: "Nadia Kirana", sales: 52, rating: 4.5 }
];

let PRODUCTS = [];

fetch('api.php?action=products')
    .then(r => r.json())
    .then(data => {
        PRODUCTS = Array.isArray(data) ? data : [];
        renderFeatured();
        renderTopRated();
        renderCatalog();
        if (typeof state !== 'undefined' && state.currentPage === 'sellerDashboard') renderSellerDashboard();
    })
    .catch(() => {
        PRODUCTS = [];
        renderFeatured();
        renderTopRated();
        renderCatalog();
    });