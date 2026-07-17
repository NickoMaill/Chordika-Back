#!/bin/bash
set -euo pipefail

# === Variables ===
SRC_DIR="/home/api/db_backups"
DEST_USER="nico"
DEST_HOST="maillols.freeboxos.fr"
DEST_PORT="4522"
DEST_DIR="/home/nico/Web/db_backups/mell"
SSH_KEY="/home/repo/.ssh/id_ed25519"
LOG_FILE="/home/api/logs/db/send_backup.log"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

# === Log ===
mkdir -p "$(dirname "$LOG_FILE")"
echo "[$DATE] 🚀 Démarrage de l'envoi des backups" >> "$LOG_FILE"

# === Rsync avec IPv4 forcé ===
rsync -avz -e "ssh -4 -i $SSH_KEY -p $DEST_PORT" \
    "$SRC_DIR/"*.{sql,dump} \
    "$DEST_USER@$DEST_HOST:$DEST_DIR" >> "$LOG_FILE" 2>&1

EXIT_CODE=$?

if [ $EXIT_CODE -eq 0 ]; then
    echo "[$DATE] ✅ Backup envoyé avec succès vers $DEST_HOST" >> "$LOG_FILE"
else
    echo "[$DATE] ❌ Erreur lors de l'envoi (code $EXIT_CODE)" >> "$LOG_FILE"
fi