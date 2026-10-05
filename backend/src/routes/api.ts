import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { login, register, getCurrentUser, checkUserExists } from '../controllers/authController.js';
import {
  getAllPersons,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  getTreeGraph,
} from '../controllers/personController.js';
import {
  addParentChildRelation,
  deleteParentChildRelation,
  addSpouseRelation,
  deleteSpouseRelation,
} from '../controllers/relationController.js';
import {
  getUpcomingEvents,
  getDemographicStats,
} from '../controllers/eventController.js';
import {
  exportJSONBackup,
  importJSONBackup,
  exportGEDCOM,
} from '../controllers/backupController.js';
import {
  getAdminUsersList,
  createAdminUser,
  updateAdminUser,
  deleteAdminUser,
  getAdminPlatformStats,
  resetUserPassword,
} from '../controllers/adminController.js';
import {
  getTrees,
  createTree,
  updateTree,
  deleteTree,
} from '../controllers/treeController.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const uploadDir = path.resolve(process.cwd(), 'data', 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo imágenes JPG, PNG, WEBP, GIF, SVG.'));
    }
  },
});

export const router = Router();

// 1. Auth & Sesión
router.post('/auth/login', login);
router.post('/auth/register', register);
router.post('/auth/check-user', checkUserExists);
router.get('/auth/me', authenticateToken, getCurrentUser);

// 2. Personas & Grafo Familiar
router.get('/trees', authenticateToken, getTrees);
router.post('/trees', authenticateToken, createTree);
router.put('/trees/:id', authenticateToken, updateTree);
router.delete('/trees/:id', authenticateToken, deleteTree);
router.get('/persons', authenticateToken, getAllPersons);
router.get('/persons/tree-graph', authenticateToken, getTreeGraph);
router.get('/persons/:id', authenticateToken, getPersonById);
router.post('/persons', authenticateToken, createPerson);
router.put('/persons/:id', authenticateToken, updatePerson);
router.delete('/persons/:id', authenticateToken, deletePerson);

// 3. Subida de Archivos
router.post('/upload/avatar', authenticateToken, upload.single('avatar'), (req: Request, res: Response) => {
  if (!req.file) {
    res.status(400).json({ error: 'No se subió ninguna imagen' });
    return;
  }
  const url = `/uploads/${req.file.filename}`;
  res.json({ message: 'Imagen subida exitosamente', url, filename: req.file.filename });
});

// 4. Relaciones Genealógicas
router.post('/relations/parent-child', authenticateToken, addParentChildRelation);
router.delete('/relations/parent-child/:id', authenticateToken, deleteParentChildRelation);
router.post('/relations/spouse', authenticateToken, addSpouseRelation);
router.delete('/relations/spouse/:id', authenticateToken, deleteSpouseRelation);

// 5. Efemérides & Demografía
router.get('/events/upcoming', authenticateToken, getUpcomingEvents);
router.get('/stats/demographics', authenticateToken, getDemographicStats);

// 6. Respaldos & GEDCOM
router.get('/backup/export/json', authenticateToken, exportJSONBackup);
router.post('/backup/import/json', authenticateToken, importJSONBackup);
router.get('/backup/export/gedcom', authenticateToken, exportGEDCOM);

// 7. Panel Super Administrador
router.get('/admin/users', authenticateToken, requireRole(['ADMIN']), getAdminUsersList);
router.post('/admin/users', authenticateToken, requireRole(['ADMIN']), createAdminUser);
router.put('/admin/users/:id', authenticateToken, requireRole(['ADMIN']), updateAdminUser);
router.post('/admin/users/:id/reset-password', authenticateToken, requireRole(['ADMIN']), resetUserPassword);
router.delete('/admin/users/:id', authenticateToken, requireRole(['ADMIN']), deleteAdminUser);
router.get('/admin/stats', authenticateToken, requireRole(['ADMIN']), getAdminPlatformStats);
