<?php
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');

$host = 'sql110.infinityfree.com';
$port = '3306';
$dbname = 'if0_42158092_fashion';
$username = 'if0_42158092';
$password = 'Dhika130206';

try {
    $pdo = new PDO(
        "mysql:host=$host;port=$port;dbname=$dbname;charset=utf8mb4",
        $username,
        $password,
        [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]
    );

    $route = $_GET['action'] ?? '';

    if ($route === 'test') {
        echo json_encode([
            'status' => true,
            'message' => 'Koneksi database berhasil',
            'database' => $dbname
        ]);
        exit;
    }

    if ($route === 'products') {
        $stmt = $pdo->query("SELECT * FROM products ORDER BY number_sold DESC");
        $rows = $stmt->fetchAll();

        $products = array_map(function($p) {
            return [
                'id'       => $p['product_id'] ?? '',
                'name'     => $p['name'] ?? '',
                'sub'      => $p['sub_category'] ?? '',
                'detail'   => $p['detail_category'] ?? '',
                'price'    => (int)($p['price'] ?? 0),
                'rating'   => (float)($p['overall_rating'] ?? 0),
                'sold'     => (int)($p['number_sold'] ?? 0),
                'reviews'  => (int)($p['total_review'] ?? 0),
                'merchant' => 'UMKM Lokal',
                'color'    => '#F5F5F5',
                'image'    => $p['image'] ?? ''
            ];
        }, $rows);

        echo json_encode($products);
        exit;
    }

    echo json_encode([
        'status' => false,
        'message' => 'Action tidak ditemukan',
        'contoh' => [
            'api.php?action=test',
            'api.php?action=products'
        ]
    ]);
    exit;

} catch (PDOException $e) {
    echo json_encode([
        'status' => false,
        'message' => 'Koneksi database gagal',
        'error' => $e->getMessage()
    ]);
    exit;
}