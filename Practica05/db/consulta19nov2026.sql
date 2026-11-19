-- COMADOS PARA CREAR LA BASE DE DATOS PARA MECAGEST Y SU INTERACCION CON PHP

-- 1. Crear la base de datos 
CREATE DATABASE db_mecagest;

-- 2. Usar/Activarla Base de Datos
USE db_mecagest;

-- 3. CREAR LA TABLA DE USUARIOS 
CREATE TABLE usuarios (
	id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    update_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
		ON UPDATE CURRENT_TIMESTAMP,
	status TINYINT DEFAULT 1 
);

-- 4. Visualizar la estructura de la tabla 
DESCRIBE usuarios;

-- 5. Seleccionar los registros de la tabla
SELECT * FROM usuarios;

-- 6. Ejemplo de inserción de un nuevo usuario
INSERT INTO usuarios VALUES(
	DEFAULT, "Carlos E. Antonio", "carlos@gmail.com",
    md5("C4rl0$01"), now(), null, 1);

-- 7. Insersion multiple de otros dos usuarios 
INSERT INTO usuarios (nombre,email,password) values
	("Juan Pérez", "j.perez@gmail.com", md5("12345")),
	("Patricia Reyes", "patty.reyes48@outlook.com", md5("67890"));
    
    
    