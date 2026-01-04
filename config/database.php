<?php
/**
 * Configuration de la base de données MySQL pour Quick'n'Tasty
 * Compatible avec XAMPP
 */

class Database {
    // Paramètres de connexion XAMPP par défaut
    private $host = 'localhost';
    private $db_name = 'quickntasty';
    private $username = 'root';  // Utilisateur par défaut XAMPP
    private $password = '';      // Mot de passe vide par défaut XAMPP
    private $port = 3306;        // Port MySQL par défaut
    
    public $conn;
    
    /**
     * Établir la connexion à la base de données
     */
    public function getConnection() {
        $this->conn = null;
        
        try {
            $dsn = "mysql:host=" . $this->host . ";port=" . $this->port . ";dbname=" . $this->db_name . ";charset=utf8mb4";
            
            $this->conn = new PDO($dsn, $this->username, $this->password);
            
            // Configuration PDO
            $this->conn->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
            $this->conn->setAttribute(PDO::ATTR_DEFAULT_FETCH_MODE, PDO::FETCH_ASSOC);
            $this->conn->setAttribute(PDO::ATTR_EMULATE_PREPARES, false);
            
        } catch(PDOException $exception) {
            echo "Erreur de connexion: " . $exception->getMessage();
            die();
        }
        
        return $this->conn;
    }
    
    /**
     * Fermer la connexion
     */
    public function closeConnection() {
        $this->conn = null;
    }
}

/**
 * Classe utilitaire pour les opérations de base de données
 */
class DatabaseHelper {
    private $db;
    private $conn;
    
    public function __construct() {
        $this->db = new Database();
        $this->conn = $this->db->getConnection();
    }
    
    /**
     * Exécuter une requête SELECT
     */
    public function select($query, $params = []) {
        try {
            $stmt = $this->conn->prepare($query);
            $stmt->execute($params);
            return $stmt->fetchAll();
        } catch(PDOException $e) {
            error_log("Erreur SELECT: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Exécuter une requête INSERT
     */
    public function insert($query, $params = []) {
        try {
            $stmt = $this->conn->prepare($query);
            $result = $stmt->execute($params);
            return $result ? $this->conn->lastInsertId() : false;
        } catch(PDOException $e) {
            error_log("Erreur INSERT: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Exécuter une requête UPDATE
     */
    public function update($query, $params = []) {
        try {
            $stmt = $this->conn->prepare($query);
            return $stmt->execute($params);
        } catch(PDOException $e) {
            error_log("Erreur UPDATE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Exécuter une requête DELETE
     */
    public function delete($query, $params = []) {
        try {
            $stmt = $this->conn->prepare($query);
            return $stmt->execute($params);
        } catch(PDOException $e) {
            error_log("Erreur DELETE: " . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Commencer une transaction
     */
    public function beginTransaction() {
        return $this->conn->beginTransaction();
    }
    
    /**
     * Valider une transaction
     */
    public function commit() {
        return $this->conn->commit();
    }
    
    /**
     * Annuler une transaction
     */
    public function rollback() {
        return $this->conn->rollback();
    }
}

// Exemple d'utilisation
/*
$db = new DatabaseHelper();

// Récupérer tous les articles du menu
$menuItems = $db->select("SELECT * FROM menu_items WHERE available = 1");

// Insérer un nouvel utilisateur
$userId = $db->insert(
    "INSERT INTO users (email, password_hash, full_name, phone) VALUES (?, ?, ?, ?)",
    ['user@example.com', password_hash('motdepasse', PASSWORD_DEFAULT), 'Nom Utilisateur', '+221123456789']
);

// Mettre à jour un article
$db->update(
    "UPDATE menu_items SET price = ? WHERE id = ?",
    [850.00, 'menu-item-id']
);
*/
?>