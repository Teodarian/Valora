# Solvr Context - 2026-06-22 - Teo

## Kort status

Dette er en oppdatert og mer konsis kontekstfil basert pa tidligere Solvr-kontekst, men med fokus pa det som faktisk er gjort i `Vendera` i denne arbeidsperioden.

## 1. Selskapsidentitet

- **Selskapsnavn:** Solvr
- **Team:** Kaushik + Teo
- **Produkter:** BottByra Oslo + Vendera
- **Arbeidsmodell:** Vi/oss, ikke enkeltpersonfokus med mindre ansvarsomrade er relevant
- **Notion HQ:** https://app.notion.com/p/374b05d7790b815f9689d396569562bd

### Ansvar
- **Kaushik:** BottByra, outreach, chatbots, nettsider, klientdialog
- **Teo:** Vendera, backend, Flask, database, API-migrasjon, deployoppsett

### Generelle regler
- Bruk norsk i forretningskontekst
- Ingen emoji i leveranser
- Tone: direkte og praktisk
- BottByra skal skrives med dobbel `t`

---

## 2. BottByra - kort snapshot

Dette er ikke hovedfokus i denne filen, men beholdes som minimumskontekst.

- **Konsept:** Chatbots for lokale Oslo-bedrifter
- **Notion-side:** https://app.notion.com/p/374b05d7790b810ba12fcb5e31990e21
- **Status:** Nettside, Formspree og 3 demo-botter er satt opp
- **AI-valg:** OpenAI `gpt-4o-mini`
- **Booking:** Cal.com er fortsatt utsatt
- **Deploy:** BottByra Flask-app finnes fortsatt i repoet og inngar i serveroppsettet

---

## 3. Vendera - oppdatert status

**Konsept:** ERP/styringssystem for elevbedrifter i skoler.  
**Tidligere navn:** Valora  
**Ansvarlig:** Teo  
**Notion-side:** https://app.notion.com/p/374b05d7790b81489e4cd216e1784380

### 3.1 Naverende stack

- Frontend: HTML, CSS, vanilla JavaScript
- Backend: Flask
- Database: SQLAlchemy + SQLite forelopig
- Migrasjoner: Flask-Migrate / Alembic
- Rate limiting: Flask-Limiter
- Deploy entrypoint: Waitress via `serve.py`
- Neste DB-steg: PostgreSQL senere

### 3.2 Viktige filer

```text
Vendera/
  __init__.py
  app.py
  config.py
  extensions.py
  models.py
  requirements.txt
  migrations/
  routes/
    __init__.py
    auth.py
    company.py
    employees.py
    contacts.py
    products.py
    sales.py
    purchases.py
    sponsors.py
    budget.py
  templates/
    index.html
    500.html
  static/
    css/style.css
    js/app.js
  tests/
    test_app.py
serve.py
wsgi.py
```

### 3.3 Backend-arkitektur som na er pa plass

- App factory og pakket importstruktur er ryddet opp
- `extensions.py` samler `db`, `migrate`, `limiter`
- `config.py` har `development`, `testing`, `production`
- `app.py` har:
  - `ProxyFix`
  - `/health`
  - API-feilhondtering
  - sikkerhetsheaders
  - CSRF-beskyttelse
  - JSON-only krav for muterende API-kall
  - produksjonsguard for `SECRET_KEY`
- `500.html` brukes for generiske serverfeil

### 3.4 Auth og session

Implementert i `routes/auth.py` og koblet til frontend:

- `POST /api/register`
- `POST /api/login`
- `POST /api/logout`
- `GET /api/me`

Status:
- Flask-session brukes
- Passord hashes med Werkzeug
- `login_required` brukes pa beskyttede ruter
- Frontend lagrer ikke lenger passord i localStorage
- Frontend stoler ikke lenger pa en lokal `isLoggedIn=true` som autoritativ auth

### 3.5 Migrerte API-moduler

Foles server-backet na:

- Employees
- Contacts
- Products
- Sales
- Purchases
- Sponsors
- Budget
- Company settings
- Company delete

Ruter som finnes:

```text
/api/employees
/api/contacts
/api/products
/api/sales
/api/purchases
/api/sponsors
/api/budget
/api/company
```

Alle er filtrert mot aktiv `company_id` i session.

### 3.6 Viktig business-logikk som er flyttet til backend

- Registrering og innlogging
- CRUD for alle hovedmoduler
- Lagerbeholdning ved salg
- Budsjettdata
- Company settings
- Sletting av aktiv elevbedrift med navnebekreftelse

### 3.7 Frontend-status

`static/js/app.js` er fortsatt stor og litt lagdelt, men den er mye tryggere enn for:

- Session hydreres fra backend
- Browserdata brukes mer som cache enn som sannhetskilde
- Gamle dupliserte auth/settings handlers er fjernet
- localStorage sanitiseres ved lagring
- Prototype-admin finnes fortsatt, men aktiv innlogget company-sletting gaar na via backend

### 3.8 Sikkerhet og hardening som er lagt til

- CSRF-token via cookie + header
- Security headers
- `X-Content-Type-Options`, `X-Frame-Options`, CSP, HSTS i riktig kontekst
- Rate limiting pa auth og flere muterende ruter
- Inputvalidering pa flere CRUD-ruter
- `SECRET_KEY`-krav i produksjonsmodus

### 3.9 Testing

Det finnes testoppsett i:

```text
Vendera/tests/test_app.py
```

Dekker blant annet:
- `/health`
- security headers
- CSRF / JSON-enforcement
- register/login/session
- company update/delete
- CRUD-flyt for employees, contacts, products, sales, purchases, sponsors
- budget-flow

**Viktig begrensning i denne arbeidsperioden:** testene kunne ikke kjores fra Codex-miljoet fordi `python.exe` feilet med Windows logon-session-feil. Testene ble derfor skrevet og kontrollert ved kodeinspeksjon, ikke verifisert kjort her.

### 3.10 Hva som er gjort i denne perioden

Kort oppsummert:

- satt opp Flask-Migrate og migrasjoner
- lagt til produksjonsvennlig configstruktur
- lagt til Waitress/Wsgi entrypoints
- flyttet alle hovedmoduler fra localStorage-prototype mot backend-ruter
- lagt til company settings og company delete via backend
- strammet inn frontend session/cache-logikk
- lagt til testfil for backendflyter
- oppdatert deployoppsett og serverdokumentasjon

### 3.11 Gjenstaende / neste naturlige steg for Vendera

- rydde videre i `static/js/app.js`
- flytte flere avledede rapport-/summary-beregninger helt til backend
- bytte SQLite til PostgreSQL
- full produksjonsdeploy med HTTPS
- kjore testene lokalt eller i CI
- eventuelt redusere eller fase ut prototype-admin/local registry videre

---

## 4. Server og deploy

### Produksjonsserver (ny)

- **IP:** `172.16.204.132`
- **Bruker:** `user`
- **OS:** Ubuntu 26.04 LTS
- **Status:** serveroppsett er oppdatert i repoet til a matche dagens Flask-struktur

### Oppdaterte deployfiler

```text
Server setup/setup.sh
Server setup/server_setup_instructions.md
```

Disse er oppdatert til a bruke:

- `Vendera/requirements.txt`
- `python -m flask --app Vendera:app db upgrade`
- Waitress via `serve.py`
- env-fil `/etc/vendera.env`
- Nginx proxy mot intern port `8000`

### Viktig deploydetalj

`APP_ENV=production` bor **ikke** slas pa for Vendera for HTTPS er satt opp, fordi sikre cookies da kreves. Derfor star serveroppsettet forelopig til `APP_ENV=development` pa HTTP-serveren, selv om setupet ellers er mer produksjonsrettet.

---

## 5. Kjente regler og preferanser

- Kontekstfiler skal bevares konservativt: ikke fjern ting uten grunn
- Filnavn bor fortsatt folge monsteret:
  - `solvr_context_YYYY-MM-DD_1_[kaushik/teo].md`
  - `solvr_context_YYYY-MM-DD_2_[kaushik/teo].md`
- `templates/` skal ligge ved siden av `app.py`
- `static/css` og `static/js` brukes klassisk via Flask `url_for`
- Flask debug skal ikke brukes i deploy

---

## 6. Prioriterte neste steg

1. Kjor Vendera-testene lokalt og rett eventuelle feil som dukker opp
2. Rydd videre i `Vendera/static/js/app.js`
3. Flytt summary/report-beregninger til backend
4. Bytt SQLite til PostgreSQL nar deploygrunnlaget er klart
5. Sett opp HTTPS og bytt Vendera til ekte `APP_ENV=production`

---

## 7. Endringer denne kontekstfilen representerer

Denne filen erstatter ikke hele tidligere Solvr-historikken, men komprimerer den for videre arbeid pa Vendera. Den viktigste forskjellen fra eldre kontekst er at Vendera ikke lenger bare er "auth koblet til Flask"; den er na i praksis en fler-moduls backend-applikasjon med:

- migrasjoner
- sikkerhetslag
- CRUD-ruter for hoveddomenene
- serverbacket company/budget/settings-logikk
- deployfiler som matcher dagens struktur
