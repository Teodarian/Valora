# Valora Server Oppsett

Denne mappen er oppdatert for den naverende Flask-strukturen i `Valora`, inkludert:
- `Flask-Migrate` for Vendera-databasen
- `waitress` som produksjonsserver for Vendera
- reverse proxy via Nginx
- egne miljofiler for systemd-tjenestene

## Hva scriptet gjor

`setup.sh` setter opp:
- systempakker: `python3`, `python3-venv`, `python3-pip`, `git`, `nginx`, `ufw`
- repo-kloning til `/srv/Valora`
- Python-venv for Vendera og BottByra
- installasjon av `Vendera/requirements.txt`
- database-migrasjoner med `python -m flask --app Vendera:app db upgrade`
- systemd-tjenester for begge appene
- Nginx reverse proxy
- grunnleggende brannmurregler

## Viktig om miljo og HTTPS

Vendera bruker sikre cookie-innstillinger i ekte produksjonsmodus. Det betyr:

- hvis du setter `APP_ENV=production`, ma appen kjores bak HTTPS
- hvis du bare bruker vanlig `http://SERVER_IP`, vil sikre cookies ikke fungere riktig

Derfor setter scriptet Vendera til:

```env
APP_ENV=development
```

som standard, selv pa serveren. Dette er bevisst, slik at plain HTTP faktisk fungerer til du setter opp domene + HTTPS.

Nar du senere har HTTPS pa plass, kan du endre:

```env
APP_ENV=production
```

i `/etc/vendera.env` og restarte tjenesten.

## Krav

- Ubuntu-server med sudo-tilgang
- internettilgang
- GitHub-tilgang til repoet

## Steg 1 - Koble til serveren

```bash
ssh user@SERVER_IP
```

## Steg 2 - Hent og kjor setup-scriptet

```bash
curl -O https://raw.githubusercontent.com/Teodarian/Valora/redesigned_vedera_hosted-_on_vercel_for_now/Server%20setup/setup.sh
sudo bash setup.sh
```

Scriptet:
- kloner repoet til `/srv/Valora`
- lager venv for `Vendera`
- installerer avhengigheter
- oppretter `/etc/vendera.env`
- kjører `db upgrade`
- starter Vendera via `serve.py` med Waitress pa port `8000`
- setter opp Nginx foran appen pa port `80`

## Steg 3 - Verifiser at tjenestene kjorer

```bash
sudo systemctl status vendera bottbyra
```

Begge skal vise `active (running)`.

## Steg 4 - Verifiser Vendera bak Nginx

```bash
curl http://SERVER_IP/health
```

Du skal fa et JSON-svar med:
- `status: ok`
- riktig miljoverdi

## Steg 5 - Aapne i nettleser

- Vendera: `http://SERVER_IP`
- BottByra: `http://SERVER_IP:8080`

## Viktige filer etter oppsett

- Vendera appkode: `/srv/Valora/Vendera`
- Vendera env: `/etc/vendera.env`
- Vendera systemd: `/etc/systemd/system/vendera.service`
- BottByra env: `/etc/bottbyra.env`
- Nginx-konfig:
  - `/etc/nginx/sites-available/vendera`
  - `/etc/nginx/sites-available/bottbyra`

## Manuell oppdatering senere

Hvis du pusher nye endringer til branchen og vil oppdatere serveren:

```bash
cd /srv/Valora
git checkout redesigned_vedera_hosted-_on_vercel_for_now
git pull --ff-only origin redesigned_vedera_hosted-_on_vercel_for_now

/srv/Valora/Vendera/venv/bin/pip install -r /srv/Valora/Vendera/requirements.txt
/srv/Valora/Vendera/venv/bin/python -m flask --app Vendera:app db upgrade

sudo systemctl restart vendera
```

Hvis BottByra ogsa er endret:

```bash
/srv/Valora/botbyra-portfolio/Bottbyra-flask/venv/bin/pip install -r /srv/Valora/botbyra-portfolio/Bottbyra-flask/requirements.txt
sudo systemctl restart bottbyra
```

## Feilsoking

```bash
# Tjenestelogger
sudo journalctl -u vendera -f
sudo journalctl -u bottbyra -f

# Restart tjenester
sudo systemctl restart vendera bottbyra

# Sjekk nginx-konfig
sudo nginx -t

# Reload nginx
sudo systemctl reload nginx
```

## Nar du senere setter opp HTTPS

Etter at du har domene og TLS pa plass:

1. oppdater Nginx med domenenavn
2. sett opp HTTPS, for eksempel med Certbot
3. endre `/etc/vendera.env`:

```env
APP_ENV=production
```

4. restart Vendera:

```bash
sudo systemctl restart vendera
```

Da vil appen bruke de strengere produksjonsinnstillingene som allerede ligger i Flask-konfigurasjonen.
