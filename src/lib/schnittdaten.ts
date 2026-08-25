/**
 * Schnittdaten-Datenbank & Berechnung für das Fräsen.
 * Pure Funktionen und Daten – server- und clientseitig identisch, getestet.
 *
 * Die Richtwerte sind Praxis-Startwerte aus Zerspanungstabellen (VDI/Herstellerkataloge)
 * und bewusst konservativ gehalten. Formeln sind identisch zu den Einzelrechnern:
 *   n  = vc · 1000 / (π · d)
 *   vf = fz · z · n
 *   hm = fz · (2·ae/d) / φs           mit cos φs = 1 − 2·ae/d      (siehe /rechner/mittlere-spanungsdicke)
 *   kc = kc1.1 / hm^mc                (Kienzle)
 *   P  = Q · kc / (60000 · η)         mit Q in cm³/min             (siehe /rechner/spindelleistung-fraesen)
 */

export type ToolMaterial = 'hss' | 'vhm' | 'vhm-tialn' | 'wsp';

export interface ToolMaterialInfo {
  id: ToolMaterial;
  label: string;
  short: string;
}

export const TOOL_MATERIALS: ToolMaterialInfo[] = [
  { id: 'hss', label: 'HSS / HSS-E (Schnellarbeitsstahl)', short: 'HSS' },
  { id: 'vhm', label: 'VHM unbeschichtet (Vollhartmetall)', short: 'VHM' },
  { id: 'vhm-tialn', label: 'VHM beschichtet (TiAlN/AlTiN)', short: 'VHM beschichtet' },
  { id: 'wsp', label: 'Wendeschneidplatten-Fräser', short: 'WSP' },
];

export interface CuttingMaterial {
  id: string;
  label: string;
  /** ISO-Zerspanungsgruppe (P Stahl, M Edelstahl, K Guss, N NE-Metall, S Superlegierung, O sonstige). */
  group: 'P' | 'M' | 'K' | 'N' | 'S' | 'O';
  /** Richtwertbereich der Schnittgeschwindigkeit in m/min je Werkzeugmaterial. */
  vc: Record<ToolMaterial, [number, number]>;
  /** Zahnvorschub-Richtwert bei halbem Eingriff (ae = d/2): fz = fzFactor · d. */
  fzFactor: number;
  /** Spezifische Schnittkraft kc1.1 in N/mm² (Kienzle). */
  kc11: number;
  /** Kienzle-Anstiegswert mc. */
  mc: number;
  /** Werkzeugmaterialien, die für diesen Werkstoff praktisch ungeeignet sind. */
  unsuitable?: ToolMaterial[];
  note: string;
}

export const MATERIALS: CuttingMaterial[] = [
  {
    id: 'alu-knet',
    label: 'Aluminium Knetlegierung (6061, 7075, AlMg)',
    group: 'N',
    vc: { hss: [60, 120], vhm: [200, 400], 'vhm-tialn': [300, 600], wsp: [300, 1000] },
    fzFactor: 0.018,
    kc11: 700,
    mc: 0.23,
    note: 'Scharfe, polierte Schneiden mit großem Spanraum (2 Schneiden) verwenden. Aufbauschneiden vermeiden: lieber schneller als langsamer, Kühlung oder Sprühnebel hilft der Spanabfuhr.',
  },
  {
    id: 'alu-guss',
    label: 'Aluminium-Guss (AlSi, siliziumhaltig)',
    group: 'N',
    vc: { hss: [50, 90], vhm: [150, 300], 'vhm-tialn': [200, 400], wsp: [250, 600] },
    fzFactor: 0.015,
    kc11: 800,
    mc: 0.25,
    note: 'Höherer Siliziumanteil wirkt abrasiv und senkt die Standzeit deutlich – ab ca. 12 % Si Diamantbeschichtung erwägen.',
  },
  {
    id: 'baustahl',
    label: 'Baustahl S235 / S355 (St37, St52)',
    group: 'P',
    vc: { hss: [20, 35], vhm: [80, 140], 'vhm-tialn': [120, 200], wsp: [150, 300] },
    fzFactor: 0.01,
    kc11: 1780,
    mc: 0.17,
    note: 'Gut zerspanbar, neigt aber zu langen Fließspänen. Ausreichend Vorschub fahren, damit die Schneide schneidet statt zu reiben.',
  },
  {
    id: 'c45',
    label: 'Vergütungsstahl C45 (1.0503)',
    group: 'P',
    vc: { hss: [18, 30], vhm: [70, 120], 'vhm-tialn': [100, 180], wsp: [130, 250] },
    fzFactor: 0.009,
    kc11: 2000,
    mc: 0.18,
    note: 'Im vergüteten Zustand deutlich zäher als Baustahl – Schnittgeschwindigkeit eher am unteren Rand beginnen.',
  },
  {
    id: '42crmo4',
    label: 'Legierter Stahl 42CrMo4 (1.7225)',
    group: 'P',
    vc: { hss: [15, 25], vhm: [60, 110], 'vhm-tialn': [90, 160], wsp: [110, 220] },
    fzFactor: 0.008,
    kc11: 2100,
    mc: 0.18,
    note: 'Hohe Festigkeit und Wärmeentwicklung. Beschichtetes VHM und stabile Spannung sind hier fast Pflicht.',
  },
  {
    id: 'stahl-gehaertet',
    label: 'Werkzeugstahl gehärtet (48–56 HRC)',
    group: 'P',
    vc: { hss: [5, 10], vhm: [30, 60], 'vhm-tialn': [50, 120], wsp: [60, 150] },
    fzFactor: 0.005,
    kc11: 2800,
    mc: 0.2,
    unsuitable: ['hss'],
    note: 'Nur mit beschichtetem VHM oder Hartmetall bearbeiten. Kleine Zustellungen, hohe Drehzahl, möglichst ohne Kühlmittel (Trockenschnitt mit Druckluft).',
  },
  {
    id: 'v2a',
    label: 'Edelstahl 1.4301 / V2A (X5CrNi18-10)',
    group: 'M',
    vc: { hss: [12, 20], vhm: [50, 90], 'vhm-tialn': [80, 140], wsp: [100, 180] },
    fzFactor: 0.008,
    kc11: 2350,
    mc: 0.21,
    note: 'Neigt stark zur Kaltverfestigung: konstant im Schnitt bleiben, nie auf der Stelle reiben und Vorschub nie zu klein wählen.',
  },
  {
    id: 'v4a',
    label: 'Edelstahl 1.4571 / V4A (X6CrNiMoTi17-12-2)',
    group: 'M',
    vc: { hss: [10, 18], vhm: [45, 80], 'vhm-tialn': [70, 120], wsp: [90, 160] },
    fzFactor: 0.007,
    kc11: 2450,
    mc: 0.21,
    note: 'Noch zäher als V2A und schlecht wärmeleitend – reichlich Kühlschmierstoff direkt in die Schnittzone.',
  },
  {
    id: 'gg25',
    label: 'Grauguss GG25 (EN-GJL-250)',
    group: 'K',
    vc: { hss: [20, 35], vhm: [80, 140], 'vhm-tialn': [120, 200], wsp: [150, 300] },
    fzFactor: 0.012,
    kc11: 1160,
    mc: 0.26,
    note: 'Kurzspanend und gut zerspanbar, erzeugt aber abrasiven Graphitstaub. Trocken fräsen und gut absaugen.',
  },
  {
    id: 'ggg40',
    label: 'Sphäroguss GGG40 (EN-GJS-400)',
    group: 'K',
    vc: { hss: [18, 30], vhm: [70, 120], 'vhm-tialn': [100, 180], wsp: [130, 250] },
    fzFactor: 0.011,
    kc11: 1400,
    mc: 0.25,
    note: 'Zäher als Grauguss, dafür weniger abrasiv. Gusshaut ist hart – erster Schnitt tief genug ansetzen.',
  },
  {
    id: 'messing',
    label: 'Messing CuZn39Pb (kurzspanend)',
    group: 'N',
    vc: { hss: [60, 120], vhm: [150, 300], 'vhm-tialn': [200, 400], wsp: [250, 500] },
    fzFactor: 0.015,
    kc11: 780,
    mc: 0.18,
    note: 'Sehr gut zerspanbar. Werkzeuge mit neutralem oder negativem Spanwinkel verhindern das Einhaken beim Bohren und Fräsen.',
  },
  {
    id: 'kupfer',
    label: 'Kupfer (Cu-ETP, weich)',
    group: 'N',
    vc: { hss: [50, 90], vhm: [130, 250], 'vhm-tialn': [150, 300], wsp: [200, 400] },
    fzFactor: 0.014,
    kc11: 1000,
    mc: 0.2,
    note: 'Sehr zäh und schmierend: scharfe, polierte Schneiden, großer Spanwinkel und reichlich Kühlschmierung.',
  },
  {
    id: 'titan',
    label: 'Titan Ti6Al4V (3.7165)',
    group: 'S',
    vc: { hss: [8, 15], vhm: [30, 60], 'vhm-tialn': [40, 80], wsp: [50, 100] },
    fzFactor: 0.006,
    kc11: 1400,
    mc: 0.23,
    note: 'Schlechte Wärmeleitung – die Hitze bleibt in der Schneide. Niedrige vc, ordentlicher Vorschub, viel Kühlmittel und niemals im Schnitt stehen bleiben (Brandgefahr durch Späne).',
  },
  {
    id: 'inconel',
    label: 'Nickelbasis Inconel 718',
    group: 'S',
    vc: { hss: [4, 8], vhm: [15, 35], 'vhm-tialn': [25, 50], wsp: [30, 60] },
    fzFactor: 0.005,
    kc11: 2800,
    mc: 0.25,
    unsuitable: ['hss'],
    note: 'Extrem kaltverfestigend und abrasiv. Nur mit stabiler Maschine, beschichtetem Hartmetall und Hochdruckkühlung wirtschaftlich.',
  },
  {
    id: 'kunststoff',
    label: 'Kunststoff POM / PA / PE / PP',
    group: 'O',
    vc: { hss: [150, 400], vhm: [300, 800], 'vhm-tialn': [300, 800], wsp: [300, 800] },
    fzFactor: 0.025,
    kc11: 250,
    mc: 0.2,
    note: 'Einschneider mit großem Spanraum verwenden. Hauptproblem ist Schmelzen: hoher Vorschub, Druckluft zur Kühlung, Späne sofort abführen.',
  },
  {
    id: 'acryl',
    label: 'Acrylglas PMMA / Polycarbonat',
    group: 'O',
    vc: { hss: [150, 350], vhm: [250, 600], 'vhm-tialn': [250, 600], wsp: [250, 600] },
    fzFactor: 0.02,
    kc11: 300,
    mc: 0.2,
    note: 'Neigt zum Schmelzen und Reißen. Einschneider, gleichmäßiger Vorschub ohne Stopps, Druckluftkühlung – nicht mit Wasser kühlen (Spannungsrisse).',
  },
  {
    id: 'holz',
    label: 'Holz, MDF & Multiplex',
    group: 'O',
    vc: { hss: [200, 600], vhm: [300, 900], 'vhm-tialn': [300, 900], wsp: [300, 900] },
    fzFactor: 0.035,
    kc11: 60,
    mc: 0.25,
    note: 'Hohe Drehzahl, hoher Vorschub. MDF ist durch den Leimanteil abrasiv – VHM hält dort deutlich länger als HSS. Gute Absaugung einplanen.',
  },
  {
    id: 'gfk',
    label: 'GFK / FR4 (Leiterplatte, Epoxid-Glas)',
    group: 'O',
    vc: { hss: [50, 120], vhm: [100, 250], 'vhm-tialn': [150, 350], wsp: [150, 350] },
    fzFactor: 0.01,
    kc11: 600,
    mc: 0.22,
    unsuitable: ['hss'],
    note: 'Glasfasern wirken wie Schmirgel und zerstören HSS in Minuten. Diamantverzahnte oder diamantbeschichtete Fräser verwenden und den Staub unbedingt absaugen (gesundheitsschädlich).',
  },
  {
    id: 'cfk',
    label: 'CFK (kohlenstofffaserverstärkt)',
    group: 'O',
    vc: { hss: [30, 80], vhm: [100, 250], 'vhm-tialn': [150, 350], wsp: [150, 350] },
    fzFactor: 0.008,
    kc11: 800,
    mc: 0.22,
    unsuitable: ['hss'],
    note: 'Nur diamantbeschichtet wirtschaftlich. Delamination vermeiden: Gleichlauf, scharfe Schneiden, Bauteil vollflächig unterstützen. Staub ist leitfähig und gesundheitsschädlich – absaugen.',
  },
];

export const MATERIAL_MAP: Record<string, CuttingMaterial> = Object.fromEntries(
  MATERIALS.map((m) => [m.id, m]),
);

export const getMaterial = (id: string): CuttingMaterial | undefined => MATERIAL_MAP[id];

export const GROUP_LABELS: Record<CuttingMaterial['group'], string> = {
  P: 'Stahl',
  M: 'Edelstahl',
  K: 'Guss',
  N: 'NE-Metall',
  S: 'Superlegierung',
  O: 'Sonstige',
};

/** Obergrenze für den Spanausdünnungs-Ausgleich (Praxiswert, sonst utopische Vorschübe). */
export const MAX_THINNING = 2.5;

export interface CuttingInput {
  material: string;
  toolMaterial: ToolMaterial;
  /** Fräserdurchmesser in mm. */
  d: number;
  /** Zähnezahl. */
  z: number;
  /** Radiale Zustellung (Eingriffsbreite) in mm. */
  ae: number;
  /** Axiale Zustellung (Schnitttiefe) in mm. */
  ap: number;
  /** Wirkungsgrad in Prozent. */
  eta: number;
  /** Spanausdünnung ausgleichen (fz anheben, wenn ae < d/2). */
  chipThinning: boolean;
}

export interface CuttingOutput {
  vc: number;
  vcMin: number;
  vcMax: number;
  n: number;
  fzBase: number;
  fz: number;
  thinningFactor: number;
  hm: number;
  phiDeg: number;
  vf: number;
  q: number;
  kc: number;
  pc: number;
  p: number;
  fc: number;
  warnings: string[];
}

const clamp = (v: number, lo: number, hi: number) => Math.min(Math.max(v, lo), hi);

/** Eingriffswinkel φs in rad aus dem Eingriffsverhältnis ae/d. */
export function engagementAngle(ratio: number): number {
  return Math.acos(clamp(1 - 2 * clamp(ratio, 0, 1), -1, 1));
}

/** Mittlere Spanungsdicke hm – identisch zum Rechner /rechner/mittlere-spanungsdicke. */
export function meanChipThickness(fz: number, ratio: number): number {
  const phi = engagementAngle(ratio);
  return phi > 0 ? (fz * 2 * clamp(ratio, 0, 1)) / phi : 0;
}

export function computeCuttingData(input: CuttingInput): CuttingOutput {
  const mat = getMaterial(input.material) ?? MATERIALS[0];
  const d = Math.max(input.d, 0.01);
  const z = Math.max(1, Math.round(input.z));
  const ap = Math.max(input.ap, 0);
  const ae = clamp(input.ae, 0, d);
  const eta = clamp(input.eta, 1, 100) / 100;
  const warnings: string[] = [];

  const [vcMin, vcMax] = mat.vc[input.toolMaterial];
  const vc = (vcMin + vcMax) / 2;
  const n = (vc * 1000) / (Math.PI * d);

  const ratio = ae / d;
  const fzBase = mat.fzFactor * d;
  // Referenz ist der halbe Eingriff (ae = d/2) – dort gilt hm = 2/π · fz.
  const hmTarget = (2 / Math.PI) * fzBase;
  const phi = engagementAngle(ratio);
  let thinningFactor = 1;
  if (input.chipThinning && ratio > 0 && phi > 0) {
    thinningFactor = clamp((hmTarget * phi) / (2 * ratio) / fzBase, 0.5, MAX_THINNING);
  }
  const fz = fzBase * thinningFactor;

  const hm = meanChipThickness(fz, ratio);
  const vf = fz * z * n;
  const q = (ae * ap * vf) / 1000;
  const kc = mat.kc11 / Math.pow(Math.max(hm, 0.001), mat.mc);
  const pc = (q * kc) / 60000;
  const p = eta > 0 ? pc / eta : 0;
  // Schnittkraft aus dem Spanquerschnitt der im Eingriff stehenden Schneide.
  const fc = kc * hm * ap;

  if (mat.unsuitable?.includes(input.toolMaterial)) {
    warnings.push(
      `${TOOL_MATERIALS.find((t) => t.id === input.toolMaterial)?.short} ist für ${mat.label} praktisch ungeeignet – die Werte dienen nur als Vergleich.`,
    );
  }
  if (ap > 2 * d) {
    warnings.push('Die Schnitttiefe übersteigt das Doppelte des Fräserdurchmessers – Werkzeugbruch- und Rattergefahr.');
  }
  if (input.chipThinning && thinningFactor >= MAX_THINNING - 1e-9) {
    warnings.push(`Der Spanausdünnungs-Ausgleich ist auf ${MAX_THINNING.toLocaleString('de-DE')}× begrenzt – bei so kleiner Zustellung besser die Drehzahl prüfen.`);
  }
  if (n > 24000) {
    warnings.push('Die nötige Drehzahl liegt über 24.000 min⁻¹ – prüfe, ob deine Spindel das schafft, sonst vc entsprechend senken.');
  }

  return {
    vc,
    vcMin,
    vcMax,
    n,
    fzBase,
    fz,
    thinningFactor,
    hm,
    phiDeg: (phi * 180) / Math.PI,
    vf,
    q,
    kc,
    pc,
    p,
    fc,
    warnings,
  };
}
