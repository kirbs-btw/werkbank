import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-raster-vs-vektor',
  category: 'laser',
  title: 'Laser: Raster- vs. Vektorgravur Zeitvergleich',
  shortTitle: 'Raster vs. Vektor',
  description:
    'Vergleiche, ob ein Motiv als Flächen-Rastergravur oder als Linien-Vektorgravur schneller ist, und sieh den Zeitunterschied direkt in Minuten.',
  keywords: [
    'raster vs vektor laser',
    'lasergravur zeit vergleich',
    'vektorgravur rastergravur dauer',
    'füllung kontur laser zeit',
    'wann raster wann vektor laser',
    'gravur methode vergleich',
  ],
  formula:
    'Raster-Zeit = (Fläche / Linienabstand) / Speed_Raster;  Vektor-Zeit = Linienlänge / Speed_Vektor; Vergleich beider',
  inputs: [
    { type: 'number', id: 'breite', label: 'Motivbreite', unit: 'mm', default: 80, min: 0, step: 1, help: 'Breite des Gravurbereichs (für die Rasterfläche).' },
    { type: 'number', id: 'hoehe', label: 'Motivhöhe', unit: 'mm', default: 50, min: 0, step: 1, help: 'Höhe des Gravurbereichs (bestimmt die Zeilenzahl beim Raster).' },
    { type: 'number', id: 'linienlaenge', label: 'Gesamte Linienlänge', unit: 'mm', default: 1200, min: 0, step: 10, help: 'Summe aller Konturlinien des Motivs für die Vektorgravur.' },
    { type: 'number', id: 'abstand', label: 'Raster-Linienabstand', unit: 'mm', default: 0.1, min: 0.01, step: 0.01, help: '0,1 mm ≈ 254 DPI; bestimmt die Zeilenzahl der Flächengravur.' },
    { type: 'number', id: 'speedRaster', label: 'Geschwindigkeit Raster', unit: 'mm/s', default: 300, min: 1, step: 10, help: 'Scangeschwindigkeit der Flächengravur.' },
    { type: 'number', id: 'speedVektor', label: 'Geschwindigkeit Vektor', unit: 'mm/s', default: 40, min: 1, step: 1, help: 'Liniengeschwindigkeit der Vektorgravur (meist deutlich langsamer).' },
  ],
  compute: (v) => {
    const b = num(v.breite);
    const h = num(v.hoehe);
    const ll = num(v.linienlaenge);
    const abstand = num(v.abstand, 0.1);
    const sr = num(v.speedRaster, 1);
    const sv = num(v.speedVektor, 1);
    const zeilen = abstand > 0 ? h / abstand : 0;
    const rasterWeg = zeilen * b;
    const rasterMin = sr > 0 ? rasterWeg / sr / 60 : 0;
    const vektorMin = sv > 0 ? ll / sv / 60 : 0;
    const schneller = rasterMin <= vektorMin ? 'Rastergravur' : 'Vektorgravur';
    const diff = Math.abs(rasterMin - vektorMin);
    return [
      { label: 'Schnellere Methode', value: schneller, primary: true, help: 'Welche Gravurart bei diesen Werten weniger Zeit braucht' },
      { label: 'Rastergravur-Zeit', value: rasterMin, unit: 'min', digits: 2 },
      { label: 'Vektorgravur-Zeit', value: vektorMin, unit: 'min', digits: 2 },
      { label: 'Zeitunterschied', value: diff, unit: 'min', digits: 2 },
    ];
  },
  intro:
    'Ein Motiv lässt sich oft auf zwei Arten gravieren: als flächige Rastergravur, bei der der Kopf das Bild Zeile für Zeile abrastert, oder als Vektorgravur, bei der nur die Konturlinien nachgefahren werden. Welche schneller ist, hängt vom Verhältnis aus gefüllter Fläche, Linienabstand und der Linienlänge des Motivs ab. Große Vollflächen sprechen für die Vektorvariante nur, wenn sie aus wenigen langen Linien bestehen; viele feine Linien oder Schraffuren können dagegen als Raster effizienter sein. Dieser Rechner stellt beide Zeiten gegenüber und nennt die schnellere Methode.',
  howto: [
    'Breite und Höhe des Gravurbereichs für die Rasterfläche eintragen.',
    'Gesamte Linienlänge aller Konturen des Motivs für die Vektorvariante angeben (aus der Software auslesbar).',
    'Raster-Linienabstand sowie beide Geschwindigkeiten (Raster und Vektor) eintragen.',
    'Schnellere Methode und Zeitunterschied ablesen und die passende Gravurart wählen.',
  ],
  faq: [
    { q: 'Wann ist Vektorgravur sinnvoller?', a: 'Bei reinen Strichzeichnungen, Schriften aus dünnen Linien oder Umrissen. Hier muss der Strahl nur die Konturen abfahren statt die ganze Fläche zu füllen, was bei wenig Linieninhalt deutlich schneller ist.' },
    { q: 'Wann lohnt sich Rastergravur?', a: 'Bei gefüllten Flächen, Fotos, Verläufen und großen geschlossenen Bereichen. Eine Flächenfüllung als Vektor zu schraffieren würde extrem viele Linien erzeugen und dauert dann meist länger als eine saubere Rastergravur.' },
    { q: 'Warum ist die Vektorgeschwindigkeit oft niedriger?', a: 'Vektor- bzw. Liniengravur arbeitet häufig tiefer und mit weniger Leistung pro Durchgang, deshalb fährt der Kopf langsamer. Beim Raster wird in einem Überlauf nur leicht angekratzt, dafür sehr schnell gescannt.' },
    { q: 'Berücksichtigt der Rechner Leerwege und Beschleunigung?', a: 'Nein, er rechnet die reine Bearbeitungszeit. Beschleunigung, Umkehrwege und Sprünge zwischen Linien können beide Werte erhöhen. Für eine genauere Rasterschätzung mit Umkehraufschlag nutze den Gravurzeit-Rechner.' },
  ],
  related: ['laser-gravur-zeit', 'laser-schnittzeit', 'laser-dpi-aufloesung'],
  updated: '2026-06-16',
  examples: [
    { values: { breite: 80, hoehe: 50, linienlaenge: 1200, abstand: 0.1, speedRaster: 300, speedVektor: 40 }, expect: [{ label: 'Rastergravur-Zeit', value: 2.2222, tolerance: 0.01 }] },
    { values: { breite: 80, hoehe: 50, linienlaenge: 1200, abstand: 0.1, speedRaster: 300, speedVektor: 40 }, expect: [{ label: 'Vektorgravur-Zeit', value: 0.5, tolerance: 0.01 }] },
  ],
};
