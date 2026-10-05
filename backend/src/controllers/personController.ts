import { Request, Response } from 'express';
import { z } from 'zod';
import { prisma } from '../config/db.js';
import { generateMerkleNodeHash, sanitizeString } from '../utils/crypto.js';
import { AuthRequest } from '../middleware/auth.js';

const PersonSchema = z.object({
  firstName: z.string().min(1, 'El primer nombre es requerido'),
  middleName: z.string().optional().nullable(),
  lastName: z.string().min(1, 'El primer apellido es requerido'),
  secondLastName: z.string().optional().nullable(),
  maidenName: z.string().optional().nullable(),
  nickname: z.string().optional().nullable(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).default('UNKNOWN'),
  isAlive: z.boolean().default(true),
  birthDate: z.string().optional().nullable(), // YYYY-MM-DD
  birthPlace: z.string().optional().nullable(),
  deathDate: z.string().optional().nullable(), // YYYY-MM-DD
  deathPlace: z.string().optional().nullable(),
  burialPlace: z.string().optional().nullable(),
  causeOfDeath: z.string().optional().nullable(),
  avatarUrl: z.string().optional().nullable(),
  biography: z.string().optional().nullable(),
  profession: z.string().optional().nullable(),
  contactPhone: z.string().optional().nullable(),
  contactEmail: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  generation: z.number().int().optional().nullable(),
  kinshipRole: z.string().optional().nullable(),
});

function getUserIdFromReq(req: AuthRequest): string | null {
  return req.user?.id || null;
}

export async function getAllPersons(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const persons = await prisma.person.findMany({
      where: { userId },
      include: {
        parentRelations: {
          include: {
            parent: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, gender: true, isAlive: true, birthDate: true }
            }
          }
        },
        childRelations: {
          include: {
            child: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, gender: true, isAlive: true, birthDate: true }
            }
          }
        },
        spousesAsFirst: {
          include: {
            person2: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, gender: true, isAlive: true, birthDate: true }
            }
          }
        },
        spousesAsSecond: {
          include: {
            person1: {
              select: { id: true, firstName: true, lastName: true, avatarUrl: true, gender: true, isAlive: true, birthDate: true }
            }
          }
        },
      },
      orderBy: [
        { birthDate: 'asc' },
        { lastName: 'asc' },
        { firstName: 'asc' }
      ]
    });

    res.json({ persons });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al listar personas', details: error.message });
  }
}

export async function getPersonById(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const person = await prisma.person.findUnique({
      where: { id },
      include: {
        parentRelations: {
          include: {
            parent: true
          }
        },
        childRelations: {
          include: {
            child: true
          }
        },
        spousesAsFirst: {
          include: {
            person2: true
          }
        },
        spousesAsSecond: {
          include: {
            person1: true
          }
        },
      }
    });

    if (!person) {
      res.status(404).json({ error: 'Persona no encontrada' });
      return;
    }

    res.json({ person });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al obtener persona', details: error.message });
  }
}

export async function createPerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req) || 'system';
    const parse = PersonSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const data = parse.data;
    if (data.deathDate && data.deathDate.trim() !== '') {
      data.isAlive = false;
    }

    const merkleHash = generateMerkleNodeHash({
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      gender: data.gender,
      userId,
    });

    const person = await prisma.person.create({
      data: {
        userId,
        firstName: data.firstName.trim(),
        middleName: sanitizeString(data.middleName),
        lastName: data.lastName.trim(),
        secondLastName: sanitizeString(data.secondLastName),
        maidenName: sanitizeString(data.maidenName),
        nickname: sanitizeString(data.nickname),
        gender: data.gender,
        isAlive: data.isAlive,
        birthDate: data.birthDate || null,
        birthPlace: sanitizeString(data.birthPlace),
        deathDate: data.deathDate || null,
        deathPlace: sanitizeString(data.deathPlace),
        burialPlace: sanitizeString(data.burialPlace),
        causeOfDeath: sanitizeString(data.causeOfDeath),
        avatarUrl: data.avatarUrl || null,
        biography: data.biography || null,
        profession: sanitizeString(data.profession),
        contactPhone: sanitizeString(data.contactPhone),
        contactEmail: sanitizeString(data.contactEmail),
        notes: data.notes || null,
        generation: data.generation || 1,
        kinshipRole: data.kinshipRole || null,
        merkleHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'CREATE',
        entity: 'PERSON',
        entityId: person.id,
        details: `Creado: ${person.firstName} ${person.lastName}`,
        performedBy: req.user?.username || 'user',
        hash: merkleHash,
      },
    });

    res.status(201).json({ message: 'Persona agregada exitosamente', person });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al crear persona', details: error.message });
  }
}

export async function updatePerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;
    const parse = PersonSchema.safeParse(req.body);
    if (!parse.success) {
      res.status(400).json({ error: 'Datos no válidos', details: parse.error.format() });
      return;
    }

    const data = parse.data;
    if (data.deathDate && data.deathDate.trim() !== '') {
      data.isAlive = false;
    }

    const merkleHash = generateMerkleNodeHash({
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      deathDate: data.deathDate,
      gender: data.gender,
    });

    const person = await prisma.person.update({
      where: { id },
      data: {
        firstName: data.firstName.trim(),
        middleName: sanitizeString(data.middleName),
        lastName: data.lastName.trim(),
        secondLastName: sanitizeString(data.secondLastName),
        maidenName: sanitizeString(data.maidenName),
        nickname: sanitizeString(data.nickname),
        gender: data.gender,
        isAlive: data.isAlive,
        birthDate: data.birthDate || null,
        birthPlace: sanitizeString(data.birthPlace),
        deathDate: data.deathDate || null,
        deathPlace: sanitizeString(data.deathPlace),
        burialPlace: sanitizeString(data.burialPlace),
        causeOfDeath: sanitizeString(data.causeOfDeath),
        avatarUrl: data.avatarUrl || null,
        biography: data.biography || null,
        profession: sanitizeString(data.profession),
        contactPhone: sanitizeString(data.contactPhone),
        contactEmail: sanitizeString(data.contactEmail),
        notes: data.notes || null,
        generation: data.generation || 1,
        kinshipRole: data.kinshipRole || null,
        merkleHash,
      },
    });

    await prisma.auditLog.create({
      data: {
        action: 'UPDATE',
        entity: 'PERSON',
        entityId: person.id,
        details: `Actualizado: ${person.firstName} ${person.lastName}`,
        performedBy: req.user?.username || 'user',
        hash: merkleHash,
      },
    });

    res.json({ message: 'Persona actualizada correctamente', person });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al actualizar persona', details: error.message });
  }
}

export async function deletePerson(req: AuthRequest, res: Response): Promise<void> {
  try {
    const id = req.params.id as string;

    const person = await prisma.person.findUnique({ where: { id } });
    if (!person) {
      res.status(404).json({ error: 'Persona no encontrada' });
      return;
    }

    await prisma.person.delete({ where: { id } });

    await prisma.auditLog.create({
      data: {
        action: 'DELETE',
        entity: 'PERSON',
        entityId: id,
        details: `Eliminado: ${person.firstName} ${person.lastName}`,
        performedBy: req.user?.username || 'user',
      },
    });

    res.json({ message: 'Persona eliminada exitosamente' });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al eliminar persona', details: error.message });
  }
}

export async function getTreeGraph(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = getUserIdFromReq(req);
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const persons = await prisma.person.findMany({ where: { userId } });
    const personIds = persons.map(p => p.id);

    const relations = await prisma.relation.findMany({
      where: {
        parentId: { in: personIds },
        childId: { in: personIds }
      }
    });

    const spouses = await prisma.spouseRelation.findMany({
      where: {
        person1Id: { in: personIds },
        person2Id: { in: personIds }
      }
    });

    res.json({
      nodes: persons.map((p: any) => ({
        id: p.id,
        firstName: p.firstName,
        middleName: p.middleName,
        lastName: p.lastName,
        secondLastName: p.secondLastName,
        maidenName: p.maidenName,
        nickname: p.nickname,
        gender: p.gender,
        isAlive: p.isAlive,
        birthDate: p.birthDate,
        birthPlace: p.birthPlace,
        deathDate: p.deathDate,
        deathPlace: p.deathPlace,
        avatarUrl: p.avatarUrl,
        profession: p.profession,
        generation: p.generation,
        kinshipRole: p.kinshipRole,
      })),
      parentChildEdges: relations.map((r: any) => ({
        id: r.id,
        parentId: r.parentId,
        childId: r.childId,
        type: r.type,
      })),
      spouseEdges: spouses.map((s: any) => ({
        id: s.id,
        person1Id: s.person1Id,
        person2Id: s.person2Id,
        type: s.type,
        marriageDate: s.marriageDate,
        divorceDate: s.divorceDate,
      })),
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al generar grafo de árbol', details: error.message });
  }
}
