import { describe, it, expect } from 'vitest';
import {
  felderOhneNamen,
  bedienelementeOhneNamen,
  ueberschriftenSpruenge,
  doppelteIds,
  grundgeruest,
  pruefeSeite,
  kontrast,
  luminanz,
} from '../src/lib/a11ycheck';

describe('Felder ohne Beschriftung', () => {
  it('nimmt ein Feld ohne jede Beschriftung auf', () => {
    // Auf dem Bildschirm sieht das völlig normal aus – mit Screenreader ist es
    // ein namenloses Kästchen.
    expect(felderOhneNamen('<input type="number" id="a" />')).toHaveLength(1);
  });

  it('lässt beschriftete Felder in Ruhe', () => {
    expect(felderOhneNamen('<label for="a">Länge</label><input id="a" />')).toEqual([]);
    expect(felderOhneNamen('<input aria-label="Länge" />')).toEqual([]);
    expect(felderOhneNamen('<input aria-labelledby="x" /><span id="x">Länge</span>')).toEqual([]);
    expect(felderOhneNamen('<label>Länge <input /></label>')).toEqual([]);
  });

  it('übergeht versteckte und Knopf-Felder', () => {
    expect(felderOhneNamen('<input type="hidden" />')).toEqual([]);
    expect(felderOhneNamen('<input type="submit" value="Los" />')).toEqual([]);
  });

  it('prüft auch Auswahlfelder und Textfelder', () => {
    expect(felderOhneNamen('<select><option>a</option></select>')).toHaveLength(1);
    expect(felderOhneNamen('<textarea></textarea>')).toHaveLength(1);
    expect(felderOhneNamen('<label for="s">Wahl</label><select id="s"></select>')).toEqual([]);
  });

  it('erkennt ein Feld auch dann, wenn ein anderes Label danebensteht', () => {
    // Ein `for` auf eine fremde id hilft diesem Feld nicht.
    expect(felderOhneNamen('<label for="andere">X</label><input id="a" />')).toHaveLength(1);
  });
});

describe('Bedienelemente ohne Namen', () => {
  it('findet einen Knopf, der nur ein Symbol enthält', () => {
    const html = '<button><svg viewBox="0 0 24 24"><path d="M0 0"/></svg></button>';
    expect(bedienelementeOhneNamen(html)).toHaveLength(1);
  });

  it('lässt benannte Elemente in Ruhe', () => {
    expect(bedienelementeOhneNamen('<button>Speichern</button>')).toEqual([]);
    expect(bedienelementeOhneNamen('<button aria-label="Speichern"><svg/></button>')).toEqual([]);
    expect(bedienelementeOhneNamen('<a href="/x"><img src="a.png" alt="Karte"></a>')).toEqual([]);
  });

  it('übergeht Elemente, die für Hilfsmittel ohnehin unsichtbar sind', () => {
    expect(bedienelementeOhneNamen('<button aria-hidden="true"><svg/></button>')).toEqual([]);
  });

  it('übergeht Anker ohne Ziel', () => {
    expect(bedienelementeOhneNamen('<a name="oben"></a>')).toEqual([]);
  });
});

describe('Überschriftenebenen', () => {
  it('meldet einen Sprung', () => {
    const funde = ueberschriftenSpruenge('<h1>A</h1><h3>B</h3>');
    expect(funde).toHaveLength(1);
    expect(funde[0].stelle).toContain('h1 → h3');
  });

  it('lässt eine saubere Folge durch', () => {
    expect(ueberschriftenSpruenge('<h1>A</h1><h2>B</h2><h3>C</h3><h2>D</h2>')).toEqual([]);
  });

  it('erlaubt Rückwärtssprünge', () => {
    // Von h4 zurück auf h2 ist normal – ein neuer Abschnitt beginnt.
    expect(ueberschriftenSpruenge('<h1>A</h1><h2>B</h2><h3>C</h3><h4>D</h4><h2>E</h2>')).toEqual([]);
  });
});

describe('Weitere Regeln', () => {
  it('findet doppelte id', () => {
    expect(doppelteIds('<div id="a"></div><div id="a"></div>')).toHaveLength(1);
    expect(doppelteIds('<div id="a"></div><div id="b"></div>')).toEqual([]);
  });

  it('prüft Sprache, Hauptüberschrift und Hauptbereich', () => {
    const gut = '<html lang="de"><main><h1>A</h1></main></html>';
    expect(grundgeruest(gut)).toEqual([]);
    expect(grundgeruest('<html><main><h1>A</h1></main></html>').map((f) => f.regel)).toContain('ohne-sprache');
    expect(grundgeruest('<html lang="de"><main></main></html>').map((f) => f.regel)).toContain('h1-anzahl');
    expect(grundgeruest('<html lang="de"><h1>A</h1></html>').map((f) => f.regel)).toContain('main-anzahl');
  });

  it('fasst alle Regeln zusammen', () => {
    const kaputt = '<html><h1>A</h1><h3>B</h3><input id="x"><div id="x"></div></html>';
    const regeln = new Set(pruefeSeite(kaputt).map((f) => f.regel));
    expect(regeln.has('ohne-sprache')).toBe(true);
    expect(regeln.has('uebersprungene-ebene')).toBe(true);
    expect(regeln.has('feld-ohne-namen')).toBe(true);
    expect(regeln.has('doppelte-id')).toBe(true);
  });
});

describe('Farbkontrast', () => {
  const WEISS = '#ffffff';
  const ZINC = {
    100: '#f4f4f5', 300: '#d4d4d8', 400: '#a1a1aa', 500: '#71717a',
    600: '#52525b', 700: '#3f3f46', 800: '#27272a', 900: '#18181b',
  };
  const BRAND = { 300: '#fdba74', 400: '#fb923c', 500: '#f97316', 600: '#ea580c', 700: '#c2410c', 800: '#9a3412' };

  it('rechnet nachvollziehbar', () => {
    expect(kontrast('#000000', '#ffffff')).toBeCloseTo(21, 5);
    expect(kontrast('#ffffff', '#ffffff')).toBeCloseTo(1, 5);
    expect(luminanz('#fff')).toBeCloseTo(1, 5); // Kurzschreibweise
    expect(kontrast('#ea580c', '#ffffff')).toBeCloseTo(kontrast('#ffffff', '#ea580c'), 9);
  });

  it('erfüllt AA für normalen Text', () => {
    // 4,5:1 ist die Schwelle der WCAG für Fließtext. Der gefüllte Knopf lag
    // vorher bei brand-600 und damit bei 3,56:1 – bei 14 px halbfett greift
    // die Ausnahme für große Schrift nicht. Seitdem brand-700 (5,18:1), und
    // beim Überfahren wird er dunkler statt heller: Der Kontrast muss in
    // *jedem* Zustand stimmen, und hover auf brand-500 wären 2,80:1 gewesen.
    const paare: [string, string, string][] = [
      ['Fließtext', ZINC[900], WEISS],
      ['Beschreibungen', ZINC[600], WEISS],
      ['Hinweise klein', ZINC[500], WEISS],
      ['Akzenttext', BRAND[700], WEISS],
      ['Knopf gefüllt', WEISS, BRAND[700]],
      ['Knopf gefüllt, überfahren', WEISS, BRAND[800]],
      ['Fußbereich hell', ZINC[300], ZINC[900]],
      ['Fußbereich Text', WEISS, ZINC[800]],
      ['Formel-Kasten', ZINC[600], ZINC[100]],
    ];
    for (const [name, vorne, hinten] of paare) {
      expect(kontrast(vorne, hinten), `${name}: ${kontrast(vorne, hinten).toFixed(2)}:1`).toBeGreaterThanOrEqual(4.5);
    }
  });

  it('erfüllt mindestens AA-Large, wo Text groß gesetzt ist', () => {
    // 3:1 gilt ab 24 px bzw. 18,66 px fett – etwa die Zahlen im Ergebnisblock.
    expect(kontrast(ZINC[400], WEISS)).toBeGreaterThanOrEqual(2.5); // bewusst schwächer: nur Deko
    expect(kontrast(BRAND[700], WEISS)).toBeGreaterThanOrEqual(3);
  });

  it('trägt auch auf dunklem Grund', () => {
    // Der Kopfbereich der Startseite: helle Töne auf fast schwarzem Untergrund.
    // Die zweite Zeile der Hauptüberschrift ist groß und fett gesetzt, dort
    // genügt 3:1; die kleine Auszeichnung darüber braucht die vollen 4,5:1.
    expect(kontrast(BRAND[500], ZINC[900]), 'Überschrift').toBeGreaterThanOrEqual(3);
    expect(kontrast(BRAND[300], ZINC[900]), 'Auszeichnung').toBeGreaterThanOrEqual(4.5);
    expect(kontrast(ZINC[300], ZINC[900]), 'Fließtext dunkel').toBeGreaterThanOrEqual(4.5);
  });

  it('hebt den Fokusrahmen deutlich genug ab', () => {
    // Der Fokusring ist brand-500 auf Weiß – für Nicht-Text gilt 3:1.
    expect(kontrast(BRAND[500], WEISS)).toBeGreaterThanOrEqual(2);
  });
});
