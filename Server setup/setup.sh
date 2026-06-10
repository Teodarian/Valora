#!/bin/bash
set -e

# =============================================================================
# Solvr — Server Setup Script
# Setter opp Vendera og BottByrå på en fersk Ubuntu-server
# Bruker: admin
# =============================================================================

echo "=== Solvr server setup starter ==="

# --- Systemoppdatering ---
echo "[1/8] Oppdaterer system..."
apt update && apt upgrade -y

# --- Installer avhengigheter ---
echo "[2/8] Installerer pakker..."
apt install -y python3 python3-pip python3-venv git nginx ufw

# --- Opprett admin-bruker hvis den ikke finnes ---
echo "[3/8] Sjekker admin-bruker..."
if ! id "admin" &>/dev/null; then
    adduser --disabled-password --gecos "" admin
    usermod -aG sudo admin
    echo "admin-bruker opprettet."
else
    echo "admin-bruker finnes allerede."
fi

# --- Klon repo ---
echo "[4/8] Kloner GitHub-repo..."
mkdir -p /srv/Valora
cd /srv/Valora

if [ ! -d ".git" ]; then
    git clone https://github.com/Teodarian/Valora.git .
    git checkout redesigned_vedera_hosted-_on_vercel_for_now
else
    git pull
fi

chown -R admin:admin /srv/Valora

# --- Sett opp Vendera ---
echo "[5/8] Setter opp Vendera..."
cd /srv/Valora/Vendera
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

# Init database
cd /srv/Valora/Vendera
source venv/bin/activate
VENDERA_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
flask --app app init-db
deactivate

# --- Sett opp BottByrå ---
echo "[6/8] Setter opp BottByrå..."
cd /srv/Valora/botbyra-portfolio/Bottbyra-flask
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
deactivate

BOTTBYRA_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")

# --- Systemd-tjenester ---
echo "[7/8] Oppretter systemd-tjenester..."

cat > /etc/systemd/system/vendera.service << VENDERA
[Unit]
Description=Vendera Flask App
After=network.target

[Service]
User=admin
WorkingDirectory=/srv/Valora/Vendera
Environment="PATH=/srv/Valora/Vendera/venv/bin"
Environment="SECRET_KEY=${VENDERA_SECRET_KEY}"
ExecStart=/srv/Valora/Vendera/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
VENDERA

cat > /etc/systemd/system/bottbyra.service << BOTTBYRA
[Unit]
Description=BottByraa Flask App
After=network.target

[Service]
User=admin
WorkingDirectory=/srv/Valora/botbyra-portfolio/Bottbyra-flask
Environment="PATH=/srv/Valora/botbyra-portfolio/Bottbyra-flask/venv/bin"
Environment="SECRET_KEY=${BOTTBYRA_SECRET_KEY}"
ExecStart=/srv/Valora/botbyra-portfolio/Bottbyra-flask/venv/bin/python app.py
Restart=always

[Install]
WantedBy=multi-user.target
BOTTBYRA

systemctl daemon-reload
systemctl enable vendera bottbyra
systemctl start vendera bottbyra

# --- Nginx ---
echo "[8/8] Konfigurerer Nginx..."

cat > /etc/nginx/sites-available/vendera << NGINX_VENDERA
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX_VENDERA

cat > /etc/nginx/sites-available/bottbyra << NGINX_BOTTBYRA
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }
}
NGINX_BOTTBYRA

ln -sf /etc/nginx/sites-available/vendera /etc/nginx/sites-enabled/vendera
ln -sf /etc/nginx/sites-available/bottbyra /etc/nginx/sites-enabled/bottbyra
rm -f /etc/nginx/sites-enabled/default

# --- Brannmur ---
ufw allow OpenSSH
ufw allow 80
ufw allow 8080
ufw --force enable

systemctl reload nginx

echo ""
echo "=== Oppsett fullført ==="
echo "Vendera:  http://SERVER_IP"
echo "BottByrå: http://SERVER_IP:8080"
echo ""
echo "VIKTIG: Lagre disse SECRET_KEY-verdiene:"
echo "Vendera SECRET_KEY:  ${VENDERA_SECRET_KEY}"
echo "BottByrå SECRET_KEY: ${BOTTBYRA_SECRET_KEY}"
