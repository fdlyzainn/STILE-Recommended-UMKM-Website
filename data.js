// Hapus semua const PRODUCTS = [...] yang lama
// Ganti dengan ini di paling atas data.js:

let PRODUCTS = [];

fetch('api.php?action=products')
  .then(r => r.json())
  .then(data => {
    PRODUCTS = data;
    renderFeatured();
    renderTopRated();
    renderCatalog();
  });