import { Request, Response } from 'express';
import crypto from 'node:crypto';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export async function exportJSONBackup(req: Request, res: Response): Promise<void> {
  try {
    const persons = await prisma.person.findMany();
    const relations = await prisma.relation.findMany();
    const spouses = await prisma.spouseRelation.findMany();

    const payload = {
      version: '1.0.0',
      exportedAt: new Date().toISOString(),
      familyTreeName: 'Linaje Familiar Principal',
      persons,
      relations,
      spouses,
    };

    const payloadString = JSON.stringify(payload, null, 2);
    const merkleRoot = crypto.createHash('sha256').update(payloadString).digest('hex');

    const fullBackup = {
      ...payload,
      integrity: {
        algorithm: 'SHA-256',
        merkleRoot,
      },
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="arbol_genealogico_backup_${new Date().toISOString().split('T')[0]}.json"`);
    res.send(JSON.stringify(fullBackup, null, 2));
  } catch (error: any) {
    res.status(500).json({ error: 'Error al exportar respaldo JSON', details: error.message });
  }
}

export async function importJSONBackup(req: AuthRequest, res: Response): Promise<void> {
  try {
    const { persons, relations, spouses } = req.body;

    if (!Array.isArray(persons)) {
      res.status(400).json({ error: 'Formato inválido: se esperaba un array de personas' });
      return;
    }

    // Ejecutar en transacción atómica
    await prisma.$transaction(async (tx) => {
      // Borrar relaciones previas
      await tx.relation.deleteMany();
      await tx.spouseRelation.deleteMany();
      await tx.person.deleteMany();

      // Insertar personas
      for (const p of persons) {
        await tx.person.create({
          data: {
            id: p.id,
            firstName: p.firstName,
            middleName: p.middleName || null,
            lastName: p.lastName,
            secondLastName: p.secondLastName || null,
            maidenName: p.maidenName || null,
            nickname: p.nickname || null,
            gender: p.gender || 'UNKNOWN',
            isAlive: p.isAlive ?? true,
            birthDate: p.birthDate || null,
            birthPlace: p.birthPlace || null,
            deathDate: p.deathDate || null,
            deathPlace: p.deathPlace || null,
            burialPlace: p.burialPlace || null,
            causeOfDeath: p.causeOfDeath || null,
            avatarUrl: p.avatarUrl || null,
            biography: p.biography || null,
            profession: p.profession || null,
            contactPhone: p.contactPhone || null,
            contactEmail: p.contactEmail || null,
            notes: p.notes || null,
            generation: p.generation || 1,
            merkleHash: p.merkleHash || null,
          },
        });
      }

      // Insertar relaciones padre-hijo
      if (Array.isArray(relations)) {
        for (const r of relations) {
          await tx.relation.create({
            data: {
              id: r.id,
              parentId: r.parentId,
              childId: r.childId,
              type: r.type || 'BIOLOGICAL',
            },
          });
        }
      }

      // Insertar relaciones de cónyuges
      if (Array.isArray(spouses)) {
        for (const s of spouses) {
          await tx.spouseRelation.create({
            data: {
              id: s.id,
              person1Id: s.person1Id,
              person2Id: s.person2Id,
              type: s.type || 'MARRIED',
              marriageDate: s.marriageDate || null,
              divorceDate: s.divorceDate || null,
              notes: s.notes || null,
            },
          });
        }
      }

      await tx.auditLog.create({
        data: {
          action: 'IMPORT',
          entity: 'FULL_BACKUP',
          entityId: 'SYSTEM',
          details: `Importación completa: ${persons.length} personas, ${relations?.length || 0} vínculos`,
          performedBy: req.user?.username || 'admin',
        },
      });
    });

    res.json({ message: 'Respaldo importado exitosamente', count: persons.length });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al importar respaldo', details: error.message });
  }
}

export async function exportGEDCOM(req: Request, res: Response): Promise<void> {
  try {
    const persons = await prisma.person.findMany();
    const relations = await prisma.relation.findMany();
    const spouses = await prisma.spouseRelation.findMany();

    let gedcom = `0 HEAD\n1 SOUR GENEATRACK\n2 VERS 1.0\n1 GEDC\n2 VERS 5.5.1\n2 FORM LINEAGE-LINKED\n1 CHAR UTF-8\n`;

    // Individuos
    for (const p of persons) {
      gedcom += `0 @I${p.id.replace(/-/g, '')}@ INDI\n`;
      gedcom += `1 NAME ${p.firstName} /${p.lastName}/\n`;
      if (p.gender === 'MALE') gedcom += `1 SEX M\n`;
      else if (p.gender === 'FEMALE') gedcom += `1 SEX F\n`;
      else gedcom += `1 SEX U\n`;

      if (p.birthDate) {
        gedcom += `1 BIRT\n2 DATE ${p.birthDate}\n`;
        if (p.birthPlace) gedcom += `2 PLAC ${p.birthPlace}\n`;
      }

      if (!p.isAlive && p.deathDate) {
        gedcom += `1 DEAT Y\n2 DATE ${p.deathDate}\n`;
        if (p.deathPlace) gedcom += `2 PLAC ${p.deathPlace}\n`;
      } else if (!p.isAlive) {
        gedcom += `1 DEAT Y\n`;
      }

      if (p.biography) {
        gedcom += `1 NOTE ${p.biography.replace(/\n/g, ' ')}\n`;
      }
    }

    // Familias (Spouses y sus hijos)
    let famIndex = 1;
    for (const s of spouses) {
      const p1Id = `@I${s.person1Id.replace(/-/g, '')}@`;
      const p2Id = `@I${s.person2Id.replace(/-/g, '')}@`;

      gedcom += `0 @F${famIndex}@ FAM\n`;
      gedcom += `1 HUSB ${p1Id}\n`;
      gedcom += `1 WIFE ${p2Id}\n`;

      if (s.marriageDate) {
        gedcom += `1 MARR\n2 DATE ${s.marriageDate}\n`;
      }

      // Buscar hijos comunes
      const p1Children = relations.filter(r => r.parentId === s.person1Id).map(r => r.childId);
      const p2Children = relations.filter(r => r.parentId === s.person2Id).map(r => r.childId);
      const commonChildren = p1Children.filter(c => p2Children.includes(c));

      for (const childId of commonChildren) {
        gedcom += `1 CHIL @I${childId.replace(/-/g, '')}@\n`;
      }

      famIndex++;
    }

    gedcom += `0 TRLR\n`;

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="arbol_genealogico_${new Date().toISOString().split('T')[0]}.ged"`);
    res.send(gedcom);
  } catch (error: any) {
    res.status(500).json({ error: 'Error al exportar formato GEDCOM', details: error.message });
  }
}
