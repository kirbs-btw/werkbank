import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'laser-schnittspalt-konizitaet',
  category: 'laser',
  title: 'Laser-Schnittkonizität Rechner (Taper)',
  shortTitle: 'Konizität',
  description:
    'Berechne die Konizität (Taper) der Laserschnittkante aus oberer und unterer Fugenbreite und Materialdicke – als Flankenwinkel und mittlere Kerf.',
  keywords: [
    'laser konizität berechnen',
    'taper laserschnitt',
    'schnittflanke winkel laser',
    'schnittspalt oben unten',
    'kerf konizität rechner',
    'schräge schnittkante laser',
    'flankenwinkel laserschneiden',
  ],
  formula:
    'Taper = (Kerf_oben − Kerf_unten) / 2;  Flankenwinkel = atan(Taper / Dicke);  mittlere Kerf = (oben + unten) / 2',
  inputs: [
    { type: 'number', id: 'oben', label: 'Fugenbreite oben', unit: 'mm', default: 0.25, min: 0, step: 0.01, help: 'Breite des Schnittspalts an der Strahleintrittsseite.' },
    { type: 'number', id: 'unten', label: 'Fugenbreite unten', unit: 'mm', default: 0.15, min: 0, step: 0.01, help: 'Breite des Schnittspalts an der Austrittsseite.' },
    { type: 'number', id: 'dicke', label: 'Materialdicke', unit: 'mm', default: 6, min: 0.1, step: 0.1, help: 'Stärke des geschnittenen Werkstücks.' },
  ],
  compute: (v) => {
    const oben = num(v.oben);
    const unten = num(v.unten);
    const dicke = num(v.dicke, 1);
    const diff = oben - unten;
    const taperProSeite = diff / 2; // mm pro Seite
    const winkelRad = dicke > 0 ? Math.atan(Math.abs(taperProSeite) / dicke) : 0;
    const winkelGrad = (winkelRad * 180) / Math.PI;
    const mittlereKerf = (oben + unten) / 2;
    const taperProzent = dicke > 0 ? (Math.abs(diff) / dicke) * 100 : 0;
    return [
      { label: 'Flankenwinkel pro Seite', value: winkelGrad, unit: '°', digits: 2, primary: true, help: 'Abweichung der Schnittkante von der Senkrechten' },
      { label: 'Konizität (Taper) gesamt', value: Math.abs(diff), unit: 'mm', digits: 3, help: 'Differenz oben minus unten' },
      { label: 'Mittlere Fugenbreite (Kerf)', value: mittlereKerf, unit: 'mm', digits: 3 },
      { label: 'Taper bezogen auf Dicke', value: taperProzent, unit: '%', digits: 1 },
    ];
  },
  intro:
    'Ein Laserschnitt ist nie perfekt senkrecht: Der fokussierte Strahl ist oben oft breiter als unten (oder umgekehrt), wodurch die Schnittkante leicht schräg verläuft. Diese Konizität, im Englischen Taper genannt, beschreibt man über die Differenz von oberer und unterer Fugenbreite und den daraus resultierenden Flankenwinkel. Eine geringe Konizität bedeutet saubere, nahezu rechtwinklige Kanten – wichtig für Passungen, gestapelte Teile und sichtbare Kanten. Der Rechner ermittelt aus den gemessenen Fugenbreiten den Flankenwinkel, die mittlere Kerf und den Taper bezogen auf die Materialdicke.',
  howto: [
    'Fugenbreite an der Oberseite des Schnitts messen und eintragen.',
    'Fugenbreite an der Unterseite messen und eintragen.',
    'Materialdicke in mm angeben.',
    'Flankenwinkel und Taper ablesen; bei zu großer Konizität Fokuslage, Geschwindigkeit oder Gasdruck anpassen.',
  ],
  faq: [
    { q: 'Was verursacht die Konizität beim Laserschneiden?', a: 'Vor allem die Fokuslage und die Strahlgeometrie. Liegt der Fokus auf der Oberfläche, ist die Fuge unten breiter oder enger; auch zu hohe Geschwindigkeit, falscher Gasdruck und große Materialdicke verstärken die Schräge.' },
    { q: 'Wie reduziere ich den Taper?', a: 'Den Fokus etwas ins Material legen (oft ein Drittel der Dicke), Geschwindigkeit und Leistung aufeinander abstimmen und den Air-Assist-Druck optimieren. Bei dicken Teilen hilft eine längere Brennweite mit größerer Schärfentiefe.' },
    { q: 'Welche Konizität ist akzeptabel?', a: 'Für viele Anwendungen sind Flankenwinkel unter etwa 1° unkritisch. Bei Passungen, Steckverbindungen oder gestapelten Lagen sollte man die mittlere Kerf kennen und die Schräge so klein wie möglich halten.' },
    { q: 'Ist die Fuge immer oben breiter?', a: 'Nicht zwingend. Bei Oberflächenfokus ist sie meist oben breiter, bei tief gelegtem Fokus kann sie unten breiter werden. Der Rechner nimmt den Betrag der Differenz, sodass beide Fälle abgedeckt sind.' },
  ],
  related: ['kerf-kompensation', 'laser-fokuslage', 'laser-spotgroesse'],
  updated: '2026-06-16',
  examples: [
    { values: { oben: 0.25, unten: 0.15, dicke: 6 }, expect: [{ label: 'Mittlere Fugenbreite (Kerf)', value: 0.2, tolerance: 0.001 }] },
    { values: { oben: 0.25, unten: 0.15, dicke: 6 }, expect: [{ label: 'Flankenwinkel pro Seite', value: 0.4775, tolerance: 0.01 }] },
  ],
};
