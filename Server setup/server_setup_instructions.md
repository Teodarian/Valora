# Solvr — Server Oppsett

## Krav
- Ubuntu 26.04 LTS (fersk installasjon)
- Internettilgang
- sudo-tilgang

## Steg 1 — Koble til serveren
```bash
ssh user@SERVER_IP
```

## Steg 2 — Last ned og kjør setup-scriptet
```bash
curl -O https://raw.githubusercontent.com/Teodarian/Valora/redesigned_vedera_hosted-_on_vercel_for_now/Server%20setup/setup.sh
sudo bash setup.sh
```

Scriptet tar ca. 2–5 minutter. Det setter opp:
- Python, Nginx, UFW
- Git clone av Valora-repoet
- Python venv for Vendera og BottByrå
- Systemd-tjenester med auto-start
- Nginx reverse proxy
- Brannmur (port 22, 80, 8080)
- Unike SECRET_KEY for begge apper

## Steg 3 — Verifiser at alt kjører
```bash
sudo systemctl status vendera bottbyra
```

Begge skal vise `active (running)`.

## Steg 4 — Åpne i nettleser
- Vendera:  http://SERVER_IP
- BottByrå: http://SERVER_IP:8080

## Viktig etter oppsett
Scriptet printer SECRET_KEY-verdiene for begge apper på slutten. Ta vare på disse.

## Feilsøking
```bash
# Se logger
sudo journalctl -u vendera -f
sudo journalctl -u bottbyra -f

# Restart tjenester
sudo systemctl restart vendera bottbyra

# Reload nginx
sudo systemctl reload nginx
```
