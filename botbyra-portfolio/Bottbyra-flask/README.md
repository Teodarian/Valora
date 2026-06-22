# BottByrå Oslo — Flask-oppsett for hjemmeserver

## Mappestruktur

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

## Første gangs oppsett (Mac)

```bash
cd ~/Desktop/bottbyra
pip3 install flask
python3 app.py
```

Åpne i nettleser: http://127.0.0.1:5000

Stop server: Ctrl+C

## Sider

| URL                        | Fil                          |
|----------------------------|------------------------------|
| /                          | templates/index.html         |
| /booking/frisor            | templates/booking-frisor.html |
| /booking/restaurant        | templates/booking-restaurant.html |
| /booking/treningssenter    | templates/booking-treningssenter.html |

## Flask til PATH (hvis flask-kommando ikke finnes)

Midlertidig:
```bash
export PATH="$PATH:$(python3 -m site --user-base)/bin"
```

Permanent:
```bash
echo 'export PATH="$PATH:$(python3 -m site --user-base)/bin"' >> ~/.zshrc
```

## Neste steg

Når du skal legge til kontaktskjema-backend (Formspree er allerede koblet i index.html — ingen endringer nødvendig).
Når du skal legge til Cal.com booking — bytt ut placeholder-lenker i templates.
