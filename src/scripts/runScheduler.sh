#!/bin/bash

LOG_FILE="/home/api/logs/cron/cron.log"
ENV_FILE="/home/api/app/dist/.env"

{
    echo ""
    echo "====================================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🚀 Début du scheduler"
    echo "====================================================================="
    echo ""

    if [ -f "$ENV_FILE" ]; then
        export $(grep -v '^#' "$ENV_FILE" | xargs)
    else
        echo "[$(date '+%Y-%m-%d %H:%M:%S')] ⚠️  Fichier .env introuvable"
        echo ""
        echo "====================================================================="
        echo ""
        exit 1
    fi

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 🌐 URL appelée : $APP_API_BASEURL/$APP_API_SCHEDULER_URL"
    echo ""

    RESPONSE=$(curl -s -w " HTTP_STATUS:%{http_code}" -X GET "$APP_API_BASEURL/$APP_API_SCHEDULER_URL" \
        -H "X-API-Secret: $APP_API_SCHEDULER_SECRET")

    BODY=$(echo "$RESPONSE" | sed -e 's/ HTTP_STATUS\:.*//g')
    STATUS=$(echo "$RESPONSE" | tr -d '\n' | sed -e 's/.*HTTP_STATUS://')

    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Code HTTP: $STATUS"
    echo ""
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] 📦 Réponse API:"
    echo "$BODY"
    echo ""
    echo "====================================================================="
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] ✅ Fin du scheduler"
    echo "====================================================================="
    echo ""
} >> "$LOG_FILE" 2>&1