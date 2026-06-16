import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-gravurtiefe-durchgaenge',
  category: 'laser',
  title: 'Laser-Gravurtiefe & Durchgänge Rechner',
  shortTitle: 'Gravurtiefe',
  description:
    'Berechne aus der Abtragstiefe pro Durchgang die nötige Anzahl Durchgänge für eine Zieltiefe sowie die erreichte Tiefe und die Bearbeitungszeit.',
  keywords: [
    'gravurtiefe laser berechnen',
    'abtrag pro durchgang laser',
    'tiefengravur durchgänge',
    'wie viele durchgänge laser',
    'lasergravur tiefe einstellen',
    'mehrfachdurchgang tiefe',
    'tiefe pro pass laser',
  ],
  formula:
    'Durchgänge = ⌈Zieltiefe / Tiefe_pro_Durchgang⌉;  erreichte Tiefe = Durchgänge × Tiefe_pro_Durchgang',
  inputs: [
    { type: 'number', id: 'zieltiefe', label: 'Zieltiefe', unit: 'mm', default: 1.5, min: 0.01, step: 0.1, help: 'Gewünschte Gravur- bzw. Frästiefe.' },
    { type: 'number', id: 'proDurchgang', label: 'Abtrag pro Durchgang', unit: 'mm', default: 0.3, min: 0.001, step: 0.01, help: 'Erfahrungswert aus einem Testlauf bei den gewählten Parametern.' },
    { type: 'number', id: 'zeitProDurchgang', label: 'Zeit pro Durchgang', unit: 's', default: 45, min: 0, step: 1, help: 'Dauer eines kompletten Durchgangs der Kontur/Fläche.' },
  ],
  compute: (v) => {
    const ziel = num(v.zieltiefe);
    const pro = num(v.proDurchgang, 0.001);
    const zeit = num(v.zeitProDurchgang);
    const durchgaenge = pro > 0 ? Math.ceil(ziel / pro) : 0;
    const erreicht = durchgaenge * pro;
    const ueberschuss = erreicht - ziel;
    const gesamtZeitMin = (durchgaenge * zeit) / 60;
    return [
      { label: 'Benötigte Durchgänge', value: durchgaenge, unit: 'Durchgänge', digits: 0, primary: true, help: 'aufgerundet, damit die Zieltiefe sicher erreicht wird' },
      { label: 'Tatsächlich erreichte Tiefe', value: erreicht, unit: 'mm', digits: 3 },
      { label: 'Tiefenüberschuss', value: ueberschuss, unit: 'mm', digits: 3, help: 'wie viel tiefer als das Ziel durch Aufrunden' },
      { label: 'Gesamtzeit', value: gesamtZeitMin, unit: 'min', digits: 2 },
    ];
  },
  intro:
    'Tiefe Gravuren – etwa für Stempel, Reliefs oder fühlbare Beschriftungen – entstehen meist nicht in einem Durchgang, sondern indem der Laser dieselbe Fläche mehrfach abfährt und Schicht für Schicht Material abträgt. Wie viel pro Durchgang abgetragen wird, hängt von Material, Leistung und Geschwindigkeit ab und lässt sich am besten mit einem kurzen Testlauf bestimmen. Dieser Rechner sagt dir, wie viele Durchgänge für eine Zieltiefe nötig sind, welche Tiefe dabei tatsächlich erreicht wird und wie lange die gesamte Bearbeitung dauert. So planst du Tiefengravuren zuverlässig statt durch Probieren.',
  howto: [
    'Gewünschte Zieltiefe in mm eintragen.',
    'Abtrag pro Durchgang aus einem Testlauf bei deinen Parametern angeben.',
    'Zeit für einen kompletten Durchgang in Sekunden eintragen (z. B. aus dem Schnitt-/Gravurzeit-Rechner).',
    'Anzahl Durchgänge und Gesamtzeit ablesen und im Job hinterlegen.',
  ],
  faq: [
    { q: 'Ist der Abtrag pro Durchgang konstant?', a: 'Nur näherungsweise. Mit zunehmender Tiefe wird der Fokus unscharf und der Abtrag sinkt oft etwas, weil der Strahl die Tiefe nicht mehr ideal trifft. Bei tiefen Gravuren hilft es, den Fokus zwischendurch nachzuführen.' },
    { q: 'Warum aufrunden?', a: 'Mit der ganzzahligen Zahl an Durchgängen wird die Zieltiefe sicher erreicht oder leicht überschritten. Der angezeigte Tiefenüberschuss sagt dir, wie viel tiefer es durch das Aufrunden wird – bei knappen Materialien ist das wichtig.' },
    { q: 'Wie ermittle ich den Abtrag pro Durchgang?', a: 'Mache einen Testlauf mit z. B. drei Durchgängen, miss die Tiefe und teile durch die Anzahl. Diesen Wert trägst du hier ein. Er gilt nur für die getesteten Parameter – ändert sich Leistung oder Speed, ändert sich auch der Abtrag.' },
    { q: 'Sind viele flache Durchgänge besser als wenige tiefe?', a: 'Oft ja. Mehrere Durchgänge mit moderater Leistung erzeugen sauberere Wände und weniger Verkohlung als ein langsamer Durchgang mit voller Leistung, der das Material verbrennt. Das kostet aber mehr Zeit.' },
  ],
  related: ['laser-streckenenergie', 'laser-einstellung-material', 'laser-gravur-zeit'],
  updated: '2026-06-16',
  examples: [
    { values: { zieltiefe: 1.5, proDurchgang: 0.3, zeitProDurchgang: 45 }, expect: [{ label: 'Benötigte Durchgänge', value: 5, tolerance: 0 }] },
    { values: { zieltiefe: 1.5, proDurchgang: 0.3, zeitProDurchgang: 45 }, expect: [{ label: 'Gesamtzeit', value: 3.75, tolerance: 0.01 }] },
  ],
};
