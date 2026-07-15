CREATE DATABASE IF NOT EXISTS auth_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS produits_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS stock_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS achats_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS ventes_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS facturation_db CHARACTER SET utf8mb4;
CREATE DATABASE IF NOT EXISTS client_db CHARACTER SET utf8mb4;

CREATE USER IF NOT EXISTS 'quincaillerie'@'%' IDENTIFIED BY 'quincaillerie_pwd';
GRANT ALL PRIVILEGES ON auth_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON produits_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON stock_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON achats_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON ventes_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON facturation_db.* TO 'quincaillerie'@'%';
GRANT ALL PRIVILEGES ON client_db.* TO 'quincaillerie'@'%';
FLUSH PRIVILEGES;
