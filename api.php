<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');

$pdo = new PDO('mysql:host=localhost;dbname=fashion;charset=utf8mb4', 'root', '');

$route = $_GET['action'] ?? '';

if ($route === 'products') {
    $stmt = $pdo->query("SELECT * FROM products ORDER BY number_sold DESC");
    $rows = $stmt->fetchAll(PDO::FETCH_ASSOC);

    // Mapping nama kolom DB → nama yang dipakai app.js
    $products = array_map(function($p) {
        return [
            'id'       => $p['product_id'],
            'name'     => $p['name'],
            'sub'      => $p['sub_category'],
            'detail'   => $p['detail_category'],
            'price'    => (int)$p['price'],
            'rating'   => (float)$p['overall_rating'],
            'sold'     => (int)$p['number_sold'],
            'reviews'  => (int)$p['total_review'],
            'merchant' => 'UMKM Lokal',
            'color'    => '#F5F5F5',
        ];
    }, $rows);

    echo json_encode($products);
}