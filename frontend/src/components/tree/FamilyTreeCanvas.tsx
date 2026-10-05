import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { ZoomIn, ZoomOut, RefreshCw, Filter, Sparkles, Plus, ArrowRight, Users, Camera, Download, Share2, X } from 'lucide-react';
import { TreeGraphData, TreeGraphNode } from '../../types';
import { openWhatsAppShare } from '../../utils/genealogy';

/* ── Extrae apellidos únicos de todos los nodos ─────────────────── */
function extractSurnames(nodes: TreeGraphNode[]): string[] {
  const set = new Set<string>();
  nodes.forEach(n => {
    if (n.lastName) set.add(n.lastName.trim());
    if (n.secondLastName) set.add(n.secondLastName.trim());
  });
  return [...set].sort();
}

/* ── Dado un apellido raíz, devuelve todos los IDs conectados ────── */
function getConnectedIds(
  surnameFilter: string,
  nodes: TreeGraphNode[],
  edges: TreeGraphData['parentChildEdges'],
  spouseEdges: TreeGraphData['spouseEdges'],
): Set<string> {
  const edgeList = edges ?? [];
  const spList   = spouseEdges ?? [];
  const byId     = new Map(nodes.map(n => [n.id, n]));

  // 1. Personas que tienen ese apellido
  const hasSurname = (n: TreeGraphNode) =>
    n.lastName?.toLowerCase() === surnameFilter.toLowerCase() ||
    n.secondLastName?.toLowerCase() === surnameFilter.toLowerCase();

  const seed = new Set(nodes.filter(hasSurname).map(n => n.id));

  // 2. BFS: expandir hacia hijos Y cónyuges (incluir familia política)
  const spouseOf = new Map<string, string>();
  spList.forEach(e => { spouseOf.set(e.person1Id, e.person2Id); spouseOf.set(e.person2Id, e.person1Id); });

  const parentToChildren = new Map<string, string[]>();
  edgeList.forEach(e => {
    if (!parentToChildren.has(e.parentId)) parentToChildren.set(e.parentId, []);
    parentToChildren.get(e.parentId)!.push(e.childId);
  });

  const result = new Set<string>(seed);
  const queue  = [...seed];

  while (queue.length) {
    const id = queue.shift()!;
    // Incluir cónyuge
    const sp = spouseOf.get(id);
    if (sp && !result.has(sp)) { result.add(sp); queue.push(sp); }
    // Incluir hijos
    (parentToChildren.get(id) ?? []).forEach(cid => {
      if (!result.has(cid)) { result.add(cid); queue.push(cid); }
    });
  }

  return result;
}
import { PersonCard } from './PersonCard';

interface FamilyTreeCanvasProps {
  treeData: TreeGraphData;
  onSelectPerson: (id: string) => void;
  onAddRelative?: (id: string) => void;
  onOpenAddPerson?: () => void;
  onOpenAddPersonWithPreset?: (preset: string) => void;
  searchQuery?: string;
}

/* ═══════════════════════════════════════════════════════════════
   LAYOUT POR GENERACIONES — cada persona aparece UNA sola vez.
   Estilo "reloj de arena": los linajes paterno y materno quedan
   arriba, cada uno conectado con su hijo/a, y la pareja que une
   ambas familias queda en el centro con su descendencia debajo.
═══════════════════════════════════════════════════════════════ */

const SLOT       = 288;  // ancho reservado por tarjeta (w-72)
const COUPLE_GAP = 72;   // espacio entre cónyuges (anillo)
const UNIT_GAP   = 56;   // espacio entre unidades de la misma fila
const ROOT_GAP   = 140;  // espacio extra entre linajes distintos
const ROW_H      = 340;  // alto de cada generación
const TOP_PAD    = 56;
const SIDE_PAD   = 40;
const MID_Y      = 84;   // altura del conector matrimonial

const COLORS = ['#10b981','#3b82f6','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#ef4444'];

interface PlacedPerson { node: TreeGraphNode; x: number; y: number; }
interface PlacedUnit   { key: string; ids: string[]; x: number; y: number; width: number; level: number; label: string | null; color: string; }
interface Connector    { d: string; color: string; }
interface TreeLayout   { persons: PlacedPerson[]; units: PlacedUnit[]; connectors: Connector[]; width: number; height: number; }

function lineageRank(n: TreeGraphNode): number {
  const k = (n.kinshipRole ?? '').toLowerCase();
  if (k.includes('pat') || k === 'padre') return 0;
  if (k.includes('mat') || k === 'madre') return 2;
  return 1;
}

function computeLayout(
  nodes: TreeGraphNode[],
  edgesIn: TreeGraphData['parentChildEdges'],
  spousesIn: TreeGraphData['spouseEdges'],
): TreeLayout {
  const empty: TreeLayout = { persons: [], units: [], connectors: [], width: 0, height: 0 };
  if (!nodes.length) return empty;

  const byId    = new Map(nodes.map(n => [n.id, n]));
  const edges   = (edgesIn ?? []).filter(e => byId.has(e.parentId) && byId.has(e.childId));
  const spouses = (spousesIn ?? []).filter(e => byId.has(e.person1Id) && byId.has(e.person2Id));

  const parentsOf = new Map<string, string[]>();
  edges.forEach(e => {
    const a = parentsOf.get(e.childId) ?? [];
    if (!a.includes(e.parentId)) a.push(e.parentId);
    parentsOf.set(e.childId, a);
  });

  // Emparejamiento 1 a 1 (si alguien tiene varias parejas se usa la primera)
  const spouseOf = new Map<string, string>();
  spouses.forEach(e => {
    if (!spouseOf.has(e.person1Id) && !spouseOf.has(e.person2Id)) {
      spouseOf.set(e.person1Id, e.person2Id);
      spouseOf.set(e.person2Id, e.person1Id);
    }
  });

  /* ── 1. Nivel generacional de cada persona ─────────────────── */
  // Si los nodos tienen n.generation definido, calculamos la generación mínima (ej: 1)
  const validGens = nodes.map(n => n.generation).filter((g): g is number => typeof g === 'number' && g > 0);
  const minGen = validGens.length > 0 ? Math.min(...validGens) : 1;

  const level = new Map<string, number>(nodes.map(n => {
    // Si la persona tiene generación explícita, anclar su nivel base a (generation - minGen)
    const baseLevel = (typeof n.generation === 'number' && n.generation > 0)
      ? Math.max(0, n.generation - minGen)
      : 0;
    return [n.id, baseLevel];
  }));

  for (let it = 0; it < nodes.length + 2; it++) {
    let changed = false;
    edges.forEach(e => {
      const v = level.get(e.parentId)! + 1;
      if (v > level.get(e.childId)!) { level.set(e.childId, v); changed = true; }
    });
    spouseOf.forEach((b, a) => {
      const m = Math.max(level.get(a)!, level.get(b)!);
      if (level.get(a)! !== m) { level.set(a, m); changed = true; }
    });
    if (!changed) break;
  }
  const maxLevel = Math.max(...level.values());

  /* ── 2. Unidades (persona sola o pareja) por fila ──────────── */
  const byBirth = (a: string, b: string) =>
    (byId.get(a)!.birthDate ?? '9999').localeCompare(byId.get(b)!.birthDate ?? '9999');

  const rows: string[][][] = [];
  const assigned = new Set<string>();
  for (let l = 0; l <= maxLevel; l++) {
    const ids = nodes.filter(n => level.get(n.id) === l).map(n => n.id).sort(byBirth);
    const units: string[][] = [];
    ids.forEach(id => {
      if (assigned.has(id)) return;
      assigned.add(id);
      const sp = spouseOf.get(id);
      if (sp && level.get(sp) === l && !assigned.has(sp)) { assigned.add(sp); units.push([id, sp]); }
      else units.push([id]);
    });
    rows.push(units);
  }

  /* ── 3. Posición horizontal ────────────────────────────────── */
  const cx = new Map<string, number>();
  const placed: PlacedUnit[] = [];
  const widthOf = (u: string[]) => (u.length === 2 ? SLOT * 2 + COUPLE_GAP : SLOT);
  const parentCenter = (id: string): number | undefined => {
    const ps = (parentsOf.get(id) ?? []).filter(p => cx.has(p));
    if (!ps.length) return undefined;
    return ps.reduce((s, p) => s + cx.get(p)!, 0) / ps.length;
  };

  rows.forEach((units, l) => {
    const y = TOP_PAD + l * ROW_H;

    type Cand = { ids: string[]; desired?: number; anchor?: number; group: string; rank: number };
    const cands: Cand[] = units.map(u => {
      let ids = [...u];
      let pcs = ids.map(parentCenter);
      if (ids.length === 2) {
        const [a, b] = pcs;
        const swap =
          (a !== undefined && b !== undefined && b < a) ||
          (a === undefined && b !== undefined) ||
          (a === undefined && b === undefined &&
            byId.get(ids[0])!.gender === 'FEMALE' && byId.get(ids[1])!.gender === 'MALE');
        if (swap) { ids = ids.reverse(); pcs = pcs.reverse(); }
      }
      const lefts: number[] = [];
      if (pcs[0] !== undefined) lefts.push(pcs[0] - SLOT / 2);
      if (ids.length === 2 && pcs[1] !== undefined) lefts.push(pcs[1] - (SLOT * 1.5 + COUPLE_GAP));
      const desired = lefts.length ? lefts.reduce((s, v) => s + v, 0) / lefts.length : undefined;
      const singleAnchor = lefts.length === 1;
      const group = singleAnchor ? (parentsOf.get(pcs[0] !== undefined ? ids[0] : ids[1]) ?? []).slice().sort().join('|') : '';
      const anchor = singleAnchor ? (pcs[0] ?? pcs[1]) : undefined;
      const rank = Math.min(...ids.map(id => lineageRank(byId.get(id)!)));
      return { ids, desired, anchor, group, rank };
    });

    if (l === 0) {
      cands.sort((a, b) => a.rank - b.rank || byBirth(a.ids[0], b.ids[0]));
    } else {
      cands.sort((a, b) => (a.desired ?? Infinity) - (b.desired ?? Infinity));
    }

    // Agrupar hermanos para centrarlos bajo sus padres
    for (let i = 0; i < cands.length; ) {
      const g = cands[i].group;
      let j = i + 1;
      if (g) while (j < cands.length && cands[j].group === g) j++;
      if (g && j - i > 1 && cands[i].anchor !== undefined) {
        const total = cands.slice(i, j).reduce((s, c) => s + widthOf(c.ids), 0) + UNIT_GAP * (j - i - 1);
        let left = cands[i].anchor! - total / 2;
        for (let k = i; k < j; k++) { cands[k].desired = left; left += widthOf(cands[k].ids) + UNIT_GAP; }
      }
      i = j;
    }

    // Resolver solapamientos
    let cursor: number | null = null;
    let prevRank: number | null = null;
    cands.forEach(c => {
      const gap = l === 0 && prevRank !== null && prevRank !== c.rank ? ROOT_GAP : UNIT_GAP;
      let left = c.desired ?? (cursor === null ? 0 : cursor + gap);
      if (cursor !== null) left = Math.max(left, cursor + gap);
      const w = widthOf(c.ids);
      cx.set(c.ids[0], left + SLOT / 2);
      if (c.ids.length === 2) cx.set(c.ids[1], left + SLOT + COUPLE_GAP + SLOT / 2);

      const r = c.rank;
      const label = l === 0 ? (r === 0 ? '🏛️ Linaje Paterno' : r === 2 ? '🌸 Linaje Materno' : null) : null;
      placed.push({ key: c.ids.join('+'), ids: c.ids, x: left, y, width: w, level: l, label, color: COLORS[placed.length % COLORS.length] });
      cursor = left + w;
      prevRank = c.rank;
    });
  });

  /* ── 4. Normalizar coordenadas ─────────────────────────────── */
  const minX  = Math.min(...placed.map(u => u.x));
  const shift = SIDE_PAD - minX;
  placed.forEach(u => { u.x += shift; });
  cx.forEach((v, k) => cx.set(k, v + shift));
  const width  = Math.max(...placed.map(u => u.x + u.width)) + SIDE_PAD;
  const height = TOP_PAD + (maxLevel + 1) * ROW_H;

  const persons: PlacedPerson[] = [];
  placed.forEach(u => u.ids.forEach(id => persons.push({ node: byId.get(id)!, x: cx.get(id)! - SLOT / 2, y: u.y })));

  /* ── 5. Conectores ─────────────────────────────────────────── */
  const connectors: Connector[] = [];
  const rowY = (id: string) => TOP_PAD + level.get(id)! * ROW_H;

  // Línea matrimonial
  placed.filter(u => u.ids.length === 2).forEach(u => {
    const yy = u.y + MID_Y;
    connectors.push({ d: `M ${cx.get(u.ids[0])} ${yy} H ${cx.get(u.ids[1])}`, color: '#f59e0b' });
  });

  // Padres → hijos (agrupados por conjunto de padres)
  const groups = new Map<string, string[]>();
  parentsOf.forEach((ps, child) => {
    const key = ps.slice().sort().join('|');
    const arr = groups.get(key) ?? [];
    arr.push(child);
    groups.set(key, arr);
  });

  let gi = 0;
  groups.forEach((children, key) => {
    const ps = key.split('|');
    const ox = ps.reduce((s, p) => s + cx.get(p)!, 0) / ps.length;
    const oy = Math.max(...ps.map(rowY)) + MID_Y;
    const childTop = Math.min(...children.map(rowY));
    const busY = childTop - 40 - (gi % 3) * 10;
    const xs = children.map(c => cx.get(c)!);
    const minB = Math.min(ox, ...xs);
    const maxB = Math.max(ox, ...xs);
    let d = `M ${ox} ${oy} V ${busY} M ${minB} ${busY} H ${maxB}`;
    children.forEach(c => { d += ` M ${cx.get(c)} ${busY} V ${rowY(c)}`; });
    connectors.push({ d, color: COLORS[gi % COLORS.length] });
    gi++;
  });

  return { persons, units: placed, connectors, width, height };
}

/* ═══════════════════════════════════════════════════════════════
   RENDER DEL ÁRBOL
═══════════════════════════════════════════════════════════════ */

interface GenerationTreeProps {
  layout: TreeLayout;
  onSelect: (id: string) => void;
  onAddRelative?: (id: string) => void;
  matchFn: (p: TreeGraphNode) => boolean;
}

const GenerationTree: React.FC<GenerationTreeProps> = ({ layout, onSelect, onAddRelative, matchFn }) => (
  <div className="relative shrink-0" style={{ width: layout.width, height: layout.height }}>
    {/* Líneas */}
    <svg className="absolute inset-0 pointer-events-none" width={layout.width} height={layout.height}>
      {layout.connectors.map((c, i) => (
        <path key={i} d={c.d} stroke={c.color} strokeWidth={2.5} fill="none" strokeLinecap="round" strokeLinejoin="round" opacity={0.85} />
      ))}
    </svg>

    {/* Etiquetas de linaje + anillos */}
    {layout.units.map(u => (
      <React.Fragment key={u.key}>
        {u.label && (
          <div
            className="absolute -translate-x-1/2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border shadow-md whitespace-nowrap"
            style={{ left: u.x + u.width / 2, top: u.y - 44, borderColor: `${u.color}60`, color: u.color, background: `${u.color}15` }}
          >
            {u.label}
          </div>
        )}
        {u.ids.length === 2 && (
          <div
            className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center w-9 h-9 rounded-full text-base shadow-lg border-2 z-10"
            style={{ left: u.x + SLOT + COUPLE_GAP / 2, top: u.y + MID_Y, background: '#0f172a', borderColor: '#f59e0b80' }}
          >
            💍
          </div>
        )}
      </React.Fragment>
    ))}

    {/* Tarjetas (fondo opaco para tapar las líneas) */}
    {layout.persons.map(p => (
      <div key={p.node.id} className="absolute flex justify-center" style={{ left: p.x, top: p.y, width: SLOT }}>
        <div className="person-card-interactive rounded-2xl bg-slate-950">
          <PersonCard person={p.node} onSelect={onSelect} onAddRelative={onAddRelative} highlightMatch={matchFn(p.node)} />
        </div>
      </div>
    ))}
  </div>
);

/* ═══════════════════════════════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════════════════════════════ */

export const FamilyTreeCanvas: React.FC<FamilyTreeCanvasProps> = ({
  treeData, onSelectPerson, onAddRelative, onOpenAddPerson, onOpenAddPersonWithPreset, searchQuery = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0.75);
  const [pan, setPan]     = useState({ x: 0, y: 0 });
  const [drag, setDrag]   = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const [vitalFilter,    setVitalFilter]    = useState<'ALL'|'ALIVE'|'DECEASED'>('ALL');
  const [genderFilter,   setGenderFilter]   = useState<'ALL'|'MALE'|'FEMALE'>('ALL');
  const [lineageFilter,  setLineageFilter]  = useState<'ALL'|'PATERNAL'|'MATERNAL'>('ALL');
  const [familySurname,  setFamilySurname]  = useState<string>('ALL');

  /* ── apellidos únicos disponibles ───────────────────────── */
  const surnames = useMemo(() => extractSurnames(treeData.nodes), [treeData.nodes]);

  /* ── filtrado ─────────────────────────────────────────────── */
  const connectedIds = useMemo(() => {
    if (familySurname === 'ALL') return null;
    return getConnectedIds(familySurname, treeData.nodes, treeData.parentChildEdges, treeData.spouseEdges);
  }, [familySurname, treeData.nodes, treeData.parentChildEdges, treeData.spouseEdges]);

  const filteredNodes = useMemo(() =>
    treeData.nodes.filter(n => {
      // Filtro de linaje paterno/materno
      if (lineageFilter === 'PATERNAL') {
        const k = (n.kinshipRole || '').toLowerCase();
        if (k.includes('mat') || k === 'madre' || k.includes('materno') || k.includes('abuela_mat') || k.includes('abuelo_mat')) {
          return false;
        }
      } else if (lineageFilter === 'MATERNAL') {
        const k = (n.kinshipRole || '').toLowerCase();
        if (k.includes('pat') || k === 'padre' || k.includes('paterno') || k.includes('abuela_pat') || k.includes('abuelo_pat')) {
          return false;
        }
      }

      // Filtro de familia/apellido
      if (connectedIds && !connectedIds.has(n.id)) return false;
      if (vitalFilter  === 'ALIVE'    && !n.isAlive) return false;
      if (vitalFilter  === 'DECEASED' &&  n.isAlive) return false;
      if (genderFilter !== 'ALL'      && n.gender !== genderFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return `${n.firstName} ${n.middleName ?? ''} ${n.lastName} ${n.secondLastName ?? ''}`.toLowerCase().includes(q);
      }
      return true;
    }),
    [treeData.nodes, connectedIds, vitalFilter, genderFilter, lineageFilter, searchQuery]
  );

  const matchFn = useCallback((p: TreeGraphNode) => {
    if (!searchQuery.trim()) return false;
    const q = searchQuery.toLowerCase();
    return `${p.firstName} ${p.middleName ?? ''} ${p.lastName} ${p.secondLastName ?? ''}`.toLowerCase().includes(q);
  }, [searchQuery]);

  /* ── árbol ──────────────────────────────────────────────── */
  const layout = useMemo(
    () => computeLayout(filteredNodes, treeData.parentChildEdges, treeData.spouseEdges),
    [filteredNodes, treeData.parentChildEdges, treeData.spouseEdges]
  );

  /* ── drag / zoom ─────────────────────────────────────────── */
  const startDrag = (x: number, y: number) => { setDrag(true); setDragStart({ x: x - pan.x, y: y - pan.y }); };
  const moveDrag  = (x: number, y: number) => { if (drag) setPan({ x: x - dragStart.x, y: y - dragStart.y }); };
  const endDrag   = () => setDrag(false);

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.person-card-interactive,button')) return;
    startDrag(e.clientX, e.clientY);
  };
  const onMouseMove  = (e: React.MouseEvent) => moveDrag(e.clientX, e.clientY);
  const onTouchStart = (e: React.TouchEvent) => {
    if ((e.target as HTMLElement).closest('.person-card-interactive,button')) return;
    const t = e.touches[0]; startDrag(t.clientX, t.clientY);
  };
  const onTouchMove = (e: React.TouchEvent) => { const t = e.touches[0]; moveDrag(t.clientX, t.clientY); };

  /* ── Auto-centrado y encuadre inteligente del árbol ───────── */
  const autoCenterTree = useCallback(() => {
    if (!containerRef.current || !layout || layout.width === 0 || layout.height === 0) return;

    const container = containerRef.current;
    const cw = container.clientWidth || window.innerWidth;
    const ch = container.clientHeight || (window.innerHeight - 150);

    const padX = 40;
    const padY = 40;

    // Escala para que todo el árbol quepa en pantalla cómodamente
    const scaleX = (cw - padX * 2) / layout.width;
    const scaleY = (ch - padY * 2) / layout.height;

    // Escala adaptada (entre 0.15 y 0.85)
    let fitScale = Math.min(scaleX, scaleY);
    fitScale = Math.max(0.15, Math.min(fitScale, 0.85));

    // Centrar con precisión matemática en X y Y
    const scaledWidth = layout.width * fitScale;
    const panX = Math.round((cw - scaledWidth) / 2);
    const panY = Math.max(20, Math.round((ch - layout.height * fitScale) / 6));

    setScale(fitScale);
    setPan({ x: panX, y: panY });
  }, [layout]);

  // Centrar automáticamente cada vez que cargan o cambian los familiares
  useEffect(() => {
    if (layout.width > 0 && layout.height > 0) {
      const timer = setTimeout(() => {
        autoCenterTree();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [layout.width, layout.height, familySurname, lineageFilter, autoCenterTree]);

  // Zoom manteniendo fijo el centro de la pantalla
  const zoomAtCenter = (newScale: number) => {
    const container = containerRef.current;
    if (!container) {
      setScale(newScale);
      return;
    }
    const cw = container.clientWidth / 2;
    const ch = container.clientHeight / 2;
    const ratio = newScale / scale;
    setPan(p => ({
      x: Math.round(cw - (cw - p.x) * ratio),
      y: Math.round(ch - (ch - p.y) * ratio),
    }));
    setScale(newScale);
  };

  const onWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const nextScale = Math.min(3, Math.max(0.15, scale - e.deltaY * 0.001));
    zoomAtCenter(nextScale);
  };

  const onReset = () => { autoCenterTree(); };

  const preset = (p: string) => { if (onOpenAddPersonWithPreset) onOpenAddPersonWithPreset(p); else onOpenAddPerson?.(); };

  /* ── Export HD (renderizador nativo, sin html2canvas) ─────── */
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportModalOpen, setExportModalOpen] = useState<boolean>(false);
  const [exportedImageUri, setExportedImageUri] = useState<string | null>(null);
  const [exportedFile, setExportedFile] = useState<File | null>(null);
  const [exportInfo, setExportInfo] = useState<string>('');
  const exportTargetRef = useRef<HTMLDivElement>(null);

  const exportFileName = `Arbol_Genealogico_${familySurname !== 'ALL' ? familySurname.replace(/\s+/g, '_') : 'Familiar'}.png`;

  const handleGenerateHDImage = async () => {
    if (!layout.persons.length) return;
    setIsExporting(true);
    try {
      const { renderTreeImage } = await import('../../utils/treeImageExport');
      const title = familySurname !== 'ALL' ? `Familia ${familySurname}` : 'Árbol Genealógico Familiar';
      const res = await renderTreeImage(layout, { title, slot: SLOT, coupleGap: COUPLE_GAP, midY: MID_Y });
      if (exportedImageUri) URL.revokeObjectURL(exportedImageUri);
      setExportedImageUri(res.url);
      setExportedFile(new File([res.blob], exportFileName, { type: 'image/png' }));
      setExportInfo(`${res.width} × ${res.height} px · ${(res.blob.size / 1024 / 1024).toFixed(1)} MB`);
      setExportModalOpen(true);
    } catch (err) {
      console.error('Error al generar imagen del árbol:', err);
      alert('No se pudo generar la imagen. Cierra otras apps o pestañas y vuelve a intentarlo.');
    } finally {
      setIsExporting(false);
    }
  };

  const downloadExportedImage = () => {
    if (!exportedImageUri) return;
    const a = document.createElement('a');
    a.href = exportedImageUri;
    a.download = exportFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleShareHDImageToWhatsApp = async () => {
    if (!exportedFile) return;
    // Compartir el ARCHIVO de imagen (Android / iPhone). Se llama sin esperas previas
    // para que el navegador lo acepte como acción directa del usuario.
    if (navigator.canShare && navigator.canShare({ files: [exportedFile] })) {
      try {
        await navigator.share({ files: [exportedFile], title: 'Árbol Genealógico Familiar' });
        return;
      } catch (e: any) {
        if (e?.name === 'AbortError') return; // el usuario cerró el menú
        console.warn('share() falló, usando descarga:', e);
      }
    }
    // Respaldo (PC u otros navegadores): descargar la foto y abrir WhatsApp
    downloadExportedImage();
    setTimeout(() => {
      openWhatsAppShare('🌳 *ÁRBOL GENEALÓGICO FAMILIAR*\n\nTe envío la foto del árbol familiar 📸 (adjunta la imagen descargada).');
    }, 600);
  };

  const total = treeData.nodes.length;
  const alive = treeData.nodes.filter(n => n.isAlive).length;
  const dead  = total - alive;

  return (
    <div
      className="relative w-full flex flex-col bg-slate-950 rounded-xl border border-slate-800 shadow-2xl overflow-hidden"
      style={{ height: 'calc(100dvh - 5rem)' }}
    >
      {/* ═══════════════════ TOOLBAR ═══════════════════════════ */}
      <div className="z-30 flex items-center justify-between gap-2 px-3 py-2 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 shrink-0 overflow-x-auto">
        <div className="flex items-center gap-2 shrink-0">

        {/* 📲 Botón Principal Compartir Árbol (SIEMPRE VISIBLE AL INICIO) */}
        <button
          onClick={handleGenerateHDImage}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs transition-all shadow-md shadow-emerald-500/25 shrink-0 disabled:opacity-50 hover:scale-105 active:scale-95 cursor-pointer"
          title="Generar imagen Ultra HD (4K) del árbol para enviar por WhatsApp"
        >
          <Camera className="w-3.5 h-3.5 text-slate-950 animate-pulse" />
          <span className="whitespace-nowrap font-black">{isExporting ? 'Generando...' : '📲 Compartir Árbol'}</span>
        </button>

        {/* vital */}
        {/* 🏠 Selector de Familia por Apellido */}
        {surnames.length > 0 && (
          <div className="flex items-center gap-1 bg-slate-950/80 px-1.5 py-1 rounded-xl border border-amber-500/30 text-[11px]">
            <Users className="w-3 h-3 text-amber-400 shrink-0" />
            <span className="hidden sm:block text-amber-400 font-black pr-0.5">Familia:</span>
            <select
              value={familySurname}
              onChange={e => { setFamilySurname(e.target.value); setPan({ x: 0, y: 0 }); }}
              className="bg-slate-900 text-amber-300 font-bold text-[11px] outline-none cursor-pointer px-2 py-0.5 rounded-lg border border-amber-500/30 max-w-[140px]"
            >
              <option className="bg-slate-900 text-slate-100 font-bold" value="ALL">Todas las familias</option>
              {surnames.map(s => (
                <option className="bg-slate-900 text-slate-100 font-bold" key={s} value={s}>Familia {s}</option>
              ))}
            </select>
          </div>
        )}

        {/* 🛡️ Enfoque de Linaje (Paterno / Materno / Todos) */}
        <div className="flex items-center gap-0.5 bg-slate-950/90 px-1 py-1 rounded-xl border border-sky-500/30 text-[11px]">
          <span className="hidden lg:block text-sky-400 font-bold px-1">Enfoque:</span>
          {([['ALL','🌳 Todos'],['PATERNAL','👨 Paterno'],['MATERNAL','👩 Materno']] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => { setLineageFilter(v as typeof lineageFilter); setPan({ x: 0, y: 0 }); }}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${lineageFilter===v ? v==='PATERNAL'?'bg-blue-600 text-white shadow':v==='MATERNAL'?'bg-pink-600 text-white shadow':'bg-sky-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* Estado vital */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 px-1 py-1 rounded-xl border border-slate-800 text-[11px]">
          <span className="hidden sm:block text-slate-500 px-1 font-semibold">
            <Filter className="w-3 h-3 inline mr-0.5" />Estado:
          </span>
          {([['ALL',`Todos (${total})`],['ALIVE',`Vivos (${alive})`],['DECEASED',`🪽 (${dead})`]] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => setVitalFilter(v as typeof vitalFilter)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${vitalFilter===v ? v==='DECEASED'?'bg-purple-700 text-white':'bg-emerald-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>

        {/* género */}
        <div className="flex items-center gap-0.5 bg-slate-950/80 px-1 py-1 rounded-xl border border-slate-800 text-[11px]">
          {([['ALL','Todos'],['FEMALE','♀ Mujer'],['MALE','♂ Hombre']] as [string,string][]).map(([v,l]) => (
            <button key={v} onClick={() => setGenderFilter(v as typeof genderFilter)}
              className={`px-2 py-0.5 rounded-lg font-bold transition-all ${genderFilter===v ? v==='FEMALE'?'bg-pink-600 text-white':v==='MALE'?'bg-sky-600 text-white':'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>
              {l}
            </button>
          ))}
        </div>
        </div>

        {/* zoom */}
        <div className="flex items-center gap-1 bg-slate-950/80 px-1 py-1 rounded-xl border border-slate-800 shrink-0 ml-auto">
          <button onClick={() => zoomAtCenter(Math.min(3, scale + 0.1))} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"><ZoomIn className="w-4 h-4" /></button>
          <span className="text-[11px] font-mono w-10 text-center text-slate-400">{Math.round(scale * 100)}%</span>
          <button onClick={() => zoomAtCenter(Math.max(0.15, scale - 0.1))} className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded-lg"><ZoomOut className="w-4 h-4" /></button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button onClick={onReset} className="flex items-center gap-1 px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-800 rounded-lg">
            <RefreshCw className="w-3.5 h-3.5" /><span className="hidden sm:inline">Centrar</span>
          </button>
          <div className="w-px h-4 bg-slate-700 mx-0.5" />
          <button
            onClick={handleGenerateHDImage}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[11px] transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50"
            title="Generar imagen Ultra HD (4K) del árbol para enviar por WhatsApp"
          >
            <Camera className="w-3.5 h-3.5 text-emerald-100 animate-pulse" />
            <span className="whitespace-nowrap">{isExporting ? 'Generando...' : 'Compartir Árbol'}</span>
          </button>
        </div>
      </div>

      {/* ═══════════════════ CANVAS ════════════════════════════ */}
      <div
        ref={containerRef}
        onMouseDown={onMouseDown} onMouseMove={onMouseMove} onMouseUp={endDrag} onMouseLeave={endDrag}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={endDrag}
        onWheel={onWheel}
        className="flex-1 overflow-hidden relative bg-[radial-gradient(#1e293b_1px,transparent_1px)] [background-size:22px_22px] cursor-grab active:cursor-grabbing select-none"
      >
        <div
          style={{
            transform: `translate(${pan.x}px,${pan.y}px) scale(${scale})`,
            transformOrigin: '0 0',
            transition: drag ? 'none' : 'transform 0.12s ease-out',
            width: layout.width > 0 ? layout.width : undefined,
          }}
          className="absolute top-0 left-0 pt-4 pb-24 px-4 flex flex-col items-center"
        >

          {/* ── Árbol vacío ─────────────────────────────────── */}
          {treeData.nodes.length === 0 ? (
            <div className="max-w-sm w-full mx-auto mt-6 flex flex-col items-center p-6 bg-slate-900/90 border border-slate-800 rounded-3xl shadow-2xl text-center">
              <Sparkles className="w-10 h-10 text-emerald-400 mb-3 animate-pulse" />
              <h3 className="text-base font-black text-slate-100 mb-1">¡Construye tu Árbol Genealógico!</h3>
              <p className="text-xs text-slate-400 mb-5 leading-relaxed">
                Empieza por tus abuelos. El árbol crecerá automáticamente hacia abajo, generación por generación, hasta los bisnietos.
              </p>
              <div className="w-full flex flex-col gap-2 mb-4">
                {[
                  { p:'abuelo_pat', icon:'👴', label:'Abuelo Paterno (ej: Cesar Uzcategui)', c:'border-sky-500/40 hover:border-sky-400', a:'text-sky-400' },
                  { p:'abuela_pat', icon:'👵', label:'Abuela Paterna (ej: Ana Avila)',        c:'border-sky-400/30 hover:border-sky-400', a:'text-sky-400' },
                  { p:'abuelo_mat', icon:'👴', label:'Abuelo Materno (ej: Francisco Cabrera)',c:'border-pink-500/40 hover:border-pink-400',a:'text-pink-400'},
                  { p:'abuela_mat', icon:'👵', label:'Abuela Materna (ej: Aura Olivo)',       c:'border-pink-400/30 hover:border-pink-400',a:'text-pink-400'},
                ].map(({p,icon,label,c,a}) => (
                  <button key={p} onClick={() => preset(p)}
                    className={`flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border ${c} hover:bg-slate-900 transition-all group`}>
                    <span className="flex items-center gap-2">
                      <span className="text-base">{icon}</span>
                      <span className="text-xs font-bold text-slate-200 group-hover:text-white text-left">{label}</span>
                    </span>
                    <ArrowRight className={`w-4 h-4 ${a} shrink-0 group-hover:translate-x-1 transition-transform`} />
                  </button>
                ))}
              </div>
              {onOpenAddPerson && (
                <button onClick={onOpenAddPerson} className="w-full flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs shadow-lg transition-all hover:scale-[1.02]">
                  <Plus className="w-4 h-4" /> Abrir formulario completo
                </button>
              )}
            </div>

          ) : layout.units.length === 0 ? (
            <div className="mt-12 text-center text-slate-500">
              <p className="font-bold text-slate-300">Sin resultados para este filtro</p>
              <p className="text-xs mt-1">Cambia los filtros de estado o género</p>
            </div>

          ) : (
            /* ═══════════════════════════════════════════════════════
               ÁRBOL GENEALÓGICO — ESTÁNDAR INTERNACIONAL
               Dos raíces independientes (paternal / maternal)
               convergen cuando sus hijos se casan, y de ahí
               la descendencia continúa hacia abajo.
            ═══════════════════════════════════════════════════════ */
            <div ref={exportTargetRef} className="flex flex-col items-center min-w-max w-full p-6 rounded-3xl bg-slate-950">

              {/* Título del árbol */}
              <div className="mb-6 flex items-center gap-3">
                <div className="h-px w-16 bg-gradient-to-r from-transparent to-emerald-500/40" />
                <div className={`px-4 py-1.5 rounded-full border text-xs font-black uppercase tracking-widest shadow-lg ${
                  familySurname !== 'ALL'
                    ? 'bg-amber-950/80 border-amber-500/50 text-amber-300'
                    : 'bg-slate-900/90 border-emerald-500/30 text-emerald-300'
                }`}>
                  🌳 {familySurname !== 'ALL' ? `Familia ${familySurname}` : 'Árbol Genealógico Familiar'}
                </div>
                <div className="h-px w-16 bg-gradient-to-l from-transparent to-emerald-500/40" />
              </div>

              {/* ── Árbol por generaciones (sin duplicados) ── */}
              <GenerationTree layout={layout} onSelect={onSelectPerson} onAddRelative={onAddRelative} matchFn={matchFn} />

              {/* Botones de acción inferior */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
                <button
                  onClick={() => onOpenAddPerson?.()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900/80 border border-dashed border-slate-700 hover:border-emerald-500/60 text-slate-400 hover:text-emerald-300 text-xs font-bold transition-all hover:bg-slate-900"
                >
                  <Plus className="w-4 h-4" /> Agregar Familiar al Árbol
                </button>

                <button
                  onClick={handleGenerateHDImage}
                  disabled={isExporting}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-black text-xs shadow-lg shadow-emerald-500/20 transition-all hover:scale-105 disabled:opacity-50"
                >
                  <Camera className="w-4 h-4" />
                  <span>{isExporting ? 'Generando HD...' : '📲 Compartir Imagen del Árbol en HD (WhatsApp)'}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ═══════════════════ BOTÓN FLOTANTE COMPARTIR (siempre visible) ═══════════════════ */}
      {layout.persons.length > 0 && (
        <button
          onClick={handleGenerateHDImage}
          disabled={isExporting}
          className="absolute bottom-5 right-5 z-40 flex items-center gap-2.5 px-5 py-3.5 rounded-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm shadow-2xl shadow-emerald-950/80 border-2 border-white/40 transition-all hover:scale-105 active:scale-95 disabled:opacity-70 animate-pulse hover:animate-none cursor-pointer"
          title="Compartir foto del árbol por WhatsApp"
        >
          {isExporting ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Share2 className="w-5 h-5 stroke-[2.5]" />
          )}
          <span>{isExporting ? 'Generando foto...' : '📲 Compartir Árbol (WhatsApp)'}</span>
        </button>
      )}

      {/* ═══════════════════ LEYENDA ═══════════════════════════ */}
      <div className="absolute bottom-3 left-3 z-20 hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-[11px] text-slate-400 shadow-xl">
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-sky-500" />Hombre</span>
        <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-pink-500" />Mujer</span>
        <span className="flex items-center gap-1">💍 Pareja</span>
        <span className="flex items-center gap-1">🪽 Fallecido/a</span>
        <span className="text-slate-600 hidden md:inline">| Arrastra · Pellizca/Rueda para Zoom</span>
      </div>

      {/* ═══════════════════ MODAL EXPORTAR IMAGEN HD FOR WHATSAPP ═══════════════════ */}
      {exportModalOpen && exportedImageUri && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto animate-in fade-in duration-200">
          <div className="glass-panel w-full max-w-2xl rounded-3xl border border-slate-800 shadow-2xl p-6 relative max-h-[92vh] overflow-y-auto flex flex-col gap-4">
            
            <button
              onClick={() => setExportModalOpen(false)}
              className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400 flex items-center justify-center text-emerald-300 shrink-0">
                <Camera className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h3 className="text-base font-black text-white">Imagen Ultra HD (4K) del Árbol Generada</h3>
                <p className="text-xs text-slate-300">
                  Lista para enviar por WhatsApp o guardar en tu galería sin perder nitidez
                </p>
              </div>
            </div>

            {/* Vista previa de la imagen */}
            <div className="p-2.5 rounded-2xl bg-slate-950 border border-slate-800 max-h-72 overflow-auto flex items-center justify-center">
              <img
                src={exportedImageUri}
                alt="Árbol Genealógico HD"
                className="max-w-full h-auto rounded-xl shadow-lg border border-slate-800"
              />
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-emerald-500/30 text-xs text-slate-300 leading-relaxed">
              <span className="font-bold text-emerald-400 block mb-1">💡 Para que se vea nítida en WhatsApp:</span>
              Toca <strong>"Enviar Foto por WhatsApp"</strong> y elige el chat. Si el árbol es muy grande, envíala como <strong>"Documento"</strong> para que no pierda calidad.
              {exportInfo && <span className="block mt-1 text-slate-500">Resolución: {exportInfo}</span>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-800">
              <button
                onClick={handleShareHDImageToWhatsApp}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-sm shadow-lg transition-all"
              >
                <Share2 className="w-4 h-4" />
                <span>Enviar Foto por WhatsApp</span>
              </button>

              <button
                onClick={downloadExportedImage}
                className="flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-sm shadow-lg transition-all"
              >
                <Download className="w-4 h-4" />
                <span>Guardar Foto en el Teléfono</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
