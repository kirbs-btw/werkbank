import type { Tool } from '../../lib/types';
import { num } from '../../lib/types';

export const tool: Tool = {
  slug: 'schrauben-terrassendielen',
  category: 'holz',
  title: 'Schrauben für Terrassendielen berechnen',
  shortTitle: 'Terrassen-Schrauben',
  description:
    'Berechne die Anzahl Schrauben für deine Terrasse aus Dielenlänge, Auflagerabstand und Schrauben je Auflager – inklusive Reserve.',
  keywords: [
    'schrauben terrassendielen berechnen',
    'wie viele schrauben terrasse',
    'terrassenschrauben menge',
    'schrauben pro diele',
    'edelstahlschrauben terrasse anzahl',
    'terrasse befestigung schrauben',
    'schrauben pro m2 terrasse',
  ],
  formula:
    'Auflager je Diele = aufrunden(Dielenlänge / Auflagerabstand) + 1 · Schrauben je Diele = Auflager · Schrauben je Auflager · Gesamt = Dielen · Schrauben je Diele · (1 + Reserve %)',
  inputs: [
    { type: 'number', id: 'dielen', label: 'Anzahl Dielen', unit: 'Stück', default: 38, min: 1, step: 1 },
    { type: 'number', id: 'dielenlaenge', label: 'Dielenlänge', unit: 'mm', default: 4000, min: 1, step: 10 },
    { type: 'number', id: 'auflagerabstand', label: 'Abstand der Unterkonstruktion', unit: 'mm', default: 500, min: 1, step: 10, help: 'Mittenabstand der Latten/Balken.' },
    { type: 'number', id: 'proAuflager', label: 'Schrauben je Auflager', unit: 'Stück', default: 2, min: 1, step: 1, help: '2 bei sichtbarer Verschraubung, 1 bei verdeckten Clips meist anders.' },
    { type: 'number', id: 'reserve', label: 'Reserve', unit: '%', default: 10, min: 0, step: 1 },
  ],
  compute: (v) => {
    const dielen = num(v.dielen);
    const dielenlaenge = num(v.dielenlaenge);
    const auflagerabstand = num(v.auflagerabstand, 1);
    const proAuflager = num(v.proAuflager);
    const reserve = num(v.reserve);

    const auflagerJeDiele = auflagerabstand > 0 ? Math.ceil(dielenlaenge / auflagerabstand) + 1 : 0;
    const schraubenJeDiele = auflagerJeDiele * proAuflager;
    const gesamt = Math.ceil(dielen * schraubenJeDiele * (1 + reserve / 100));

    return [
      { label: 'Auflagerpunkte je Diele', value: auflagerJeDiele, unit: 'Stück', digits: 0 },
      { label: 'Schrauben je Diele', value: schraubenJeDiele, unit: 'Stück', digits: 0 },
      { label: 'Schrauben gesamt inkl. Reserve', value: gesamt, unit: 'Stück', digits: 0, primary: true },
    ];
  },
  intro:
    'Dieser Rechner schätzt den Schraubenbedarf für eine Holz- oder WPC-Terrasse bei sichtbarer Verschraubung. Grundlage ist, dass jede Diele an jedem Auflager der Unterkonstruktion fixiert wird – die Zahl der Auflager ergibt sich aus Dielenlänge und Lattenabstand. Pro Auflager werden meist zwei Schrauben gesetzt, damit sich die Diele nicht verdreht; daraus folgt mit einer Reserve für Fehlbohrungen die Gesamtmenge.',
  howto: [
    'Anzahl der zu verlegenden Dielen und deren Länge eintragen.',
    'Mittenabstand der Unterkonstruktion angeben (Hartholz oft 400–500 mm, Weichholz 400 mm, WPC laut Hersteller).',
    'Schrauben je Auflager wählen: in der Regel 2 bei sichtbarer Verschraubung.',
    'Reserve von etwa 10 % ergänzen und die Gesamtschraubenzahl ablesen.',
  ],
  faq: [
    {
      q: 'Warum Auflager plus eins?',
      a: 'Eine Diele wird an beiden Enden aufgelagert plus an jedem Zwischenpunkt. Bei 4000 mm Länge und 500 mm Abstand ergeben sich 8 Felder, aber 9 Auflagerpunkte (4000/500 = 8, +1 = 9).',
    },
    {
      q: 'Brauche ich bei verdeckter Befestigung mehr oder weniger?',
      a: 'Verdeckte Clip-Systeme verwenden oft einen Clip plus Schraube je Auflager und Fuge. Trage dann 1 Schraube je Auflager ein und plane Clips separat nach Herstellerangabe.',
    },
    {
      q: 'Welche Schrauben sind für Terrassen geeignet?',
      a: 'Verwende Edelstahlschrauben A2 oder besser A4 (V4A) für Hartholz und Küstennähe. Sie rosten nicht und vermeiden schwarze Verfärbungen rund um den Schraubenkopf.',
    },
    {
      q: 'Muss ich vorbohren?',
      a: 'Bei harten Hölzern wie Bangkirai oder Garapa und nahe der Dielenenden unbedingt, sonst reißt das Holz. Spezielle Terrassenschrauben mit Bohrspitze und Fräsrippen reduzieren das Vorbohren.',
    },
  ],
  related: ['terrassendielen-bedarf', 'unterkonstruktion-abstand'],
  updated: '2026-06-16',
  examples: [
    {
      values: { dielen: 38, dielenlaenge: 4000, auflagerabstand: 500, proAuflager: 2, reserve: 10 },
      expect: [
        { label: 'Auflagerpunkte je Diele', value: 9, tolerance: 0 },
        { label: 'Schrauben je Diele', value: 18, tolerance: 0 },
        { label: 'Schrauben gesamt inkl. Reserve', value: 753, tolerance: 1 },
      ],
    },
  ],
};
