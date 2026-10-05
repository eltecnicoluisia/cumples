import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { hashPassword, comparePassword } from '../utils/crypto.js';
import { AuthRequest } from '../middleware/auth.js';

const JWT_SECRET = process.env.JWT_SECRET || 'geneatrack_super_secret_jwt_key_2026';

const LoginSchema = z.object({
  username: z.string().min(3, 'Introduce tu número de celular o usuario'),
  password: z.string().min(1, 'Introduce tu contraseña'),
});

const RegisterSchema = z.object({
  phone: z.string().regex(/^\d{11}$/, 'El número de celular debe contener exactamente 11 dígitos numéricos (ej. 04121234567)'),
  fullName: z.string().min(3, 'Introduce tu nombre y apellido'),
  password: z.string(),
  email: z.string().optional(),
});

function validatePasswordRule(password: string): { isValid: boolean; error?: string } {
  if (password.length < 8 || password.length > 10) {
    return { isValid: false, error: 'La contraseña debe tener mínimo 8 y máximo 10 caracteres' };
  }
  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'La contraseña debe incluir al menos una letra mayúscula' };
  }
  const digits = password.match(/[0-9]/g) || [];
  if (digits.length < 2) {
    return { isValid: false, error: 'La contraseña debe incluir al menos dos números' };
  }
  return { isValid: true };
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const parse = LoginSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Credenciales inválidas', details: parse.error.format() });
      return;
    }

    const { username, password } = parse.data;
    const cleanIdentifier = username.trim().toLowerCase();
    const cleanPhone = username.replace(/[\s\-\+\(\)]/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { phone: cleanPhone },
          { phone: cleanIdentifier },
          { username: cleanPhone },
        ],
      },
    });

    if (!user) {
      res.status(401).json({ error: 'Número de celular o contraseña incorrectos' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ error: 'Tu cuenta ha sido desactivada. Contacta al soporte.' });
      return;
    }

    const isValid = await comparePassword(password.trim(), user.passwordHash);

    if (!isValid) {
      res.status(401).json({ error: 'Número de celular o contraseña incorrectos' });
      return;
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      message: 'Autenticación exitosa',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error en el servidor', details: error.message });
  }
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const parse = RegisterSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const { phone, password, email, fullName } = parse.data;

    // Validación de semáforo de contraseña: 8 a 10 caracteres, 1 mayúscula, 2 números
    const passCheck = validatePasswordRule(password);
    if (!passCheck.isValid) {
      res.status(400).json({ error: passCheck.error });
      return;
    }

    const cleanPhone = phone.replace(/[\s\-\+\(\)]/g, '');
    const userIdentifier = cleanPhone.toLowerCase().trim();
    const userEmail = (email || `${cleanPhone}@cumples.local`).toLowerCase().trim();

    const existing = await prisma.user.findFirst({
      where: {
        OR: [
          { username: userIdentifier },
          { phone: cleanPhone },
          { email: userEmail },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Este número de celular ya tiene una cuenta registrada. Por favor inicia sesión.' });
      return;
    }

    const count = await prisma.user.count();
    const passwordHash = await hashPassword(password);
    const assignedRole = count === 0 ? 'ADMIN' : 'USER';
    const assignedPlan = count === 0 ? 'ENTERPRISE' : 'FREE';

    const user = await prisma.user.create({
      data: {
        username: userIdentifier,
        email: userEmail,
        passwordHash,
        fullName: fullName.trim(),
        phone: cleanPhone,
        role: assignedRole,
        plan: assignedPlan,
        isActive: true,
      },
    });

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role, plan: user.plan },
      JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.status(201).json({
      message: 'Registro exitoso. ¡Bienvenido a GeneaTrack!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        phone: user.phone,
        role: user.role,
        plan: user.plan,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar usuario', details: error.message });
  }
}

export async function getCurrentUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'No autenticado' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        plan: true,
        isActive: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    res.json({ user });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuario', details: error.message });
  }
}

export async function checkUserExists(req: Request, res: Response): Promise<void> {
  try {
    const { identifier } = req.body;
    if (!identifier || typeof identifier !== 'string') {
      res.status(400).json({ error: 'Debes proporcionar un usuario o número de celular' });
      return;
    }

    const cleanIdentifier = identifier.trim().toLowerCase();
    const cleanPhone = identifier.replace(/[\s\-\+\(\)]/g, '');

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { username: cleanIdentifier },
          { email: cleanIdentifier },
          { phone: cleanPhone },
          { phone: cleanIdentifier },
          { username: cleanPhone },
        ],
      },
      select: {
        id: true,
        username: true,
        fullName: true,
        phone: true,
      },
    });

    if (!user) {
      res.json({ exists: false });
      return;
    }

    res.json({
      exists: true,
      user: {
        username: user.username,
        fullName: user.fullName,
        phone: user.phone,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al verificar usuario', details: error.message });
  }
}
