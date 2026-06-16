import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-teile-pro-platte',
  category: 'laser',
  title: 'Laser: Teile pro Platte Rechner (Schachtelung)',
  shortTitle: 'Teile pro Platte',
  description:
    'Berechne, wie viele rechteckige Teile mit Steg und Randabstand auf eine Laserplatte passen – Gitter-Schachtelung inklusive Materialausnutzung.',
  keywords: [
    'teile pro platte laser',
    'schachtelung nesting rechner',
    'wie viele teile auf platte',
    'materialausnutzung laser',
    'verschnitt laser berechnen',
    'plattenbelegung zuschnitt',
    'nesting laserschneiden',
  ],
  formula:
    'pro Reihe = ⌊(Platte − 2·Rand + Steg) / (Teil + Steg)⌋ je Achse;  Teile = Reihen × Spalten (auch um 90° gedreht)',
  inputs: [
    { type: 'number', id: 'platteB', label: 'Plattenbreite', unit: 'mm', default: 600, min: 1, step: 1, help: 'Nutzbare Breite der Materialplatte.' },
    { type: 'number', id: 'platteH', label: 'Plattenhöhe', unit: 'mm', default: 400, min: 1, step: 1, help: 'Nutzbare Höhe der Materialplatte.' },
    { type: 'number', id: 'teilB', label: 'Teilbreite', unit: 'mm', default: 80, min: 0.1, step: 1, help: 'Breite eines Bauteils (Bounding-Box).' },
    { type: 'number', id: 'teilH', label: 'Teilhöhe', unit: 'mm', default: 50, min: 0.1, step: 1, help: 'Höhe eines Bauteils (Bounding-Box).' },
    { type: 'number', id: 'steg', label: 'Steg zwischen Teilen', unit: 'mm', default: 3, min: 0, step: 0.5, help: 'Mindestabstand zwischen zwei Teilen.' },
    { type: 'number', id: 'rand', label: 'Randabstand', unit: 'mm', default: 5, min: 0, step: 1, help: 'Freibleibender Rand rundum.' },
  ],
  compute: (v) => {
    const pb = num(v.platteB);
    const ph = num(v.platteH);
    const tb = num(v.teilB, 1);
    const th = num(v.teilH, 1);
    const steg = num(v.steg);
    const rand = num(v.rand);
    const nutzB = pb - 2 * rand;
    const nutzH = ph - 2 * rand;
    const fit = (raum: number, teil: number) => {
      const teilung = teil + steg;
      return teilung > 0 ? Math.max(0, Math.floor((raum + steg) / teilung)) : 0;
    };
    // Orientierung A: Teil wie angegeben
    const a = fit(nutzB, tb) * fit(nutzH, th);
    // Orientierung B: Teil um 90° gedreht
    const b = fit(nutzB, th) * fit(nutzH, tb);
    const anzahl = Math.max(a, b);
    const teilFlaeche = tb * th * anzahl;
    const platteFlaeche = pb * ph;
    const ausnutzung = platteFlaeche > 0 ? (teilFlaeche / platteFlaeche) * 100 : 0;
    return [
      { label: 'Teile pro Platte', value: anzahl, unit: 'Stück', digits: 0, primary: true, help: 'beste der beiden Orientierungen' },
      { label: 'Teile (gedreht)', value: b, unit: 'Stück', digits: 0, help: 'Variante mit um 90° gedrehten Teilen' },
      { label: 'Materialausnutzung', value: ausnutzung, unit: '%', digits: 1 },
      { label: 'Verschnitt', value: 100 - ausnutzung, unit: '%', digits: 1 },
    ];
  },
  intro:
    'Wer Serienteile lasert, will eine Platte möglichst gut ausnutzen. Dieser Rechner schachtelt rechteckige Teile in einem einfachen Gittermuster auf die Platte und berücksichtigt dabei einen Steg zwischen den Teilen sowie einen umlaufenden Randabstand. Er prüft beide Orientierungen – Teil normal und um 90° gedreht – und gibt die bessere Belegung aus. So siehst du schnell, wie viele Teile auf eine Platte passen und wie hoch die Materialausnutzung beziehungsweise der Verschnitt ist. Für unregelmäßige Konturen liefern echte Nesting-Programme noch dichtere Ergebnisse.',
  howto: [
    'Nutzbare Plattenbreite und -höhe in mm eintragen.',
    'Breite und Höhe der Teile-Bounding-Box angeben.',
    'Steg zwischen den Teilen und umlaufenden Randabstand festlegen.',
    'Teilezahl und Materialausnutzung ablesen; bei Bedarf Teilgröße drehen oder Steg verkleinern.',
  ],
  faq: [
    { q: 'Warum berücksichtigt der Rechner einen Steg?', a: 'Zwischen zwei Teilen muss genug Material stehen bleiben, damit die Wärme abgeführt wird und die Teile nicht zusammenwachsen oder kippen. Üblich sind je nach Material 2-5 mm; bei der Schnittfuge (Kerf) genügt manchmal weniger.' },
    { q: 'Ist diese Schachtelung optimal?', a: 'Es ist eine reine Gitter-Schachtelung in einer Orientierung. Für rechteckige Teile ist sie nahezu optimal. Bei komplexen oder ineinander verschachtelbaren Konturen erreichen spezielle Nesting-Tools eine deutlich höhere Ausnutzung.' },
    { q: 'Wie ist die Materialausnutzung definiert?', a: 'Sie ist die Summe der Teil-Bounding-Box-Flächen geteilt durch die gesamte Plattenfläche. Hat ein Teil viel Leerraum innerhalb seines Rechtecks, ist die reale Ausnutzung des Werkstoffs entsprechend höher.' },
    { q: 'Sollte ich Rand und Steg knapp halten?', a: 'Ein kleinerer Steg erhöht die Teilezahl, aber zu wenig Abstand erhöht das Risiko von Brandstellen und Verzug. Der Randabstand sorgt dafür, dass nicht zu nah an den oft welligen oder eingespannten Plattenkanten geschnitten wird.' },
  ],
  related: ['laser-durchsatz', 'kerf-kompensation', 'laser-schnittkosten'],
  updated: '2026-06-16',
  examples: [
    { values: { platteB: 600, platteH: 400, teilB: 80, teilH: 50, steg: 3, rand: 5 }, expect: [{ label: 'Teile pro Platte', value: 49, tolerance: 0 }] },
    { values: { platteB: 600, platteH: 400, teilB: 100, teilH: 100, steg: 0, rand: 0 }, expect: [{ label: 'Teile pro Platte', value: 24, tolerance: 0 }] },
  ],
};
