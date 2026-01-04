<?php
/**
 * API REST pour Quick'n'Tasty
 * Compatible avec XAMPP/MySQL
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Gérer les requêtes OPTIONS (CORS preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

require_once '../config/database.php';

class QuickNTastyAPI {
    private $db;
    
    public function __construct() {
        $this->db = new DatabaseHelper();
    }
    
    /**
     * Router principal
     */
    public function handleRequest() {
        $method = $_SERVER['REQUEST_METHOD'];
        $path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
        $pathParts = explode('/', trim($path, '/'));
        
        // Supprimer 'api' du chemin si présent
        if ($pathParts[0] === 'api') {
            array_shift($pathParts);
        }
        
        $endpoint = $pathParts[0] ?? '';
        $id = $pathParts[1] ?? null;
        
        switch ($endpoint) {
            case 'menu':
                $this->handleMenuItems($method, $id);
                break;
            case 'orders':
                $this->handleOrders($method, $id);
                break;
            case 'users':
                $this->handleUsers($method, $id);
                break;
            case 'auth':
                $this->handleAuth($method);
                break;
            default:
                $this->sendResponse(404, ['error' => 'Endpoint non trouvé']);
        }
    }
    
    /**
     * Gestion des articles du menu
     */
    private function handleMenuItems($method, $id) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $item = $this->db->select("SELECT * FROM menu_items WHERE id = ?", [$id]);
                    $this->sendResponse(200, $item[0] ?? null);
                } else {
                    $category = $_GET['category'] ?? null;
                    $available = $_GET['available'] ?? null;
                    
                    $query = "SELECT * FROM menu_items WHERE 1=1";
                    $params = [];
                    
                    if ($category) {
                        $query .= " AND category = ?";
                        $params[] = $category;
                    }
                    
                    if ($available !== null) {
                        $query .= " AND available = ?";
                        $params[] = $available === 'true' ? 1 : 0;
                    }
                    
                    $query .= " ORDER BY category, name";
                    
                    $items = $this->db->select($query, $params);
                    $this->sendResponse(200, $items);
                }
                break;
                
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                $id = $this->db->insert(
                    "INSERT INTO menu_items (name, description, price, category, image_url, available) VALUES (?, ?, ?, ?, ?, ?)",
                    [
                        $data['name'],
                        $data['description'],
                        $data['price'],
                        $data['category'],
                        $data['image_url'] ?? null,
                        $data['available'] ?? true
                    ]
                );
                
                if ($id) {
                    $this->sendResponse(201, ['id' => $id, 'message' => 'Article créé avec succès']);
                } else {
                    $this->sendResponse(500, ['error' => 'Erreur lors de la création']);
                }
                break;
                
            case 'PUT':
                if (!$id) {
                    $this->sendResponse(400, ['error' => 'ID requis']);
                    return;
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                
                $result = $this->db->update(
                    "UPDATE menu_items SET name = ?, description = ?, price = ?, category = ?, image_url = ?, available = ? WHERE id = ?",
                    [
                        $data['name'],
                        $data['description'],
                        $data['price'],
                        $data['category'],
                        $data['image_url'] ?? null,
                        $data['available'] ?? true,
                        $id
                    ]
                );
                
                if ($result) {
                    $this->sendResponse(200, ['message' => 'Article mis à jour']);
                } else {
                    $this->sendResponse(500, ['error' => 'Erreur lors de la mise à jour']);
                }
                break;
                
            case 'DELETE':
                if (!$id) {
                    $this->sendResponse(400, ['error' => 'ID requis']);
                    return;
                }
                
                $result = $this->db->delete("DELETE FROM menu_items WHERE id = ?", [$id]);
                
                if ($result) {
                    $this->sendResponse(200, ['message' => 'Article supprimé']);
                } else {
                    $this->sendResponse(500, ['error' => 'Erreur lors de la suppression']);
                }
                break;
        }
    }
    
    /**
     * Gestion des commandes
     */
    private function handleOrders($method, $id) {
        switch ($method) {
            case 'GET':
                if ($id) {
                    $order = $this->db->select(
                        "SELECT o.*, u.full_name, u.email, u.phone as user_phone 
                         FROM orders o 
                         LEFT JOIN users u ON o.user_id = u.id 
                         WHERE o.id = ?", 
                        [$id]
                    );
                    
                    if ($order) {
                        // Récupérer les articles de la commande
                        $items = $this->db->select(
                            "SELECT oi.*, mi.name, mi.description 
                             FROM order_items oi 
                             JOIN menu_items mi ON oi.menu_item_id = mi.id 
                             WHERE oi.order_id = ?",
                            [$id]
                        );
                        
                        $order[0]['items'] = $items;
                    }
                    
                    $this->sendResponse(200, $order[0] ?? null);
                } else {
                    $status = $_GET['status'] ?? null;
                    $userId = $_GET['user_id'] ?? null;
                    
                    $query = "SELECT o.*, u.full_name, u.email FROM orders o LEFT JOIN users u ON o.user_id = u.id WHERE 1=1";
                    $params = [];
                    
                    if ($status) {
                        $query .= " AND o.status = ?";
                        $params[] = $status;
                    }
                    
                    if ($userId) {
                        $query .= " AND o.user_id = ?";
                        $params[] = $userId;
                    }
                    
                    $query .= " ORDER BY o.created_at DESC";
                    
                    $orders = $this->db->select($query, $params);
                    $this->sendResponse(200, $orders);
                }
                break;
                
            case 'POST':
                $data = json_decode(file_get_contents('php://input'), true);
                
                $this->db->beginTransaction();
                
                try {
                    // Créer la commande
                    $orderId = $this->db->insert(
                        "INSERT INTO orders (user_id, guest_name, guest_phone, guest_address, total_amount, delivery_fee, payment_method, delivery_type, scheduled_for) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
                        [
                            $data['user_id'] ?? null,
                            $data['guest_name'] ?? null,
                            $data['guest_phone'] ?? null,
                            $data['guest_address'] ?? null,
                            $data['total_amount'],
                            $data['delivery_fee'] ?? 0,
                            $data['payment_method'],
                            $data['delivery_type'],
                            $data['scheduled_for'] ?? null
                        ]
                    );
                    
                    // Ajouter les articles
                    foreach ($data['items'] as $item) {
                        $this->db->insert(
                            "INSERT INTO order_items (order_id, menu_item_id, quantity, price) VALUES (?, ?, ?, ?)",
                            [$orderId, $item['menu_item_id'], $item['quantity'], $item['price']]
                        );
                    }
                    
                    $this->db->commit();
                    $this->sendResponse(201, ['id' => $orderId, 'message' => 'Commande créée avec succès']);
                    
                } catch (Exception $e) {
                    $this->db->rollback();
                    $this->sendResponse(500, ['error' => 'Erreur lors de la création de la commande']);
                }
                break;
                
            case 'PUT':
                if (!$id) {
                    $this->sendResponse(400, ['error' => 'ID requis']);
                    return;
                }
                
                $data = json_decode(file_get_contents('php://input'), true);
                
                $result = $this->db->update(
                    "UPDATE orders SET status = ?, preparation_time = ? WHERE id = ?",
                    [$data['status'], $data['preparation_time'] ?? null, $id]
                );
                
                if ($result) {
                    $this->sendResponse(200, ['message' => 'Commande mise à jour']);
                } else {
                    $this->sendResponse(500, ['error' => 'Erreur lors de la mise à jour']);
                }
                break;
        }
    }
    
    /**
     * Gestion de l'authentification
     */
    private function handleAuth($method) {
        if ($method === 'POST') {
            $data = json_decode(file_get_contents('php://input'), true);
            $action = $data['action'] ?? '';
            
            switch ($action) {
                case 'login':
                    $this->login($data['email'], $data['password']);
                    break;
                case 'register':
                    $this->register($data);
                    break;
                default:
                    $this->sendResponse(400, ['error' => 'Action non reconnue']);
            }
        }
    }
    
    /**
     * Connexion utilisateur
     */
    private function login($email, $password) {
        $user = $this->db->select(
            "SELECT u.*, ur.role FROM users u LEFT JOIN user_roles ur ON u.id = ur.user_id WHERE u.email = ?",
            [$email]
        );
        
        if ($user && password_verify($password, $user[0]['password_hash'])) {
            // Créer une session/token
            $token = bin2hex(random_bytes(32));
            $expiresAt = date('Y-m-d H:i:s', strtotime('+24 hours'));
            
            $this->db->insert(
                "INSERT INTO user_sessions (user_id, token, expires_at) VALUES (?, ?, ?)",
                [$user[0]['id'], $token, $expiresAt]
            );
            
            unset($user[0]['password_hash']); // Ne pas renvoyer le hash
            
            $this->sendResponse(200, [
                'user' => $user[0],
                'token' => $token,
                'expires_at' => $expiresAt
            ]);
        } else {
            $this->sendResponse(401, ['error' => 'Identifiants invalides']);
        }
    }
    
    /**
     * Inscription utilisateur
     */
    private function register($data) {
        // Vérifier si l'email existe déjà
        $existing = $this->db->select("SELECT id FROM users WHERE email = ?", [$data['email']]);
        
        if ($existing) {
            $this->sendResponse(409, ['error' => 'Email déjà utilisé']);
            return;
        }
        
        $this->db->beginTransaction();
        
        try {
            $userId = $this->db->insert(
                "INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)",
                [
                    $data['email'],
                    password_hash($data['password'], PASSWORD_DEFAULT),
                    $data['full_name'],
                    $data['phone'] ?? null
                ]
            );
            
            // Le trigger créera automatiquement le rôle
            
            $this->db->commit();
            $this->sendResponse(201, ['id' => $userId, 'message' => 'Utilisateur créé avec succès']);
            
        } catch (Exception $e) {
            $this->db->rollback();
            $this->sendResponse(500, ['error' => 'Erreur lors de la création du compte']);
        }
    }
    
    /**
     * Envoyer une réponse JSON
     */
    private function sendResponse($statusCode, $data) {
        http_response_code($statusCode);
        echo json_encode($data, JSON_UNESCAPED_UNICODE);
        exit();
    }
}

// Initialiser et exécuter l'API
$api = new QuickNTastyAPI();
$api->handleRequest();
?>