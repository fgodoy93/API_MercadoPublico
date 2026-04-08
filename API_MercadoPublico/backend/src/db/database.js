import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('error', (err) => {
  console.error('Error inesperado en el pool de conexiones:', err);
});

export const query = (text, params) => {
  return pool.query(text, params);
};

export const getClient = () => {
  return pool.connect();
};

export async function initializeDatabase() {
  try {
    const client = await pool.connect();
    console.log('Conexión a base de datos establecida');
    
    // Create tables if they don't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        nombre VARCHAR(255) NOT NULL,
        contrasena VARCHAR(255) NOT NULL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS perfiles_empresa (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre_empresa VARCHAR(255) NOT NULL,
        rut_empresa VARCHAR(20),
        descripcion TEXT,
        servicios TEXT,
        experiencia_anos INTEGER,
        regiones VARCHAR(255),
        tipos_licitacion VARCHAR(255),
        presupuesto_minimo DECIMAL,
        presupuesto_maximo DECIMAL,
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS licitaciones_guardadas (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        codigo_licitacion VARCHAR(50) NOT NULL,
        datos_licitacion JSONB,
        nivel_match INTEGER,
        analisis_ia JSONB,
        estado VARCHAR(50),
        fecha_guardado TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(usuario_id, codigo_licitacion)
      );

      CREATE TABLE IF NOT EXISTS filtros_busqueda (
        id SERIAL PRIMARY KEY,
        usuario_id INTEGER NOT NULL REFERENCES usuarios(id) ON DELETE CASCADE,
        nombre_filtro VARCHAR(255),
        proveedor VARCHAR(255),
        region VARCHAR(255),
        fecha_inicio DATE,
        fecha_fin DATE,
        estado_licitacion VARCHAR(50),
        creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS cache_licitaciones (
        codigo_externo VARCHAR(50) PRIMARY KEY,
        datos JSONB NOT NULL,
        region VARCHAR(255),
        nombre_organismo VARCHAR(500),
        monto_estimado DECIMAL,
        tipo VARCHAR(10),
        fecha_cache TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_cache_region ON cache_licitaciones(region);
      CREATE INDEX IF NOT EXISTS idx_cache_fecha ON cache_licitaciones(fecha_cache);
    `);
    
    client.release();
    console.log('✓ Tablas de base de datos inicializadas');
  } catch (error) {
    console.error('Error inicializando base de datos:', error);
    throw error;
  }
}

export default pool;
