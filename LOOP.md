# Werkbank-Loop – Kontinuierliche Verbesserung

Dieser Prozess lässt Claude die Seite in kleinen, stabilen Iterationen ausbauen:
**neue Tools → SEO → Qualität**, immer verifiziert, immer deployt, immer indexiert.
Eine Iteration = genau **ein** abgeschlossener Backlog-Punkt, gepusht auf `main`
(→ Vercel deployt automatisch → live auf www.werkbank-rechner.de).

## Prinzipien

1. **`main` ist immer deploybar.** Niemals pushen, wenn `npm test` oder `npm run build` rot sind.
2. **Eine kohärente Einheit pro Iteration** – ein Tool, ein SEO-Punkt oder ein Fix-Paket. Kleine Commits.
3. **Nur offene, kostenlose Technik.** Keine Paid-APIs, keine externen Dienste zur Laufzeit,
   alles statisch/clientseitig. Neue npm-Dependencies nur mit starkem Grund.
4. **Nutzwert vor Masse.** Bevorzugt Features, die woanders Geld kosten
   (Vorbild: Zuschnittoptimierung ↔ cutlistoptimizer.com-Abo). Kandidaten aus `keywords/` ableiten.
5. **Repo-Konventionen einhalten:** Tools als `src/tools/<kat>/<slug>.ts` mit purem `compute()`,
   `examples` (auto-getestet), FAQ, Keywords aus der Recherche, `related`-Verlinkung,
   `updated` = heutiges Datum. Deutsche Inhalte, deutsche Commit-Messages im Repo-Stil.
6. **Nichts Destruktives, nichts Strategisches autonom.** Keine Löschungen von Content, kein
   force-push, keine History-Rewrites. Richtungsentscheidungen (neue Nische, Monetarisierung,
   EN-Version …) nur ins Entscheidungs-Log eintragen – Bastian entscheidet.

## Ablauf einer Iteration

1. **Sync:** `git pull --rebase origin main`. Bei unerwarteten Konflikten: stoppen, Log-Eintrag, nachfragen.
2. **Gesundheitscheck:** Live-Seite erreichbar? Hat der letzte Deploy die vorige Änderung ausgeliefert
   (Stichprobe per `curl`)? Wenn nein → das zuerst fixen (das ist dann die Iteration).
3. **Task wählen** – in dieser Reihenfolge:
   a) **Von Bastian gemeldete Fehler haben immer Vorrang** vor dem Backlog. Ein gemeldeter Fehler
      ist die Iteration; anschließend Regressionstest ergänzen, damit er nicht wiederkommt.
   b) Sonst: obersten offenen Punkt aus dem Backlog (P1 vor P2 vor P3). Passt er nicht mehr
      (schon erledigt/obsolet), streichen mit Begründung und nächsten nehmen.
   c) Liegen **OpenSEO-Daten** vor (siehe unten), schlagen sie die Backlog-Reihenfolge: Was real
      Impressions/Klicks bringt oder wo ein Ranking abrutscht, kommt vor geplanten Neubauten.
4. **Implementieren** nach den Prinzipien oben. Bei neuen Tools: Keywords/Titel/Description aus den
   passenden Zeilen in `keywords/*.txt` übernehmen, interne Links von 1–2 bestehenden Tools setzen.
5. **Verifizieren:** `npm test` und `npm run build` müssen grün sein. Bei UI-Änderungen zusätzlich
   Smoke-Test im Browser (Preview-Server + Screenshot/Interaktion).
6. **Dokumentieren:** In dieser Datei den Backlog-Punkt abhaken und unten im Iterations-Log
   eine Zeile ergänzen (Datum, was, welche URLs neu/geändert).
7. **Deploy:** Committen (inkl. LOOP.md) und `git push origin main`.
8. **Indexieren:**
   - Warten, bis die neue/geänderte URL live `HTTP 200` liefert (Polling, max. ~5 min;
     sonst im Log vermerken und in der nächsten Iteration prüfen).
   - **IndexNow-Ping** für alle neuen/geänderten URLs (erreicht Bing, Yandex, Seznam, Naver …):

     ```bash
     curl -s -X POST "https://api.indexnow.org/indexnow" \
       -H "Content-Type: application/json; charset=utf-8" \
       -d '{
         "host": "www.werkbank-rechner.de",
         "key": "d6ef5d38487e3026aab7faf8b9c23eba",
         "keyLocation": "https://www.werkbank-rechner.de/d6ef5d38487e3026aab7faf8b9c23eba.txt",
         "urlList": ["https://www.werkbank-rechner.de/…"]
       }'
     ```

   - Google nutzt kein IndexNow, folgt aber der Sitemap (`/sitemap-index.xml`, wird bei jedem
     Build neu erzeugt). GSC-Einreichung bleibt manuell → siehe Entscheidungs-Log E4.

## OpenSEO – datengetriebene Steuerung des Loops

**Ziel:** Der Loop soll nicht nach Bauchgefühl und der Keyword-Recherche von 2026 priorisieren,
sondern nach echten Daten. [OpenSEO](https://openseo.so/) ist eine MIT-lizenzierte, selbst-hostbare
SEO-Plattform (Open-Source-Alternative zu Ahrefs/Semrush) mit einem **MCP-Server**, der Keyword-,
Ranking-, Backlink- und Audit-Daten direkt an Claude Code liefert. Datenquelle im Hintergrund ist
DataForSEO (Pay-per-Use) – deshalb ist die Einrichtung eine Kostenentscheidung, siehe **E5**.

**Sobald der MCP-Server verbunden ist, gilt zusätzlich zum Ablauf oben:**

- **Vor der Task-Wahl:** Rankings der zuletzt veröffentlichten Seiten abfragen. Seiten, die in den
  Top 20 stehen und mit wenig Aufwand nach vorn kämen, schlagen jeden Neubau – ein Rechner auf
  Position 12 bringt mehr als der zwanzigste neue Rechner ohne Sichtbarkeit.
- **Bei neuen Tools:** Keyword-Recherche mit echtem Volumen und Intent-Klassifizierung statt der
  Schätzungen aus `keywords/`. Titel, Description und H1 an der real suchenden Formulierung
  ausrichten; die alte Recherche bleibt nur Ideenquelle.
- **Nach jedem Deploy:** Site-Audit (Lighthouse-basiert) über die neue URL laufen lassen und
  gefundene Probleme als P3-Punkte eintragen, statt sie zu ignorieren.
- **Monatlich:** Backlink- und Sichtbarkeitsverlauf prüfen; auffällige Abstürze sofort untersuchen.
- **AI-Sichtbarkeit:** OpenSEO verfolgt auch, ob die Seite in ChatGPT-Antworten und Google AI
  Overviews auftaucht. Das ist für einen Rechner-Hub zunehmend relevanter als Position 3 –
  entsprechende Lücken als eigene Backlog-Punkte aufnehmen.

**Einrichtung (einmalig, siehe T8):** OpenSEO self-hosted aufsetzen oder Cloud nutzen,
DataForSEO-Zugang hinterlegen, MCP-Server in `.mcp.json` eintragen. Danach hier vermerken, dass die
Daten verfügbar sind, damit spätere Iterationen sie auch nutzen.

**Wichtig:** Solange der MCP-Server *nicht* verbunden ist, diesen Abschnitt überspringen und nicht
so tun, als lägen Daten vor. Keine Zahlen erfinden.

## Takt & Abbruch (für den `/loop`-Betrieb)

- Nach erfolgreicher Iteration: nächste in **30–60 min** planen.
- Nichts Sinnvolles zu tun (Backlog leer und nicht sinnvoll nachfüllbar): **noop**, Wiedervorlage 60 min.
- Backlog leer: erst aus `keywords/`-Recherche neue P1/P2-Punkte ableiten und eintragen, dann weiter.
- **Stoppen** (Loop beenden + Zusammenfassung an Bastian), wenn: dieselbe Blockade zweimal in Folge
  auftritt (z. B. Push scheitert, Deploy kaputt), oder eine Entscheidung von Bastian nötig ist,
  ohne die nichts mehr sinnvoll weitergeht.

## Backlog

### P1 – Neue Tools (je 1 pro Iteration, „kostet woanders Geld" zuerst)

- [x] ~~**T1 Fingerzinken-Box-Generator** (SVG/DXF)~~ → `/generatoren/fingerzinken-box` (2026-08-25)
- [x] ~~**T2 Schnittdaten-Rechner mit Material-Datenbank**~~ → `/rechner/schnittdaten-rechner` (2026-08-25)
- [x] ~~**T3 STL-Analyse im Browser**~~ → `/generatoren/stl-analyse` (2026-08-25)
- [x] ~~**T4 DXF ⇄ SVG Konverter**~~ → `/generatoren/dxf-svg-konverter` (2026-08-25)
- [x] ~~**T5 Gridfinity-Bin-Generator**~~ → `/generatoren/gridfinity-generator` (2026-08-25)
- [x] ~~**T6 Living-Hinge-Generator**~~ → `/generatoren/living-hinge` (2026-08-25)
- [x] ~~**T7 Zuschnittoptimierung v2**~~ → Schnittliste + mehrere Plattenformate (2026-08-25)
- [ ] **T8 OpenSEO anbinden** (siehe Abschnitt oben): MCP-Server in `.mcp.json` eintragen, Zugang
      testen, erste Ranking- und Keyword-Abfrage machen und das Ergebnis als neue P1/P2-Punkte
      eintragen. **Blockiert durch E5** (DataForSEO kostet Geld) – vorher nichts installieren.
- [x] ~~**T9 Gridfinity-Baseplate-Generator**~~ → `/generatoren/gridfinity-baseplate` (2026-08-25)

### P2 – SEO

- [x] ~~**S1 Sitemap-`lastmod` pro Seite**~~ → `src/lib/lastmod.ts` + `serialize` in der Astro-Config (2026-08-26)
- [x] ~~**S2 `dateModified` in JSON-LD** + menschenlesbares Datum~~ → `UpdatedAt.astro`, 162 Seiten (2026-08-26)
- [ ] **S3 Content-Lücken schließen:** 13 Tools ohne `intro`, 5 ohne `howto`, 4 ohne `related`.
- [ ] **S4 Per-Tool-OG-Bilder** zur Build-Zeit generieren (ohne externe Dienste).
- [ ] **S5 Cross-Kategorie-`related`-Kuratierung** (z. B. Laser ↔ CNC ↔ Holz sinnvoll verweben).
- [ ] **S6 Teilen-Links:** Rechner-Eingaben als URL-Parameter, Canonical bleibt sauber.

### P3 – Qualität & Bugs

- [ ] **Q1 `npm run check` komplett grün:** vite-Typkonflikt in `astro.config.mjs` beheben.
- [ ] **Q2 Interner Link-Check** über `dist/` (Script, findet 404s/Waisen).
- [ ] **Q3 A11y-Durchgang** der Kernseiten (Labels, Fokusreihenfolge, Kontraste).
- [ ] **Q4 Umlaute reparieren:** ~20 Tool-Dateien nutzen transliterierte Umlaute im sichtbaren Text
      („Schaetze", „Fuellgrad", „beruecksichtigt"). Betrifft Titel, Beschreibungen, FAQ und teils
      Ergebnis-Labels → schlechte Optik und schwächeres Keyword-Matching. Gefunden in Iteration 3;
      `modell-gewicht.ts` ist bereits bereinigt. Liste: `grep -lE "Schaetz|Fuell|Naeher|beruecksicht|
      Waende|Groesse|Laenge|Hoehe|koennen|muessen" src/tools/*/*.ts`. Achtung: Ergebnis-Labels werden
      in `examples` per Label gematcht – beide Stellen gemeinsam ändern.

### Entscheidungs-Log (braucht Bastian – Loop setzt das NICHT um)

- [ ] **E1 Monetarisierung:** Affiliate/Ads auf Commercial-Intent-Keywords (Recherche in `keywords/`).
- [ ] **E2 Zweite Nische:** Garten ist laut Recherche Top-Kandidat – gleiche Domain oder Schwester-Domain?
- [ ] **E3 EN-Version** (hreflang) für EN-lastige Cluster (Gridfinity, Living Hinge, Board Feet).
- [ ] **E4 Google Search Console:** Zugang/Export für Claude → Backlog-Priorisierung nach echten Query-Daten.
- [ ] **E5 OpenSEO + DataForSEO:** OpenSEO selbst ist MIT-lizenziert und kostenlos, die Daten dahinter
      kommen von DataForSEO und werden pro Abfrage abgerechnet. Zu entscheiden: Budget je Monat,
      self-hosted oder Cloud, und wer die Zugangsdaten hinterlegt. Ohne diese Entscheidung bleibt T8
      blockiert und der Loop priorisiert weiter nach der Recherche in `keywords/`.

## Iterations-Log

- **2026-08-25 · Iteration 0 (Setup):** Zuschnittoptimierung gebaut und live
  (`/generatoren/zuschnittoptimierung`): Guillotine-Packing-Engine (`src/lib/cutlist.ts`) mit 10 Tests,
  Schnittplan-SVG, Druck, localStorage, Reste-Liste, FAQ-Schema. Nebenbei: `/rechner` listet jetzt auch
  Generatoren (waren vorher unauffindbar), interne Links aus 2 Holz-Tools, `@astrojs/check` installiert.
  LOOP.md angelegt. IndexNow-Ping: 6 URLs.
- **2026-08-25 · Iteration 1 (T1):** Fingerzinken-Box-Generator live
  (`/generatoren/fingerzinken-box`): Box-Joint-Geometrie (`src/lib/fingerbox.ts`) mit 19 Tests,
  Kerf-Kompensation per Kontur-Offset, Außen-/Innenmaß, Deckel optional, SVG/DXF-Export,
  Anordnung auf Arbeitsflächenbreite. Test deckte zwei echte Geometriefehler auf (Diagonale statt
  Eckpunkt, wenn an einer Ecke zwei Ausklinkungen zusammentreffen) – behoben vor dem Push.
  Interner Link aus `kerf-kompensation`. IndexNow-Ping: 4 URLs.
- **2026-08-25 · Iteration 2 (T2):** Schnittdaten-Rechner mit Material-Datenbank live
  (`/rechner/schnittdaten-rechner`): 19 Werkstoffe × 4 Werkzeugmaterialien (`src/lib/schnittdaten.ts`)
  mit 21 Tests, Spanausdünnungs-Ausgleich (gedeckelt auf 2,5×), Kienzle-kc, Leistungsbedarf,
  Warnungen bei ungeeigneten Kombinationen. Richtwerte-Tabelle wird aus der Datenbank generiert
  (bleibt automatisch synchron, zusätzlich indexierbarer Tabellen-Content). Formeln bewusst
  identisch zu `mittlere-spanungsdicke` und `spindelleistung-fraesen`. Tabellen-Styles in
  `global.css` ergänzt. Interne Links aus `drehzahl-vorschub` und `schnittgeschwindigkeit`.
  IndexNow-Ping: 4 URLs.
- **2026-08-25 · Iteration 3 (T3):** STL-Analyse live (`/generatoren/stl-analyse`): STL-Parser für
  binär und ASCII (`src/lib/stl.ts`) mit 26 Tests, exaktes Volumen über Tetraeder-Summe, Oberfläche,
  Abmessungen, Dichtheitsprüfung über Kantenzählung, Erkennung invertierter Normalen und entarteter
  Dreiecke. Dazu Material-/Kostenschätzung (19 Werkstoffe), Filamentlänge und Bauraum-Prüfung mit
  90°-Drehung. Datei bleibt im Browser – das ist der Unterschied zu den Upload-Diensten.
  Verifiziert mit generierten Test-Würfeln (Soll 8 cm³ / 24 cm² exakt getroffen, kaputtes Netz
  meldet 3 offene Kanten). Interner Link aus `modell-gewicht`, dessen Umlaute dabei repariert
  wurden → Rest als Q4 im Backlog. IndexNow-Ping: 4 URLs.
- **2026-08-25 · Iteration 4 (T4):** DXF ⇄ SVG Konverter live (`/generatoren/dxf-svg-konverter`):
  DOM-freier Parser/Writer für beide Formate (`src/lib/dxfsvg.ts`) mit 40 Tests. DXF-Seite liest
  LINE, LWPOLYLINE inkl. Bulge-Bögen, POLYLINE/VERTEX, CIRCLE, ARC, ELLIPSE und schreibt R12
  (AC1009) mit Header, Layertabelle und POLYLINE/VERTEX. SVG-Seite liest line/polyline/polygon/
  rect/circle/ellipse/path mit verschachtelten Transformationen, viewBox- und Einheiten-Umrechnung
  nach mm; Bézier- und Bogenbefehle werden aufgelöst, Kreise bleiben Kreise.
  **Der Round-Trip-Test hat einen echten Vorzeichenfehler gefunden:** Durch die y-Spiegelung dreht
  sich die Bogenrichtung um, das SVG-sweep-Flag muss 0 statt 1 sein. Die Bounding-Box allein deckt
  das nicht auf (beide Varianten sind 10 × 10 mm) – nötig war die Prüfung eines Bogen-Mittelpunkts.
  Verifiziert im Browser mit einer DXF-Testzeichnung und einem Inkscape-typischen SVG mit
  verschachtelten Gruppen (Sollmaß 68 × 45 mm exakt getroffen). IndexNow-Ping: 4 URLs.
- **2026-08-25 · Iteration 5 (T5):** Gridfinity-Generator live (`/generatoren/gridfinity-generator`):
  erzeugt druckfertige STL-Bins (`src/lib/gridfinity.ts`) mit 21 Tests. Maße **vorab am Quelldokument
  verifiziert** statt aus dem Gedächtnis – dabei zeigte sich, dass der Eckradius 3,75 mm beträgt
  (nicht 4,0 mm) und dass Mehrfeld-Bins je Rasterfeld einen eigenen Fuß im 42-mm-Raster brauchen.
  Umgesetzt: Fußprofil 0,8/1,8/2,15 mm, Stapelrand 4,4 mm, Magnet Ø6,5 × 2 mm und M3, Fächer,
  Wand/Boden. Netz aus mehreren geschlossenen Körpern mit 0,01 mm Überlappung, damit keine
  deckungsgleichen Flächen entstehen; Fußunterseite mit Bohrungen ohne T-Stöße über eine
  Winkel-Zuordnung vernetzt.
  **Zwei Normalen-Bugs gefunden, die die Dichtheitsprüfung allein nicht sieht:** Innenwand und
  Trennwand-Quader waren invertiert (1×1×6-Bin meldete 91 cm³ Material bei 72 cm³ Hüllvolumen).
  Erst die Volumenprüfung deckte das auf – Dichtheits- UND Volumentests sind beide nötig.
  Prüfung nutzt den STL-Analyzer aus Iteration 3 auf dem eigenen Netz. IndexNow-Ping: 4 URLs.

  *Hinweis für künftige Iterationen:* Die Browser-Session sprang während des Smoke-Tests auf
  `about:blank` und lieferte dadurch einmalig widersprüchliche Werte. Bei unplausiblen
  Browser-Messungen zuerst den Seitenzustand prüfen und gegen Node querrechnen, statt Code zu ändern.
- **2026-08-25 · Iteration 6 (Fehlerbehebung + Prozess):** Von Bastian gemeldetes Darstellungsproblem
  im Gridfinity-Generator behoben. Ursache: Die Vorschau zeichnete nur Umrisse ohne gefüllte
  Seitenflächen und ohne Tiefensortierung – die geometrisch korrekt tiefer liegenden Fachböden
  wirkten dadurch wie abgelöste Platten und ragten über die Vorderwand hinaus. Jetzt wird der Korpus
  als gefüllte Silhouette (konvexe Hülle der projizierten Ober- und Unterkante) gezeichnet, von
  hinten nach vorn sortiert, und das Bin-Innere per Clip-Pfad auf die Öffnung begrenzt.
  Drei Regressionstests ergänzt (Clip-Pfad vorhanden, `<g>` geschlossen, gültige Vorschau für sechs
  Konfigurationen). Außerdem: OpenSEO als datengetriebene Steuerung in den Prozess aufgenommen
  (T8 + E5) und die Regel ergänzt, dass gemeldete Fehler den Backlog schlagen.
  T6 (Living Hinge) verschoben; Geometrie-Library und 23 Tests sind bereits fertig und grün.
- **2026-08-25 · Iteration 7 (T6):** Living-Hinge-Generator live (`/generatoren/living-hinge`):
  Seite zur bereits vorhandenen Geometrie-Library gebaut, Export über die geprüften Konverter aus
  Iteration 4 (kein zweiter SVG/DXF-Writer). Zwei Vorschauen: Schnittmuster flach und Seitenansicht
  der Biegung. Kennzahlen: Scharnierbreite aus der Bogenlänge der neutralen Faser, Reihen,
  Winkel je Reihe, Schnittlänge, Schlitzöffnung.
  **UX-Fehler beim Smoke-Test gefunden:** Die Standardwerte lösten sofort eine Warnung aus, weil
  meine Faustregel von 6° je Reihe zu streng war – reale Auslegungen für 3-mm-Sperrholz liegen bei
  etwa 5 bis 10°. Schwelle auf 10° korrigiert, Formulierung von „Grenzwert" auf „übliche Auslegung"
  geändert (es gibt keinen harten Wert) und der Standard-Reihenabstand auf 2,5 mm gesetzt.
  Neuer Test: Die Standardwerte der Seite dürfen keine Warnung erzeugen.
  Interner Link aus `laser-schnittzeit`. IndexNow-Ping: 4 URLs.

  *Merksatz:* Warnschwellen mit den eigenen Standardwerten gegenprüfen. Eine Warnung, die beim
  ersten Seitenaufruf erscheint, obwohl nichts falsch ist, entwertet alle übrigen Warnungen.
- **2026-08-25 · Iteration 8 (T7):** Zuschnittoptimierung v2 live. Zwei neue Fähigkeiten:
  **(1) Mehrere Plattenformate** – Lagertabelle mit beliebig vielen Formaten, je mit Stückzahl
  (leer = unbegrenzt) und optionalem Preis. Ohne Preise minimiert der Optimierer die Fläche, mit
  Preisen die Kosten; das führt teils zu anderen Lösungen. Im Test: drei Platten 2500 × 1250 für
  105 € statt zwei Platten 2800 × 2070 für 160 €, bei weniger Verschnitt (38,1 % statt 49,9 %).
  **(2) Schnittliste** – jedes Teil bekommt im Plan eine Nummer, darunter steht die Liste mit
  Bezeichnung, Maß, Position und Drehung. Plan und Liste werden zusammen gedruckt.
  Umbau ohne Bruch: Der bewährte Packer bekam nur ein Mengenlimit und gibt nicht platzierbare Teile
  zurück; darüber liegt die Lagerverwaltung. Alle 10 Alt-Tests blieben unverändert grün,
  `optimize()` ist jetzt die Kurzform von `optimizeStock()` mit einem Posten. 23 neue Tests.
  **Zwei Tests schlugen fehl, weil der Optimierer klüger war als meine Erwartung:** Er packte beide
  Teile auf eine große Platte, statt wie von mir angenommen zwei Formate anzubrechen – das war
  sparsamer und damit richtig. Testfall so umgebaut, dass er zwei Formate wirklich erzwingt, und die
  clevere Variante als eigener Test festgehalten.
  IndexNow-Ping: 2 URLs.

  *Merksatz:* Wenn ein Test einer Optimierung fehlschlägt, zuerst prüfen, ob die Lösung besser ist
  als die erwartete. Sonst zementiert man die eigene Annahme statt das gewünschte Verhalten.
- **2026-08-25 · Iteration 9 (T9):** Gridfinity-Grundplatten-Generator live
  (`/generatoren/gridfinity-baseplate`), in `gridfinity.ts` ergänzt statt in einer neuen Datei –
  gleiche Domäne, gleiche Konstanten, gleicher Mesh-Baukasten. Fassungsprofil 0,7/1,8/2,15 mm auf
  4,65 mm mit Eckradius 4,0 mm, Boden optional. 21 neue Tests.
  **Der wichtigste Test vergleicht die beiden Profile direkt:** Bin-Fuß gegen Fassung über die
  gesamte Höhe abgetastet – das Spiel ist an jeder Stelle gleich. Damit ist belegt, dass die
  Grundplatte die Bins des eigenen Generators wirklich aufnimmt, statt nur „nach Spec" zu sein.
  **Drei Vernetzungsfehler, jeweils durch die Dichtheitsprüfung gefunden:**
  (1) `roundedRectCorners` erzeugte bei Radius 0 mehrfach denselben Eckpunkt → entartete Kanten.
  (2) Außenrahmen und Fassung haben unterschiedlich viele Punkte → `ring` ersetzt durch `annulus`
      (Winkel-Zuordnung).
  (3) Laut Spezifikation ist die Fassungsöffnung oben exakt so groß wie das Rasterfeld, benachbarte
      Fassungen träfen sich also auf **null Wandstärke**. Das ist weder vernetzbar noch druckbar.
      Lösung: Fassung um 0,05 mm je Seite zurückgenommen (`SOCKET_RELIEF`), Spiel dadurch 0,20 statt
      0,25 mm, Plattenaußenmaße bleiben exakte Vielfache von 42 mm. Auf der Seite offen erklärt.
  Zusätzlich: `PLATE_JOIN` und `SOCKET_RELIEF` müssen sich unterscheiden, sonst fallen die
  Seitenmittelpunkte benachbarter Felder aufeinander – als Invariante mit eigenem Test festgehalten.
  Gegenseitige Links zwischen Bin- und Grundplatten-Generator. IndexNow-Ping: 4 URLs.

- **2026-08-26 · Iteration 10 (S1 + S2):** Ehrliche Aktualitätssignale. Vorher trug **jede** der
  172 URLs den Zeitstempel des letzten Builds – auch Rechner, die seit Juni unverändert sind. Wer
  bei jedem Deploy behauptet, die ganze Seite sei neu, wird zu Recht ignoriert.
  Jetzt liefert jede Seite ihr echtes Datum (`src/lib/lastmod.ts`): Rechner und Generatoren aus dem
  `updated`-Feld, Kategorie- und Übersichtsseiten aus dem jüngsten Datum ihrer Einträge, alles
  Übrige aus dem Seitenstart. Verteilung jetzt: 41 × 15.06., 117 × 16.06., 9 × 25.08., 5 × 26.08.
  Dazu `dateModified` und `datePublished` im JSON-LD sowie ein sichtbares
  `<time datetime="…">` in deutschem Format auf allen 162 Werkzeugseiten. Ein Test hält fest, dass
  die drei Quellen (sichtbar, JSON-LD, Sitemap) **nicht auseinanderlaufen** – widersprüchliche
  Signale wären schlimmer als gar keine.
  Nebenbei: `updated` für alle 9 Generatoren ergänzt (Daten aus der Git-Historie, nicht geschätzt),
  das auf jeder Generatorseite einzeln ausgeschriebene JSON-LD durch `generatorAppLd()` ersetzt und
  9 dadurch verwaiste Importe entfernt. 18 neue Tests.
  **Ein Test hat einen falschen Wert von mir gefunden:** `SITE_START` stand auf dem 16.06. (erster
  Commit), 40 Rechner tragen aber den 15.06. als Verfassungsdatum. Auf das tatsächlich früheste
  Inhaltsdatum korrigiert.
  IndexNow-Ping bewusst nur 2 URLs – siehe Merksatz.

  *Merksatz:* Nach reinen Metadaten-Änderungen nicht alle Seiten bei IndexNow melden. Das wäre
  genau die Sorte Frische-Behauptung, die dieser Punkt abgeschafft hat. Gemeldet wird, was sich
  inhaltlich geändert hat.

  *Merksatz:* Wo eine Spezifikation eine nulldicke Kante fordert, ist eine dokumentierte,
  minimale Abweichung besser als ein Modell, das sich nicht drucken lässt – aber sie gehört
  sichtbar auf die Seite, nicht nur in den Code.

  *Wiederholt aufgetreten:* Die Browser-Session sprang erneut auf `about:blank` und lieferte dabei
  einen unplausiblen Messwert. Bereits in Iteration 5 gesehen – Browser-Messungen bei Auffälligkeiten
  immer gegen Node prüfen, nicht den Code ändern.

## Start-Prompt (Referenz)

```
/loop Werkbank-Loop: Lies LOOP.md im Repo-Root und führe genau EINE Iteration nach dem dort
dokumentierten Ablauf aus. Wähle den obersten offenen Backlog-Punkt (P1 vor P2 vor P3),
implementiere ihn sauber nach Repo-Konventionen, verifiziere mit npm test und npm run build
(beides muss grün sein), hake ihn in LOOP.md ab und ergänze das Iterations-Log, committe im
Repo-Stil und pushe auf origin/main (Vercel deployt automatisch). Prüfe danach die Live-URL
und melde neue/geänderte URLs per IndexNow (Key siehe LOOP.md). Bei Instabilität: nicht
pushen, erst fixen. Strategische Fragen nur ins Entscheidungs-Log eintragen. Danach: nächste
Iteration in 30–60 min planen; wenn nichts Sinnvolles zu tun ist, noop.
```
