// FashModa Product Dataset
// Derived from PRDECT-ID (Tokopedia) with preprocessing & relabeling
// Sub categories: Pakaian, Sepatu, Tas, Baju Muslim, Sports, Beauty, Kids, Batik, Jam dan Aksesoris

const PRODUCTS = [
  // PAKAIAN
  { id:1, name:"Kaos polos cotton combed 30s premium unisex", category:"Fashion", sub:"Pakaian", detail:"Kaos Polos", price:45000, rating:4.8, sold:12450, reviews:3210, merchant:"TokoKaosJaya", color:"#E8F5E9" },
  { id:2, name:"Hoodie oversize fleece tebal musim hujan", category:"Fashion", sub:"Pakaian", detail:"Hoodie", price:185000, rating:4.7, sold:8920, reviews:2140, merchant:"DistroLocal", color:"#E3F2FD" },
  { id:3, name:"Kemeja flanel kotak cowok slim fit casual", category:"Fashion", sub:"Pakaian", detail:"Kemeja", price:120000, rating:4.6, sold:6780, reviews:1890, merchant:"FlanelBros", color:"#FFF3E0" },
  { id:4, name:"Celana jogger panjang pria wanita bahan fleece", category:"Fashion", sub:"Pakaian", detail:"Celana Jogger", price:95000, rating:4.5, sold:9100, reviews:2345, merchant:"JoggerKita", color:"#FCE4EC" },
  { id:5, name:"Dress midi floral wanita casual elegan", category:"Fashion", sub:"Pakaian", detail:"Dress", price:210000, rating:4.7, sold:5430, reviews:1560, merchant:"ButikFloraSolo", color:"#F3E5F5" },
  { id:6, name:"Rok plisket kain wanita korean style", category:"Fashion", sub:"Pakaian", detail:"Rok", price:89000, rating:4.4, sold:7200, reviews:1920, merchant:"KoreanStyle.ID", color:"#E0F2F1" },
  { id:7, name:"Polo shirt pria bordir logo premium", category:"Fashion", sub:"Pakaian", detail:"Polo Shirt", price:150000, rating:4.6, sold:4300, reviews:980, merchant:"PoloGarment", color:"#E8F5E9" },
  { id:8, name:"Jaket bomber wanita streetwear", category:"Fashion", sub:"Pakaian", detail:"Jaket", price:275000, rating:4.5, sold:3200, reviews:870, merchant:"StreetWearID", color:"#E3F2FD" },

  // BAJU MUSLIM
  { id:9, name:"Hijab pashmina voal motif bunga lembut", category:"Fashion", sub:"Baju Muslim", detail:"Hijab", price:35000, rating:4.9, sold:19200, reviews:5400, merchant:"HijabNusantara", color:"#F8BBD0" },
  { id:10, name:"Gamis syari wanita bahan maxmara terbaru", category:"Fashion", sub:"Baju Muslim", detail:"Gamis", price:320000, rating:4.8, sold:7800, reviews:2100, merchant:"GamisElegan", color:"#E1BEE7" },
  { id:11, name:"Baju koko lengan panjang dewasa pria", category:"Fashion", sub:"Baju Muslim", detail:"Koko", price:145000, rating:4.7, sold:8900, reviews:2300, merchant:"KokoSantri", color:"#B2EBF2" },
  { id:12, name:"Mukena bali motif bordir premium anti kusut", category:"Fashion", sub:"Baju Muslim", detail:"Mukena", price:255000, rating:4.8, sold:6200, reviews:1700, merchant:"MukenaBali", color:"#DCEDC8" },
  { id:13, name:"Jilbab segi empat paris polos aneka warna", category:"Fashion", sub:"Baju Muslim", detail:"Jilbab", price:22000, rating:4.6, sold:24000, reviews:6800, merchant:"HijabNusantara", color:"#FFF9C4" },
  { id:14, name:"Kaftan wanita batik kombinasi modern", category:"Fashion", sub:"Baju Muslim", detail:"Kaftan", price:195000, rating:4.5, sold:3400, reviews:890, merchant:"BatikPasar", color:"#FFE0B2" },

  // SEPATU
  { id:15, name:"Sneakers canvas unisex lokal premium putih", category:"Fashion", sub:"Sepatu", detail:"Sneakers", price:195000, rating:4.7, sold:11200, reviews:3100, merchant:"SneakerLocal", color:"#E8EAF6" },
  { id:16, name:"Sepatu kulit formal pria pantofel hitam", category:"Fashion", sub:"Sepatu", detail:"Sepatu Formal", price:385000, rating:4.6, sold:4500, reviews:1230, merchant:"KulitNusantara", color:"#ECEFF1" },
  { id:17, name:"Sandal gunung outdoor pria trekking", category:"Fashion", sub:"Sepatu", detail:"Sandal Gunung", price:165000, rating:4.5, sold:7800, reviews:2100, merchant:"OutdoorGear.ID", color:"#FBE9E7" },
  { id:18, name:"Sepatu slip on wanita mutiara casual", category:"Fashion", sub:"Sepatu", detail:"Slip On", price:128000, rating:4.4, sold:6300, reviews:1700, merchant:"ShoesGirls", color:"#FCE4EC" },
  { id:19, name:"Boots ankle wanita sol tebal fashion", category:"Fashion", sub:"Sepatu", detail:"Boots", price:290000, rating:4.6, sold:3200, reviews:870, merchant:"FashionShoe", color:"#EDE7F6" },

  // TAS
  { id:20, name:"Tas ransel laptop waterproof anti gores pria", category:"Fashion", sub:"Tas", detail:"Ransel", price:285000, rating:4.9, sold:15600, reviews:4200, merchant:"TasTokcer", color:"#E1F5FE" },
  { id:21, name:"Tas selempang wanita kulit pu korean style", category:"Fashion", sub:"Tas", detail:"Tas Selempang", price:175000, rating:4.7, sold:9800, reviews:2600, merchant:"BagTrend", color:"#F9FBE7" },
  { id:22, name:"Clutch pria wanita organizer tas tangan", category:"Fashion", sub:"Tas", detail:"Clutch", price:92000, rating:4.8, sold:4100, reviews:1100, merchant:"TasTokcer", color:"#FAFAFA" },
  { id:23, name:"Tote bag kanvas motif lokal indie aesthetic", category:"Fashion", sub:"Tas", detail:"Tote Bag", price:65000, rating:4.5, sold:8900, reviews:2400, merchant:"LokalBag", color:"#F1F8E9" },
  { id:24, name:"Tas koper kabin ukuran 20 inch ringan", category:"Fashion", sub:"Tas", detail:"Koper", price:450000, rating:4.6, sold:2800, reviews:760, merchant:"KoperIndo", color:"#E3F2FD" },

  // SPORTS
  { id:25, name:"Jersey bola printing full sublim custom", category:"Fashion", sub:"Sports", detail:"Jersey", price:125000, rating:4.7, sold:13400, reviews:3600, merchant:"JerseyKita", color:"#E8F5E9" },
  { id:26, name:"Celana training olahraga pria wanita dry fit", category:"Fashion", sub:"Sports", detail:"Celana Training", price:95000, rating:4.5, sold:7600, reviews:2000, merchant:"SportswearID", color:"#FFF3E0" },
  { id:27, name:"Kaos olahraga lari gym wanita slim fit", category:"Fashion", sub:"Sports", detail:"Kaos Olahraga", price:85000, rating:4.6, sold:8900, reviews:2300, merchant:"FitnessPro", color:"#FCE4EC" },
  { id:28, name:"Jaket windbreaker outdoor sport pria", category:"Fashion", sub:"Sports", detail:"Jaket Sport", price:225000, rating:4.7, sold:5400, reviews:1400, merchant:"OutdoorGear.ID", color:"#E3F2FD" },

  // BEAUTY
  { id:29, name:"Skincare paket lengkap moisturizer serum lokal", category:"Fashion", sub:"Beauty", detail:"Skincare", price:150000, rating:4.8, sold:16700, reviews:4500, merchant:"SkinCaraID", color:"#FCE4EC" },
  { id:30, name:"Lipstik matte lokal tahan lama 12 jam", category:"Fashion", sub:"Beauty", detail:"Lipstik", price:45000, rating:4.7, sold:21000, reviews:5800, merchant:"MoiBeauty", color:"#F8BBD0" },
  { id:31, name:"Sunscreen spf 50 daily moisturizer ringan", category:"Fashion", sub:"Beauty", detail:"Sunscreen", price:78000, rating:4.9, sold:19500, reviews:5300, merchant:"SkinCaraID", color:"#FFFDE7" },
  { id:32, name:"Foundation cushion coverage medium natural", category:"Fashion", sub:"Beauty", detail:"Foundation", price:125000, rating:4.6, sold:9800, reviews:2600, merchant:"MoiBeauty", color:"#FFF8E1" },

  // KIDS
  { id:33, name:"Baju anak kaos karakter lucu unisex 1-5 tahun", category:"Fashion", sub:"Kids", detail:"Kaos Anak", price:55000, rating:4.8, sold:12300, reviews:3300, merchant:"KidsFashionID", color:"#E8F5E9" },
  { id:34, name:"Sepatu anak perempuan pita lucu anti slip", category:"Fashion", sub:"Kids", detail:"Sepatu Anak", price:95000, rating:4.7, sold:7800, reviews:2100, merchant:"BabyStepID", color:"#FCE4EC" },
  { id:35, name:"Baju koko anak laki mini premium lebaran", category:"Fashion", sub:"Kids", detail:"Koko Anak", price:115000, rating:4.8, sold:5600, reviews:1500, merchant:"KidsFashionID", color:"#E0F7FA" },
  { id:36, name:"Dress anak perempuan tutu princess 3-8 tahun", category:"Fashion", sub:"Kids", detail:"Dress Anak", price:135000, rating:4.6, sold:4300, reviews:1150, merchant:"BabyStepID", color:"#F3E5F5" },

  // BATIK
  { id:37, name:"Kemkemeja batik pria lengan panjang solo motif klasik", category:"Fashion", sub:"Batik", detail:"Batik Pria", price:185000, rating:4.7, sold:6700, reviews:1800, merchant:"BatikPasar", color:"#FFF9C4" },
  { id:38, name:"Batik wanita atasan modern kombinasi katun", category:"Fashion", sub:"Batik", detail:"Batik Wanita", price:165000, rating:4.6, sold:5400, reviews:1450, merchant:"BatikPasar", color:"#FFE0B2" },
  { id:39, name:"Hem batik couple pria wanita motif kawung", category:"Fashion", sub:"Batik", detail:"Batik Couple", price:310000, rating:4.8, sold:3200, reviews:850, merchant:"BatikNusantara", color:"#F3E5F5" },

  // AKSESORIS
  { id:40, name:"Jam tangan pria analog kulit casual elegan", category:"Fashion", sub:"Jam dan Aksesoris", detail:"Jam Tangan", price:295000, rating:4.7, sold:8900, reviews:2400, merchant:"TimeIDN", color:"#ECEFF1" },
  { id:41, name:"Kalung emas perhiasan wanita 24k lapis emas", category:"Fashion", sub:"Jam dan Aksesoris", detail:"Kalung", price:125000, rating:4.5, sold:6700, reviews:1800, merchant:"PerhiasanID", color:"#FFFDE7" },
  { id:42, name:"Topi bucket hat unisex bahan kanvas vintage", category:"Fashion", sub:"Jam dan Aksesoris", detail:"Topi", price:68000, rating:4.6, sold:9400, reviews:2500, merchant:"TrendsID", color:"#E8EAF6" },
];

// Simulate pre-computed cosine similarity scores (from TF-IDF + Content-Based Filtering)
function getRecommendations(productId, topN = 6) {
  const product = PRODUCTS.find(p => p.id === productId);
  if (!product) return [];
  
  // Simulate similarity: same sub-category > same detail > different
  const scores = PRODUCTS
    .filter(p => p.id !== productId)
    .map(p => {
      let score = 0;
      if (p.sub === product.sub) score += 0.6;
      if (p.detail === product.detail) score += 0.3;
      // Simulate TF-IDF word overlap in name
      const aWords = product.name.toLowerCase().split(' ');
      const bWords = p.name.toLowerCase().split(' ');
      const overlap = aWords.filter(w => bWords.includes(w) && w.length > 3).length;
      score += overlap * 0.05;
      score += Math.random() * 0.1; // small noise
      return { ...p, similarity: Math.min(score, 1).toFixed(3) };
    })
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, topN);
  
  return scores;
}

const MERCHANTS = [
  { id:'m1', name:'TokoKaosJaya', owner:'Budi Santoso', sales:156, rating:4.8 },
  { id:'m2', name:'HijabNusantara', owner:'Siti Rahmawati', sales:298, rating:4.9 },
  { id:'m3', name:'TasTokcer', owner:'Andi Wijaya', sales:201, rating:4.8 },
  { id:'m4', name:'SneakerLocal', owner:'Rizky Pratama', sales:178, rating:4.7 },
  { id:'m5', name:'BatikPasar', owner:'Dewi Kurniasih', sales:143, rating:4.7 },
];

const USERS_DEMO = {
  buyer: { name:'Demo Pembeli', email:'buyer@demo.com', role:'buyer' },
  merchant: { name:'Demo Penjual', email:'merchant@demo.com', role:'merchant', store:'TokoDemoKita' },
  admin: { name:'Admin FashModa', email:'admin@fashmoda.com', role:'admin' },
};
