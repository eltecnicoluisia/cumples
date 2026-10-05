import express from 'express';
import cors from 'cors';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { router } from './routes/api.js';
import { prisma } from './config/db.js';
import { hashPassword } from './utils/crypto.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Configurar directorios persistentes
const uploadsDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Servir archivos estáticos subidos (avatares / fotos)
app.use('/uploads', express.static(uploadsDir));

// Rutas de API
app.use('/api', router);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'cumples-api',
  });
});

// Servir frontend compilado si existe (producción en contenedor)
const clientDistPath = path.resolve(process.cwd(), 'client-dist');
if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

async function bootstrapAdmin() {
  try {
    const adminPasswordHash = await hashPassword('admin123456');
    await prisma.user.upsert({
      where: { username: 'admin' },
      update: {
        role: 'ADMIN',
        isActive: true,
        passwordHash: adminPasswordHash,
      },
      create: {
        username: 'admin',
        email: 'admin@cumples.local',
        passwordHash: adminPasswordHash,
        fullName: 'Super Administrador',
        role: 'ADMIN',
        plan: 'ENTERPRISE',
        isActive: true,
      },
    });
    console.log('✅ Usuario Administrador garantizado: admin / admin123456');
  } catch (error) {
    console.error('⚠️ Error al asegurar usuario administrador:', error);
  }
}

// Iniciar servidor
app.listen(PORT, async () => {
  await bootstrapAdmin();
  console.log(`=========================================`);
  console.log(`🚀 GeneaTrack Backend iniciado`);
  console.log(`📍 Puerto: http://localhost:${PORT}`);
  console.log(`💾 Base de Datos: SQLite / Prisma`);
  console.log(`🖼️ Carpeta uploads: ${uploadsDir}`);
  console.log(`👑 Admin Usuario: admin / admin123456`);
  console.log(`=========================================`);
});
