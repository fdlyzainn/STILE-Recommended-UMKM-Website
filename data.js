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

let PRODUCTS = [];

fetch('api.php?action=products')
    .then(r => r.json())
    .then(data => {
        PRODUCTS = data;
        renderFeatured();
        renderTopRated();
        renderCatalog();
    });