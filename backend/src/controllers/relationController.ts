import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

const ParentChildSchema = z.object({
  parentId: z.string().uuid(),
  childId: z.string().uuid(),
  type: z.enum(['BIOLOGICAL', 'ADOPTIVE', 'FOSTER', 'STEP']).default('BIOLOGICAL'),
});

const SpouseSchema = z.object({
  person1Id: z.string().uuid(),
  person2Id: z.string().uuid(),
  type: z.enum(['MARRIED', 'PARTNER', 'DIVORCED', 'WIDOWED', 'SEPARATED']).default('MARRIED'),
  marriageDate: z.string().optional().nullable(),
  divorceDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export async function addParentChildRelation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parse = ParentChildSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const { parentId, childId, type } = parse.data;

    if (parentId === childId) {
      res.status(400).json({ error: 'Una persona no puede ser su propio padre o madre' });
      return;
    }

    // Verificar si ya existe
    const existing = await prisma.relation.findUnique({
      where: {
        parentId_childId: { parentId, childId },
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Este vínculo de parentesco ya está registrado' });
      return;
    }

    const relation = await prisma.relation.create({
      data: {
        parentId,
        childId,
        type,
      },
      include: {
        parent: { select: { id: true, firstName: true, lastName: true } },
        child: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'RELATION',
        entityId: relation.id,
        details: `Vínculo: ${relation.parent.firstName} es progenitor de ${relation.child.firstName}`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.status(201).json({ message: 'Vínculo creado exitosamente', relation });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear relación', details: error.message });
  }
}

export async function deleteParentChildRelation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const relation = await prisma.relation.findUnique({ where: { id } });
    if (!relation) {
      res.status(404).json({ error: 'Relación no encontrada' });
      return;
    }

    await prisma.relation.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'RELATION',
        entityId: id,
        details: `Vínculo eliminado (${relation.parentId} -> ${relation.childId})`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.json({ message: 'Relación eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar relación', details: error.message });
  }
}

export async function addSpouseRelation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const parse = SpouseSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const { person1Id, person2Id, type, marriageDate, divorceDate, notes } = parse.data;

    if (person1Id === person2Id) {
      res.status(400).json({ error: 'No es posible vincular a la misma persona como cónyuge' });
      return;
    }

    // Ordenar IDs para evitar duplicados en espejo
    const [p1, p2] = person1Id < person2Id ? [person1Id, person2Id] : [person2Id, person1Id];

    const existing = await prisma.spouseRelation.findFirst({
      where: {
        OR: [
          { person1Id: p1, person2Id: p2 },
          { person1Id: p2, person2Id: p1 },
        ],
      },
    });

    if (existing) {
      res.status(400).json({ error: 'Esta unión de pareja/cónyuge ya existe' });
      return;
    }

    const spouse = await prisma.spouseRelation.create({
      data: {
        person1Id: p1,
        person2Id: p2,
        type,
        marriageDate: marriageDate || null,
        divorceDate: divorceDate || null,
        notes: notes || null,
      },
      include: {
        person1: { select: { id: true, firstName: true, lastName: true } },
        person2: { select: { id: true, firstName: true, lastName: true } },
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'SPOUSE',
        entityId: spouse.id,
        details: `Unión: ${spouse.person1.firstName} y ${spouse.person2.firstName} (${type})`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.status(201).json({ message: 'Unión de pareja registrada', spouse });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al registrar unión', details: error.message });
  }
}

export async function deleteSpouseRelation(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const spouse = await prisma.spouseRelation.findUnique({ where: { id } });
    if (!spouse) {
      res.status(404).json({ error: 'Unión no encontrada' });
      return;
    }

    await prisma.spouseRelation.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'SPOUSE',
        entityId: id,
        details: `Unión eliminada`,
        performedBy: req.user?.username || 'admin',
      },
    });

    res.json({ message: 'Unión eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar unión', details: error.message });
  }
}
