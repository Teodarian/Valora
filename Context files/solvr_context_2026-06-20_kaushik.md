# Solvr Context — 2026-06-20 — Kaushik

## Sesjonsoppsummering

### BottByrå — videre planlegging
- Diskuterte felles vs. delte nettsider for Solvr-tjenestene (BottByrå, Vendera). Konklusjon: delte nettsider er riktig — målgruppene (lokale Oslo-bedrifter vs. skoler) er for ulike for én felles side.
- Diskuterte sommerferie-effekt på outreach: juli er generelt dårlig i Norge, men barbershops og restauranter kan være mottakelige (sommerpeak). Treningssentre kan vente til august.
- Avklarte Cal.com vs. Formspree: Formspree brukes nå (kontaktskjema), Cal.com utsettes til man faktisk har demo-samtaler å booke.

### Nettside (index.html) — designrydding
- Bruker lastet opp endret index.html for designgjennomgang (kun design, ikke innhold).
- Fant og fikset: nav-meny pekte på `#priser` og `#testimonials`, men begge seksjoner er kommentert ut i koden → døde lenker. Fjernet fra meny (nå kun Om / Demo / Kontakt).
- Flagget (ikke endret, kun observert):
  - Tekstfeil: "Solver" → skal være "Solvr"
  - Mulig sammenslåingsfeil: "teknisketakt"

### Mobile-testing
- Alle 3 botts (Hair Magic, Oslo Treningssenter, Oslo Restaurant) er nå testet på mobil og svarer fornuftig — markert ferdig i Notion.

### Formspree
- Bruker bekreftet Formspree ID og riktig e-post er satt i index.html — markert ferdig i Notion.

### AI-modell — endring av leverandør
**Viktig beslutning:** Bytter fra Mistral AI / Gemini til **OpenAI gpt-4o-mini** for alle 3 botts.
- Bruker bekreftet at OpenAI API skal brukes (ikke Mistral/Gemini).
- Bruker er OK med at OpenAI krever betalingskort/kreditt for API-nøkkel (i motsetning til Mistral/Gemini sine gratis-tiers).
- Notion oppdatert: fjernet Mistral/Gemini-oppgaver, lagt til "Hent OpenAI API-nøkkel" og "Koble OpenAI gpt-4o-mini til alle 3 botts i Typebot".
- Tech Stack-tabellen oppdatert: OpenAI gpt-4o-mini er nå primær AI-leverandør (ikke lenger "senere fase").

## Gjenstående i Fase 1 (BottByrå)
- [ ] Hent OpenAI API-nøkkel (platform.openai.com — krever betalingskort)
- [ ] Koble OpenAI gpt-4o-mini til alle 3 botts i Typebot
- [ ] Sett opp Cal.com booking-lenker (utsatt til demo-fase er aktuell)

## Notion-status
Side oppdatert: BottByrå Oslo (https://app.notion.com/p/374b05d7790b810ba12fcb5e31990e21)
- Hurtigstatus-tabell og Fase 1-sjekkliste synkronisert med dagens fremgang
- Tech Stack-tabell oppdatert med ny AI-leverandør

## Neste steg / forslag til neste sesjon
1. Hent OpenAI API-nøkkel
2. Koble OpenAI til alle 3 botts i Typebot, test svarkvalitet
3. Vurder GitHub Action for auto-deploy (stod på pri-listen tidligere, men ble nedprioritert til fordel for planlegging)
4. SSH-nøkkel-oppsett (avhengighet for GitHub Action)
5. Når demo-samtaler blir aktuelt: sett opp Cal.com
