import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Usuario } from '../db/sequelize.js';
import dotenv from 'dotenv';

dotenv.config();

const router = express.Router();

// Registrar usuario
router.post('/registro', async (req, res) => {
  try {
    const { email, nombre, contrasena } = req.body;

    // Validar entrada
    if (!email || !nombre || !contrasena) {
      return res.status(400).json({ error: 'Faltan campos requeridos' });
    }

    // Verificar si usuario ya existe
    const existing = await Usuario.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: 'El email ya está registrado' });
    }

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(contrasena, 10);

    // Crear usuario
    const usuario = await Usuario.create({
      email,
      nombre,
      contrasena: hashedPassword
    });

    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'secreto_default',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, contrasena } = req.body;

    if (!email || !contrasena) {
      return res.status(400).json({ error: 'Email y contraseña requeridos' });
    }

    // Buscar usuario
    const usuario = await Usuario.findOne({ where: { email } });
    if (!usuario) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Verificar contraseña
    const passwordMatch = await bcrypt.compare(contrasena, usuario.contrasena);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Credenciales inválidas' });
    }

    // Generar token
    const token = jwt.sign(
      { id: usuario.id, email: usuario.email },
      process.env.JWT_SECRET || 'secreto_default',
      { expiresIn: process.env.JWT_EXPIRY || '7d' }
    );

    res.json({
      usuario: {
        id: usuario.id,
        email: usuario.email,
        nombre: usuario.nombre
      },
      token
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
