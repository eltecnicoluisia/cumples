export interface ZodiacInfo {
  name: string;
  symbol: string;
  dates: string;
  element: string;
}

export function getZodiacSign(dateStr?: string | null): ZodiacInfo | null {
  if (!dateStr) return null;
  const parts = dateStr.split('-');
  if (parts.length < 3) return null;

  const month = parseInt(parts[1], 10);
  const day = parseInt(parts[2], 10);

  if (isNaN(month) || isNaN(day) || month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) {
    return { name: 'Acuario', symbol: '♒', dates: '20 Ene - 18 Feb', element: 'Aire' };
  }
  if ((month === 2 && day >= 19) || (month === 3 && day <= 20)) {
    return { name: 'Piscis', symbol: '♓', dates: '19 Feb - 20 Mar', element: 'Agua' };
  }
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) {
    return { name: 'Aries', symbol: '♈', dates: '21 Mar - 19 Abr', element: 'Fuego' };
  }
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) {
    return { name: 'Tauro', symbol: '♉', dates: '20 Abr - 20 May', element: 'Tierra' };
  }
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) {
    return { name: 'Géminis', symbol: '♊', dates: '21 May - 20 Jun', element: 'Aire' };
  }
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) {
    return { name: 'Cáncer', symbol: '♋', dates: '21 Jun - 22 Jul', element: 'Agua' };
  }
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) {
    return { name: 'Leo', symbol: '♌', dates: '23 Jul - 22 Ago', element: 'Fuego' };
  }
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) {
    return { name: 'Virgo', symbol: '♍', dates: '23 Ago - 22 Sep', element: 'Tierra' };
  }
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) {
    return { name: 'Libra', symbol: '♎', dates: '23 Sep - 22 Oct', element: 'Aire' };
  }
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) {
    return { name: 'Escorpio', symbol: '♏', dates: '23 Oct - 21 Nov', element: 'Agua' };
  }
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) {
    return { name: 'Sagitario', symbol: '♐', dates: '22 Nov - 21 Dic', element: 'Fuego' };
  }
  // Capricornio: 22 Dic - 19 Ene
  return { name: 'Capricornio', symbol: '♑', dates: '22 Dic - 19 Ene', element: 'Tierra' };
}

export interface AgeInfo {
  isAlive: boolean;
  currentAge: number | null;
  ageAtDeath: number | null;
  wouldBeAge: number | null;
  summaryText: string;
}

export function calculateAgeDetails(
  birthDate?: string | null,
  deathDate?: string | null,
  isAliveProp: boolean = true
): AgeInfo {
  const isAlive = deathDate && deathDate.trim() !== '' ? false : isAliveProp;

  if (!birthDate || birthDate.trim() === '') {
    return {
      isAlive,
      currentAge: null,
      ageAtDeath: null,
      wouldBeAge: null,
      summaryText: '',
    };
  }

  const birthParts = birthDate.split('-');
  const bYear = parseInt(birthParts[0], 10);
  const bMonth = parseInt(birthParts[1] || '1', 10) - 1;
  const bDay = parseInt(birthParts[2] || '1', 10);

  if (isNaN(bYear)) {
    return {
      isAlive,
      currentAge: null,
      ageAtDeath: null,
      wouldBeAge: null,
      summaryText: '',
    };
  }

  const today = new Date();

  // Calcular qué edad tendría hoy en día
  let wouldBeYears = today.getFullYear() - bYear;
  if (
    today.getMonth() < bMonth ||
    (today.getMonth() === bMonth && today.getDate() < bDay)
  ) {
    wouldBeYears--;
  }
  if (wouldBeYears < 0) wouldBeYears = 0;

  if (isAlive) {
    return {
      isAlive: true,
      currentAge: wouldBeYears,
      ageAtDeath: null,
      wouldBeAge: wouldBeYears,
      summaryText: `${wouldBeYears} años`,
    };
  }

  // Si está fallecido
  let ageAtDeath: number | null = null;
  if (deathDate && deathDate.trim() !== '') {
    const deathParts = deathDate.split('-');
    const dYear = parseInt(deathParts[0], 10);
    const dMonth = parseInt(deathParts[1] || '1', 10) - 1;
    const dDay = parseInt(deathParts[2] || '1', 10);

    if (!isNaN(dYear)) {
      ageAtDeath = dYear - bYear;
      if (dMonth < bMonth || (dMonth === bMonth && dDay < bDay)) {
        ageAtDeath--;
      }
      if (ageAtDeath < 0) ageAtDeath = 0;
    }
  }

  return {
    isAlive: false,
    currentAge: null,
    ageAtDeath,
    wouldBeAge: wouldBeYears,
    summaryText: ageAtDeath !== null ? `Falleció a los ${ageAtDeath} años` : '',
  };
}

export function formatFullName(person: {
  firstName?: string | null;
  middleName?: string | null;
  lastName?: string | null;
  secondLastName?: string | null;
}): string {
  const parts = [
    person.firstName?.trim(),
    person.middleName?.trim(),
    person.lastName?.trim(),
    person.secondLastName?.trim(),
  ].filter(Boolean);

  return parts.join(' ');
}

export function formatPersonDropdownLabel(person: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  nickname?: string | null;
  birthDate?: string | null;
  generation?: number | null;
}): string {
  const fullName = formatFullName(person);
  const nicknameText = person.nickname?.trim() ? ` (${person.nickname.trim()})` : '';
  
  let birthText = '';
  if (person.birthDate && person.birthDate.trim() !== '') {
    const parts = person.birthDate.split('-');
    const year = parts[0];
    if (year && year.length === 4) {
      birthText = ` [Nac. ${year}]`;
    }
  }

  const genText = person.generation ? ` — Gen ${person.generation}` : '';

  return `${fullName}${nicknameText}${birthText}${genText}`;
}

export function formatDisplayDate(dateStr?: string | null): string {
  if (!dateStr || !dateStr.trim()) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${year}`;
  }
  return dateStr;
}

export function generateWhatsAppBirthdayText(person: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  birthDate?: string | null;
  birthPlace?: string | null;
  gender?: string;
  isEve?: boolean;
}): string {
  const fullName = formatFullName(person);
  const zodiac = getZodiacSign(person.birthDate);
  const age = calculateAgeDetails(person.birthDate, null, true);

  let formattedDate = person.birthDate || 'No registrada';
  if (person.birthDate) {
    const parts = person.birthDate.split('-');
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    const d = parseInt(parts[2] || '1', 10);
    const m = parseInt(parts[1] || '1', 10);
    formattedDate = `${d} de ${months[m - 1]}`;
  }

  const header = person.isEve 
    ? `🚨 *¡ALERTA FAMILIAR: MAÑANA ES EL CUMPLEAÑOS!* 🎂`
    : `🎂 *¡RECORDATORIO DE CUMPLEAÑOS FAMILIAR!* 🎂`;

  const footer = person.isEve
    ? `\n⏰ *¡Recuerda que mañana está de cumpleaños!* Prepara tus felicitaciones, llamada o mensaje especial para celebrarlo. 🥳🎁🎈`
    : `\n✨ _¡No olvides enviarle tus mejores deseos y bendiciones en su día especial!_ 🥳🎁🎈`;

  return (
    `${header}\n\n` +
    `👤 *Familiar:* ${fullName}\n` +
    `🗓️ *Fecha:* ${formattedDate} ${person.isEve ? '(¡MAÑANA!)' : ''}\n` +
    (age.currentAge !== null ? `🎉 *${person.isEve ? 'Cumplirá' : 'Edad actual'}:* ${person.isEve ? (age.currentAge + 1) : age.currentAge} años\n` : '') +
    (zodiac ? `♈ *Signo Zodiacal:* ${zodiac.name} (${zodiac.symbol})\n` : '') +
    (person.birthPlace ? `📍 *Lugar de Nacimiento:* ${person.birthPlace}\n` : '') +
    footer
  );
}

export function generateWhatsAppMemorialText(person: {
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthPlace?: string | null;
  deathPlace?: string | null;
  isEve?: boolean;
}): string {
  const fullName = formatFullName(person);
  const zodiac = getZodiacSign(person.birthDate);
  const age = calculateAgeDetails(person.birthDate, person.deathDate, false);

  const header = person.isEve
    ? `🕯️ *RECORDATORIO: MAÑANA CONMEMORAMOS LA PARTIDA DE NUESTRO SER QUERIDO* 🪽`
    : `🕊️ *EN MEMORIA DE NUESTRO SER QUERIDO* 🪽`;

  const footer = person.isEve
    ? `\n🕯️ _Mañana se cumple un año más de su partida física. Mantengámosle presente en nuestras oraciones y gratos recuerdos._ 🙏🤍`
    : `\n🕯️ _Siempre en nuestros corazones y recuerdos familiares más preciados._ 🙏🤍`;

  const formattedBirth = formatDisplayDate(person.birthDate);
  const formattedDeath = formatDisplayDate(person.deathDate);

  return (
    `${header}\n\n` +
    `👤 *Familiar:* ${fullName}\n` +
    (formattedBirth ? `🎂 *Nacimiento:* ${formattedBirth}\n` : '') +
    (formattedDeath ? `🪽 *Fecha de Partida:* ${formattedDeath} ${person.isEve ? '(¡MAÑANA!)' : ''}\n` : '') +
    (age.ageAtDeath !== null ? `🕊️ *Falleció a los:* ${age.ageAtDeath} años\n` : '') +
    (age.wouldBeAge !== null ? `✨ *Si estuviera con nosotros:* ${age.wouldBeAge} años hoy\n` : '') +
    (zodiac ? `♈ *Signo Zodiacal:* ${zodiac.name} (${zodiac.symbol})\n` : '') +
    (person.birthPlace ? `📍 *Lugar de Nacimiento:* ${person.birthPlace}\n` : '') +
    (person.deathPlace ? `📍 *Lugar de Fallecimiento:* ${person.deathPlace}\n` : '') +
    footer
  );
}

export function generateWhatsAppMarriageText(event: {
  spouse1Name: string;
  spouse2Name: string;
  marriageDate: string;
  yearsMarried: number | null;
  isEve?: boolean;
}): string {
  const header = event.isEve
    ? `🚨 *¡ALERTA FAMILIAR: MAÑANA ES ANIVERSARIO DE BODAS!* 💍🥂`
    : `💍 *¡ANIVERSARIO DE MATRIMONIO FAMILIAR!* 🥂✨`;

  const footer = event.isEve
    ? `\n⏰ *¡Recuerda que mañana celebran su aniversario!* Prepara tus felicitaciones y bendiciones para la hermosa pareja. 🎉❤️`
    : `\n✨ _¡No olvides enviarles un cálido abrazo y desearles muchos años más de amor y unión!_ 🥂💖`;

  const formattedMarriage = formatDisplayDate(event.marriageDate);

  return (
    `${header}\n\n` +
    `👩‍❤️‍👨 *Pareja:* ${event.spouse1Name} y ${event.spouse2Name}\n` +
    `🗓️ *Fecha de Matrimonio:* ${formattedMarriage} ${event.isEve ? '(¡MAÑANA!)' : ''}\n` +
    (event.yearsMarried !== null ? `🎉 *Aniversario:* ${event.yearsMarried} años juntos 💍\n` : '') +
    footer
  );
}

export function generateWhatsAppCustomEventText(event: {
  personName: string;
  title: string;
  eventType: string;
  eventDate: string;
  yearsAnniversary: number | null;
  description?: string | null;
  isEve?: boolean;
}): string {
  const header = event.isEve
    ? `🚨 *¡ALERTA FAMILIAR: MAÑANA ES UN HITO ESPECIAL!* 🎓🎉`
    : `🎓 *¡RECORDATORIO DE EVENTO ESPECIAL FAMILIAR!* 🌟✨`;

  const footer = event.isEve
    ? `\n⏰ *¡Recuerda que mañana se conmemora esta fecha!* Acompáñale con un mensaje de orgullo y felicitación. 👏🎊`
    : `\n✨ _¡Celebremos juntos este gran momento en la historia de nuestra familia!_ 👏❤️`;

  const formattedCustom = formatDisplayDate(event.eventDate);

  return (
    `${header}\n\n` +
    `👤 *Familiar:* ${event.personName}\n` +
    `📌 *Evento / Hito:* ${event.title}\n` +
    `🗓️ *Fecha:* ${formattedCustom} ${event.isEve ? '(¡MAÑANA!)' : ''}\n` +
    (event.yearsAnniversary !== null ? `⏳ *Años de este logro/hito:* ${event.yearsAnniversary} años\n` : '') +
    (event.description ? `📝 *Detalles:* ${event.description}\n` : '') +
    footer
  );
}

export const SMART_FAMILY_TEMPLATE = `📋 *PLANTILLA DE REGISTRO FAMILIAR (CUMPLES)*
----------------------------------------
Copia este texto, llena tus datos y reenvíalo:

Primer Nombre: 
Segundo Nombre: 
Primer Apellido: 
Segundo Apellido: 
Apodo / Cariño: 
Fecha de Nacimiento (DD/MM/AAAA): 
Lugar de Nacimiento: 
Profesión u Ocupación: 
Teléfono de Contacto: 
Correo Electrónico: 
----------------------------------------`;

export function parseSmartFamilyData(rawText: string) {
  const result: {
    firstName?: string;
    middleName?: string;
    lastName?: string;
    secondLastName?: string;
    nickname?: string;
    gender?: 'MALE' | 'FEMALE' | 'OTHER' | 'UNKNOWN';
    isAlive?: boolean;
    birthDate?: string;
    birthPlace?: string;
    deathDate?: string;
    deathPlace?: string;
    profession?: string;
    contactPhone?: string;
    contactEmail?: string;
    biography?: string;
  } = {};

  const lines = rawText.split('\n');

  const normalizeDate = (val: string): string | undefined => {
    val = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
    const dmy = val.match(/^(\d{1,2})[\/\.-](\d{1,2})[\/\.-](\d{4})$/);
    if (dmy) {
      const day = dmy[1].padStart(2, '0');
      const month = dmy[2].padStart(2, '0');
      const year = dmy[3];
      return `${year}-${month}-${day}`;
    }
    const months: { [k: string]: string } = {
      enero: '01', febrero: '02', marzo: '03', abril: '04', mayo: '05', junio: '06',
      julio: '07', agosto: '08', septiembre: '09', octubre: '10', noviembre: '11', diciembre: '12'
    };
    const textDate = val.toLowerCase().match(/^(\d{1,2})\s+de\s+([a-z]+)\s+de\s+(\d{4})/);
    if (textDate) {
      const day = textDate[1].padStart(2, '0');
      const month = months[textDate[2]] || '01';
      const year = textDate[3];
      return `${year}-${month}-${day}`;
    }
    return undefined;
  };

  for (const line of lines) {
    const parts = line.split(/[:=]/);
    if (parts.length < 2) continue;

    const key = parts[0].trim().toLowerCase();
    const val = parts.slice(1).join(':').trim();
    if (!val) continue;

    if (/primer\s*nombre|nombres?|nombre/.test(key) && !result.firstName) {
      const nameParts = val.split(/\s+/);
      result.firstName = nameParts[0];
      if (nameParts.length > 1 && !result.middleName) {
        result.middleName = nameParts.slice(1).join(' ');
      }
    } else if (/segundo\s*nombre/.test(key)) {
      result.middleName = val;
    } else if (/primer\s*apellido|apellidos?|apellido/.test(key) && !result.lastName) {
      const surnameParts = val.split(/\s+/);
      result.lastName = surnameParts[0];
      if (surnameParts.length > 1 && !result.secondLastName) {
        result.secondLastName = surnameParts.slice(1).join(' ');
      }
    } else if (/segundo\s*apellido/.test(key)) {
      result.secondLastName = val;
    } else if (/apodo|sobrenombre|cariño/.test(key)) {
      result.nickname = val;
    } else if (/g[eé]nero|sexo/.test(key)) {
      if (/hom|masc|m/i.test(val)) result.gender = 'MALE';
      else if (/muj|fem|f/i.test(val)) result.gender = 'FEMALE';
    } else if (/nacimiento|cumple/.test(key)) {
      const parsedD = normalizeDate(val);
      if (parsedD) result.birthDate = parsedD;
    } else if (/lugar.*nacimiento|ciudad.*nac/i.test(key)) {
      result.birthPlace = val;
    } else if (/fallecimiento|partida/i.test(key)) {
      const parsedD = normalizeDate(val);
      if (parsedD) {
        result.deathDate = parsedD;
        result.isAlive = false;
      }
    } else if (/profesi[oó]n|trabajo|ocupaci[oó]n/i.test(key)) {
      result.profession = val;
    } else if (/tel[eé]fono|celular|whatsapp|m[oó]vil/i.test(key)) {
      result.contactPhone = val;
    } else if (/correo|email|e-mail/i.test(key)) {
      result.contactEmail = val;
    } else if (/biograf[ií]a|notas?|historia/i.test(key)) {
      result.biography = val;
    }
  }

  return result;
}

export function openWhatsAppShare(text: string): void {
  const encoded = encodeURIComponent(text);
  window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
}

export interface KinshipInfo {
  role: string;
  label: string;
  branch: 'PATERNAL' | 'MATERNAL' | 'DIRECT' | 'OTHER';
  branchLabel: string;
  icon: string;
  badgeColor: string;
}

export function getKinshipInfo(role?: string | null): KinshipInfo {
  switch (role) {
    case 'bisabuelo_pat':
      return { role: 'bisabuelo_pat', label: 'Bisabuelo Paterno', branch: 'PATERNAL', branchLabel: 'Ancestros Paternos', icon: '👴🏼', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'bisabuela_pat':
      return { role: 'bisabuela_pat', label: 'Bisabuela Paterna', branch: 'PATERNAL', branchLabel: 'Ancestros Paternos', icon: '👵🏼', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'bisabuelo_mat':
      return { role: 'bisabuelo_mat', label: 'Bisabuelo Materno', branch: 'MATERNAL', branchLabel: 'Ancestros Maternos', icon: '👴🏼', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'bisabuela_mat':
      return { role: 'bisabuela_mat', label: 'Bisabuela Materna', branch: 'MATERNAL', branchLabel: 'Ancestros Maternos', icon: '👵🏼', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'abuelo_pat':
      return { role: 'abuelo_pat', label: 'Abuelo Paterno', branch: 'PATERNAL', branchLabel: 'Rama Paterna', icon: '👴', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'abuela_pat':
      return { role: 'abuela_pat', label: 'Abuela Paterna', branch: 'PATERNAL', branchLabel: 'Rama Paterna', icon: '👵', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'abuelo_mat':
      return { role: 'abuelo_mat', label: 'Abuelo Materno', branch: 'MATERNAL', branchLabel: 'Rama Materna', icon: '👴', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'abuela_mat':
      return { role: 'abuela_mat', label: 'Abuela Materna', branch: 'MATERNAL', branchLabel: 'Rama Materna', icon: '👵', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'padre':
      return { role: 'padre', label: 'Padre', branch: 'DIRECT', branchLabel: 'Tronco Familiar', icon: '👨', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'madre':
      return { role: 'madre', label: 'Madre', branch: 'DIRECT', branchLabel: 'Tronco Familiar', icon: '👩', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'yo':
      return { role: 'yo', label: 'Yo (Registrador)', branch: 'DIRECT', branchLabel: 'Titular', icon: '👤', badgeColor: 'border-amber-500/40 bg-amber-950/70 text-amber-300' };
    case 'hermano':
      return { role: 'hermano', label: 'Hermano', branch: 'DIRECT', branchLabel: 'Hermandad', icon: '👦', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'hermana':
      return { role: 'hermana', label: 'Hermana', branch: 'DIRECT', branchLabel: 'Hermandad', icon: '👧', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'conyuge':
      return { role: 'conyuge', label: 'Cónyuge / Pareja', branch: 'DIRECT', branchLabel: 'Matrimonio', icon: '💍', badgeColor: 'border-purple-500/40 bg-purple-950/70 text-purple-300' };
    case 'hijo':
      return { role: 'hijo', label: 'Hijo', branch: 'DIRECT', branchLabel: 'Descendencia', icon: '👶', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'hija':
      return { role: 'hija', label: 'Hija', branch: 'DIRECT', branchLabel: 'Descendencia', icon: '👧', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'nieto':
      return { role: 'nieto', label: 'Nieto / Nieta', branch: 'DIRECT', branchLabel: 'Nietos', icon: '🧒', badgeColor: 'border-teal-500/40 bg-teal-950/70 text-teal-300' };
    case 'tio_pat':
      return { role: 'tio_pat', label: 'Tío Paterno', branch: 'PATERNAL', branchLabel: 'Rama Paterna (Tíos)', icon: '👨🏽‍🦳', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'tia_pat':
      return { role: 'tia_pat', label: 'Tía Paterna', branch: 'PATERNAL', branchLabel: 'Rama Paterna (Tíos)', icon: '👩🏽‍🦳', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'tio_mat':
      return { role: 'tio_mat', label: 'Tío Materno', branch: 'MATERNAL', branchLabel: 'Rama Materna (Tíos)', icon: '👨🏽‍🦳', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'tia_mat':
      return { role: 'tia_mat', label: 'Tía Materna', branch: 'MATERNAL', branchLabel: 'Rama Materna (Tíos)', icon: '👩🏽‍🦳', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'primo':
      return { role: 'primo', label: 'Primo / Prima', branch: 'DIRECT', branchLabel: 'Primos', icon: '👦🏽', badgeColor: 'border-amber-500/40 bg-amber-950/70 text-amber-300' };
    case 'sobrino':
      return { role: 'sobrino', label: 'Sobrino / Sobrina', branch: 'DIRECT', branchLabel: 'Sobrinos', icon: '🧒🏽', badgeColor: 'border-teal-500/40 bg-teal-950/70 text-teal-300' };
    case 'suegro':
      return { role: 'suegro', label: 'Suegro / Suegra', branch: 'OTHER', branchLabel: 'Familia Político', icon: '👴🏼', badgeColor: 'border-purple-500/40 bg-purple-950/70 text-purple-300' };
    case 'cunado':
      return { role: 'cunado', label: 'Cuñado / Cuñada', branch: 'OTHER', branchLabel: 'Familia Político', icon: '👨🏼‍🦱', badgeColor: 'border-purple-500/40 bg-purple-950/70 text-purple-300' };
    case 'bisabuelo':
      return { role: 'bisabuelo', label: 'Bisabuelo', branch: 'OTHER', branchLabel: 'Ancestros', icon: '👴🏼', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'bisabuela':
      return { role: 'bisabuela', label: 'Bisabuela', branch: 'OTHER', branchLabel: 'Ancestros', icon: '👵🏼', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    case 'tatarabuelo':
      return { role: 'tatarabuelo', label: 'Tatarabuelo', branch: 'OTHER', branchLabel: 'Ancestros Lejanos', icon: '👴🏽', badgeColor: 'border-sky-500/40 bg-sky-950/70 text-sky-300' };
    case 'tatarabuela':
      return { role: 'tatarabuela', label: 'Tatarabuela', branch: 'OTHER', branchLabel: 'Ancestros Lejanos', icon: '👵🏽', badgeColor: 'border-pink-500/40 bg-pink-950/70 text-pink-300' };
    default:
      return { role: 'otro', label: 'Familiar', branch: 'OTHER', branchLabel: 'Familia', icon: '👥', badgeColor: 'border-slate-700 bg-slate-900 text-slate-400' };
  }
}
