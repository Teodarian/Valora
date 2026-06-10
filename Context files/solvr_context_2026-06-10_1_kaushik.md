# Solvr — Full Context File
**Created:** 2026-06-03
**Last updated:** 2026-06-10
**Operator denne sesjonen:** Kaushik Rompichala
**AI:** Claude (Sonnet 4.6)

---

## Session end rules (mandatory)

When the user types "end session", the AI must:
1. Generate a new `solvr_context_[YYYY-MM-DD]_[nummer]_[kaushik/teo].md` file (user downloads manually)
2. Create a new entry in the **AI Carryforwards** Notion database with a subpage containing the full context
3. Add an entry to the **Progress Log** (Added by: Claude, correct date, Phase, description)
4. Update **Bug Tracker** — resolve/archive fixed bugs, add new ones
5. Update checklists on BottByrå and Vendera product pages
6. Prompt operator to add their own words to the Progress Log

**CRITICAL — context file regel:**
Bruk alltid forrige sesjonens kontekstfil som base. ALDRI fjern noe med mindre operatøren eksplisitt ber om det, eller begge parter er enige om en endring. Legg bare til nytt innhold eller oppdater eksisterende punkter på stedet. Når du er i tvil — behold det.

**Navneregel for kontekstfiler:**
- Første fil den dagen: `solvr_context_YYYY-MM-DD_1_[kaushik/teo].md`
- Andre fil: `solvr_context_YYYY-MM-DD_2_[kaushik/teo].md`
- Og så videre. Alltid nummerert fra 1.

## Session start rules (mandatory)

When a new chat begins and the context file is uploaded, the AI must **before doing any work**:
1. Ask "Hvem opererer denne sesjonen — Kaushik eller Teo?" if not already clear from the file
2. Read the context file fully
3. Fetch the following Notion pages live to catch anything changed since the file was written:
   - Solvr Company HQ: https://app.notion.com/p/374b05d7790b815f9689d396569562bd
   - BottByrå Oslo: https://app.notion.com/p/374b05d7790b810ba12fcb5e31990e21
   - Vendera: https://app.notion.com/p/374b05d7790b81489e4cd216e1784380
   - Progress Log: https://app.notion.com/p/51c52de4c64346b18cf6b6ad2b1fa716
   - Bug Tracker: https://app.notion.com/p/ae74217f7c804e8f9630d130f3aad7dc
   - AI Carryforwards: https://app.notion.com/p/fe24cbd1c8874030b94f26b5a526d5c6
4. Confirm out loud: operator identity, current status, any discrepancies between context file and Notion, understanding of the task
5. Only then start work

---

## 1. Selskapsidentitet

### Team
| Person | Rolle |
|---|---|
| **Kaushik Rompichala** | BottByrå Oslo — chatbots, outreach, klienter |
| **Teo** | Vendera — backend, Flask, API-migrasjon |

- **Selskapsnavn:** Solvr
- **Type:** Lite digitalt konsulentfirma — to personer, Oslo, Norge
- **Modell:** Vi jobber sammen. Bruk alltid "vi" og "oss", aldri enkeltpersoner med mindre det gjelder spesifikt ansvarsområde
- **Produkter:** BottByrå Oslo + Vendera
- **Retning:** To produktlinjer — custom chatbot-integrasjon for bedrifter (BottByrå) og ERP for skolers elevbedrifter (Vendera)
- **Notion HQ:** https://app.notion.com/p/374b05d7790b815f9689d396569562bd
- **Tone:** Direkte, ingen motivasjonstaler, ingen emoji i leveranser
- **Forretningsspråk:** Norsk til klienter, norsk i Notion

---

## 2. BottByrå Oslo — nåværende status

**Konsept:** Bygger og integrerer custom chatbotter for lokale bedrifter. Primærmarked: Oslo (barbershops, treningssentre, restauranter, saloner).
**Ansvarlig:** Kaushik
**Verdiforslag:** "Kundene dine får svar automatisk — selv klokken 23. Ingen lønnskostnad, ingen manuelle svar."
**Notion-side:** https://app.notion.com/p/374b05d7790b810ba12fcb5e31990e21

### Tech Stack
| Verktøy | Formål | Status |
|---|---|---|
| Typebot | Bygg/host botts | ✅ Live — 3 botts bygget |
| OpenAI gpt-4o-mini | AI-svar | ✅ Koblet til alle 3 botts |
| Cal.com | Booking | ❌ Ikke satt opp |
| Vercel | Host nettside | ✅ Koblet til GitHub |
| Flask | Backend for hjemmeserver | ✅ Satt opp og kjører lokalt |
| Formspree | Kontaktskjema | ✅ ID: meedalga (live i index.html) |
| Notion | Forretningsorganisering | ✅ Live |
| ManyChat | Instagram DM | 🔜 Fase 2 |
| Stripe / Vipps | Betalinger | ❌ Ikke startet |

### Live Botts
| Bott | Embed ID |
|---|---|
| Hair Magic Barbershop | hair-magic-u6hg3yk |
| Oslo Treningssenter | oslo-treningsenter-gba4l00 |
| Oslo Restaurant | resturant-a2viody |

**Embed-regel:** Bruk alltid iframes — aldri Typebot JS-biblioteket (fungerer ikke for flere botts på én side).
```html
<iframe src="https://typebot.io/[BOTT-ID]" style="width:100%;height:500px;border:none;"></iframe>
```

### Typebot OpenAI-oppsett
- Action: **Create chat completion**
- Modell: **gpt-4o-mini**
- Messages: **system** (systemprompt) + **user** (`{{Chat gpt querry}}`)
- Save response: **Message content** → variabel `query output`

### Nettside — designsystem (Bit-Minimalism fra Google Stitch)
| Token | Verdi |
|---|---|
| Bakgrunn | #131313 |
| Aksent | #ff5c00 (oransje) |
| Tekst | #e2e2e2 |
| Muted | #a1a1a1 |
| Outline | #3a3a3a |
| Font overskrift/UI | Space Mono |
| Font brødtekst | Inter |
| Hjørner | 0px (skarpe) |
| Hover-animasjon | 0s (ingen easing — pixel-stil) |

**Filstruktur (Vercel — statisk):**
```
repo/
  index.html                   ✅ Redesignet 2026-06-06
  booking-frisør.html          ✅ Redesignet 2026-06-06
  booking-treningssenter.html  ✅ Redesignet 2026-06-06
  booking-restaurant.html      ✅ Redesignet 2026-06-06
  vercel.json
```

**Filstruktur (Flask — hjemmeserver):**
```
bottbyra/
  app.py
  config.py
  requirements.txt
  routes/
    __init__.py
  templates/
    index.html
    booking-frisor.html
    booking-restaurant.html
    booking-treningssenter.html
  static/
    css/
    js/
```

**Flask-kommandoer (Mac):**
```bash
cd ~/Desktop/bottbyra
pip3 install flask
python3 app.py
```
Åpne i nettleser: `http://127.0.0.1:5000`
Stop server: `Ctrl+C`
Port 5000-konflikt: slå av AirPlay Receiver i System Settings → General → AirDrop & Handoff

**Språkregler for nettsiden:**
- Aldri "Kaushik Rompichala" alene — bruk "vi/oss"
- Der navn er nødvendig: "Kaushik & Teo" eller "Kaushik og Teo"
- Kaushik: chatbots og kundekontakt / Teo: backend og integrasjoner

### Priser
| Pakke | Månedlig | Engangs | Inkluderer |
|---|---|---|---|
| Starter | 1 000 kr/mnd | 3 500 kr | Nettside-bott, AI, booking |
| Growth | 2 500 kr/mnd | 6 500 kr | + Instagram DM, lead-innsamling |
| Full | 4 000 kr/mnd | 11 000 kr | + WhatsApp, nettside-synk |
| Support-retainer | 800 kr/mnd | Tillegg | Oppdateringer, overvåking |

Første klient: gratis mot testimonial + porteføljetillatelse.

### Sjekkliste — Fase 1 (nåværende)
- [x] 3 botts bygget i Typebot
- [x] Vercel koblet til GitHub
- [x] index.html ferdig og ryddet
- [x] 3 demo bookingsider bygget
- [x] Typebot embed-domene rettet til typebot.io
- [x] Norske systemprompts laget for alle 3 botts
- [x] Nettside redesignet til Bit-Minimalism (Google Stitch)
- [x] Språk oppdatert til vi/oss på alle sider
- [x] Git submodule fjernet — botbyra-portfolio merget inn i Valora-repo
- [x] Flask-backend satt opp og kjører lokalt (hjemmeserver-oppsett)
- [x] OpenAI gpt-4o-mini koblet til alle 3 Typebot-botts
- [ ] Rydd opp unødvendige elementer og feil ordbruk på nettsiden (neste sesjon)
- [ ] Hent Gemini API-nøkkel (aistudio.google.com — gratis)
- [ ] Sett opp Cal.com booking-lenker
- [ ] Test alle 3 botts på mobil (10 spørsmål hver)
- [ ] Oppdater Notion-titler fra BotByrå til BottByrå

### Sjekkliste — Fase 2 (outreach)
- [ ] Bygg liste over 20 Oslo-bedrifter i Lead Pipeline
- [ ] Send outreach-DMs (norsk mal)
- [ ] Følg opp én gang etter 3 dager uten svar
- [ ] For de som svarer: send demo-lenke, tilby 15 min samtale

### Sjekkliste — Fase 3 (første klientleveranse)
- [ ] Tilpass bott med ekte klientinfo
- [ ] Ta opp Loom-gjennomgang og send til klient
- [ ] Fyll inn migrasjonsdokument
- [ ] Be om skriftlig testimonial etter 2 uker

### Åpne bugs
| Bug | Prioritet |
|---|---|
| Cal.com booking-lenker er placeholders | Medium |
| Notion-titler viser BotByrå (enkel t) | Low |
| Nettside har unødvendige elementer / feil ordbruk — ikke gjennomgått ennå | Medium |

### Systemprompts (OpenAI gpt-4o-mini)
Lim inn i Typebot → OpenAI-blokk → Messages → system-role.

**Hair Magic Barbershop:**
```
Du er en hjelpsom kundeserviceassistent for Hair Magic Barbershop i Oslo.
Vær vennlig, kort og konkret. Svar kun på spørsmål som gjelder barbershopen eller hårpleie.
Svar alltid på samme språk som kunden skriver på.

Informasjon om barbershopen:
- Adresse: Karl Johans gate 12, 0154 Oslo
- Telefon: +47 22 11 33 44
- Åpningstider: Man–Tir 10–18 / Ons–Tor 10–20 / Fre 09–18 / Lør 09–16 / Søn stengt
- Priser: Herreklipp 350kr, Skjeggtrim 200kr, Combo 499kr, Barneklipp 250kr, Hot Towel Shave 299kr, VIP-pakke 699kr
- For timebestilling, send kunden til Book-knappen
```

**Oslo Treningssenter:**
```
Du er en hjelpsom kundeserviceassistent for Oslo Treningssenter.
Vær vennlig, kort og konkret. Svar kun på spørsmål som gjelder treningssenteret.
Svar alltid på samme språk som kunden skriver på.

Informasjon om senteret:
- Adresse: Grønland 17, 0188 Oslo
- Telefon: +47 23 45 67 89
- Åpningstider: Man–Fre 06–23 / Lør 08–20 / Søn 09–18
- For timebestilling og mer info, send kunden til Book-knappen
```

**Oslo Restaurant:**
```
Du er en hjelpsom kundeserviceassistent for Oslo Restaurant.
Vær vennlig, kort og gjestfri. Svar kun på spørsmål som gjelder restauranten.
Svar alltid på samme språk som kunden skriver på.

For bordreservasjon og mer info, send kunden til Book-knappen.
```

### Outreach-maler
**Første kontakt (DM):**
Hei! Vi bygger chatbotter for bedrifter i Oslo — den svarer kundene automatisk, booker timer og håndterer spørsmål døgnet rundt. Kan sende en rask demo hvis det høres interessant ut?

**Oppfølging (3 dager uten svar):**
Hei igjen! Bare ville sjekke om du fikk meldingen vår. Demoen tar bare 10 minutter — ingen forpliktelse. Vil du ta en titt?

**På demo — bruk disse formuleringene:**
- "Den svarer kundene dine automatisk — selv om natten"
- "Den booker timer uten at du trenger å være pålogget"
- "Den håndterer de samme 10 spørsmålene du får hver uke"

**Aldri si til klienter:** AI, machine learning, GPT, automation workflow, API

---

## 3. Vendera — nåværende status

**Konsept:** ERP/styringssystem solgt til skoler for bruk i elevbedrifter. Tidligere navn: Valora.
**Ansvarlig:** Teo
**Notion-side:** https://app.notion.com/p/374b05d7790b81489e4cd216e1784380

### Tech Stack
- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Python Flask
- Database: SQLite via SQLAlchemy (PostgreSQL senere)
- Ingen React nå
- Gradvis migrasjon modul for modul

### Mappestruktur
```
Vendera/
  app.py
  config.py
  extensions.py
  models.py
  requirements.txt
  routes/
    __init__.py
    auth.py
  templates/
    index.html
  static/
    css/style.css
    js/app.js
```

**Viktige regler:**
- `templates/` må ligge ved siden av `app.py`, ikke inne i `static/`
- CSS i `static/css/style.css`, JS i `static/js/app.js`
- Flask renderer `templates/index.html`
- I HTML: bruk `{{ url_for('static', filename='css/style.css') }}`

### Kommandoer (Mac)
```bash
python3 --version
cd ~/Desktop/Vendera
pip3 install flask flask-sqlalchemy
flask --app app init-db
python3 app.py
```
Åpne i nettleser: `http://127.0.0.1:5000`
Stop server: `Ctrl+C`
Hard refresh browser: `Cmd+Shift+R`
Legg Flask til PATH (midlertidig): `export PATH="$PATH:$(python3 -m site --user-base)/bin"`
Legg Flask til PATH (permanent): `echo 'export PATH="$PATH:$(python3 -m site --user-base)/bin"' >> ~/.zshrc`

### Slette testbruker / localStorage
1. `Cmd+Option+I` → DevTools
2. Application-fanen → Local Storage → `http://127.0.0.1:5000`
3. Slett alle nøkler → `Cmd+Shift+R`

### Sjekkliste — Fase 1 (nåværende)
- [x] Frontend prototype ferdig (alle moduler)
- [x] Flask-backend satt opp
- [x] Backend auth (register/login/logout/me) implementert
- [x] app.py med eksplisitt root/template/static-mapper
- [x] config.py, extensions.py, models.py
- [x] routes/auth.py med login_required decorator
- [x] Werkzeug passord-hashing
- [x] Flask-sesjoner med signed cookies
- [x] Vendera style.css redesignet til Bit-Minimalism (2026-06-07)
- [ ] Koble frontend auth til Flask-backend
- [ ] Stopp å lagre passord i localStorage
- [ ] Contacts API migrert
- [ ] Products API migrert
- [ ] Sales API migrert (inkl. lagerbeholdning-logikk)
- [ ] Purchases API migrert
- [ ] Employees API migrert
- [ ] Sponsors API migrert
- [ ] Budget API migrert

### Sjekkliste — Fase 2 (API-migrasjon)
- [ ] Bytt SQLite til PostgreSQL
- [ ] Sikker SECRET_KEY fra miljøvariabel
- [ ] Inputvalidering på alle API-ruter
- [ ] CSRF/sikkerhetsgjennomgang

### Åpne bugs
| Bug | Prioritet |
|---|---|
| Frontend auth ikke koblet til Flask-backend | Critical |
| requirements.txt er tom — må fylles ut | Medium |

### Frontend-moduler (implementert)
- Dashboard, Ansatte, Kontakter, Produkter, Salg, Innkjøp, Budsjett, Sponsorer, Rapporter
- Søk og filter på alle moduler
- Rediger/slett-knapper overalt
- Kontaktdetaljside med tilkoblede salg/innkjøp
- Lagerbeholdning-logikk i salg
- Tryggere prototype-admin sletting (krever skriving av eksakt selskapsnavn)

### localStorage-nøkler (frontend)
```js
const STORAGE_KEY = "venderaPhase2Data";
const REGISTRY_KEY = "venderaCompanyRegistry";
const ACTIVE_COMPANY_KEY = "venderaActiveCompanyId";
```

### Frontend Auth-migrasjonsplan
Legg til i toppen av `static/js/app.js`:
```js
const USE_BACKEND_AUTH = true;

async function apiRequest(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  let responseData = {};
  try { responseData = await response.json(); } catch { responseData = {}; }
  if (!response.ok) throw new Error(responseData.error || "Noe gikk galt med serveren.");
  return responseData;
}
```

### Fremtidige API-ruter
```
GET/POST   /api/contacts       PUT/DELETE /api/contacts/<id>
GET/POST   /api/products       PUT/DELETE /api/products/<id>
GET/POST   /api/sales          PUT/DELETE /api/sales/<id>
GET/POST   /api/purchases      PUT/DELETE /api/purchases/<id>
GET/POST   /api/employees      PUT/DELETE /api/employees/<id>
GET/POST   /api/sponsors       PUT/DELETE /api/sponsors/<id>
GET/PUT    /api/budget
GET        /api/reports
```
Alle ruter må filtrere på `company_id == session["company_id"]`.

---

## 4. Solvr — nåværende status

### Notion-struktur
| Side/database | URL |
|---|---|
| Solvr Company HQ | https://app.notion.com/p/374b05d7790b815f9689d396569562bd |
| BottByrå Oslo | https://app.notion.com/p/374b05d7790b810ba12fcb5e31990e21 |
| Vendera | https://app.notion.com/p/374b05d7790b81489e4cd216e1784380 |
| Client CRM | https://app.notion.com/p/090ffd54a0d14c249828f8fbf1eb385c |
| Finance Tracker | https://app.notion.com/p/890db399c8ac4848917a0f0318e10174 |
| Progress Log | https://app.notion.com/p/51c52de4c64346b18cf6b6ad2b1fa716 |
| Bug Tracker | https://app.notion.com/p/ae74217f7c804e8f9630d130f3aad7dc |
| AI Carryforwards | https://app.notion.com/p/fe24cbd1c8874030b94f26b5a526d5c6 |
| AI Workflow-strategi | https://app.notion.com/p/374b05d7790b81a59fdac898ecd62aa7 |

### Selskapets neste steg
- [ ] Velg domene for Solvr (f.eks. solvr.no)
- [ ] Separate nettsider for BottByrå og Vendera (ikke felles — målgruppene er for ulike)
- [ ] Bestem betalingsstruktur (Stripe / Vipps) for begge produkter
- [ ] Sett opp felles e-post (f.eks. hei@solvr.no)

---

## 5. Endringer denne sesjonen (2026-06-10, Kaushik)

- **OpenAI gpt-4o-mini** valgt som permanent AI-løsning — erstatter Mistral AI
- Alle 3 Typebot-botts koblet til OpenAI og fungerer (Create chat completion, system prompt, user `{{Chat gpt querry}}`, save response → `query output`)
- BottByrå Flask-backend satt opp og kjører lokalt
- Neste sesjon: rydde opp unødvendige elementer og feil ordbruk på nettsiden

---

## 6. Nærmeste neste steg (prioritert)

1. **[BottByrå — Medium]** Rydd opp unødvendige elementer og feil ordbruk på nettsiden
2. **[BottByrå — Medium]** Sett opp Cal.com booking-lenker
3. **[BottByrå — Medium]** Test alle 3 botts på mobil (10 spørsmål hver)
4. **[Vendera — Critical]** Koble frontend auth til Flask-backend (/api/register, /api/login, /api/logout, /api/me)
5. **[Vendera — Medium]** Fyll ut requirements.txt med flask og flask-sqlalchemy
6. **[Solvr — Lav]** Oppdater alle BotByrå → BottByrå i Notion-titler

---

## 7. Preferanser og regler

- Kontekstfil heter alltid: `solvr_context_YYYY-MM-DD_[nummer]_[kaushik/teo].md` — alltid nummerert fra 1
- Lagres i GitHub-repo under `/context/`
- BottByrå alltid: stor B, dobbel t, stor B, å — aldri BotByrå
- Bruk alltid "vi" og "oss" — aldri enkeltpersoner med mindre det gjelder spesifikt ansvarsområde
- Ingen emoji i noen klientvendt leveranse
- Aldri si til klienter: AI, machine learning, GPT, automation workflow, API
- Tone: direkte, ingen motivasjonstaler
