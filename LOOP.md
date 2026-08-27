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
5. **Verifizieren:** `npm test`, `npm run build`, `npm run check`, `npm run linkcheck`
   **und `npm run a11ycheck`** müssen grün sein.
   Der Typcheck gehört seit Iteration 27 dazu, weil er Fehler sieht, die zur Laufzeit stumm
   bleiben: In Iteration 16 hatte er einen Test entlarvt, der 40 Minuten lang grün lief, ohne
   irgendetwas zu prüfen – die Schnittebene war falsch benannt und damit komplett `undefined`. Bei UI-Änderungen zusätzlich
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
- [x] ~~**T15 Splitter: Deckflächen bei entarteten Schnittkonturen**~~ → flache Ecken beim
      Ohrenschneiden (2026-08-26)
- [x] ~~**T16 `bridgeHoles` bei mehreren Löchern**~~ → Sichtbarkeitsprüfung nach Eberly plus
      Kreuzungsprüfung (2026-08-26)
- [x] ~~**T17 Ohrenschneiden an Berührstellen**~~ → Sweep-Zerlegung in `polytri.ts`, mit Probe
      gegen das Brückenverfahren (2026-08-26)
- [x] ~~**T18 Sweep-Zerlegung: waagerechte Kanten und lange Reihen**~~ → drei Ursachen behoben,
      Fehlfälle auf Splitter-Querschnitten von 352 auf 80 (2026-08-26). Restliche 80 sind kein
      Nutzerproblem: Das Brückenverfahren schafft in der gesamten Testmenge jeden Querschnitt,
      der zweite Weg greift nur, wo es das nicht tut. **Weiteres Feilen daran hat keinen
      messbaren Nutzen mehr – siehe E7.**
- [x] ~~**T19 Zahnriemen-Länge & Achsabstand**~~ → `/rechner/zahnriemen-laenge` (2026-08-27)
- [x] ~~**T20 Schritte je mm für Achsantriebe**~~ → `/rechner/schritte-je-mm` (2026-08-27)
- [ ] **T8 OpenSEO anbinden** (siehe Abschnitt oben): MCP-Server in `.mcp.json` eintragen, Zugang
      testen, erste Ranking- und Keyword-Abfrage machen und das Ergebnis als neue P1/P2-Punkte
      eintragen. **Blockiert durch E5** (DataForSEO kostet Geld) – vorher nichts installieren.
- [x] ~~**T9 Gridfinity-Baseplate-Generator**~~ → `/generatoren/gridfinity-baseplate` (2026-08-25)

#### Neuer Strang: Elektronik (Abdeckungsanalyse 2026-08-27)

Die Maker-Nische ist durchgerechnet: Von 146 Keywords in `keywords/` sind nur noch 33 offen, und
die verteilen sich auf **English** (E3) und **Commercial Intent** (E1) – beides Entscheidungen,
keine Bauaufgaben. Der Zahnrad-Cluster sah zunächst nach Lücke aus, war aber ein Messfehler:
`/generatoren/zahnrad` gibt es längst, meine Abdeckungsprüfung hatte nur `src/tools/` gelesen.

Elektronik ist **derselbe Leserkreis**, nicht eine zweite Nische: Wer sich einen Drucker oder eine
Fräse baut, rechnet auch Vorwiderstände, Netzteile und Grenzfrequenzen. Deshalb gleiche Domain,
gleiche Machart – im Gegensatz zu Garten/MINT/Stochastik, die als Fremd-Nischen unter E2 bleiben.
25 ungedeckte Keywords, nach Clustergröße:

- [x] ~~**T21 NE555-Rechner**~~ → `/rechner/ne555-rechner` (2026-08-27), zugleich die neue
      Kategorie `elektronik`
- [x] ~~**T22 Ohmsches Gesetz & Leistung**~~ → `/rechner/ohmsches-gesetz` (2026-08-27), dazu
      `src/lib/elektro.ts` als gemeinsame Grundlage der Kategorie
- [ ] **T23 Operationsverstärker** (4 KW): invertierend und nichtinvertierend, Verstärkung,
      Widerstandspaare aus der E-Reihe.
- [ ] **T24 RC/RL-Filter & Grenzfrequenz** (3 KW): Tief-/Hochpass, Zeitkonstante, Bode-Verlauf als
      Diagramm.
- [ ] **T25 Spannungsteiler** (3 KW): unbelastet und belastet – gerade der belastete Fall fehlt in
      fast jedem Online-Rechner, obwohl er der praxisrelevante ist.

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
- [x] ~~**S5 Cross-Kategorie-Verlinkung**~~ → 41 kuratierte Paare in `src/lib/crosslinks.ts` (2026-08-26)
- [x] ~~**S6 Teilen-Links**~~ → Eingaben in der Adresszeile, `src/lib/shareurl.ts` (2026-08-26)

### P3 – Qualität & Bugs

- [x] ~~**Q1 `npm run check` komplett grün**~~ → eine gemeinsame Vite-Version statt zweier (2026-08-26)
- [x] ~~**Q2 Interner Link-Check**~~ → `npm run linkcheck`, fand sofort einen toten Verweis (2026-08-27)
- [x] ~~**Q3 A11y-Durchgang**~~ → `npm run a11ycheck` + Kontrastprüfung, 5 Befunde behoben (2026-08-27)
- [x] ~~**Q4 Umlaute reparieren**~~ → 202 Ersetzungen in 21 Rechnern, Testsperre gesetzt (2026-08-27)

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
- [ ] **E7 Wohin als Nächstes? (Priorisierung):** Die letzten vier Iterationen steckten in der
      Zerlegungs-Geometrie des STL-Splitters (T15–T18). Die Bauteile sind messbar deutlich besser
      geworden, **aber drei dieser vier Iterationen haben kein nutzerseitiges Maß bewegt** – der
      Splitter liefert schon vorher in jedem geprüften Fall dichte Hälften. Der P1-Strang ist
      damit erschöpft: Was dort noch offen ist, betrifft einen Ersatzweg, der in der gesamten
      Testmenge nie gebraucht wird.
      **Vorschlag:** P1 vorerst als abgearbeitet betrachten (T8 bleibt durch E5 blockiert) und den
      Loop auf P2/P3 laufen lassen – S5 (Cross-Kategorie-Verlinkung), S6 (Teilen-Links), Q2
      (interner Link-Check), Q3 (A11y), Q4 (Umlaute). Das sind Punkte mit unmittelbarer Wirkung
      auf Auffindbarkeit und Bedienbarkeit. Alternativ: ein neues großes Werkzeug als T19 – dann
      bitte Richtung nennen.
      Ohne Antwort nimmt der Loop ab der nächsten Iteration P2.
      **Stand 2026-08-27:** P2 und P3 sind inzwischen ebenfalls vollständig abgearbeitet. Statt den
      Loop leerlaufen zu lassen, habe ich die Keyword-Recherche gegen den Bestand gerechnet und
      **Elektronik als nächsten Strang gesetzt (T21–T25)** – gleiche Zielgruppe, gleiche Domain,
      also keine strategische Weichenstellung, sondern der bestehende Auftrag „mehr nützliche
      Werkzeuge". Garten, MINT und Stochastik wären dagegen echte Fremd-Nischen und bleiben E2.
      Wenn dir eine andere Richtung lieber ist, sag Bescheid – sonst arbeite ich T21–T25 ab.
- [ ] **E8 Leiterquerschnitt-Rechner umsortieren?** `/rechner/strombelastbarkeit-leiterquerschnitt`
      liegt unter **Metall & Blech** – offenkundig über das Kupfer gedacht, nicht über den Strom.
      Sachlich gehört er nach Elektronik. Ich habe ihn **nicht verschoben**: Sein `related` zeigt auf
      Draht-, Rundmaterial- und Rohrgewicht, er ist also bewusst als Metall-Rechner geschrieben, und
      das Umsortieren von Bestandsinhalten ist keine Entscheidung, die ich nebenbei treffe. Die
      Auffindbarkeit ist vorerst über eine Querverlinkung gelöst. Der Slug bliebe beim Verschieben
      gleich, die URL also auch – es wäre ein billiger, umkehrbarer Schritt, wenn du ihn willst.

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

- **2026-08-26 · Iteration 19 (T15):** **Bins mit Magnetlöchern lassen sich jetzt in jeder
  Richtung dicht schneiden.** Die Ursache lag ganz woanders, als meine Backlog-Notiz behauptet
  hatte – die sprach von Brücken-Triangulierung, dabei baut der Gridfinity-Generator seine
  Magnetlöcher überhaupt nicht mit Brücken, sondern mit `annulus`.

  Der Weg dahin über drei widerlegte Vermutungen: Ein minimaler Nachbau mit einem gebrückten Loch
  reproduzierte den Fehler **nicht**. Die Schnittkontur selbst war einwandfrei – eine geschlossene
  Schleife aus 65 Punkten, keine Mehrfachbesuche. Erst die Messung von `earClip` gegen diese
  Kontur brachte es: **57 Dreiecke statt 63, sechs Konturkanten ohne Deckfläche.**

  Der Grund: **flache Ecken.** Sie liegen genau auf der Verbindung ihrer Nachbarn, sind also weder
  konvex noch einspringend – und weil ein Punkt auf der Kante eines Ohrs als „innen" zählt,
  blockieren sie zugleich jedes Ohr, dessen Kante durch sie hindurchläuft. Fünf solcher Ecken
  blockierten die drei verbliebenen Ohren gegenseitig; die Zerlegung blieb stehen und verwarf den
  Rest.

  **Ein naheliegender Fix war falsch und wurde verworfen:** die Lehrbuchregel „nur einspringende
  Ecken blockieren ein Ohr". Damit stimmte die Fläche zwar exakt, aber die Ohren übersprangen die
  flachen Punkte – die Deckfläche bekam die Kante a–c, die beschnittene Wand hatte a–b und b–c,
  und plötzlich fehlten 32 statt 6 Kanten. Die Anforderung ist strenger als „Fläche abdecken":
  **Jeder Konturpunkt muss Ecke bleiben.** Richtig ist deshalb, eine flache Ecke mit einem
  flächenlosen Dreieck abzuschneiden – das bringt die Zerlegung weiter und verbraucht genau die
  beiden Randkanten, die verbraucht werden müssen.

  **Nebenbei ein neuer Fehler gefunden:** `bridgeHoles` verschmilzt Löcher bei bestimmten Lagen
  falsch – 1 und 3 Löcher sauber, 2 und 4 kaputt. Als T16 mit Messwerten festgehalten.

  13 neue Tests, darunter eine Zusicherung für `earClip`, die nicht nur die Fläche prüft, sondern
  dass **jede Konturkante genau einmal Rand der Zerlegung** ist. Insgesamt 967.

  **Merksatz:** Eine Notiz im Backlog ist eine Vermutung von damals, kein Befund. Diese hier stand
  zwei Iterationen lang da und schickte mich in die falsche Richtung. Beim Wiederaufnehmen zuerst
  nachmessen, ob sie noch stimmt.

- **2026-08-26 · Iteration 20 (T16):** **Löcher werden richtig an die Außenkontur angebunden.**
  Die alte Fassung schickte vom rechtesten Punkt eines Lochs einen Strahl nach rechts und nahm den
  Endpunkt der getroffenen Kante – ohne zu prüfen, ob der von dort überhaupt zu sehen ist. Stand
  ein anderes Loch dazwischen, kreuzte die Brücke fremde Kanten und das verschmolzene Polygon
  schnitt sich selbst. Neu ist der fehlende Schritt aus dem üblichen Verfahren (Eberly): Im
  Dreieck aus Lochpunkt, Strahlentreffer und Kantenendpunkt darf keine einspringende Ecke liegen;
  liegt doch eine darin, wird diese genommen. Dazu eine ausdrückliche Kreuzungsprüfung – eine
  Brücke taugt genau dann, wenn ihre Strecke keine Kante kreuzt. **Prüfen statt hoffen.**

  **Gemessen an 717 zufälligen Lochanordnungen:** Die Verschmelzung ist jetzt in 712 Fällen
  korrekt statt in 487; vollständig zerlegen lassen sich 659 statt 340.

  Zwei weitere Ideen habe ich probiert und **wieder zurückgenommen, weil die Messung sie widerlegte**
  – beide klangen plausibel und machten es schlechter: den Gleichstand an senkrechten Kanten über
  den kürzeren Weg auflösen (659 → 604) und Brückenpunkte meiden, an denen schon ein Loch hängt
  (659 → 605).

  Wichtiger als die Zahlen war eine **Trennung der Zuständigkeiten**, die vorher fehlte: Eine
  Zwischenmessung zeigte, dass das verschmolzene Polygon in den verbliebenen Fehlerfällen völlig
  korrekt ist – richtige Fläche, keine Selbstschnitte – und erst das Ohrenschneiden an der
  Berührstelle zweier Brücken hängen bleibt. Das ist ein eigener Punkt (T17), kein Rest von T16.
  Die Tests prüfen deshalb beide Zusagen getrennt.

  Ein Zwischenschritt führte mich fast in die Irre: Ich hatte Fehlerfälle mit gerundeten Mittelpunkt-
  und Radiuswerten protokolliert und daraus nachgebaut – die Nachbauten liefen sauber durch, weil
  sie eben nicht dieselben Polygone waren. Erst das Protokollieren der exakten Koordinaten führte
  zum Befund. 12 neue Tests, insgesamt 970.

  **Merksatz:** Ein Fehlerbericht muss den Fall exakt festhalten, nicht ungefähr. Eine gerundete
  Rekonstruktion beweist gar nichts – sie kann grün laufen, während der echte Fall rot ist.

- **2026-08-26 · Iteration 21 (T17):** **Keine Verbesserung ausgeliefert – und das ist das
  Ergebnis.** Vier Ansätze für die Berührstellen im Ohrenschneiden geprüft, alle am Messstand
  widerlegt: an der Berührstelle auftrennen (unverändert), Diagonale suchen (Einzelfall besser,
  Messstand unverändert), belegte Brückenpunkte meiden (658 statt 659), Ohren an Brückenpunkten
  zurückstellen (0 statt 659). Jeder einzelne ist wieder aus dem Code verschwunden.

  Gewonnen ist trotzdem etwas, und zwar das Entscheidende: **Der Mechanismus ist jetzt verstanden.**
  Ein Loch hängt an einer Brücke aus *zwei* Kanten; solange beide existieren, funktioniert das
  Ohrenschneiden. Wird das Ohr am Brückenpunkt geschnitten, verschmelzen sie zu einer Berührung in
  einem einzigen Punkt – und auf so einem Ring ist das Verfahren **grundsätzlich nicht mehr
  korrekt**, es findet „Ohren", die gar kein Material sind. Der Beleg ist eindeutig: Der Rest eines
  solchen Rings hatte am Ende die Fläche −606, lief also längst verkehrt herum. Damit ist klar,
  dass hier kein weiterer Rückfall hilft, sondern ein anderes Verfahren nötig ist. Das steht mitsamt
  den vier Sackgassen in T17.

  Ausgeliefert wurde eine Sache, die direkt aus dieser Arbeit folgt: **Der Warntext im Splitter
  nannte die falsche Ursache.** Er sprach von „sehr schmalen oder entarteten Dreiecken"; tatsächlich
  sind es Querschnitte mit mehreren getrennten Hohlräumen. Wer einen Hinweis gibt, sollte den
  richtigen geben.

  **Merksatz:** Eine Iteration ohne ausgelieferte Verbesserung ist kein verlorener Lauf, wenn
  danach feststeht, welcher Weg *nicht* gangbar ist – vorausgesetzt, das steht so im Backlog, dass
  niemand die Sackgassen erneut abläuft. Was nichts bringt, gehört aus dem Code heraus, nicht
  auskommentiert hinein.

- **2026-08-26 · Iteration 22 (T17):** **Ein zweites Zerlegungsverfahren, das Löcher direkt
  behandelt.** Nach der letzten Iteration stand fest, dass kein weiterer Rückfall im
  Ohrenschneiden hilft. Also `polytri.ts`: ein Sweep von oben nach unten, der an den kritischen
  Ecken Diagonalen einzieht, bis nur noch y-monotone Teilstücke übrig sind. Löcher brauchen dabei
  **keine Sonderbehandlung** – sie sind einfach weitere Ringe im Kantensatz, gegenläufig
  orientiert. Entscheidend für den Einsatz als Deckfläche: Es entstehen **keine neuen Punkte**,
  nur Diagonalen zwischen vorhandenen Ecken, und die heben sich in der Kantenbilanz auf.

  **Gemessen:** 714 von 717 zufälligen Lochanordnungen sauber zerlegt, gegen 659 beim
  Brückenverfahren. An echten Schnitten durch solche Platten: 179 von 180 dicht statt 177.

  Zwei Fehler auf dem Weg, beide durch Messung gefunden statt durch Nachdenken: Zuerst kamen
  **null** Dreiecke heraus – ich hatte je Kante nur eine Halbkante in die Nachbarschaft
  eingetragen, zum Ablaufen der Flächen braucht es beide. Danach wurde das **Loch gefüllt**: Der
  Hohlraum ist ebenfalls eine Fläche des Kantennetzes und läuft gegen den Uhrzeigersinn, sieht
  also aus wie Material. Seitdem entscheidet die Umlaufzahl an einem Punkt im Inneren.

  **Das neue Verfahren ersetzt das alte aber nicht** – es stolpert über waagerechte Kanten, und
  die sind im Querschnitt einer flachen Fläche der Normalfall. Beim Verdrahten fielen prompt drei
  vorher grüne Tests um. Deshalb rechnet der Splitter jetzt beide und prüft nach: **Jede
  Konturkante muss genau einmal am Rand stehen.** Das erste Verfahren, das besteht, gewinnt.
  Erst diese Probe – nicht die zuerst gewählte Flächenprobe – machte alle Tests grün: Eine
  Zerlegung kann flächenrichtig sein und den Rand trotzdem anders führen.

  Zwei Vorversuche zum Ohrenschneiden gingen wie erwartet ins Leere und sind wieder draußen
  (Brückenpunkte hintanstellen statt verbieten: unverändert 659). 9 neue Tests für das Modul,
  insgesamt 979.

  **Merksatz:** Zwei Verfahren mit verschiedenen Schwächen und einer nachprüfbaren Abnahme sind
  ehrlicher als ein Verfahren mit einer Kette von Rückfällen. Voraussetzung ist, dass die Abnahme
  genau das prüft, worauf es ankommt – hier die Kantenbilanz, nicht die Fläche.

- **2026-08-26 · Iteration 23 (T18, teilweise):** **Zwei Ursachen in der Sweep-Zerlegung behoben,
  Fehlfälle auf Splitter-Querschnitten von 352 auf 190 gesenkt.**

  Die erste war ein Rechenfehler mit Ansage: Ich prüfte auf `a.y === b.y`, um waagerechte Kanten
  zu erkennen. Schnittkonturen entstehen aber durch Interpolation, und eine eigentlich waagerechte
  Kante hat dann Endpunkte, deren y sich im **letzten Bit** unterscheidet – gemessen
  −7,2872319847799565 gegen −7,287231984779956. Der Test greift dort nicht, und die Interpolation
  teilt durch rund 10⁻¹⁵.

  Die zweite war ein Denkfehler: Teilstücke ohne Flächeninhalt habe ich zusammen mit der
  Außenfläche über „Fläche ≤ 0" verworfen. Solche Stücke entstehen an Reihen gerader Punkte – und
  **mit ihnen fielen ihre Randkanten weg.** An einer gemessenen Kontur aus 28 Punkten: drei Ecken
  ungenutzt, vier Konturkanten fehlend, obwohl die Gesamtfläche stimmte. Flächenlos heißt eben
  nicht wertlos: Diese Stücke tragen nichts zur Fläche bei, halten aber die Kantenbilanz zusammen.

  **Ehrlich zur Wirkung:** Kein nutzerseitiges Maß hat sich bewegt. Der Splitter rechnet weiter
  zuerst über Brücken, und dessen Tests waren schon vorher grün. Besser geworden ist der zweite
  Weg – der greift genau dort, wo Brücken versagen. Beide Korrekturen sind mit der exakten
  Fehlerkontur als Regressionstest hinterlegt.

  Offen bleibt der schwerere Fall: lange Punktreihen auf identischer Höhe (40 Punkte, davon 13 und
  15 auf zwei Höhen → 10 von 38 Dreiecken). Steht in T18.

  Zwei Dinge zum Vorgehen: Der **Messstand ist jetzt ein fester Test** statt einer Wegwerfdatei –
  er hat in drei Iterationen jede Vermutung entschieden. Und ich bin beim Sichern der Dateien
  gestolpert: Beim Vorher-Nachher-Vergleich spielte ich am Ende die ältere Sicherung zurück und
  überschrieb damit eine fertige Korrektur. Aufgefallen ist es nur, weil der Regressionstest
  sofort rot wurde. 2 neue Tests, insgesamt 982.

  **Merksatz:** „Entartet" ist kein Grund zum Wegwerfen. Ein flächenloses Stück trägt keine
  Fläche, aber sehr wohl Kanten – und die Kantenbilanz ist hier die eigentliche Zusage.

- **2026-08-26 · Iteration 24 (T18):** **Diagonalen, die auf dem Rand liegen, werden übergangen –
  Fehlfälle von 190 auf 80.** Bei vielen Ecken auf gleicher Höhe zieht der Sweep Diagonalen
  zwischen Punkten **derselben Linie**. Solche Strecken trennen nichts, sie liegen auf der Kontur.
  Beim Ablaufen der Flächen richten sie trotzdem Schaden an: An ihren Endpunkten stehen zwei
  Nachbarn unter demselben Winkel, die Reihenfolge wird beliebig, und benachbarte Flächen
  verschmelzen. An der gemessenen Kontur mit 13 und 15 Punkten auf zwei Höhen entstand statt acht
  Teilflächen **eine einzige mit 72 Kanten**; 23 von 40 Ecken blieben ungenutzt, und von 265,8
  Flächeneinheiten kamen 4,1 heraus. Jetzt: 38 von 38 Dreiecken, Fläche exakt.

  Auf dem Weg dorthin habe ich die Abbiegerichtung beim Flächenablauf verdächtigt und
  umgedreht – **das kippte nur alle Vorzeichen**, die 72-Kanten-Fläche blieb. Aufschlussreich war
  daran etwas anderes: Bei Ecken mit nur zwei Nachbarn sind beide Richtungen identisch, und alle
  meine einfachen Tests haben genau solche Ecken. Die Regel war also nie geprüft, sie fiel nur
  nicht auf.

  **Und der Befund, der zählt:** Eine Zählung zeigt, dass das Brückenverfahren in der gesamten
  Testmenge **kein einziges Mal** scheitert. Der zweite Weg wird dort nie gebraucht. Damit ist
  weiteres Feilen an der Sweep-Zerlegung ohne messbaren Nutzen – als E7 zur Entscheidung gestellt,
  mit dem Vorschlag, den Loop auf P2/P3 umzustellen. 2 neue Tests, insgesamt 985.

  **Merksatz:** Eine Regel, die in allen Tests denselben Wert liefert, egal wie sie lautet, ist
  nicht geprüft – sie ist nur unauffällig. Wer eine Verzweigung testen will, braucht einen Fall,
  in dem sich die Zweige unterscheiden.

- **2026-08-26 · Iteration 25 (S5):** **Die sechs Inseln sind verbunden.** Eine Zählung zu Beginn
  war ernüchternd: Von 409 `related`-Verweisen führte **genau einer** über eine Kategoriegrenze.
  Wer am Laser Blech schnitt und dessen Gewicht brauchte, fand von dort keinen Weg dorthin,
  obwohl beides längst da war – weder als Leser noch als Suchmaschine, die dem Linkgraph folgt.

  Jetzt: **41 kuratierte Paare**, 82 gerichtete Verweise, 59 von 153 Rechnern mit Anschluss an
  einen anderen Bereich. Alle 15 möglichen Bereichspaare sind belegt, und ein Test prüft, dass das
  Netz zusammenhängend bleibt – jede Kategorie muss von jeder anderen erreichbar sein.

  **Automatisch ging es nicht.** Ein Versuch über Stichwort-Überschneidung lieferte neben Treffern
  wie „Bohrer-Drehzahl ↔ Drehzahl beim Stahlbohren" (Überschneidung 10) eben auch „Dachneigung ↔
  Stützmaterial-Anteil". Für eine Seite, die von echtem Nutzen lebt, ist das zu grob. Also von
  Hand, geordnet nach tatsächlichen Arbeitswegen: Drehzahl und Vorschub, Gewinde, Blech, Kosten
  und Zeit, Plattenausnutzung, Schrauben ins Holz, Gewicht, Gehrung, Oberfläche.

  Zwei Entwurfsentscheidungen: Die Paare liegen in **einer** Tabelle statt verstreut in sechzig
  Tool-Dateien – so lassen sie sich an einer Stelle überprüfen. Und sie bekommen einen **eigenen
  Abschnitt** („Passt auch dazu"), weil die Rechner-Seite nur vier verwandte Rechner zeigt; ein
  fünfter Eintrag in `related` wäre unsichtbar geblieben.

  Die `updated`-Daten der Rechner bleiben unangetastet: Der Abschnitt ist eine Ergänzung an der
  Vorlage, keine inhaltliche Änderung am jeweiligen Rechner. Ehrliche Datumsangaben sind mehr wert
  als 153 frische Zeitstempel. 8 neue Tests, insgesamt 992.

  **Merksatz:** Interne Verlinkung, die nur innerhalb ihrer Kategorie bleibt, ist keine Verlinkung,
  sondern eine Sackgasse mit Karten drin. Erst der Weg nach draußen macht aus Einzelseiten eine
  Seite.

- **2026-08-26 · Iteration 26 (S6):** **Rechnungen lassen sich teilen.** Wer Werte verstellt, findet
  sie in der Adresszeile wieder; ein Knopf legt den Link in die Zwischenablage. Der Link führt
  dieselbe Rechnung wieder vor – für eine Rückfrage im Forum, eine Notiz an sich selbst oder eine
  Absprache in der Werkstatt.

  Drei Entscheidungen, die mehr wiegen, als es aussieht:

  **Nur Abweichungen wandern in die URL.** Wer nichts verstellt, bekommt keine Parameter, wer ein
  Maß ändert, bekommt genau eines. Das hält Links kurz – und sorgt nebenbei dafür, dass die
  geteilte Seite inhaltlich dieselbe bleibt wie die kanonische. Stellt man alles zurück,
  verschwindet die Query wieder ganz.

  **Fremden Werten wird nicht geglaubt.** Ein geteilter Link kommt von außen. Unbekannte Parameter
  fliegen raus, „abc" in einem Zahlenfeld ebenso, Auswahlwerte müssen zu den angebotenen gehören,
  und Zahlen außerhalb der erklärten Grenzen werden auf die Grenze gezogen statt durchgereicht.
  Live geprüft mit `?vc=abc&d=-999&boeser=1&x=<script>`: Ergebnis war `?d=0.1`, sonst nichts.

  **Die Adresszeile wird verzögert geschrieben.** Safari lässt rund 100 `replaceState`-Aufrufe je
  30 Sekunden zu und wirft danach – bei jedem Tastendruck zu schreiben wäre ein sicherer Weg in die
  Ausnahme. Jetzt 400 ms nach der letzten Änderung und nur, wenn sich die Adresse wirklich ändert.

  Das Canonical bleibt unangetastet: Es entsteht aus dem Seitenpfad, nicht aus der aufgerufenen
  Adresse – geprüft im Build und live. 12 neue Tests, insgesamt 1004.

  **Merksatz:** Eine URL mit Parametern ist eine Eingabe wie jede andere. Wer sie ungeprüft in
  Felder schreibt, hat sich eine Hintertür in den eigenen Rechner gebaut.

- **2026-08-26 · Iteration 27 (Q1):** **`npm run check` ist grün – 0 Fehler, 0 Warnungen.** Die
  beiden Meldungen begleiteten den Loop seit Iteration 16.

  Die erste war eine echte Kleinigkeit mit lehrreichem Grund: In `dxfsvg.ts` steht im `T`-Zweig des
  Pfad-Parsers `const c1 = prevCtrl ? … : p0` und weiter unten `prevCtrl = c1`. Damit hängt der Typ
  von `c1` an `prevCtrl` und umgekehrt; TypeScript bricht solche Ringschlüsse ab und macht daraus
  stillschweigend `any`. Der `S`-Zweig darüber hat dasselbe Muster, weist aber `c2` zu – deshalb
  war nur einer von beiden auffällig. Eine ausdrückliche Typangabe löst den Ring.

  Die zweite war **zwei Vite-Versionen im selben Baum**: Astro brachte vite 6 mit,
  `@tailwindcss/vite` und vitest brachten vite 5. Zur Laufzeit passte das zusammen, aber `Plugin`
  aus dem einen Paket gilt nicht als `PluginOption` aus dem anderen. Ein Cast hätte das zugedeckt –
  stattdessen jetzt **eine** Version: vitest von 2 auf 3 gehoben (2 verlangt vite 5), vite als
  ausdrückliche Abhängigkeit auf 6.4.3 und ein `overrides`-Eintrag, der alle darauf zieht. Der
  Zwischenstand war lehrreich: vitest 3 zog von sich aus vite 7 – aus zwei Versionen wurden zwei
  andere. Erst der Override vereinheitlicht wirklich.

  Weil der Umbau die Build-Kette selbst betrifft, habe ich das Ergebnis genauer geprüft als sonst:
  1004 Tests grün, 176 Seiten, 171 Vorschaubilder, 174 Sitemap-Einträge, CSS vorhanden,
  Tailwind-Klassen greifen, Teilen-Knopf und Querverweise stehen.

  **`npm run check` ist ab sofort Teil des Prüfschritts.** Es sieht Fehler, die zur Laufzeit stumm
  bleiben – in Iteration 16 entlarvte es einen Test, der 40 Minuten grün lief, ohne irgendetwas zu
  prüfen. Ohne IndexNow-Meldung: An den Seiten hat sich inhaltlich nichts geändert.

  **Merksatz:** Ein Cast ist eine Behauptung. Wo sich zwei Typpakete widersprechen, ist die Frage
  nicht, wie man den Prüfer überzeugt, sondern warum es zwei sind.

- **2026-08-27 · Iteration 28 (Q2):** **`npm run linkcheck` prüft die fertige Seite auf tote
  Verweise und verwaiste Seiten** – und fand beim ersten Lauf sofort einen: `/rechner/3d-druck-kosten`,
  verlinkt von der STL-Transformieren-Seite. Den Slug hatte ich in Iteration 14 selbst erfunden;
  es gibt ihn nicht. Weder Build noch Typcheck melden so etwas – der Link ist einfach da und führt
  ins Leere.

  Beim Korrigieren zeigte sich, dass auch der Satz drumherum nicht stimmte: Er versprach „aus dem
  neuen Volumen wird direkt der Materialpreis". Der Transformierer liefert aber Volumen, und der
  Preis braucht Gewicht. Der passende Rechner ist `modell-gewicht` – der nimmt genau ein
  Modellvolumen in cm³ entgegen. Jetzt führt der Weg über beide Schritte, und der Text sagt das
  auch. **Ein toter Link ist selten nur ein Tippfehler; meistens stimmt der Gedanke dahinter auch
  nicht ganz.**

  Die Prüflogik steht als reine Funktion in `src/lib/linkcheck.ts` und ist ohne Dateisystem
  getestet; das Skript sammelt nur die Dateien ein. Ausgeführt wird es mit Nodes Type-Stripping –
  so bleibt die Logik im getippten Teil des Repos, ohne dafür ein weiteres Werkzeug zu brauchen.

  **`npm run linkcheck` ist ab sofort Teil des Prüfschritts**, zusammen mit Test, Build und
  Typcheck. Stand danach: 177 Seiten, keine toten Verweise, keine Waisen. 11 neue Tests,
  insgesamt 1015.

  **Merksatz:** Verweise sind das Einzige an einer statischen Seite, das im Build niemand prüft.
  Alles andere bricht laut – ein falscher `href` bricht still.

- **2026-08-27 · Iteration 29 (Q3):** **Fünf Barrieren gefunden und behoben**, dazu `npm run
  a11ycheck` als bleibender Prüfschritt.

  Das Grundgerüst war schon in Ordnung – Sprache, genau eine Hauptüberschrift, Hauptbereich,
  Sprunglink, keine Bilder ohne Alternativtext. Die Befunde lagen darunter:

  **Drei Eingabefelder ohne Beschriftung** – das Suchfeld auf `/rechner` und zwei Felder im
  STL-Transformierer. Alle drei hatten einen Platzhalter oder ein `<span>` daneben; auf dem
  Bildschirm sieht das völlig normal aus, mit Screenreader ist es ein namenloses Kästchen.

  **Übersprungene Überschriftenebenen auf acht Seiten.** Auf den Kategorieseiten folgte auf die
  `h1` direkt die `h3` der Karten – jetzt gibt es dazwischen eine Abschnittsüberschrift (nur für
  Hilfsmittel sichtbar). Auf der 404-Seite kamen die Sprünge aus dem Fußbereich; dessen
  Überschriften stehen jetzt auf `h2`, was ohnehin richtiger ist: Fußbereich-Abschnitte sind
  Geschwister des Hauptinhalts, keine Unterpunkte.

  **Zwei Kontrastfehler.** Der gefüllte Knopf – der prominenteste Bedienknopf der Seite – hatte
  weiß auf `brand-600` nur **3,56:1**; nötig sind 4,5:1, und bei 14 px halbfett greift die
  Ausnahme für große Schrift nicht. Jetzt `brand-700` mit 5,18:1. Beim Überfahren wurde er
  bisher *heller* (`brand-500`, 2,80:1) – der Kontrast muss aber in jedem Zustand stimmen, also
  geht er jetzt nach `brand-800` (7,31:1). Und der Formel-Kasten auf jeder Rechnerseite lag mit
  `zinc-500` auf `zinc-100` bei **4,40:1**, knapp darunter – jetzt `zinc-600`.

  Die Farben sind damit eine Spur satter als vorher. Das ist eine sichtbare Änderung am
  Erscheinungsbild; ein Blick auf die Startseite zeigt, dass sie trägt.

  Die Prüfung steht als reine Funktion in `src/lib/a11ycheck.ts`, samt Kontrastrechnung nach WCAG.
  Was ein Browser braucht – Fokusreihenfolge, Verhalten mit Hilfsmitteln – deckt sie ausdrücklich
  nicht ab; das steht auch so im Modulkopf. 21 neue Tests, insgesamt 1035.

  **Merksatz:** Kontrast gilt für jeden Zustand, nicht nur für den ruhenden. Ein Knopf, der beim
  Überfahren heller wird, wird beim Überfahren auch schlechter lesbar.

- **2026-08-27 · Iteration 30 (Q4):** **202 umschriebene Umlaute in 21 Rechnern korrigiert** –
  „fuer", „Laenge", „Gewindeueberstand", „Zaehnezahl". Das las sich nach Notlösung aus einer Zeit
  ohne Umlaute auf der Tastatur und stand mitten im Text, den Leser und Suchmaschinen sehen.

  Der Weg dahin war lehrreicher als das Ergebnis. Mein erster Ansatz – jedes Wort mit ae/oe/ue/ss
  melden – lieferte **448 Treffer**, fast alles korrekte Wörter: „Durchmesser", „gemessen",
  „bewusst", „Klasse". Umgekehrt wurde es brauchbar: nicht eine Liste der Ausnahmen, sondern eine
  Liste der **tatsächlichen Umschreibungen**. Damit blieben 177 Fundstellen in genau 20 Rechnern –
  und das deckte sich mit der Schätzung im Backlog.

  Zwei Dinge mussten beim Ersetzen unangetastet bleiben, und beide hätten stillen Schaden
  angerichtet: **Bezeichner** (`id: 'laenge'` ist richtig, seine Beschriftung „Länge" nicht) und
  **Suchwörter** (wer transliteriert sucht, soll fündig werden). Deshalb werden `slug`, `id`,
  `value` und `keywords` vor dem Ersetzen maskiert.

  Drei Fälle habe ich nur durch Nachsehen richtig gemacht: **`ae`** ist beim Fräsen das
  Formelzeichen der Eingriffsbreite, kein umschriebenes „ä". **„Kreissäge"** und **„Darrmasse"**
  sind mit ss korrekt. Und **„Bettmasse"** meint im Aufheizrechner die *Masse* des Betts, nicht
  dessen *Maße* – eine Zeile weiter hätte „Bettmaße" daraus einen Fehler gemacht.

  Die 21 berührten Rechner haben ein neues `updated`-Datum, die übrigen 132 nicht. 3 neue Tests
  sperren die Fehlerklasse: kein sichtbarer Text darf umschriebene Umlaute enthalten, Bezeichner
  dürfen es weiterhin, und `ae` bleibt. Insgesamt 1038.

  **Ohne Netz:** GitHub und die Live-Seite waren während dieser Iteration nicht erreichbar
  (`curl` liefert 000, `git` bricht nach 75 s ab). Gesundheitscheck, Push und IndexNow konnten
  deshalb nicht laufen. Die Arbeit ist lokal fertig und vollständig geprüft – Tests, Build,
  Typcheck, Link-Check, A11y-Check alle grün – und **wartet als lokaler Commit auf den Push.**
  Die nächste Iteration schiebt ihn nach.

  **Merksatz:** Beim Suchen nach Fehlern ist die Liste der Ausnahmen fast immer die falsche Seite.
  Wer „alles außer richtig" sucht, findet vor allem Richtiges.

- **2026-08-27 · Iteration 31 (T19):** **Zahnriemen-Rechner** – Länge, Zähnezahl, Achsabstand
  und Umschlingung. Zahnriemen gibt es nur in ganzen Zähnen; der Wunsch-Achsabstand führt deshalb
  fast nie auf einen erhältlichen Riemen. Der Rechner rundet auf die nächste Zähnezahl und rechnet
  zurück, wohin die Welle dann gehört – die Differenz ist der Weg, den der Spanner hergeben muss.

  **Was ich bewusst nicht gebaut habe:** Erste Wahl wäre eine ISO-Passungstabelle gewesen (H7/g6
  und Verwandte) – hohe Nachfrage, echter Nutzen. Deren Zahlenwerte hätte ich aber aus dem
  Gedächtnis eintippen müssen, und ohne Netz gab es keine Quelle zum Gegenprüfen. Genau so ist in
  Iteration 5 ein falsches Gridfinity-Maß entstanden. Also etwas, das sich **vollständig
  herleiten** lässt: reine Geometrie, jede Zahl nachrechenbar.

  Die Umkehrung – welcher Achsabstand gehört zu einer vorgegebenen Länge – hat keine geschlossene
  Formel, weil der Umschlingungswinkel selbst vom Achsabstand abhängt. Sie läuft über eine
  Intervallhalbierung, und ein Test prüft, dass sie exakt dorthin zurückfindet, wo die
  Vorwärtsrechnung herkam. Dazu die Probe an einer Stelle, wo es eine geschlossene Formel gibt:
  Bei gleich großen Scheiben ist die Länge genau 2a + z·p – die krummen Teilkreise heben sich weg.
  16 neue Tests, insgesamt 1056.

  **Zum zweiten Mal ohne Netz:** GitHub, Vercel und die eigene Seite sind aus dieser Umgebung nicht
  erreichbar (DNS löst auf, Verbindung läuft ins Zeitlimit), während `example.com` und die
  npm-Registry antworten – also eine selektive Sperre, kein Ausfall. Zwei Commits warten damit auf
  den Push. Alles ist lokal geprüft: Tests, Build, Typcheck, Link-Check, A11y-Check.

  **Merksatz:** Wenn die Quelle fehlt, wähle die Aufgabe, die keine braucht. Eine Tabelle aus dem
  Gedächtnis ist keine Tabelle, sondern eine Behauptung mit Nachkommastellen.

- **2026-08-27 · Iteration 32 (Nachprüfung):** **Kein Netz, also die ausstehende Arbeit im
  Browser nachgeprüft** – und dabei einen Fehler gefunden, den kein Test hatte.

  Zwei Commits warteten ungeprüft im Browser auf den Push. Statt weitere Arbeit aufzustapeln, habe
  ich beide örtlich durchgespielt. Der Umlaut-Durchgang war sauber: keine Reste, keine kaputte
  Kodierung, Umlaute richtig dargestellt.

  Beim Zahnriemen-Rechner zeigte sich dagegen etwas, das im HTML nicht auffällt: Bei überlappenden
  Scheiben standen Achsabstand und Umschlingung richtig auf null – **die Kopfzeile meldete aber
  weiterhin selbstbewusst „Riemen mit 60 Zähnen"**. Für eine Anordnung, die es nicht geben kann,
  ist das die schlechteste aller Ausgaben: eine Zahl, die brauchbar aussieht. Jetzt stehen alle
  abgeleiteten Werte auf null, und der Hinweis nennt den kleinsten möglichen Achsabstand. Der Test
  für den Grenzfall prüft das mit.

  **Weiterhin kein Netz:** GitHub, Vercel und die eigene Seite antworten aus dieser Umgebung nicht,
  während andere Hosts erreichbar sind. Drei Commits warten jetzt auf den Push; alle sind örtlich
  vollständig geprüft – Tests, Build, Typcheck, Link-Check, A11y-Check – und der neue Rechner
  zusätzlich im Browser.

  **Merksatz:** Eine Ausgabe, die bei unmöglicher Eingabe trotzdem eine plausible Zahl zeigt, ist
  schlimmer als eine Fehlermeldung. Grenzfälle gehören nicht nur abgefangen, sondern auch
  ausgesprochen.

- **2026-08-27 · Iteration 33 (T20):** **Rechner für Schritte je mm** – aus Motorschritten,
  Mikroschritten und Antriebsdaten, dazu Auflösung und die Geschwindigkeit, an der die Steuerung
  aussteigt.

  Die Auswahl war wieder von der fehlenden Netzverbindung geprägt, diesmal produktiv: Gesucht war
  eine Aufgabe, deren Ergebnis sich **gegen allgemein bekannte Werte** prüfen lässt, wenn schon
  keine Quelle erreichbar ist. Genau das liefert dieser Rechner – GT2 mit 20 Zähnen, 1,8°-Motor
  und 1/16 ergibt 80 Schritte/mm, eine T8-Spindel 400. Diese beiden Zahlen stehen in praktisch
  jeder Drucker-Firmware; sie sind die Probe, die eine Tabelle aus dem Gedächtnis nicht hat.

  Hübsch ist, dass sich beim Riemen die krummen Teilkreisdurchmesser wegkürzen: Der Weg je
  Umdrehung ist schlicht Zähnezahl mal Teilung. Deshalb kommt die glatte 80 überhaupt zustande.

  Auch dieser Rechner wurde im Browser durchgespielt, nicht nur im HTML – nachdem die
  Nachprüfung in der vorigen Iteration einen echten Fehler zutage gefördert hatte. Diesmal ohne
  Befund. 5 neue Tests, insgesamt 1061. Querverweis zum Zahnriemen-Rechner gesetzt.

  **Vierter Commit ohne Netz.** GitHub bleibt aus dieser Umgebung gesperrt, während andere Hosts
  antworten. Alles ist örtlich vollständig geprüft.

  **Merksatz:** Wenn keine Quelle erreichbar ist, wähle eine Aufgabe mit bekanntem Ergebnis. Zwei
  Zahlen, die jeder Drucker-Nutzer kennt, sind mehr wert als eine Tabelle, die niemand nachprüfen
  kann.

- **2026-08-27 · Iteration 34 (Gesamtprobe):** **Keine neue Funktion, sondern eine Kontrolle des
  Gesamtstands.** Vier Commits gehen auf einmal live, sobald die Netzsperre fällt – bisher hatte
  ich aber nur einzelne Seiten angesehen. Also neun Seiten quer durch alle Bauarten geprüft:
  Startseite, Übersicht, zwei Kategorien, drei Rechner, ein Generator, die Fehlerseite.

  Ergebnis: überall HTTP 200, genau eine Hauptüberschrift, ein Hauptbereich, richtiges Canonical,
  **keine kaputte Kodierung**, keine Reste umschriebener Umlaute.

  Ein Treffer erwies sich als Fehlalarm meiner eigenen Prüfung: Auf der Zahnriemen-Seite meldete
  sie zwei Umschreibungen – es war der Slug `zahnriemen-laenge` in den JSON-LD-Daten. Slugs sind
  bewusst ASCII; mein Muster hatte den Inhalt des Script-Elements mitgelesen.

  Bewusst **keine fünfte Änderung** obendrauf: Vier ungetestet-live Commits sind schon mehr, als
  mir lieb ist. Solange nichts ausgeliefert werden kann, ist Nachprüfen die nützlichere Arbeit als
  Nachlegen.

  **Merksatz:** Wer nicht ausliefern kann, sollte nicht weiterstapeln. Unausgelieferte Arbeit
  altert und wird mit jedem Commit schwerer zu beurteilen, wenn sie endlich rausgeht.

  **Nachtrag, gleiche Iteration:** Die Netzsperre fiel beim erneuten Versuch – **alle fünf Commits
  sind ausgeliefert** (A11y, Umlaute, Zahnriemen, Grenzfall, Schritte je mm). Live geprüft: beide
  neuen Rechner antworten mit 200, richtiges Canonical, keine kaputte Kodierung, je drei JSON-LD-
  Blöcke, beide in der Sitemap (176 Einträge). 27 URLs per IndexNow gemeldet, angenommen.

  Im Browser nachgerechnet statt nur angeklickt:
  - Schritte je mm: GT2/20 Zähne → **80 Schritte/mm**, 12,5 µm, 40 mm Weg je Umdrehung; auf
    T8-Spindel umgeschaltet → **400 Schritte/mm**, 2,5 µm. Beides die Werte aus der Firmware.
  - Zahnriemen-Grenzfall: 20/60 Zähne, 5 mm Teilung, 5 mm Achsabstand → alle abgeleiteten Werte
    stehen auf 0, Hinweis „mindestens 63,66 mm". Die Teilkreise (31,83 / 95,49 mm) bleiben stehen –
    richtig so, die hängen nicht vom Achsabstand ab.
  - Nebenbei bestätigt: Die Teilen-URL nimmt nur Nicht-Vorgaben auf (`?z2=60&p=5&a=5`, z1=20 fehlt).

  Ein zweiter Fehlalarm meiner eigenen Prüfung: Die Eingabefelder haben kein `id`, was nach einem
  A11y-Fehler aussah. Sie stehen aber **innerhalb** ihres `<label>` und tragen `data-input="z1"` –
  das ist gültig ausgezeichnet, und `a11ycheck` hat es zu Recht durchgelassen.

- **2026-08-27 · Iteration 35 (T21):** **NE555-Rechner live** unter `/rechner/ne555-rechner` – und
  damit die **neue Kategorie Elektronik**. Drei Betriebsarten: astabil, astabil mit Diode über R2,
  monostabil. Ausgegeben werden Frequenz, Periodendauer, High- und Low-Zeit, Tastverhältnis.

  Der Kern ist unspektakulär (ln2 beim Oszillator, ln3 beim Monoflop), interessant sind die drei
  Entscheidungen drumherum:

  1. **Im Monoflop steht keine Frequenz.** Ein Monoflop schwingt nicht – eine Frequenz hinzuschreiben
     wäre eine Zahl, die brauchbar aussieht und keine hat. Dieselbe Regel wie beim Zahnriemen-
     Grenzfall, nur konsequenter umgesetzt: Statt Nullen auszugeben, fällt die Zeile ganz weg.
  2. **Zeile „Mit E12-Bauteilen".** Jeder Rechner im Netz liefert 69,8 kΩ und lässt einen damit
     stehen. Hier steht daneben, was mit 68 kΩ wirklich herauskommt. Gerundet wird logarithmisch,
     nicht arithmetisch – die E-Reihe ist geometrisch gestuft, die Grenze zwischen 68 und 82 liegt
     bei 74,7 und nicht bei 75.
  3. **Der 50-%-Hinweis steht dauerhaft am Ergebnis**, nicht nur im FAQ. Dass das Tastverhältnis im
     Standardaufbau nie unter 50 % kommt, ist *die* Stolperstelle des Bausteins; wer das erst nach
     dem Löten merkt, hat umsonst gelötet.

  **Die Querverlinkungs-Sperre aus S5 hat sofort zugeschlagen:** Die neue Kategorie war über keine
  Verbindung erreichbar, der Test wurde rot. Das ist genau ihr Zweck – eine siebte Insel wäre sonst
  unbemerkt entstanden. Zwei Paare ergänzt (Leiterquerschnitt, Stepper-Vref).

  Dabei aufgefallen: Der Leiterquerschnitt-Rechner liegt unter *Metall*. Nicht verschoben, sondern
  als **E8** notiert – Bestandsinhalte umsortiere ich nicht nebenbei.

  Ein Test war zunächst rot, und zwar zu Recht am Test: Ich hatte auf „Pin 7" geprüft, das steht
  aber auch im harmlosen „entlädt über R2 nach Pin 7". Jetzt prüft er auf „überlastet".

  Prüfkette: 1091 Tests, 181 Seiten, `check` 0 Fehler, keine toten Verweise, keine A11y-Befunde.
  Im Browser alle drei Betriebsarten durchgeschaltet: 1,03 Hz in der Vorgabe, 51,63 ms als Monoflop,
  721,3 Hz mit Diode – letzteres deckungsgleich mit dem Testwert.

- **2026-08-27 · Iteration 36 (T22):** **Ohmsches Gesetz live** unter `/rechner/ohmsches-gesetz`.
  Alle sechs Kombinationen aus U, I, R und P – zwei eingeben, zwei fallen heraus.

  Vorweg **`src/lib/elektro.ts`** angelegt: E12- und E24-Reihe, Vorsatzeinheiten, Belastbarkeit.
  Die E-Reihe steckte bis eben im NE555-Rechner; beim zweiten Gebrauch verschiebt man sie, statt
  sie zu kopieren. Der NE555 zieht jetzt von dort und wurde dabei nebenbei besser: Sein
  Widerstandstext schrieb bisher stur kΩ, jetzt kommen 500 Ω auch als 500 Ω heraus.

  Drei Dinge, die den Rechner von einer Formelsammlung unterscheiden:

  1. **Alle vier Größen stehen im Ergebnis**, auch die eingegebenen – als Gegenprobe gegen
     Zehnerpotenz-Vertipper. Die eingegebenen sind als solche gekennzeichnet, hervorgehoben wird
     nur die erste berechnete.
  2. **Die Einheit schaltet mit**: 22,73 mA statt 0,0227 A, 4,7 kΩ statt 4700 Ω.
  3. **Belastbarkeit mit Faktor 2 Reserve**, gerundet auf handelsübliche Klassen. Die Nennleistung
     auf dem Bauteil gilt frei stehend bei 70 °C – im Gehäuse bleibt davon weniger übrig.

  **Zwei Befunde, beide bei mir und nicht im Code:**

  - Ein Test behauptete, E12 weiche nie mehr als 10 % ab. Stimmt nicht: Die Reihe ist gerundet und
    dadurch nicht sauber geometrisch. Der ideale Faktor wäre ¹²√10 = 1,2115, der Schritt 12 → 15
    macht aber 1,25 – der größte der Reihe. Schlimmster Fall ist der halbe Schritt, also
    **√1,25 = 11,8 %**, erreicht bei x = 13,6. Schranke korrigiert und begründet.
  - `astro check` fand einen Typfehler in meiner eigenen Testdatei, den vitest nicht sieht: eine
    Objektliteral-Liste mit Union-Typ. Vitest transpiliert nur, es prüft keine Typen – deshalb
    gehört `check` in die Kette.

  **Und einen echten Textfehler fand erst der Browser:** Trifft der berechnete Widerstand die
  E12-Reihe zufällig genau, stand dort der Widerspruch „150 Ω ist kaufbar, 150 Ω nicht". Das ist
  kein Randfall – Lehrbuchbeispiele sind genau so gewählt, dass es aufgeht. Behoben, mit Test.
  Damit hat die Browser-Probe in drei aufeinanderfolgenden Iterationen etwas gefunden, das keine
  Testsuite gemeldet hat.

  Prüfkette: 1126 Tests, 182 Seiten, `check` 0 Fehler, keine toten Verweise, keine A11y-Befunde.
  Im Browser alle sechs Kombinationen auf denselben Arbeitspunkt (12 V, 2 A, 6 Ω, 24 W) gebracht –
  jede liefert dieselben vier Zahlen.

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
