import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { hashPassword } from '../utils/crypto.js';
import { AuthRequest } from '../middleware/auth.js';

const CreateUserSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(6),
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'EDITOR', 'VIEWER']).default('USER'),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).default('FREE'),
  isActive: z.boolean().default(true),
});

const UpdateUserSchema = z.object({
  fullName: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  role: z.enum(['ADMIN', 'USER', 'EDITOR', 'VIEWER']).optional(),
  plan: z.enum(['FREE', 'PRO', 'ENTERPRISE']).optional(),
  isActive: z.boolean().optional(),
  password: z.string().min(6).optional(),
});

export async function getAdminUsersList(req: AuthRequest, res: Response): Promise<void> {
  try {
    const users = await prisma.user.findMany({
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
        updatedAt: true,
        _count: {
          select: { persons: true }
        }
      },
      orderBy: { createdAt: 'desc' },
    });

    const formatted = users.map(u => ({
      id: u.id,
      username: u.username,
      email: u.email,
      fullName: u.fullName,
      phone: u.phone,
      role: u.role,
      plan: u.plan,
      isActive: u.isActive,
      createdAt: u.createdAt,
      totalRelatives: u._count.persons,
    }));

    res.json({ users: formatted });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener usuarios', details: error.message });
  }
}

export async function createAdminUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parse = CreateUserSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const { username, email, password, fullName, phone, role, plan, isActive } = parse.data;

    const existing = await prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });

    if (existing) {
      res.status(400).json({ error: 'El usuario o correo ya está registrado' });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        fullName: fullName || null,
        phone: phone || null,
        role,
        plan,
        isActive,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'USER',
        entityId: user.id,
        details: `Usuario creado por admin: ${user.username} (${user.role} - ${user.plan})`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.status(201).json({ message: 'Usuario creado exitosamente', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear usuario', details: error.message });
  }
}

export async function updateAdminUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parse = UpdateUserSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const data = parse.data;
    const updateData: any = {};

    if (data.fullName !== undefined) updateData.fullName = data.fullName;
    if (data.phone !== undefined) updateData.phone = data.phone;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.plan !== undefined) updateData.plan = data.plan;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;
    if (data.password) {
      updateData.passwordHash = await hashPassword(data.password);
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        phone: true,
        role: true,
        plan: true,
        isActive: true,
      }
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        details: `Usuario actualizado por admin: ${user.username}`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.json({ message: 'Usuario actualizado exitosamente', user });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar usuario', details: error.message });
  }
}

export async function resetUserPassword(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const { password } = req.body;

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({ error: 'La nueva contraseña debe tener al menos 6 caracteres' });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    const passwordHash = await hashPassword(password);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'USER',
        entityId: id,
        details: `Contraseña restablecida por admin para el usuario: ${user.username}`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.json({ message: `Contraseña de ${user.username} restablecida con éxito` });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al restablecer la contraseña', details: error.message });
  }
}

export async function deleteAdminUser(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }

    if (user.username === 'admin') {
      res.status(400).json({ error: 'No es posible eliminar al superadministrador principal' });
      return;
    }

    // Borrado en cascada (personas y relaciones del usuario)
    await prisma.person.deleteMany({ where: { userId: id } });
    await prisma.user.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'USER',
        entityId: id,
        details: `Usuario eliminado: ${user.username}`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.json({ message: 'Usuario y datos asociados eliminados' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar usuario', details: error.message });
  }
}

export async function getAdminPlatformStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const [totalUsers, activeUsers, totalPersons, plans] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { isActive: true } }),
      prisma.person.count(),
      prisma.user.groupBy({
        by: ['plan'],
        _count: { plan: true },
      }),
    ]);

    const planCounts = {
      FREE: 0,
      PRO: 0,
      ENTERPRISE: 0,
    };

    plans.forEach(p => {
      if (p.plan in planCounts) {
        planCounts[p.plan as keyof typeof planCounts] = p._count.plan;
      }
    });

    res.json({
      totalUsers,
      activeUsers,
      totalPersons,
      planCounts,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener métricas globales', details: error.message });
  }
}
