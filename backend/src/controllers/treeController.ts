import { Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

const TreeSchema = z.object({
  name: z.string().min(1, 'El nombre del árbol es requerido'),
  description: z.string().optional().nullable(),
});

function getUserIdFromReq(req: AuthRequest): string | null {
  return req.user?.id || null;
}

export async function getTrees(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    let trees = await prisma.tree.findMany({
      where: { userId },
      include: {
        _count: {
          select: { persons: true }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    if (trees.length === 0) {
      // Crear árboles por defecto
      const defaultTree = await prisma.tree.create({
        data: {
          userId,
          name: 'Árbol Genealógico Principal',
          description: 'Árbol familiar general',
          isDefault: true,
        },
        include: {
          _count: {
            select: { persons: true }
          }
        }
      });
      trees = [defaultTree];
    }

    res.json({ trees });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al listar árboles', details: error.message });
  }
}

export async function createTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const data = TreeSchema.parse(req.body);

    const tree = await prisma.tree.create({
      data: {
        userId,
        name: data.name,
        description: data.description,
        isDefault: false,
      },
      include: {
        _count: {
          select: { persons: true }
        }
      }
    });

    res.status(201).json({ tree, message: 'Árbol creado exitosamente' });
  } catch (error: any) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ error: 'Datos inválidos', details: error.errors });
      return;
    }
    res.status(500).json({ error: 'Error al crear árbol', details: error.message });
  }
}

export async function updateTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const data = TreeSchema.parse(req.body);

    const tree = await prisma.tree.updateMany({
      where: { id: id as string, userId },
      data: {
        name: data.name,
        description: data.description,
      }
    });

    res.json({ message: 'Árbol actualizado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar árbol', details: error.message });
  }
}

export async function deleteTree(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    const { id } = req.params;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    await prisma.tree.deleteMany({
      where: { id: id as string, userId, isDefault: false }
    });

    res.json({ message: 'Árbol eliminado exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar árbol', details: error.message });
  }
}
