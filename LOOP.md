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
3. **Task wählen:** obersten offenen Punkt aus dem Backlog (P1 vor P2 vor P3). Passt er nicht mehr
   (schon erledigt/obsolet), streichen mit Begründung und nächsten nehmen.
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

## Takt & Abbruch (für den `/loop`-Betrieb)

- Nach erfolgreicher Iteration: nächste in **30–60 min** planen.
- Nichts Sinnvolles zu tun (Backlog leer und nicht sinnvoll nachfüllbar): **noop**, Wiedervorlage 60 min.
- Backlog leer: erst aus `keywords/`-Recherche neue P1/P2-Punkte ableiten und eintragen, dann weiter.
- **Stoppen** (Loop beenden + Zusammenfassung an Bastian), wenn: dieselbe Blockade zweimal in Folge
  auftritt (z. B. Push scheitert, Deploy kaputt), oder eine Entscheidung von Bastian nötig ist,
  ohne die nichts mehr sinnvoll weitergeht.

## Backlog

### P1 – Neue Tools (je 1 pro Iteration, „kostet woanders Geld" zuerst)

- [ ] **T1 Fingerzinken-Box-Generator** (SVG/DXF): Kisten mit Fingerzinken für Laser/CNC.
      Keywords: „laser box generator deutsch", „kiste fingerzinken generator".
- [ ] **T2 Schnittdaten-Rechner mit Material-Datenbank** (Feeds & Speeds Pro): Material × Werkzeug
      → vc/fz-Empfehlung + Drehzahl/Vorschub. Pendant zu HSMAdvisor/FSWizard (kostenpflichtig).
      Keywords: „schnittdaten rechner", „schnittdaten aluminium fräsen".
- [ ] **T3 STL-Analyse im Browser**: Datei-Upload (bleibt lokal) → Volumen, Gewicht, Materialkosten
      je Material. Keyword: „stl volumen filament rechner".
- [ ] **T4 DXF ⇄ SVG Konverter** (clientseitig, Linien/Polylinien/Kreise/Bögen).
      Online-Konverter sind ad-verseucht oder kostenpflichtig.
- [ ] **T5 Gridfinity-Bin-Generator** (STL-Export im Browser). Achtung Recherche-Hinweis:
      DE-Nutzer suchen englisch → Seite DE mit EN-Keywords.
- [ ] **T6 Living-Hinge-Generator** (SVG/DXF-Muster für Laser).
- [ ] **T7 Zuschnittoptimierung v2**: Schnittliste/Etiketten-Druck, mehrere Plattenformate gleichzeitig.

### P2 – SEO

- [ ] **S1 Sitemap-`lastmod` pro Seite** aus `tool.updated` statt global `new Date()` (ehrliche Signale).
- [ ] **S2 `dateModified` in JSON-LD** + „Aktualisiert"-Datum menschenlesbar (de-DE) rendern.
- [ ] **S3 Content-Lücken schließen:** 13 Tools ohne `intro`, 5 ohne `howto`, 4 ohne `related`.
- [ ] **S4 Per-Tool-OG-Bilder** zur Build-Zeit generieren (ohne externe Dienste).
- [ ] **S5 Cross-Kategorie-`related`-Kuratierung** (z. B. Laser ↔ CNC ↔ Holz sinnvoll verweben).
- [ ] **S6 Teilen-Links:** Rechner-Eingaben als URL-Parameter, Canonical bleibt sauber.

### P3 – Qualität & Bugs

- [ ] **Q1 `npm run check` komplett grün:** vite-Typkonflikt in `astro.config.mjs` beheben.
- [ ] **Q2 Interner Link-Check** über `dist/` (Script, findet 404s/Waisen).
- [ ] **Q3 A11y-Durchgang** der Kernseiten (Labels, Fokusreihenfolge, Kontraste).

### Entscheidungs-Log (braucht Bastian – Loop setzt das NICHT um)

- [ ] **E1 Monetarisierung:** Affiliate/Ads auf Commercial-Intent-Keywords (Recherche in `keywords/`).
- [ ] **E2 Zweite Nische:** Garten ist laut Recherche Top-Kandidat – gleiche Domain oder Schwester-Domain?
- [ ] **E3 EN-Version** (hreflang) für EN-lastige Cluster (Gridfinity, Living Hinge, Board Feet).
- [ ] **E4 Google Search Console:** Zugang/Export für Claude → Backlog-Priorisierung nach echten Query-Daten.

## Iterations-Log

- **2026-08-25 · Iteration 0 (Setup):** Zuschnittoptimierung gebaut und live
  (`/generatoren/zuschnittoptimierung`): Guillotine-Packing-Engine (`src/lib/cutlist.ts`) mit 10 Tests,
  Schnittplan-SVG, Druck, localStorage, Reste-Liste, FAQ-Schema. Nebenbei: `/rechner` listet jetzt auch
  Generatoren (waren vorher unauffindbar), interne Links aus 2 Holz-Tools, `@astrojs/check` installiert.
  LOOP.md angelegt. IndexNow-Ping: 6 URLs.

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
