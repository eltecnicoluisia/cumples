import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Sembrando base de datos inicial...');

  // 1. Crear usuario Administrador
  const adminPasswordHash = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      username: 'admin',
      email: 'admin@familia.local',
      passwordHash: adminPasswordHash,
      role: 'ADMIN',
    },
  });
  console.log(`👤 Usuario Administrador creado: admin (contraseña: admin123456)`);

  // 2. Comprobar si ya existen personas
  const personCount = await prisma.person.count();
  if (personCount > 0) {
    console.log('ℹ️ Ya existen personas en la base de datos. Omitiendo datos de prueba.');
    return;
  }

  // 3. Crear Personas (Generación 1: Bisabuelos)
  const bisabueloPat = await prisma.person.create({
    data: {
      firstName: 'Manuel',
      lastName: 'Uzcátegui',
      gender: 'MALE',
      isAlive: false,
      birthDate: '1920-04-12',
      birthPlace: 'Mérida, Venezuela',
      deathDate: '1998-11-20',
      deathPlace: 'Caracas, Venezuela',
      profession: 'Agricultor y Comerciante',
      generation: 1,
      biography: 'Patriarca de la familia, fundador de las tierras familiares y gran aficionado a la música tradicional.',
    },
  });

  const bisabuelaPat = await prisma.person.create({
    data: {
      firstName: 'Carmen',
      lastName: 'Rondón',
      maidenName: 'Rondón',
      gender: 'FEMALE',
      isAlive: false,
      birthDate: '1924-07-16',
      birthPlace: 'Mérida, Venezuela',
      deathDate: '2005-03-14',
      deathPlace: 'Caracas, Venezuela',
      profession: 'Maestra y Costurera',
      generation: 1,
      biography: 'Matriarca recordada por su generosidad, cocina tradicional y dedicación a la enseñanza.',
    },
  });

  const bisabueloMat = await prisma.person.create({
    data: {
      firstName: 'Antonio',
      lastName: 'Pérez',
      gender: 'MALE',
      isAlive: false,
      birthDate: '1922-09-05',
      birthPlace: 'San Cristóbal, Venezuela',
      deathDate: '1990-08-12',
      deathPlace: 'San Cristóbal, Venezuela',
      profession: 'Carpintero Ebanista',
      generation: 1,
    },
  });

  const bisabuelaMat = await prisma.person.create({
    data: {
      firstName: 'Rosa',
      lastName: 'Márquez',
      maidenName: 'Márquez',
      gender: 'FEMALE',
      isAlive: false,
      birthDate: '1927-12-25',
      birthPlace: 'San Cristóbal, Venezuela',
      deathDate: '2012-05-18',
      deathPlace: 'San Cristóbal, Venezuela',
      profession: 'Ama de Casa',
      generation: 1,
    },
  });

  // Generación 2: Abuelos
  const abueloPat = await prisma.person.create({
    data: {
      firstName: 'Rafael',
      lastName: 'Uzcátegui',
      gender: 'MALE',
      isAlive: false,
      birthDate: '1948-06-15',
      birthPlace: 'Caracas, Venezuela',
      deathDate: '2019-10-03',
      deathPlace: 'Caracas, Venezuela',
      profession: 'Ingeniero Civil',
      generation: 2,
      biography: 'Diseñó puentes y estructuras viales. Apasionado del ajedrez y la historia universal.',
    },
  });

  const abuelaPat = await prisma.person.create({
    data: {
      firstName: 'Elena',
      lastName: 'Pérez Márquez',
      maidenName: 'Pérez',
      gender: 'FEMALE',
      isAlive: true,
      birthDate: '1952-03-22',
      birthPlace: 'San Cristóbal, Venezuela',
      profession: 'Enfermera Jubilada',
      generation: 2,
      biography: 'Corazón de la familia actual, le encanta reunir a todos en los cumpleaños y cocinar hallacas.',
    },
  });

  // Tía abuela
  const tiaAbuela = await prisma.person.create({
    data: {
      firstName: 'Lucía',
      lastName: 'Uzcátegui Rondón',
      gender: 'FEMALE',
      isAlive: true,
      birthDate: '1955-08-08',
      birthPlace: 'Caracas, Venezuela',
      profession: 'Artista Plástica',
      generation: 2,
    },
  });

  // Generación 3: Padres y Tíos
  const padre = await prisma.person.create({
    data: {
      firstName: 'Carlos',
      lastName: 'Uzcátegui Pérez',
      gender: 'MALE',
      isAlive: true,
      birthDate: '1975-01-18',
      birthPlace: 'Caracas, Venezuela',
      profession: 'Arquitecto',
      generation: 3,
      contactPhone: '+58 412 1234567',
    },
  });

  const madre = await prisma.person.create({
    data: {
      firstName: 'Mariana',
      lastName: 'Gómez',
      gender: 'FEMALE',
      isAlive: true,
      birthDate: '1978-05-30',
      birthPlace: 'Valencia, Venezuela',
      profession: 'Médico Pediatra',
      generation: 3,
    },
  });

  const tio = await prisma.person.create({
    data: {
      firstName: 'Roberto',
      lastName: 'Uzcátegui Pérez',
      gender: 'MALE',
      isAlive: true,
      birthDate: '1980-11-14',
      birthPlace: 'Caracas, Venezuela',
      profession: 'Desarrollador de Software',
      generation: 3,
    },
  });

  // Generación 4: Hijos / Nietos
  const hijoPrincipal = await prisma.person.create({
    data: {
      firstName: 'Amy',
      lastName: 'Uzcátegui Gómez',
      gender: 'FEMALE',
      isAlive: true,
      birthDate: '2002-10-15',
      birthPlace: 'Caracas, Venezuela',
      profession: 'Ingeniera de Sistemas & Creadora del Árbol',
      generation: 4,
      biography: 'Administradora del linaje familiar digital y custodia de las memorias familiares.',
    },
  });

  const hermano = await prisma.person.create({
    data: {
      firstName: 'Diego',
      lastName: 'Uzcátegui Gómez',
      gender: 'MALE',
      isAlive: true,
      birthDate: '2006-04-02',
      birthPlace: 'Caracas, Venezuela',
      profession: 'Estudiante Universitario',
      generation: 4,
    },
  });

  const prima = await prisma.person.create({
    data: {
      firstName: 'Sofía',
      lastName: 'Uzcátegui Romero',
      gender: 'FEMALE',
      isAlive: true,
      birthDate: '2010-09-19',
      birthPlace: 'Mérida, Venezuela',
      profession: 'Estudiante',
      generation: 4,
    },
  });

  // 4. Establecer Cónyuges / Matrimonios
  await prisma.spouseRelation.createMany({
    data: [
      { person1Id: bisabueloPat.id, person2Id: bisabuelaPat.id, type: 'MARRIED', marriageDate: '1944-05-10' },
      { person1Id: bisabueloMat.id, person2Id: bisabuelaMat.id, type: 'MARRIED', marriageDate: '1949-09-20' },
      { person1Id: abueloPat.id, person2Id: abuelaPat.id, type: 'MARRIED', marriageDate: '1972-12-16' },
      { person1Id: padre.id, person2Id: madre.id, type: 'MARRIED', marriageDate: '2000-08-19' },
    ],
  });

  // 5. Establecer Vínculos Padre-Hijo
  await prisma.relation.createMany({
    data: [
      // Bisabuelos -> Abuelo Paterno
      { parentId: bisabueloPat.id, childId: abueloPat.id, type: 'BIOLOGICAL' },
      { parentId: bisabuelaPat.id, childId: abueloPat.id, type: 'BIOLOGICAL' },
      // Bisabuelos -> Tía Abuela
      { parentId: bisabueloPat.id, childId: tiaAbuela.id, type: 'BIOLOGICAL' },
      { parentId: bisabuelaPat.id, childId: tiaAbuela.id, type: 'BIOLOGICAL' },

      // Bisabuelos Maternos -> Abuela Paterna (Elena Pérez)
      { parentId: bisabueloMat.id, childId: abuelaPat.id, type: 'BIOLOGICAL' },
      { parentId: bisabuelaMat.id, childId: abuelaPat.id, type: 'BIOLOGICAL' },

      // Abuelos -> Padre (Carlos) & Tío (Roberto)
      { parentId: abueloPat.id, childId: padre.id, type: 'BIOLOGICAL' },
      { parentId: abuelaPat.id, childId: padre.id, type: 'BIOLOGICAL' },
      { parentId: abueloPat.id, childId: tio.id, type: 'BIOLOGICAL' },
      { parentId: abuelaPat.id, childId: tio.id, type: 'BIOLOGICAL' },

      // Padre & Madre -> Hijos (Amy y Diego)
      { parentId: padre.id, childId: hijoPrincipal.id, type: 'BIOLOGICAL' },
      { parentId: madre.id, childId: hijoPrincipal.id, type: 'BIOLOGICAL' },
      { parentId: padre.id, childId: hermano.id, type: 'BIOLOGICAL' },
      { parentId: madre.id, childId: hermano.id, type: 'BIOLOGICAL' },

      // Tío Roberto -> Prima Sofía
      { parentId: tio.id, childId: prima.id, type: 'BIOLOGICAL' },
    ],
  });

  console.log('✅ Base de datos sembrada con linaje de 4 generaciones (vivos y fallecidos).');
}

main()
  .catch((e) => {
    console.error('❌ Error al sembrar base de datos:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
