/* ═══════════════════════════════════════════════════════════════
   EXPORTADOR NATIVO DEL ÁRBOL A IMAGEN (Canvas 2D puro)
   No clona el DOM ni usa html2canvas: dibuja directamente las
   tarjetas, líneas y anillos a partir del layout calculado.
   Funciona en cualquier celular porque ajusta automáticamente la
   resolución al límite de memoria del dispositivo.
═══════════════════════════════════════════════════════════════ */

export interface ExportPerson {
  id: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  secondLastName?: string | null;
  nickname?: string | null;
  gender: string;
  isAlive: boolean;
  birthDate?: string | null;
  deathDate?: string | null;
  avatarUrl?: string | null;
}

export interface ExportLayout {
  persons: { node: ExportPerson; x: number; y: number }[];
  units: { ids: string[]; x: number; y: number; width: number; label: string | null; color: string }[];
  connectors: { d: string; color: string }[];
  width: number;
  height: number;
}

export interface ExportOptions {
  title: string;
  slot: number;      // ancho reservado por tarjeta
  coupleGap: number; // espacio entre cónyuges
  midY: number;      // altura de la línea matrimonial
}

export interface ExportResult { blob: Blob; url: string; width: number; height: number; }

const CARD_H = 210;
const HEADER_H = 150;
const FOOTER_H = 90;
const PAD = 40;

function fmtDate(d?: string | null): string {
  if (!d) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(d);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : '';
}

function ageOf(birth?: string | null, death?: string | null): number | null {
  if (!birth) return null;
  const b = new Date(birth);
  const e = death ? new Date(death) : new Date();
  if (isNaN(b.getTime()) || isNaN(e.getTime())) return null;
  let a = e.getFullYear() - b.getFullYear();
  const mm = e.getMonth() - b.getMonth();
  if (mm < 0 || (mm === 0 && e.getDate() < b.getDate())) a--;
  return a >= 0 ? a : null;
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

/** Recorta el texto con "…" para que quepa en maxW */
function fit(ctx: CanvasRenderingContext2D, text: string, maxW: number): string {
  if (ctx.measureText(text).width <= maxW) return text;
  let t = text;
  while (t.length > 1 && ctx.measureText(t + '…').width > maxW) t = t.slice(0, -1);
  return t + '…';
}

/** Dibuja un path SVG simple (solo comandos M, H, V absolutos) */
function strokeSvgPath(ctx: CanvasRenderingContext2D, d: string) {
  const tokens = d.trim().split(/\s+/);
  let x = 0, y = 0, i = 0;
  ctx.beginPath();
  while (i < tokens.length) {
    const cmd = tokens[i++];
    if (cmd === 'M') { x = parseFloat(tokens[i++]); y = parseFloat(tokens[i++]); ctx.moveTo(x, y); }
    else if (cmd === 'L') { x = parseFloat(tokens[i++]); y = parseFloat(tokens[i++]); ctx.lineTo(x, y); }
    else if (cmd === 'H') { x = parseFloat(tokens[i++]); ctx.lineTo(x, y); }
    else if (cmd === 'V') { y = parseFloat(tokens[i++]); ctx.lineTo(x, y); }
  }
  ctx.stroke();
}

/** Carga una foto de perfil; si falla o no tiene CORS, devuelve null (se usan iniciales) */
function loadImage(url: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    if (!url.startsWith('data:')) img.crossOrigin = 'anonymous';
    const timer = setTimeout(() => resolve(null), 6000);
    img.onload = () => { clearTimeout(timer); resolve(img); };
    img.onerror = () => { clearTimeout(timer); resolve(null); };
    img.src = url;
  });
}

/** Calcula la escala máxima segura según el dispositivo */
function safeScale(w: number, h: number): number {
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  const isMobile = isIOS || /Android|Mobile/i.test(ua);
  const maxDim  = isIOS ? 4096 * 2 : isMobile ? 8192 : 16384;
  const maxArea = isIOS ? 16_000_000 : isMobile ? 24_000_000 : 64_000_000;
  const s = Math.min(3, maxDim / w, maxDim / h, Math.sqrt(maxArea / (w * h)));
  return Math.max(0.25, s);
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, q?: number): Promise<Blob | null> {
  return new Promise(resolve => {
    try { canvas.toBlob(b => resolve(b), type, q); } catch { resolve(null); }
  });
}

export async function renderTreeImage(layout: ExportLayout, opts: ExportOptions): Promise<ExportResult> {
  const { slot, coupleGap, midY, title } = opts;
  const W = layout.width + PAD * 2;
  const H = layout.height + HEADER_H + FOOTER_H;

  // Precargar fotos (con CORS); las que fallen usan iniciales
  const photos = new Map<string, HTMLImageElement>();
  await Promise.all(layout.persons.map(async p => {
    if (!p.node.avatarUrl) return;
    const img = await loadImage(p.node.avatarUrl);
    if (img) photos.set(p.node.id, img);
  }));

  let scale = safeScale(W, H);
  let canvas: HTMLCanvasElement | null = null;
  let blob: Blob | null = null;

  // Intentar con la escala segura; si el dispositivo no puede, reducir hasta lograrlo
  let usePhotos = photos.size > 0;
  for (let attempt = 0; attempt < 6 && !blob; attempt++) {
    canvas = document.createElement('canvas');
    canvas.width = Math.floor(W * scale);
    canvas.height = Math.floor(H * scale);
    const ctx = canvas.getContext('2d');
    if (ctx) {
      try {
        draw(ctx, scale, photos, usePhotos);
        blob = await canvasToBlob(canvas, 'image/png');
      } catch { blob = null; }
    }
    if (!blob) {
      canvas.width = 0; canvas.height = 0;
      if (usePhotos) usePhotos = false; // primero reintentar sin fotos
      else scale *= 0.6;                // luego reducir resolución
    }
  }

  if (!blob || !canvas) throw new Error('No se pudo generar la imagen en este dispositivo');
  const result = { blob, url: URL.createObjectURL(blob), width: canvas.width, height: canvas.height };
  canvas.width = 0; canvas.height = 0; // liberar memoria
  return result;

  /* ─────────────── Dibujo ─────────────── */
  function draw(ctx: CanvasRenderingContext2D, s: number, pics: Map<string, HTMLImageElement>, usePhotos: boolean) {
    ctx.setTransform(s, 0, 0, s, 0, 0);
    const FONT = '-apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

    // Fondo
    ctx.fillStyle = '#020617';
    ctx.fillRect(0, 0, W, H);

    // Encabezado
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, '#064e3b'); grad.addColorStop(0.5, '#0f766e'); grad.addColorStop(1, '#064e3b');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 8);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#ecfdf5';
    ctx.font = `900 56px ${FONT}`;
    ctx.fillText(`🌳 ${title}`, W / 2, 70);
    ctx.fillStyle = '#94a3b8';
    ctx.font = `600 24px ${FONT}`;
    ctx.fillText(`${layout.persons.length} familiares  ·  Generado el ${new Date().toLocaleDateString('es-VE')}`, W / 2, 118);

    // Área del árbol
    ctx.save();
    ctx.translate(PAD, HEADER_H);

    // Líneas
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    layout.connectors.forEach(c => {
      ctx.strokeStyle = c.color;
      ctx.globalAlpha = 0.9;
      strokeSvgPath(ctx, c.d);
    });
    ctx.globalAlpha = 1;

    // Etiquetas de linaje
    layout.units.forEach(u => {
      if (!u.label) return;
      ctx.font = `900 18px ${FONT}`;
      const tw = ctx.measureText(u.label.toUpperCase()).width + 36;
      const cx = u.x + u.width / 2;
      roundRect(ctx, cx - tw / 2, u.y - 50, tw, 34, 17);
      ctx.fillStyle = `${u.color}26`; ctx.fill();
      ctx.strokeStyle = `${u.color}99`; ctx.lineWidth = 2; ctx.stroke();
      ctx.fillStyle = u.color;
      ctx.textAlign = 'center';
      ctx.fillText(u.label.toUpperCase(), cx, u.y - 33);
    });

    // Tarjetas
    layout.persons.forEach(p => drawCard(ctx, p.node, p.x + 8, p.y, slot - 16, usePhotos ? pics.get(p.node.id) : undefined, FONT));

    // Anillos de matrimonio (encima de las líneas)
    layout.units.forEach(u => {
      if (u.ids.length !== 2) return;
      const cx = u.x + slot + coupleGap / 2;
      const cy = u.y + midY;
      ctx.beginPath(); ctx.arc(cx, cy, 22, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a'; ctx.fill();
      ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 3; ctx.stroke();
      ctx.font = `22px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillStyle = '#fbbf24';
      ctx.fillText('💍', cx, cy + 1);
    });

    ctx.restore();

    // Pie
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#64748b';
    ctx.font = `600 22px ${FONT}`;
    ctx.fillText('🔵 Hombre    🩷 Mujer    💍 Pareja    🪽 Fallecido/a', W / 2, H - 58);
    ctx.fillStyle = '#10b981';
    ctx.font = `800 22px ${FONT}`;
    ctx.fillText('cumples.informaticosvenezuela.com', W / 2, H - 26);
  }

  function drawCard(ctx: CanvasRenderingContext2D, n: ExportPerson, x: number, y: number, w: number, photo: HTMLImageElement | undefined, FONT: string) {
    const female = n.gender === 'FEMALE';
    const accent = !n.isAlive ? '#a855f7' : female ? '#ec4899' : n.gender === 'MALE' ? '#0ea5e9' : '#10b981';

    // Fondo de tarjeta
    roundRect(ctx, x, y, w, CARD_H, 22);
    ctx.fillStyle = '#0f172a'; ctx.fill();
    ctx.lineWidth = 3; ctx.strokeStyle = accent; ctx.stroke();
    // Franja superior de color
    ctx.save();
    roundRect(ctx, x, y, w, CARD_H, 22); ctx.clip();
    ctx.fillStyle = `${accent}33`;
    ctx.fillRect(x, y, w, 8);
    ctx.restore();

    // Avatar
    const ax = x + w / 2, ay = y + 50, r = 34;
    ctx.save();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2); ctx.closePath();
    ctx.fillStyle = `${accent}30`; ctx.fill();
    if (photo) {
      ctx.clip();
      const side = Math.min(photo.naturalWidth, photo.naturalHeight);
      ctx.drawImage(photo, (photo.naturalWidth - side) / 2, (photo.naturalHeight - side) / 2, side, side, ax - r, ay - r, r * 2, r * 2);
    } else {
      const ini = `${(n.firstName || '?')[0] ?? ''}${(n.lastName || '')[0] ?? ''}`.toUpperCase();
      ctx.fillStyle = accent; ctx.font = `900 28px ${FONT}`;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText(ini, ax, ay + 1);
    }
    ctx.restore();
    ctx.beginPath(); ctx.arc(ax, ay, r, 0, Math.PI * 2);
    ctx.lineWidth = 3; ctx.strokeStyle = accent; ctx.stroke();

    if (!n.isAlive) {
      ctx.font = `22px ${FONT}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('🪽', ax + r + 6, ay - r + 8);
    }

    // Nombres y apellidos completos (siempre 2 + 2)
    const names = [n.firstName, n.middleName].filter(Boolean).join(' ');
    const surnames = [n.lastName, n.secondLastName].filter(Boolean).join(' ');
    const maxW = w - 24;
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    ctx.fillStyle = '#f8fafc';
    ctx.font = `800 21px ${FONT}`;
    ctx.fillText(fit(ctx, names, maxW), ax, y + 112);
    ctx.font = `800 21px ${FONT}`;
    ctx.fillStyle = '#e2e8f0';
    ctx.fillText(fit(ctx, surnames, maxW), ax, y + 138);

    let ly = y + 162;
    if (n.nickname) {
      ctx.font = `italic 600 16px ${FONT}`;
      ctx.fillStyle = '#fbbf24';
      ctx.fillText(fit(ctx, `"${n.nickname}"`, maxW), ax, ly);
      ly += 22;
    }

    // Fechas / edad
    const age = ageOf(n.birthDate, n.isAlive ? null : n.deathDate);
    let info = '';
    if (n.isAlive) {
      info = n.birthDate ? `🎂 ${fmtDate(n.birthDate)}${age !== null ? `  ·  ${age} años` : ''}` : '';
    } else {
      const b = n.birthDate ? n.birthDate.slice(0, 4) : '?';
      const d = n.deathDate ? n.deathDate.slice(0, 4) : '?';
      info = `🕊️ ${b} – ${d}${age !== null ? `  ·  ${age} años` : ''}`;
    }
    if (info) {
      ctx.font = `600 16px ${FONT}`;
      ctx.fillStyle = n.isAlive ? '#94a3b8' : '#c4b5fd';
      ctx.fillText(fit(ctx, info, maxW), ax, Math.min(ly, y + CARD_H - 14));
    }
  }
}
