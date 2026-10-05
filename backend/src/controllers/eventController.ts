import { Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { AuthRequest } from '../middleware/auth.js';

export interface BirthdayEvent {
  personId: string;
  fullName: string;
  avatarUrl: string | null;
  gender: string;
  isAlive: boolean;
  birthDate: string;
  birthDay: number;
  birthMonth: number;
  birthYear?: number;
  birthPlace?: string | null;
  ageTurning: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  type: 'BIRTHDAY';
}

export interface MemorialEvent {
  personId: string;
  fullName: string;
  avatarUrl: string | null;
  gender: string;
  birthDate?: string | null;
  deathDate: string;
  birthPlace?: string | null;
  deathPlace?: string | null;
  deathDay: number;
  deathMonth: number;
  deathYear?: number;
  yearsPassed: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  ageAtDeath: number | null;
  type: 'MEMORIAL';
}

export interface MarriageEvent {
  relationId: string;
  spouse1Name: string;
  spouse2Name: string;
  spouse1Id: string;
  spouse2Id: string;
  marriageDate: string;
  marriageDay: number;
  marriageMonth: number;
  marriageYear?: number;
  yearsMarried: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  type: 'MARRIAGE';
}

export interface CustomEventItem {
  id: string;
  personId: string;
  personName: string;
  title: string;
  eventType: string;
  eventDate: string;
  eventDay: number;
  eventMonth: number;
  eventYear?: number;
  yearsAnniversary: number | null;
  daysUntil: number;
  eventDateThisYear: string;
  description?: string | null;
  type: 'CUSTOM';
}

function parseDateComponents(dateStr?: string | null) {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;
  const year = parseInt(parts[0], 10);
  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);
  if (isNaN(year) || isNaN(month) || isNaN(day)) return null;
  return { year, month, day };
}

function calculateDaysUntil(month: number, day: number, today: Date): { daysUntil: number; targetDateStr: string } {
  const currentYear = today.getFullYear();
  let target = new Date(currentYear, month - 1, day);
  
  // Normalizar hoy a medianoche
  const todayNormalized = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  
  if (target < todayNormalized) {
    target = new Date(currentYear + 1, month - 1, day);
  }

  const diffTime = target.getTime() - todayNormalized.getTime();
  const daysUntil = Math.round(diffTime / (1000 * 60 * 60 * 24));
  const targetDateStr = `${target.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  return { daysUntil, targetDateStr };
}

export async function getUpcomingEvents(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
    if (!userId) {
      res.status(401).json({ error: 'No autorizado' });
      return;
    }

    const persons = await prisma.person.findMany({ 
      where: { userId },
      include: { customEvents: true }
    });
    const personIds = persons.map(p => p.id);

    const spouseRelations = await prisma.spouseRelation.findMany({
      where: {
        person1Id: { in: personIds },
        person2Id: { in: personIds },
        marriageDate: { not: null }
      },
      include: {
        person1: true,
        person2: true
      }
    });

    const today = new Date();
    const birthdays: BirthdayEvent[] = [];
    const memorials: MemorialEvent[] = [];
    const marriages: MarriageEvent[] = [];
    const customEvents: CustomEventItem[] = [];

    for (const p of persons) {
      const fullName = `${p.firstName} ${p.lastName}${p.nickname ? ` "${p.nickname}"` : ''}`;

      // 1. Cumpleaños
      if (p.birthDate) {
        const b = parseDateComponents(p.birthDate);
        if (b) {
          const { daysUntil, targetDateStr } = calculateDaysUntil(b.month, b.day, today);
          const ageTurning = b.year ? (new Date(targetDateStr).getFullYear() - b.year) : null;

          birthdays.push({
            personId: p.id,
            fullName,
            avatarUrl: p.avatarUrl,
            gender: p.gender,
            isAlive: p.isAlive,
            birthDate: p.birthDate,
            birthDay: b.day,
            birthMonth: b.month,
            birthYear: b.year,
            birthPlace: p.birthPlace,
            ageTurning,
            daysUntil,
            eventDateThisYear: targetDateStr,
            type: 'BIRTHDAY',
          });
        }
      }

      // 2. Aniversario Luctuoso / Conmemoraciones
      if (!p.isAlive && p.deathDate) {
        const d = parseDateComponents(p.deathDate);
        if (d) {
          const { daysUntil, targetDateStr } = calculateDaysUntil(d.month, d.day, today);
          const yearsPassed = d.year ? (new Date(targetDateStr).getFullYear() - d.year) : null;
          
          let ageAtDeath: number | null = null;
          if (p.birthDate) {
            const b = parseDateComponents(p.birthDate);
            if (b && b.year && d.year) {
              ageAtDeath = d.year - b.year;
            }
          }

          memorials.push({
            personId: p.id,
            fullName,
            avatarUrl: p.avatarUrl,
            gender: p.gender,
            birthDate: p.birthDate,
            deathDate: p.deathDate,
            birthPlace: p.birthPlace,
            deathPlace: p.deathPlace,
            deathDay: d.day,
            deathMonth: d.month,
            deathYear: d.year,
            yearsPassed,
            daysUntil,
            eventDateThisYear: targetDateStr,
            ageAtDeath,
            type: 'MEMORIAL',
          });
        }
      }

      // 3. Hitos / Eventos Personalizados (Graduaciones, Bautizos, Logros)
      if (p.customEvents && p.customEvents.length > 0) {
        for (const ce of p.customEvents) {
          if (ce.eventDate) {
            const cDate = parseDateComponents(ce.eventDate);
            if (cDate) {
              const { daysUntil, targetDateStr } = calculateDaysUntil(cDate.month, cDate.day, today);
              const yearsAnniversary = cDate.year ? (new Date(targetDateStr).getFullYear() - cDate.year) : null;

              customEvents.push({
                id: ce.id,
                personId: p.id,
                personName: fullName,
                title: ce.title,
                eventType: ce.eventType,
                eventDate: ce.eventDate,
                eventDay: cDate.day,
                eventMonth: cDate.month,
                eventYear: cDate.year,
                yearsAnniversary,
                daysUntil,
                eventDateThisYear: targetDateStr,
                description: ce.description,
                type: 'CUSTOM',
              });
            }
          }
        }
      }
    }

    // 4. Aniversarios de Matrimonio
    for (const sp of spouseRelations) {
      if (sp.marriageDate) {
        const mDate = parseDateComponents(sp.marriageDate);
        if (mDate) {
          const { daysUntil, targetDateStr } = calculateDaysUntil(mDate.month, mDate.day, today);
          const yearsMarried = mDate.year ? (new Date(targetDateStr).getFullYear() - mDate.year) : null;

          marriages.push({
            relationId: sp.id,
            spouse1Name: `${sp.person1.firstName} ${sp.person1.lastName}`,
            spouse2Name: `${sp.person2.firstName} ${sp.person2.lastName}`,
            spouse1Id: sp.person1.id,
            spouse2Id: sp.person2.id,
            marriageDate: sp.marriageDate,
            marriageDay: mDate.day,
            marriageMonth: mDate.month,
            marriageYear: mDate.year,
            yearsMarried,
            daysUntil,
            eventDateThisYear: targetDateStr,
            type: 'MARRIAGE',
          });
        }
      }
    }

    birthdays.sort((a, b) => a.daysUntil - b.daysUntil);
    memorials.sort((a, b) => a.daysUntil - b.daysUntil);
    marriages.sort((a, b) => a.daysUntil - b.daysUntil);
    customEvents.sort((a, b) => a.daysUntil - b.daysUntil);

    res.json({
      today: today.toISOString().split('T')[0],
      totalBirthdays: birthdays.length,
      totalMemorials: memorials.length,
      totalMarriages: marriages.length,
      totalCustomEvents: customEvents.length,
      next7DaysBirthdays: birthdays.filter(b => b.daysUntil <= 7),
      next30DaysBirthdays: birthdays.filter(b => b.daysUntil <= 30),
      allBirthdays: birthdays,
      allMemorials: memorials,
      allMarriages: marriages,
      allCustomEvents: customEvents,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al calcular efemérides y cumpleaños', details: error.message });
  }
}

export async function getDemographicStats(req: AuthRequest, res: Response): Promise<void> {
  try {
    const userId = req.user?.id;
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

    const totalPersons = persons.length;
    const livingCount = persons.filter(p => p.isAlive).length;
    const deceasedCount = totalPersons - livingCount;

    const males = persons.filter(p => p.gender === 'MALE').length;
    const females = persons.filter(p => p.gender === 'FEMALE').length;
    const others = totalPersons - males - females;

    // Calcular edad promedio de los vivos y longevidad promedio de fallecidos
    const currentYear = new Date().getFullYear();
    const livingAges: number[] = [];
    const deceasedLifespans: number[] = [];

    persons.forEach(p => {
      const b = parseDateComponents(p.birthDate);
      if (b && b.year) {
        if (p.isAlive) {
          livingAges.push(currentYear - b.year);
        } else if (p.deathDate) {
          const d = parseDateComponents(p.deathDate);
          if (d && d.year) {
            deceasedLifespans.push(d.year - b.year);
          }
        }
      }
    });

    const avgLivingAge = livingAges.length > 0
      ? Math.round(livingAges.reduce((a, b) => a + b, 0) / livingAges.length)
      : null;

    const avgDeceasedLifespan = deceasedLifespans.length > 0
      ? Math.round(deceasedLifespans.reduce((a, b) => a + b, 0) / deceasedLifespans.length)
      : null;

    // Conteo por mes de nacimiento
    const monthlyBirthCounts = Array(12).fill(0);
    persons.forEach(p => {
      const b = parseDateComponents(p.birthDate);
      if (b && b.month >= 1 && b.month <= 12) {
        monthlyBirthCounts[b.month - 1]++;
      }
    });

    res.json({
      totalPersons,
      livingCount,
      deceasedCount,
      genderDistribution: { males, females, others },
      totalRelations: relations.length,
      totalMarriages: spouses.length,
      avgLivingAge,
      avgDeceasedLifespan,
      monthlyBirthCounts,
    });
  } catch (error: any) {
    res.status(500).json({ error: 'Error al calcular estadísticas demográficas', details: error.message });
  }
}
