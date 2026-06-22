#!/bin/bash
set -e

# =============================================================================
# Valora Server Setup Script
# Setter opp Vendera og BottByra pa en fersk Ubuntu-server
# Kjor som root eller med sudo
# =============================================================================

REPO_DIR="/srv/Valora"
REPO_URL="https://github.com/Teodarian/Valora.git"
BRANCH="redesigned_vedera_hosted-_on_vercel_for_now"
DEPLOY_USER="admin"

VENDERA_DIR="$REPO_DIR/Vendera"
VENDERA_VENV="$VENDERA_DIR/venv"
VENDERA_ENV_FILE="/etc/vendera.env"

BOTTDIR="$REPO_DIR/botbyra-portfolio/Bottbyra-flask"
BOTT_VENV="$BOTTDIR/venv"
BOTT_ENV_FILE="/etc/bottbyra.env"

echo "=== Valora server setup starter ==="

echo "[1/8] Oppdaterer system..."
apt update
apt upgrade -y

echo "[2/8] Installerer pakker..."
apt install -y python3 python3-pip python3-venv git nginx ufw

echo "[3/8] Sjekker admin-bruker..."
if ! id "$DEPLOY_USER" &>/dev/null; then
    adduser --disabled-password --gecos "" "$DEPLOY_USER"
    usermod -aG sudo "$DEPLOY_USER"
    echo "admin-bruker opprettet."
else
    echo "admin-bruker finnes allerede."
fi

echo "[4/8] Henter Valora-repo..."
mkdir -p "$REPO_DIR"

if [ ! -d "$REPO_DIR/.git" ]; then
    git clone --branch "$BRANCH" "$REPO_URL" "$REPO_DIR"
else
    cd "$REPO_DIR"
    git fetch origin
    git checkout "$BRANCH"
    git pull --ff-only origin "$BRANCH"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$REPO_DIR"

echo "[5/8] Setter opp Vendera..."
cd "$VENDERA_DIR"
python3 -m venv venv
source "$VENDERA_VENV/bin/activate"
python -m pip install --upgrade pip
pip install -r requirements.txt
deactivate

mkdir -p "$VENDERA_DIR/instance"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$VENDERA_DIR"

VENDERA_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
cat > "$VENDERA_ENV_FILE" <<EOF
APP_ENV=development
SECRET_KEY=$VENDERA_SECRET_KEY
DATABASE_URL=sqlite:///$VENDERA_DIR/instance/vendera.db
PREFERRED_URL_SCHEME=http
RATELIMIT_STORAGE_URI=memory://
EOF
chmod 600 "$VENDERA_ENV_FILE"

runuser -u "$DEPLOY_USER" -- bash -lc "cd '$REPO_DIR' && '$VENDERA_VENV/bin/python' -m flask --app Vendera:app db upgrade"

echo "[6/8] Setter opp BottByra..."
cd "$BOTTDIR"
python3 -m venv venv
source "$BOTT_VENV/bin/activate"
python -m pip install --upgrade pip
pip install -r requirements.txt
deactivate

BOTTBYRA_SECRET_KEY=$(python3 -c "import secrets; print(secrets.token_hex(32))")
cat > "$BOTT_ENV_FILE" <<EOF
SECRET_KEY=$BOTTBYRA_SECRET_KEY
EOF
chmod 600 "$BOTT_ENV_FILE"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$BOTTDIR"

echo "[7/8] Oppretter systemd-tjenester..."

cat > /etc/systemd/system/vendera.service <<EOF
[Unit]
Description=Vendera Flask App (Waitress)
After=network.target

[Service]
User=$DEPLOY_USER
WorkingDirectory=$REPO_DIR
EnvironmentFile=$VENDERA_ENV_FILE
Environment="PATH=$VENDERA_VENV/bin"
ExecStart=$VENDERA_VENV/bin/python $REPO_DIR/serve.py
Restart=always
RestartSec=5
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
EOF

cat > /etc/systemd/system/bottbyra.service <<EOF
[Unit]
Description=BottByra Flask App
After=network.target

[Service]
User=$DEPLOY_USER
WorkingDirectory=$BOTTDIR
EnvironmentFile=$BOTT_ENV_FILE
Environment="PATH=$BOTT_VENV/bin"
ExecStart=$BOTT_VENV/bin/python $BOTTDIR/app.py
Restart=always
RestartSec=5
KillSignal=SIGINT

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable vendera bottbyra
systemctl restart vendera bottbyra

echo "[8/8] Konfigurerer Nginx..."

cat > /etc/nginx/sites-available/vendera <<EOF
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOF

cat > /etc/nginx/sites-available/bottbyra <<EOF
server {
    listen 8080;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5001;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_set_header X-Forwarded-Host \$host;
    }
}
EOF

ln -sf /etc/nginx/sites-available/vendera /etc/nginx/sites-enabled/vendera
ln -sf /etc/nginx/sites-available/bottbyra /etc/nginx/sites-enabled/bottbyra
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl reload nginx

ufw allow OpenSSH
ufw allow 80
ufw allow 8080
ufw --force enable

echo ""
echo "=== Oppsett fullfort ==="
echo "Vendera:  http://SERVER_IP"
echo "BottByra: http://SERVER_IP:8080"
echo ""
echo "Miljofiler:"
echo "  $VENDERA_ENV_FILE"
echo "  $BOTT_ENV_FILE"
echo ""
echo "Merk:"
echo "- Vendera kjores na via Waitress pa intern port 8000."
echo "- Databasen opprettes/oppdateres via Flask-Migrate (db upgrade)."
echo "- APP_ENV star til development til du har satt opp HTTPS."
