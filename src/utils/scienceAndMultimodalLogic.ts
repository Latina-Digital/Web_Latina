export type EpistemicProvenance = 'experimental' | 'predicted' | 'curated_chemical';

export interface ChemicalCompoundProperties {
  cid: number;
  name: string;
  industrialRole: string;
  molecularFormula: string;
  molecularWeight: number;
  canonicalSmiles: string;
  inchikey: string;
  xlogp: number;
  tpsa: number;
  hBondDonorCount: number;
  hBondAcceptorCount: number;
  rotatableBondCount: number;
  complexity: number;
  provenance: EpistemicProvenance;
}

export interface LipinskiVeberAssessment {
  lipinskiViolations: number;
  passesLipinski: boolean;
  passesVeber: boolean;
  mwPass: boolean;
  logpPass: boolean;
  hbdPass: boolean;
  hbaPass: boolean;
  rotatablePass: boolean;
  tpsaPass: boolean;
  stabilityGrade: 'Óptima (Grado Industrial INEN)' | 'Moderada (Controlar Solvente)' | 'Especializada (Polímero Pesado)';
  summaryText: string;
}

export interface PlddtBandInfo {
  band: 'very_high' | 'confident' | 'low' | 'very_low';
  label: string;
  colorHex: '#0053D6' | '#65CBF3' | '#FFDB13' | '#FF7D45';
  interpretation: string;
}

export interface MolecularAtom3D {
  serial: number;
  atomName: string;
  resName: string;
  chainId: string;
  resSeq: number;
  x: number;
  y: number;
  z: number;
  bFactor: number;
  element: string;
}

export interface BiomolecularTargetPreset {
  id: string;
  type: 'chemical' | 'protein_alphafold' | 'protein_pdb';
  label: string;
  subtitle: string;
  accessionOrCid: string;
  uniprotId?: string;
  pdbId?: string;
  pubchemCid?: number;
  provenance: EpistemicProvenance;
  industrialApplication: string;
}

export const SCIENCE_QUICK_TARGETS: BiomolecularTargetPreset[] = [
  {
    id: 'tio2_rutile',
    type: 'chemical',
    label: 'Dióxido de Titanio (CID 26042)',
    subtitle: 'Pigmento Blanco de Alta Reflectancia LRV · Pintura Satinada & Látex LVA',
    accessionOrCid: '26042',
    pubchemCid: 26042,
    provenance: 'curated_chemical',
    industrialApplication: 'Opacidad primaria, bloqueo UV y reflectancia lumínica en Duralín Forte y Satinado Tipo 1.',
  },
  {
    id: 'bisphenol_a_diglycidyl',
    type: 'chemical',
    label: 'Resina Epóxica BADGE (CID 2286)',
    subtitle: 'Monómero Base Epóxico Anticorrosivo & Mortero Industrial',
    accessionOrCid: '2286',
    pubchemCid: 2286,
    provenance: 'curated_chemical',
    industrialApplication: 'Adherencia estructural sobre acero y hormigón en recubrimientos industriales y Porcelana 2K.',
  },
  {
    id: 'octhilinone_biocide',
    type: 'chemical',
    label: 'Octilinona Fungicida (CID 33528)',
    subtitle: 'Biocida Isotiazolinona Antihongos para Clima Costero Ecuatoriano',
    accessionOrCid: '33528',
    pubchemCid: 33528,
    provenance: 'curated_chemical',
    industrialApplication: 'Inhibición fúngica y algicida en Pintura Elastomérica, Duralín Forte y Porcelana 2K Antihongos.',
  },
  {
    id: 'catalase_p04040',
    type: 'protein_alphafold',
    label: 'Catalasa Antioxidante (AF-P04040)',
    subtitle: 'Enzima Hemo de Degradación de Peróxido · Estudio Bio-Resistencia al Moho',
    accessionOrCid: 'P04040',
    uniprotId: 'P04040',
    pdbId: '1DGF',
    provenance: 'predicted',
    industrialApplication: 'Diana enzimática para formulación de aditivos biocidas y recubrimientos asépticos hospitalarios.',
  },
  {
    id: 'tp53_p04637',
    type: 'protein_alphafold',
    label: 'Antígeno Celular TP53 (AF-P04637)',
    subtitle: 'Estructura Canónica AlphaFold DB con Regiones Ordenadas e IDPR',
    accessionOrCid: 'P04637',
    uniprotId: 'P04637',
    pdbId: '1TUP',
    provenance: 'predicted',
    industrialApplication: 'Referencia estructural de calibración pLDDT (4 bandas de confianza AlphaFold DB) y dominios de unión.',
  },
  {
    id: 'hemoglobin_4hhb',
    type: 'protein_pdb',
    label: 'Hemoglobina Humana (PDB 4HHB)',
    subtitle: 'Difracción de Rayos X (1.74 Å) · Complejo Tetramérico con Grupo Hemo Fe²⁺',
    accessionOrCid: '4HHB',
    pdbId: '4HHB',
    uniprotId: 'P68871',
    provenance: 'experimental',
    industrialApplication: 'Modelo cristalográfico experimental de complejos organometálicos y quelación de iones de transición.',
  },
];

export const GEMINI_CHAT_MODELS = [
  {
    id: 'gemini-3.8-flash',
    label: 'Gemini 3.8 Flash (General & Rápido)',
    badge: 'Estándar',
    description: 'Equilibrio ideal de velocidad y razonamiento para consultas de catálogo, ERP, logística y química.',
    requiresPaidKey: false,
  },
  {
    id: 'gemini-4-argon',
    label: 'Gemini 4 Argon (Razonamiento Complejo & STEM)',
    badge: 'Pro STEM',
    description: 'Máxima capacidad analítica para ingeniería civil, formulación química, código y proyecciones B2B.',
    requiresPaidKey: true,
  },
  {
    id: 'gemini-3.1-flash-lite',
    label: 'Gemini 3.1 Flash Lite (Ultra-Baja Latencia)',
    badge: 'Veloz',
    description: 'Respuestas instantáneas de alto rendimiento para atención al cliente y despacho rápido.',
    requiresPaidKey: false,
  },
] as const;

export type GeminiChatModelId = (typeof GEMINI_CHAT_MODELS)[number]['id'];

export const GEMINI_SYSTEM_ROLES = [
  {
    id: 'ingeniero_quimico',
    label: 'Ingeniero Químico & Formulador INEN',
    systemInstruction:
      'Eres el Director de Laboratorio Químico y Control de Calidad NTE INEN de Industrial Latina Cía. Ltda. en Guayaquil, Ecuador. Explicas con rigor técnico la formulación de polímeros vinil-acrílicos, dióxido de titanio, biocidas antihongos, empastes y morteros, relacionándolos siempre con productos reales del catálogo.',
  },
  {
    id: 'arquitecto_especificador',
    label: 'Arquitecto Especificador & Fotometría 3D',
    systemInstruction:
      'Eres el Arquitecto Principal de Especificaciones y Fotometría de Industrial Latina & Induless Ecuador. Asesoras sobre combinaciones de colores, reflectancia lumínica (LRV), iluminancia en Lux con paneles LED Induless, cubiertas Techoforte y cálculo exacto de materiales por m².',
  },
  {
    id: 'director_erp_syspro',
    label: 'Consultor ERP, Facturación SRI & Logística 48-72h',
    systemInstruction:
      'Eres el Director de Operaciones ERP, Facturación Electrónica SRI (SYSPRO / Latinasoft) y Logística Nacional de Industrial Latina. Resuelves dudas sobre links de pago, cupones para clientes nuevos verificados en Firestore y entregas garantizadas en 48 a 72 horas.',
  },
] as const;

export function evaluateChemicalFormulationRules(
  props: Pick<
    ChemicalCompoundProperties,
    'molecularWeight' | 'xlogp' | 'hBondDonorCount' | 'hBondAcceptorCount' | 'rotatableBondCount' | 'tpsa'
  >
): LipinskiVeberAssessment {
  const mwPass = props.molecularWeight <= 500;
  const logpPass = props.xlogp <= 5;
  const hbdPass = props.hBondDonorCount <= 5;
  const hbaPass = props.hBondAcceptorCount <= 10;
  const rotatablePass = props.rotatableBondCount <= 10;
  const tpsaPass = props.tpsa <= 140;

  const lipinskiViolations = [mwPass, logpPass, hbdPass, hbaPass].filter((v) => !v).length;
  const passesLipinski = lipinskiViolations <= 1;
  const passesVeber = rotatablePass && tpsaPass;

  const stabilityGrade =
    passesLipinski && passesVeber
      ? 'Óptima (Grado Industrial INEN)'
      : lipinskiViolations <= 2
        ? 'Moderada (Controlar Solvente)'
        : 'Especializada (Polímero Pesado)';

  const summaryText =
    passesLipinski && passesVeber
      ? `Cumple heurísticas fisicoquímicas Lipinski (${lipinskiViolations} violaciones) y Veber (TPSA ${props.tpsa.toFixed(1)} Å²). Excelente compatibilidad de dispersión en matriz acuosa o epóxica.`
      : `Presenta ${lipinskiViolations} desviaciones Lipinski / TPSA ${props.tpsa.toFixed(1)} Å². Requiere tensoactivos o co-solventes de coalescencia controlada.`;

  return {
    lipinskiViolations,
    passesLipinski,
    passesVeber,
    mwPass,
    logpPass,
    hbdPass,
    hbaPass,
    rotatablePass,
    tpsaPass,
    stabilityGrade,
    summaryText,
  };
}

export function classifyPlddtConfidence(score: number): PlddtBandInfo {
  const clamped = Math.max(0, Math.min(100, Number(score) || 0));
  if (clamped > 90) {
    return {
      band: 'very_high',
      label: 'Muy Alta (pLDDT > 90)',
      colorHex: '#0053D6',
      interpretation: 'Alta precisión en esqueleto peptídico y cadenas laterales; apto para análisis de sitio activo.',
    };
  }
  if (clamped >= 70) {
    return {
      band: 'confident',
      label: 'Confiable (70 ≤ pLDDT ≤ 90)',
      colorHex: '#65CBF3',
      interpretation: 'Topología de estructura secundaria bien definida.',
    };
  }
  if (clamped >= 50) {
    return {
      band: 'low',
      label: 'Baja (50 ≤ pLDDT < 70)',
      colorHex: '#FFDB13',
      interpretation: 'Bucles flexibles o regiones conectoras inter-dominio; interpretar con precaución.',
    };
  }
  return {
    band: 'very_low',
    label: 'Muy Baja (pLDDT < 50)',
    colorHex: '#FF7D45',
    interpretation: 'Correlaciona con regiones intrínsecamente desordenadas (IDPR); no interpretar como plegamiento rígido.',
  };
}

export function computeSequencePlddtSummary(atoms: MolecularAtom3D[]): {
  meanPlddt: number;
  veryHighPct: number;
  confidentPct: number;
  lowPct: number;
  veryLowPct: number;
  residueCount: number;
} {
  if (!atoms || atoms.length === 0) {
    return {
      meanPlddt: 0,
      veryHighPct: 0,
      confidentPct: 0,
      lowPct: 0,
      veryLowPct: 0,
      residueCount: 0,
    };
  }

  const byResidue = new Map<string, number>();
  for (const a of atoms) {
    const key = `${a.chainId}:${a.resSeq}`;
    if (!byResidue.has(key) || a.atomName === 'CA') {
      byResidue.set(key, a.bFactor);
    }
  }

  const scores = Array.from(byResidue.values());
  const total = scores.length || 1;
  let sum = 0;
  let vh = 0;
  let conf = 0;
  let low = 0;
  let vl = 0;

  for (const s of scores) {
    sum += s;
    if (s > 90) vh++;
    else if (s >= 70) conf++;
    else if (s >= 50) low++;
    else vl++;
  }

  return {
    meanPlddt: Number((sum / total).toFixed(1)),
    veryHighPct: Number(((vh / total) * 100).toFixed(1)),
    confidentPct: Number(((conf / total) * 100).toFixed(1)),
    lowPct: Number(((low / total) * 100).toFixed(1)),
    veryLowPct: Number(((vl / total) * 100).toFixed(1)),
    residueCount: scores.length,
  };
}

export function parsePdbOrCifAtoms(rawText: string, maxAtoms = 450): MolecularAtom3D[] {
  const atoms: MolecularAtom3D[] = [];
  if (!rawText || typeof rawText !== 'string') return atoms;

  const lines = rawText.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('ATOM  ') || line.startsWith('HETATM')) {
      // Standard PDB column format or whitespace-delimited mmCIF ATOM_SITE row
      const tokens = line.trim().split(/\s+/);
      if (line.length >= 54 && !line.includes('_atom_site')) {
        const atomName = line.slice(12, 16).trim();
        // Keep C-alpha, P, or ligand heavy atoms to stay fast in WebGL
        if (line.startsWith('ATOM  ') && atomName !== 'CA' && atomName !== 'CB' && atomName !== 'N' && atoms.length > 180) {
          continue;
        }
        const serial = parseInt(line.slice(6, 11).trim(), 10) || atoms.length + 1;
        const resName = line.slice(17, 20).trim() || 'ALA';
        const chainId = line.slice(21, 22).trim() || 'A';
        const resSeq = parseInt(line.slice(22, 26).trim(), 10) || 1;
        const x = parseFloat(line.slice(30, 38).trim());
        const y = parseFloat(line.slice(38, 46).trim());
        const z = parseFloat(line.slice(46, 54).trim());
        const bFactor = parseFloat(line.slice(60, 66).trim()) || 85.0;
        const element = line.slice(76, 78).trim() || atomName.slice(0, 1) || 'C';
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          atoms.push({ serial, atomName, resName, chainId, resSeq, x, y, z, bFactor, element });
          if (atoms.length >= maxAtoms) break;
          continue;
        }
      }
      // Fallback for mmCIF ATOM / HETATM lines
      if (tokens.length >= 15) {
        const atomName = tokens[3] || 'CA';
        if (tokens[0] === 'ATOM' && atomName !== 'CA' && atoms.length > 160) continue;
        const serial = parseInt(tokens[1], 10) || atoms.length + 1;
        const element = tokens[2] || 'C';
        const resName = tokens[5] || 'ALA';
        const chainId = tokens[6] || 'A';
        const resSeq = parseInt(tokens[8], 10) || atoms.length + 1;
        const x = parseFloat(tokens[10]);
        const y = parseFloat(tokens[11]);
        const z = parseFloat(tokens[12]);
        const bFactor = parseFloat(tokens[14]) || 88.0;
        if (Number.isFinite(x) && Number.isFinite(y) && Number.isFinite(z)) {
          atoms.push({ serial, atomName, resName, chainId, resSeq, x, y, z, bFactor, element });
          if (atoms.length >= maxAtoms) break;
        }
      }
    }
  }
  return atoms;
}

export function buildProceduralConformerAtoms(seedKey: string, count = 64): MolecularAtom3D[] {
  const atoms: MolecularAtom3D[] = [];
  const residues = ['ALA', 'GLY', 'LEU', 'VAL', 'SER', 'THR', 'LYS', 'ASP', 'GLU', 'PHE', 'HIS', 'CYS'];
  const elements = ['C', 'N', 'O', 'S', 'Ti', 'Fe'];
  let hash = 0;
  for (let i = 0; i < seedKey.length; i++) {
    hash = (hash * 31 + seedKey.charCodeAt(i)) % 100000;
  }

  for (let i = 0; i < count; i++) {
    const t = i * 0.42;
    const radius = 6.5 + Math.sin(i * 0.25 + (hash % 7)) * 2.2;
    const x = Number((Math.cos(t) * radius).toFixed(3));
    const y = Number((Math.sin(t) * radius).toFixed(3));
    const z = Number(((i - count / 2) * 0.65).toFixed(3));
    // Realistic pLDDT distribution across the 4 AlphaFold bands
    const rawConf = 94 - Math.abs(i - count * 0.45) * 0.9 + Math.sin(i * 0.7) * 8;
    const bFactor = Number(Math.max(38, Math.min(98.5, rawConf)).toFixed(1));
    atoms.push({
      serial: i + 1,
      atomName: i % 4 === 0 ? 'CA' : i % 4 === 1 ? 'N' : i % 4 === 2 ? 'O' : 'CB',
      resName: residues[i % residues.length],
      chainId: i < count * 0.75 ? 'A' : 'B',
      resSeq: i + 1,
      x,
      y,
      z,
      bFactor,
      element: elements[(i + (hash % 3)) % elements.length],
    });
  }
  return atoms;
}

export function generateProceduralWavBase64(options?: {
  durationSec?: number;
  sampleRate?: number;
  baseFreqHz?: number;
  chordMode?: 'corporate_anthem' | 'industrial_ambient' | 'voice_confirm';
}): string {
  const durationSec = Math.max(0.5, Math.min(12, options?.durationSec ?? 3.0));
  const sampleRate = options?.sampleRate ?? 24000;
  const baseFreq = options?.baseFreqHz ?? 261.63; // C4
  const mode = options?.chordMode ?? 'corporate_anthem';
  const numSamples = Math.floor(durationSec * sampleRate);
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeStr = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // 44-byte RIFF WAV header
  writeStr(0, 'RIFF');
  view.setUint32(4, 36 + dataSize, true);
  writeStr(8, 'WAVE');
  writeStr(12, 'fmt ');
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true);  // AudioFormat = 1 (PCM)
  view.setUint16(22, 1, true);  // NumChannels = 1
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true);  // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample = 16
  writeStr(36, 'data');
  view.setUint32(40, dataSize, true);

  const notes =
    mode === 'corporate_anthem'
      ? [baseFreq, baseFreq * 1.25, baseFreq * 1.5, baseFreq * 2.0]
      : mode === 'industrial_ambient'
        ? [baseFreq * 0.75, baseFreq, baseFreq * 1.333, baseFreq * 1.5]
        : [440, 554.37, 659.25];

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const noteIdx = Math.min(notes.length - 1, Math.floor((t / durationSec) * notes.length));
    const freq = notes[noteIdx];
    const env = Math.min(1, t * 12) * Math.max(0, 1 - (t / durationSec) * 0.65);
    const wave =
      0.55 * Math.sin(2 * Math.PI * freq * t) +
      0.28 * Math.sin(2 * Math.PI * (freq * 1.5) * t) +
      0.17 * Math.sin(2 * Math.PI * (freq * 0.5) * t);
    const sample = Math.max(-1, Math.min(1, wave * env * 0.45));
    view.setInt16(44 + i * 2, Math.round(sample * 32767), true);
  }

  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(buffer).toString('base64');
  }
  return btoa(binary);
}
