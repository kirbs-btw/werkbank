import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-schnittzeit',
  category: 'laser',
  title: 'Laser-Schnittzeit Rechner',
  shortTitle: 'Schnittzeit',
  description:
    'Berechne die Schnittzeit beim Laserschneiden aus Schnittlänge und Vorschubgeschwindigkeit, inklusive prozentualem Aufschlag für Leerwege und Stiche.',
  keywords: [
    'laser schnittzeit berechnen',
    'schnittzeit laserschneiden rechner',
    'laser bearbeitungszeit',
    'schnittlänge geschwindigkeit zeit',
    'laser fertigungszeit',
    'wie lange dauert laserschnitt',
  ],
  formula:
    'reine Schnittzeit = Schnittlänge / Geschwindigkeit;  Gesamtzeit = reine Schnittzeit × (1 + Aufschlag/100)',
  inputs: [
    { type: 'number', id: 'laenge', label: 'Gesamte Schnittlänge', unit: 'mm', default: 2000, min: 0, step: 10, help: 'Summe aller Konturlängen, im CAD/CAM als Pfadlänge ablesbar.' },
    { type: 'number', id: 'speed', label: 'Schnittgeschwindigkeit', unit: 'mm/min', default: 1200, min: 1, step: 10, help: 'Vorschub des Schneidkopfs für Material und Dicke.' },
    { type: 'number', id: 'aufschlag', label: 'Aufschlag Leerwege/Stiche', unit: '%', default: 15, min: 0, max: 100, step: 1, help: 'Positionierfahrten und Einstiche verlängern die reine Schnittzeit, typisch 10-25 %.' },
  ],
  compute: (v) => {
    const laenge = num(v.laenge);
    const speed = num(v.speed, 1);
    const aufschlag = num(v.aufschlag);
    const schnittMin = speed > 0 ? laenge / speed : 0;
    const gesamtMin = schnittMin * (1 + aufschlag / 100);
    const gesamtSek = gesamtMin * 60;
    return [
      { label: 'Gesamtzeit', value: gesamtMin, unit: 'min', digits: 2, primary: true, help: 'inkl. Aufschlag für Leerwege und Stiche' },
      { label: 'Gesamtzeit in Sekunden', value: gesamtSek, unit: 's', digits: 0 },
      { label: 'Reine Schnittzeit', value: schnittMin, unit: 'min', digits: 2 },
    ];
  },
  intro:
    'Die Schnittzeit ergibt sich direkt aus der gesamten Schnittlänge geteilt durch die Schnittgeschwindigkeit. Hinzu kommen Leerwege zwischen den Konturen und das Einstechen, die als prozentualer Aufschlag berücksichtigt werden. Maker brauchen diesen Wert, um Maschinenzeit zu kalkulieren, Aufträge zu takten und Angebotspreise sauber zu begründen.',
  howto: [
    'Gesamte Schnittlänge eintragen (Summe aller Konturen, im CAM oft als Pfadlänge angezeigt).',
    'Schnittgeschwindigkeit in mm/min für Material und Dicke eintragen.',
    'Aufschlag für Leerwege und Einstiche schätzen (ohne Erfahrungswert ca. 15 %).',
    'Gesamtzeit in Minuten bzw. Sekunden ablesen und in die Auftragskalkulation übernehmen.',
  ],
  faq: [
    { q: 'Warum reicht Länge geteilt durch Geschwindigkeit nicht aus?', a: 'Der reine Quotient erfasst nur die Zeit, in der der Strahl tatsächlich schneidet. Positionierfahrten zwischen Konturen, Einstiche und Beschleunigungsphasen kommen hinzu, deshalb der prozentuale Aufschlag.' },
    { q: 'Wo finde ich die Schnittlänge meiner Datei?', a: 'Die meisten CAM- und Laser-Programme (LightBurn, RDWorks, Lasercut) zeigen die Gesamtpfadlänge an. Alternativ liefert das CAD die Summe der Konturlängen.' },
    { q: 'Welche Schnittgeschwindigkeit soll ich ansetzen?', a: 'Sie hängt stark von Lasertyp, Leistung, Material und Dicke ab. Nutze die in deinen Schneidtabellen hinterlegten Werte oder unseren Material-Einstellungsrechner als Ausgangspunkt.' },
    { q: 'Wie groß ist der Leerwege-Aufschlag realistisch?', a: 'Bei wenigen großen Teilen reichen 5-10 %, bei vielen kleinen Konturen mit häufigem Umpositionieren sind 20-30 % realistisch. Miss bei wichtigen Aufträgen einmal die tatsächliche Maschinenzeit nach.' },
  ],
  related: ['laser-schnittkosten', 'laser-durchsatz', 'kerf-kompensation'],
  updated: '2026-06-16',
  examples: [
    { values: { laenge: 2000, speed: 1200, aufschlag: 0 }, expect: [{ label: 'Gesamtzeit', value: 1.6667, tolerance: 0.01 }] },
    { values: { laenge: 6000, speed: 1500, aufschlag: 20 }, expect: [{ label: 'Gesamtzeit', value: 4.8, tolerance: 0.01 }] },
  ],
};
