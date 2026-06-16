import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-abluft-volumenstrom',
  category: 'laser',
  title: 'Laser-Abluft Volumenstrom Rechner (Absaugung)',
  shortTitle: 'Abluft',
  description:
    'Dimensioniere die Absaugung deines Lasers: nötiger Volumenstrom aus Gehäusevolumen und Luftwechselrate sowie Strömungsgeschwindigkeit im Abluftrohr.',
  keywords: [
    'laser absaugung berechnen',
    'abluft volumenstrom laser',
    'luftwechsel laser gehäuse',
    'lüfter dimensionieren laser',
    'm3/h absaugung laser',
    'rohrdurchmesser luftgeschwindigkeit',
    'laser rauch absaugen',
  ],
  formula:
    'Volumen = B·H·T;  Volumenstrom = Volumen × Luftwechsel/h;  Rohrgeschwindigkeit = Volumenstrom / Rohrquerschnitt',
  inputs: [
    { type: 'number', id: 'breite', label: 'Gehäusebreite', unit: 'cm', default: 100, min: 1, step: 1, help: 'Innenbreite des Laser-/Absaugraums.' },
    { type: 'number', id: 'hoehe', label: 'Gehäusehöhe', unit: 'cm', default: 30, min: 1, step: 1, help: 'Innenhöhe.' },
    { type: 'number', id: 'tiefe', label: 'Gehäusetiefe', unit: 'cm', default: 60, min: 1, step: 1, help: 'Innentiefe.' },
    { type: 'number', id: 'luftwechsel', label: 'Luftwechselrate', unit: '1/min', default: 1, min: 0.1, step: 0.1, help: 'Wie oft das Gehäusevolumen pro Minute getauscht wird (Laser oft 0,5-2/min).' },
    { type: 'number', id: 'rohr', label: 'Rohrdurchmesser', unit: 'mm', default: 100, min: 10, step: 5, help: 'Innendurchmesser des Abluftschlauchs/Rohrs.' },
  ],
  compute: (v) => {
    const bCm = num(v.breite);
    const hCm = num(v.hoehe);
    const tCm = num(v.tiefe);
    const lw = num(v.luftwechsel);
    const rohrMm = num(v.rohr, 100);
    const volM3 = (bCm / 100) * (hCm / 100) * (tCm / 100);
    const stromM3min = volM3 * lw;
    const stromM3h = stromM3min * 60;
    const rohrRm = rohrMm / 1000 / 2;
    const rohrFlaeche = Math.PI * rohrRm * rohrRm; // m²
    const geschwindigkeit = rohrFlaeche > 0 ? stromM3min / 60 / rohrFlaeche : 0; // m/s
    return [
      { label: 'Benötigter Volumenstrom', value: stromM3h, unit: 'm³/h', digits: 0, primary: true, help: 'Mindest-Förderleistung des Lüfters' },
      { label: 'Volumenstrom pro Minute', value: stromM3min, unit: 'm³/min', digits: 2 },
      { label: 'Gehäusevolumen', value: volM3, unit: 'm³', digits: 3 },
      { label: 'Strömungsgeschwindigkeit im Rohr', value: geschwindigkeit, unit: 'm/s', digits: 1, help: 'Sollte für Rauch/Staub etwa 8-15 m/s betragen' },
    ];
  },
  intro:
    'Beim Laserschneiden und -gravieren entstehen Rauch, feine Partikel und teils reizende Gase, die zuverlässig abgesaugt werden müssen – sowohl für das Schnittbild als auch für die Gesundheit. Eine ausreichend dimensionierte Absaugung tauscht das Luftvolumen des Gehäuses mehrmals pro Minute aus. Dieser Rechner ermittelt aus den Innenmaßen und der gewünschten Luftwechselrate den nötigen Volumenstrom in m³/h und prüft, ob die Strömungsgeschwindigkeit im Abluftrohr hoch genug ist, damit sich Staub und Partikel nicht absetzen. So findest du den passenden Lüfter und Rohrdurchmesser.',
  howto: [
    'Innenmaße des Lasergehäuses (Breite, Höhe, Tiefe) in cm eintragen.',
    'Gewünschte Luftwechselrate pro Minute wählen (häufig 0,5-2, beim Schneiden eher höher).',
    'Innendurchmesser des Abluftrohrs in mm angeben.',
    'Volumenstrom in m³/h ablesen und einen Lüfter mit Reserve wählen; Rohrgeschwindigkeit auf 8-15 m/s prüfen.',
  ],
  faq: [
    { q: 'Wie viele Luftwechsel braucht ein Laser?', a: 'Das hängt vom Prozess ab. Für reine Gravur reicht oft weniger, beim Schneiden rauchstarker Materialien sollte das Gehäusevolumen ein- bis zweimal pro Minute getauscht werden. Mehr schadet selten, kostet aber Lüfterleistung und Lärm.' },
    { q: 'Warum ist die Strömungsgeschwindigkeit im Rohr wichtig?', a: 'Ist sie zu niedrig, setzen sich Staub und kondensierende Stoffe im Rohr ab und verstopfen es. Als Richtwert für staubhaltige Abluft gelten etwa 8-15 m/s. Ein zu kleines Rohr erhöht zwar die Geschwindigkeit, aber auch den Druckverlust.' },
    { q: 'Reicht ein Umluftfilter statt Abluft nach außen?', a: 'Ein guter Aktivkohle- und Schwebstofffilter kann viele Stoffe binden, muss aber für den Volumenstrom ausgelegt und regelmäßig gewartet werden. Bei stark rauchenden oder gesundheitsschädlichen Materialien ist eine Abluft ins Freie sicherer.' },
    { q: 'Berücksichtigt der Rechner Druckverluste?', a: 'Nein, er liefert den reinen Soll-Volumenstrom. Lange Schläuche, Bögen und Filter erhöhen den Widerstand, sodass die reale Förderleistung sinkt. Plane deshalb beim Lüfter eine Reserve von etwa 30-50 % ein.' },
  ],
  related: ['laser-air-assist', 'laser-einstellung-material', 'laser-schnittkosten'],
  updated: '2026-06-16',
  examples: [
    { values: { breite: 100, hoehe: 30, tiefe: 60, luftwechsel: 1, rohr: 100 }, expect: [{ label: 'Benötigter Volumenstrom', value: 10.8, tolerance: 0.1 }] },
    { values: { breite: 100, hoehe: 30, tiefe: 60, luftwechsel: 1, rohr: 100 }, expect: [{ label: 'Strömungsgeschwindigkeit im Rohr', value: 0.38, tolerance: 0.05 }] },
  ],
};
