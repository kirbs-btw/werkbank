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
4. **Ambition vor Bequemlichkeit.** Bevorzugt Werkzeuge, die woanders Geld kosten
   (Vorbild: Zuschnittoptimierung ↔ cutlistoptimizer.com-Abo). **Ein Werkzeug darf groß sein.**
   Wenn die ehrliche Antwort auf ein Nutzerproblem ein 3D-Editor ist, dann wird ein 3D-Editor
   gebaut – nicht ein Rechner, der das Problem streift. Große Werkzeuge werden als **Epic** in
   Teil-Iterationen zerlegt (siehe unten), jede davon für sich lauffähig und deploybar.
   Der Maßstab ist: Würde jemand dafür bezahlen? Wenn nein, ist es zu klein gedacht.
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
   **Bei gebündelten Seiten den richtigen Chunk prüfen.** Astro legt gemeinsam genutzte Module
   (`meshsplit`, `viewer3d`, `gridfinity` …) in eigene Dateien, die das Seitenskript erst
   nachlädt und die im HTML nirgends stehen. Wer nur die Seite oder ihr Einstiegsskript
   durchsucht, findet eine längst ausgelieferte Änderung nicht: erst den Import-Verweis im
   Einstiegsskript auflösen, dann dort suchen. Das hat einmal zehn Minuten Warten auf einen
   Deploy gekostet, der schon fertig war.
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
   **Browser-Messungen immer über mehrere Zeitpunkte protokollieren, nie einen Einzelwert lesen.**
   Die Seite rechnet in `requestAnimationFrame`; eine Ablesung direkt nach dem Ereignis zeigt den
   alten Stand. Das hat in drei Iterationen in Folge zu falschen Fehlerdiagnosen geführt – bis
   zum Beweis eines Fehlers gehört ein Verlauf, der zeigt, dass sich der Wert auch nach dem
   Warten nicht ändert.
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
- [x] ~~**T14 Splitter: senkrechte Schnitte durch Mehrkörper-Netze**~~ → jeder Körper wird
      einzeln geschnitten (2026-08-26)
- [ ] **T15 Splitter: Flächen, die über Brücken trianguliert sind** – Eine flache Fläche mit
      Löchern (etwa die Bodenfläche eines Bins mit Magnetlöchern) wird über nullbreite Schlitze
      trianguliert, die vom Rand zu jedem Loch führen. Quert die Schnittebene so einen Schlitz,
      entstehen entartete Konturstücke und die Deckfläche schließt nicht ganz.
      **Gemessen:** konstant 4 offene Kanten je Brücke (16 bei vier Magnetlöchern), unabhängig von
      der Schnittposition, solange die Ebene die Brücken quert; im Bereich der Löcher selbst
      40–110. Die offenen Kanten liegen alle auf der Schnittlinie der flachen Fläche, sechs Punkte
      innerhalb von 0,17 mm.
      **Zwei Wege wurden geprüft und verworfen:** Richtung der Schnittstrecken beim Verketten
      bevorzugen (keine Wirkung – die Verkettung biegt dort nicht falsch ab) und Punkte
      zusammenfassen (die Punkte liegen mit 0,04 mm weit über jeder sinnvollen Toleranz).
      Nötig ist vermutlich eine echte Reparatur der Kontur in 2D – wobei die Deckfläche danach
      exakt auf die beschnittenen Seitenwände passen muss, sonst entstehen erst recht offene
      Kanten. Bis dahin weist `stats.openEdges` das Problem aus und die Seite warnt.
- [ ] **T8 OpenSEO anbinden** (siehe Abschnitt oben): MCP-Server in `.mcp.json` eintragen, Zugang
      testen, erste Ranking- und Keyword-Abfrage machen und das Ergebnis als neue P1/P2-Punkte
      eintragen. **Blockiert durch E5** (DataForSEO kostet Geld) – vorher nichts installieren.
- [x] ~~**T9 Gridfinity-Baseplate-Generator**~~ → `/generatoren/gridfinity-baseplate` (2026-08-25)

### Epic A – Mesh-Werkstatt im Browser

Das größte ungelöste Problem im 3D-Druck-Alltag: **Das Modell passt nicht auf den Drucker.**
Die Lösung dafür kostet anderswo Geld (Lychee Pro, früher Meshmixer) oder läuft nur unter Windows.
Wir bauen sie als Werkzeugkette – jede Stufe für sich nutzbar, zusammen eine kleine Werkstatt.
Alles im Browser, ohne Upload, ohne Bibliothek von der Stange.

- [x] ~~**T10 3D-Viewer als Grundlage**~~ → `src/lib/viewer3d.ts`, eingebaut in die STL-Analyse (2026-08-26)
- [x] ~~**T11 STL-Splitter**~~ → `/generatoren/stl-splitter` (2026-08-26)
- [x] ~~**T12 Passstifte automatisch**~~ → im STL-Splitter (2026-08-26)
- [x] ~~**T13 Mess- und Transformwerkzeuge**~~ → `/generatoren/stl-transformieren` (2026-08-26)

### P2 – SEO

- [x] ~~**S1 Sitemap-`lastmod` pro Seite**~~ → `src/lib/lastmod.ts` + `serialize` in der Astro-Config (2026-08-26)
- [x] ~~**S2 `dateModified` in JSON-LD** + menschenlesbares Datum~~ → `UpdatedAt.astro`, 162 Seiten (2026-08-26)
- [x] ~~**S3 Content-Lücken schließen**~~ → alle 153 Tools vollständig, Testsperre gesetzt (2026-08-26)
- [x] ~~**S4 Per-Tool-OG-Bilder**~~ → 171 Karten zur Build-Zeit, Text als Pfade (2026-08-26)
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
- [ ] **E6 Einwilligungsbanner für AdSense (dringend):** Seit 26.08.2026 läuft Google AdSense auf
      der Seite. Google verlangt für Nutzer im EWR eine **zertifizierte Consent-Management-Plattform
      (CMP)** nach dem TCF-Standard; ohne sie schaltet Google im EWR nur eingeschränkt oder gar keine
      Anzeigen, und rechtlich fehlt die Einwilligung nach § 25 TDDDG. Zu entscheiden: welche CMP
      (Googles eigene ist kostenlos, Alternativen sind Usercentrics oder Cookiebot) und wer sie
      einrichtet. Die Datenschutzerklärung ist bereits angepasst, das Banner fehlt noch.
      **Solange kein Banner läuft, ist das ein offenes Risiko – nicht vergessen.**
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

- **2026-08-26 · Iteration 11 (T10 + AdSense):** Richtungswechsel auf Bastians Ansage: Werkzeuge
  dürfen groß sein. Prinzip 4 entsprechend geschärft und **Epic A „Mesh-Werkstatt"** angelegt –
  das größte ungelöste Alltagsproblem im 3D-Druck ist „Modell passt nicht auf den Drucker", und die
  Lösung dafür kostet anderswo Geld.
  Erste Stufe gebaut: **eigener WebGL2-Renderer** (`src/lib/viewer3d.ts`, 25 Tests) mit Orbit, Zoom,
  Pinch, flacher Schattierung und **beidseitiger Beleuchtung**, damit Netze mit falsch gedrehten
  Normalen lesbar bleiben statt schwarz zu erscheinen. Bewusst ohne three.js: 600 kB Abhängigkeit
  auf einer Seite, die von Ladezeit lebt, wäre der falsche Handel. Eingebaut als Vorschau in der
  STL-Analyse; dafür `analyzeMesh()` von `analyzeStl()` getrennt, damit große Dateien nicht zweimal
  eingelesen werden. Ab 900 000 Dreiecken wird die Anzeige übersprungen.
  **Verifikation mit Einschränkung:** Der Screenshot lief zweimal in einen Timeout, die
  Browser-Session war erneut instabil. Belegt ist stattdessen die Render-Pipeline selbst –
  Programm gelinkt, zwei Attribute gebunden, ein Zeichenaufruf mit 18 Eckpunkten für ein
  6-Dreieck-Modell, Tiefentest aktiv, kein GL-Fehler, kein Fallback-Hinweis. Zusammen mit den
  Matrix-Tests (Ziel landet in der Bildmitte, Einpassung garantiert das Modell im Bild) ist das
  belastbar; **die Pixel selbst hat niemand gesehen** – beim nächsten Durchlauf nachholen.
  Nebenbei auf Zuruf: **Google AdSense** eingebunden (mit `preconnect`, damit der Seitenaufbau
  weniger leidet) und die Datenschutzerklärung korrigiert – dort stand noch „Aktuell wird keine
  Werbung ausgespielt", was mit dem Snippet schlicht falsch wurde. **E6 angelegt: Ohne
  zertifizierte Consent-Plattform fehlt im EWR die Einwilligung, und Google schaltet nur
  eingeschränkt Anzeigen.**

  *Merksatz:* `readPixels` taugt nicht als Nachweis, dass WebGL gezeichnet hat – der Puffer ist nach
  dem Compositing undefiniert und liest sich als Schwarz. Aussagekräftig sind Link-Status,
  Zeichenaufrufe und Fehlercode.

- **2026-08-26 · Iteration 12 (T11):** **STL-Splitter live** (`/generatoren/stl-splitter`) – das
  Kernstück von Epic A. Schnittebene auf X, Y oder Z frei setzen, Netz trennen, beide Hälften
  einzeln als STL speichern. Die Schnittfläche wird geschlossen, auch bei hohlen Modellen: Kanten
  zu Ringen verketten, Ringe in die Ebene projizieren, Löcher an ihrer Verschachtelungstiefe
  erkennen, per Brücke in den Außenrand einfügen und ear-clippen (`src/lib/meshsplit.ts`, 24 Tests).
  Der Viewer zeigt beide Hälften in unterschiedlicher Farbe – dafür `setParts()` ergänzt.
  **Beweisführung über das eigene Werkzeug:** Als komplexes Hohlmodell dient ein Bin aus dem
  eigenen Gridfinity-Generator; nach dem Schnitt prüft der eigene STL-Analyzer beide Hälften auf
  Dichtheit, und das Volumen muss dem Original entsprechen. Auf vier Schnitthöhen bestanden.
  **Ein echter Fehler gefunden:** Brücken erzeugen bewusst doppelte Punkte; das Ear-Clipping schloss
  Punkte nur nach Index aus, nicht nach Lage – dadurch blockierte jeder Doppelpunkt jedes Ohr und
  es entstand gar keine Deckfläche. Behoben durch Positionsvergleich.
  Zusätzlich die aus Iteration 11 offene Pixel-Prüfung nachgeholt: `snapshot()` im Viewer ergänzt
  (zeichnet synchron und liest sofort aus) – das PNG enthält 19 795 Modellpixel auf hellem Grund.
  Nebenbei ein echtes Feature: Knopf „Bild speichern" in der STL-Analyse.

  *Merksatz:* Browser-Messungen brauchen einen Verlauf, keinen Einzelwert. Mehrere „Fehler" dieser
  Iteration waren Ablesungen vor dem nächsten Animationsrahmen – erst das Protokollieren über
  mehrere Zeitpunkte zeigte, dass alles stimmte.

- **2026-08-26 · Iteration 13 (T12):** **Passstifte im STL-Splitter.** Die untere Hälfte bekommt
  Zapfen, die obere passende Taschen mit einstellbarem Spiel – Anzahl, Durchmesser, Länge und Spiel
  frei wählbar. Der elegante Teil: **Ein Stiftloch ist einfach ein weiteres Loch in der
  Deckfläche**, die Loch-Überbrückung aus Iteration 12 trägt das ohne Änderung. Der Zapfen kommt
  als eigener geschlossener Körper dazu, minimal ins Material eintauchend, damit keine Fläche
  doppelt liegt. Stiftpositionen werden über ein Raster gesucht und dann möglichst weit
  auseinander gewählt; wo der Querschnitt zu dünn ist, setzt der Generator **lieber gar keinen
  Stift als einen halb im Nichts stehenden** – bei einer 2,4-mm-Wand ist das der richtige Verzicht.
  15 neue Tests, insgesamt 862. Beide Hälften bleiben in allen Varianten dicht, geprüft über den
  eigenen STL-Analyzer; Volumen und Bauhöhe stimmen (Zapfen 4 mm → untere Hälfte 4 mm höher).
  **Zwei Testerwartungen waren falsch, nicht der Code:** Der Zapfen ist ein 20-Eck, kein Kreis
  (1,6 % weniger Volumen als die Kreisformel), und die Ablehnung von Stiften in einer 2,4-mm-Wand
  ist die gewünschte Schutzfunktion.
  Nebenbei ein Grammatikfehler behoben („1 Stifte gesetzt").

- **2026-08-26 · Iteration 14 (T13):** **STL transformieren – und ein Fund im Gridfinity-Generator.**
  Neue Seite `/generatoren/stl-transformieren`: auf ein exaktes Zielmaß skalieren (das, was Slicer
  nicht können – die rechnen in Prozent), in 90°-Schritten oder frei drehen, spiegeln, auf die
  Bauplatte legen, dazu Strecken per Klick im Modell messen. Jeder Schritt einzeln rückgängig.
  **Damit ist Epic A vollständig.**

  Der eigentliche Gewinn der Iteration war ein Nebenprodukt: Ein Test stellte fest, dass eine
  **reine Verschiebung** das gemeldete Volumen eines Gridfinity-Bins um 5 % änderte. Das ist bei
  einem geschlossenen Netz unmöglich – die Volumenformel ist nur dann verschiebungsinvariant, wenn
  die Summe aller Flächenvektoren null ist. War sie nicht: Der Absatz unter dem Stapelrand
  (`gridfinity.ts:364`) zeigte nach oben statt nach unten. Betroffen war die Voreinstellung, also
  fast jedes erzeugte Bin. **Die Kantenzählung konnte das prinzipiell nicht finden** – sie sortiert
  die Kantenrichtung weg und hält ein Netz mit verdrehter Fläche für dicht. Neu ist deshalb
  `closureError()` als schärfere Prüfung, samt Regressionssperre für neun Bin-Bauformen und für
  alle Splitter-Ergebnisse.

  Zwei weitere Dinge fielen erst im Zusammenspiel auf, nicht im Test: Die Messmarken zählten für die
  Modellgrenzen mit und verschoben damit den Kameramittelpunkt – zweimal derselbe Bildpunkt ergab
  0,26 mm statt 0. Seitdem gibt es `helper: true` für Hilfsgeometrie. Und die Marken waren mit
  74 sichtbaren Pixeln schlicht zu klein; gemessen wurde das, indem der eigene Schnappschuss
  ausgewertet und Modell- gegen Markenpixel gezählt wurden.

  7 neue Tests im Bestand, 56 für das neue Modul, insgesamt 922.

  **Merksatz:** Dichtheit über Kantenzählung ist notwendig, aber nicht hinreichend. Wer wissen will,
  ob ein Netz wirklich geschlossen ist, prüft zusätzlich, ob die Flächenvektoren sich aufheben –
  und die einfachste Probe darauf ist: dasselbe Teil an zwei Orten muss dasselbe Volumen haben.

- **2026-08-26 · Iteration 15 (S3):** **Alle 153 Tools inhaltlich vollständig.** 12 fehlende
  Einleitungen, 5 Anleitungen und 3 Verweis-Sätze ergänzt. Die Texte erklären jeweils das, was über
  die Formel hinausgeht und wofür man sonst nachschlagen müsste: warum ein Raummeter Ster rund 30 %
  weniger Holz enthält als ein Festmeter; warum die Holzfeuchte u über 100 % liegen kann (frische
  Fichte enthält mehr Wasser als eigene Trockensubstanz); warum beim Anziehen einer Schraube der
  größte Teil des Moments in Reibung verschwindet und eine Drehmomentangabe ohne Reibungszustand
  wenig wert ist; dass ein Quadratmeter Stahlblech je Millimeter Dicke 7,85 kg wiegt. Bei den
  Bodenbelägen der Hinweis, dass das Aufrunden auf ganze Pakete oft schwerer wiegt als der
  Verschnitt selbst.

  **Nebenbei ein toter interner Link gefunden:** `laser-abluft-volumenstrom` verwies auf
  `laser-air-assist` statt auf `laser-air-assist-luftverbrauch`. So etwas fällt im Build nicht auf –
  die Karte fehlt einfach. Drei neue Tests sperren die Fehlerklasse dauerhaft: jeder `related`-Slug
  muss existieren, kein Tool darf auf sich selbst verweisen, und jedes Tool braucht Einleitung,
  Anleitung, FAQ und Verweise. Damit kann S3 nicht mehr zurückfallen.

  Berührte Tools haben ein neues `updated`-Datum bekommen – die Sitemap meldet also 13 ehrlich
  geänderte Seiten und nicht den ganzen Bestand. Korrigiert wurde außerdem ein irreführender
  Kommentar in `types.ts`: Er versprach für `howto` ein HowTo-Schema, das nie ausgegeben wurde.
  Nachrüsten lohnt nicht – Google hat die HowTo-Rich-Results 2023 abgekündigt; der sichtbare Text
  bleibt, das Markup wäre Ballast. Insgesamt 925 Tests.

  **Merksatz:** Vollständigkeit, die man einmal herstellt, zerfällt wieder. Wer eine Lücke schließt,
  sollte im selben Zug den Test schreiben, der sie nicht zurückkommen lässt.

- **2026-08-26 · Iteration 16 (S4):** **Eigene Vorschaubilder für 171 Seiten**, erzeugt zur
  Build-Zeit ohne fremden Dienst. Der Kniff steckt darin, **den Text vor dem Rastern in Pfade zu
  verwandeln**: Ein `<text>`-Element bräuchte eine installierte Schrift, und welche auf dem
  Build-Server liegen, weiß niemand sicher – im Zweifel käme eine Ersatzschrift oder ein leeres
  Bild heraus. Gesetzt wird Glyphe für Glyphe mit eigenem Kerning, weil opentype.js über Inters
  `ccmp`-Tabelle stolpert und Shaping für lateinischen Text ohnehin nichts beiträgt. Gerastert
  wird mit sharp, das über Astro schon im Baum lag – jetzt ausdrücklich als Abhängigkeit
  eingetragen, statt sich auf eine fremde transitive zu verlassen.

  Zwei Entscheidungen unterwegs: Das Paket `@fontsource/inter` bringt 5 MB in 252 Dateien mit,
  gebraucht werden zwei mit 62 KB – die liegen jetzt samt Lizenz im Repo. Und Vites `?inline`
  flog wieder raus, weil es im Build eine Data-URL liefert, unter vitest aber einen
  Dev-Server-Pfad: Dann prüften die Tests einen anderen Weg als den ausgelieferten. Stattdessen
  ein Weg für beide, über die von der eigenen Modulposition aus gesuchte Projektwurzel.
  Build dauert dadurch 12 statt 2 Sekunden; 28 neue Tests.

  **Der eigentliche Fund kam aus `astro check`:** Vier Typfehler in dem Splitter-Test, den ich in
  Iteration 14 geschrieben hatte. Ich hatte die Schnittebene als `{axis, position}` übergeben –
  richtig ist `{nx, ny, nz, d}`. Damit war die Ebene komplett `undefined`, eine Hälfte blieb leer,
  und `closureError` liefert für ein leeres Netz 0. **Der Test lief 40 Minuten lang grün, ohne
  irgendetwas zu prüfen.** Mit richtiger Ebene fällt er sofort durch und legt einen echten Defekt
  frei: senkrechte Schnitte durch überlappende Mehrkörper-Netze → T14. Eingegrenzt ist er sauber –
  Vollkörper und Einkörper-Hohlkörper überstehen jeden Schnitt, auch schräg.

  Typfehler insgesamt von 7 auf 2 gesenkt (Rest ist Q1); für opentype.js eine eigene Deklaration
  ergänzt. 954 Tests.

  **Merksatz:** Ein grüner Test beweist nichts, solange er nicht auch beweist, dass er gearbeitet
  hat. Wo eine Kennzahl bei leerer Eingabe „gut" meldet, gehört eine Prüfung auf nichtleere
  Eingabe davor. Und: `npm test` allein reicht als Netz nicht – `astro check` sieht Fehler, die
  zur Laufzeit stumm bleiben.

- **2026-08-26 · Iteration 17 (T14):** **Mehrkörper-Netze werden jetzt körperweise geschnitten.**
  Vorher war *jeder* senkrechte oder schräge Schnitt durch ein Gridfinity-Bin undicht. Die Ursache:
  Ein solches Netz besteht aus mehreren einander leicht überlappenden Vollkörpern; ein senkrechter
  Schnitt trifft mehrere davon auf einmal, und die Frage „außen oder Loch?" wurde über die
  Verschachtelungstiefe entschieden. Bei **ineinander** liegenden Konturen trägt das, bei
  **einander überlappenden** nicht – der Umriss des einen Körpers galt als Loch im anderen.
  Getrennt betrachtet ist jede Kontur wieder eindeutig, und die Überlappungen bleiben erhalten, so
  wie sie gemeint sind.

  Dazu zwei Ergänzungen aus der Fehlersuche. **Eine Ausweichebene:** Liegt die Ebene genau auf
  Kanten des Modells – etwa mittig durch ein symmetrisches Teil –, durchtrennt sie kein einziges
  Dreieck, es entsteht keine Schnittkontur und beide Hälften bleiben offen. Dann wird die Ebene um
  einen Bruchteil eines Mikrometers verschoben; derselbe Kniff, den Slicer für ihre Schichtebenen
  benutzen. Und **eine ehrliche Kennzahl:** `stats.openEdges` weist offene Kanten aus, die Seite
  warnt. Ein undichtes Ergebnis wird nicht mehr stillschweigend ausgeliefert.

  **Eine wichtige Korrektur an mir selbst unterwegs:** Als Abnahmekriterium hatte ich zuerst nur
  die Vektorfläche genommen. Die reicht nicht – ein Riss, dessen beide Ränder sich gegenseitig
  aufheben, hat Vektorfläche null und ist trotzdem offen. Gemessen: 64 offene Kanten bei
  rechnerisch perfekt geschlossener Fläche. Seitdem zählt die Kantenbilanz mit.

  Ebenso irreführend war eine Zwischenmessung: Ich prüfte einzelne Ausweichebenen mit
  `splitMesh(…, d)` und sah überall 0 offene Kanten – **weil jeder dieser Aufrufe seine eigene
  Leiter durchläuft**. Erst eine Instrumentierung der Leiter selbst zeigte, dass sie in einem Fall
  gar nicht ans Ziel kommt. Daraus wurde T15, mit genauer Diagnose statt Vermutung.

  Neu: 21 Tests, darunter eine Kontrolle über 70+ Schnitte in vier Richtungen, drei Maßstäben und
  mehreren Bauformen, jeweils gegen die eigene STL-Analyse geprüft. Insgesamt 962.

  **Merksatz:** Wer eine Zusicherung nicht halten kann, sagt es dem Nutzer – statt die Zusicherung
  leise zu senken. Und: Ein Messwert aus einer Funktion, die selbst schon korrigiert, misst die
  Korrektur mit, nicht den Zustand.

- **2026-08-26 · Iteration 18 (T15, halb):** **Schnitte entlang von Trennwänden sind dicht.**
  T15 umfasste zwei Fälle, die ich in der Notiz auf eine Wurzel zurückgeführt hatte – die Diagnose
  zeigte, dass es zwei verschiedene sind: Beim Trennwand-Fall lagen 444 Punkte exakt auf der Ebene
  bei nur 16 durchtrennten Dreiecken, beim Magnetloch-Fall kein einziger bei 141 durchtrennten.

  Behoben ist der erste. Die Ursache war eine echte Lücke: **Ein Dreieck mit zwei Ecken auf der
  Ebene und der dritten darüber galt als vollständig oben und steuerte keine Schnittstrecke bei.**
  Lag das Nachbardreieck unten, war die gemeinsame Kante trotzdem Rand des Schnitts – und fehlte in
  der Kontur. 104 Kanten blieben so offen. Solche Kanten werden jetzt von der Oberseite aus
  gesammelt und gezählt: einmal gesehen heißt echter Rand, zweimal gesehen heißt mitten im
  Material. Das ist keine Sonderbehandlung, sondern schließt eine Fallunterscheidung, die vorher
  einfach fehlte.

  Der zweite Fall bleibt offen und ist jetzt genau vermessen statt vermutet – siehe T15. Zwei
  Ansätze habe ich geprüft und wieder verworfen, weil sie nichts brachten: die Richtung der
  Schnittstrecken beim Verketten zu bevorzugen und nahe Punkte zusammenzufassen. **Beide sind
  zurückgenommen, nicht auskommentiert** – eine unbelegte Vermutung gehört nicht in den Code, auch
  wenn sie plausibel klingt.

  Neu: der 2×3-Bin mit Trennwänden in der harten Kontrolle, dazu vier Ebenen genau entlang der
  Wände. Insgesamt 963 Tests.

  **Merksatz:** Wenn zwei Symptome gleich aussehen, heißt das nicht, dass sie dieselbe Ursache
  haben. Erst messen, was am jeweiligen Ort tatsächlich anders ist – hier: Punkte auf der Ebene
  gegen durchtrennte Dreiecke. Das trennte in einer Minute, was ich vorher in einen Backlog-Punkt
  zusammengeschrieben hatte.

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
