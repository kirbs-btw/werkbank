import { describe, it, expect } from 'vitest';
import { seitenPfad, normalisiere, interneZiele, pruefe } from '../src/lib/linkcheck';

describe('Seitenpfad aus Dateiname', () => {
  it('schneidet index.html und Endung ab', () => {
    expect(seitenPfad('index.html')).toBe('/');
    expect(seitenPfad('rechner/bohrzeit/index.html')).toBe('/rechner/bohrzeit');
    expect(seitenPfad('404.html')).toBe('/404');
  });

  it('kommt mit Windows-Trennern und führendem ./ zurecht', () => {
    expect(seitenPfad('rechner\\bohrzeit\\index.html')).toBe('/rechner/bohrzeit');
    expect(seitenPfad('./rechner/bohrzeit/index.html')).toBe('/rechner/bohrzeit');
  });
});

describe('Ziel normalisieren', () => {
  it('entfernt Anker, Parameter und Schrägstrich am Ende', () => {
    expect(normalisiere('/rechner/x#unten')).toBe('/rechner/x');
    expect(normalisiere('/rechner/x?a=1')).toBe('/rechner/x');
    expect(normalisiere('/rechner/x/')).toBe('/rechner/x');
    expect(normalisiere('/')).toBe('/');
  });
});

describe('Verweise aus HTML lesen', () => {
  it('nimmt seiteninterne Verweise auf', () => {
    const html = '<a href="/rechner/a">A</a><a href="/kategorie/b">B</a>';
    expect(interneZiele(html)).toEqual(['/rechner/a', '/kategorie/b']);
  });

  it('übergeht alles, was nicht auf diese Seite zeigt', () => {
    const html = [
      '<a href="https://example.org">extern</a>',
      '<a href="mailto:a@b.de">Mail</a>',
      '<a href="tel:+491234">Telefon</a>',
      '<a href="#unten">Anker</a>',
      '<a href="relativ/pfad">relativ</a>',
      '<link rel="stylesheet" href="/_astro/x.css" />',
    ].join('');
    // Der Stylesheet-Verweis bleibt drin – auch der kann ins Leere zeigen.
    expect(interneZiele(html)).toEqual(['/_astro/x.css']);
  });
});

describe('Prüfung', () => {
  const alleDa = () => true;

  it('meldet nichts, wenn alles verlinkt ist und existiert', () => {
    const seiten = new Map([
      ['/', '<a href="/rechner/a">A</a>'],
      ['/rechner/a', '<a href="/">Start</a>'],
    ]);
    const { tot, waisen } = pruefe(seiten, alleDa);
    expect(tot.size).toBe(0);
    expect(waisen).toEqual([]);
  });

  it('findet einen Verweis ins Leere und sagt, wo er steht', () => {
    // Genau dieser Fall lag im Bestand: ein Slug mit Tippfehler.
    const seiten = new Map([
      ['/', '<a href="/rechner/gibtesnicht">X</a>'],
      ['/rechner/a', '<a href="/rechner/gibtesnicht">X</a>'],
    ]);
    const { tot } = pruefe(seiten, (z) => z !== '/rechner/gibtesnicht');
    expect([...tot.keys()]).toEqual(['/rechner/gibtesnicht']);
    expect(tot.get('/rechner/gibtesnicht')).toEqual(['/', '/rechner/a']);
  });

  it('findet Seiten, auf die niemand verweist', () => {
    const seiten = new Map([
      ['/', '<a href="/rechner/a">A</a>'],
      ['/rechner/a', ''],
      ['/rechner/vergessen', ''],
    ]);
    expect(pruefe(seiten, alleDa).waisen).toEqual(['/rechner/vergessen']);
  });

  it('hält Startseite und Fehlerseite nie für verwaist', () => {
    const seiten = new Map([
      ['/', ''],
      ['/404', ''],
    ]);
    expect(pruefe(seiten, alleDa).waisen).toEqual([]);
  });

  it('zählt einen Verweis mit Anker als Verlinkung', () => {
    const seiten = new Map([
      ['/', '<a href="/rechner/a#faq">A</a>'],
      ['/rechner/a', ''],
    ]);
    expect(pruefe(seiten, alleDa).waisen).toEqual([]);
  });

  it('meldet dasselbe tote Ziel nur einmal, aber mit allen Fundstellen', () => {
    const seiten = new Map([
      ['/a', '<a href="/weg">1</a><a href="/weg">2</a>'],
      ['/b', '<a href="/weg">3</a>'],
    ]);
    const { tot } = pruefe(seiten, () => false);
    // Ein totes Ziel, aber alle drei Fundstellen – so ist es beim Aufräumen brauchbar.
    expect(tot.size).toBe(1);
    expect(tot.get('/weg')).toEqual(['/a', '/a', '/b']);
  });
});
