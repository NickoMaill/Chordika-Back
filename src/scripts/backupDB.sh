#!/bin/bash
set -o allexport
source /home/api/app/dist/.env
set +o allexport

USER=$PGUSER
DB_NAME=$PGDATABASE
BACKUP_DIR="/home/api/db_backups"
LOG_DIR="/home/api/logs/db"
DATE=$(date +"%Y-%m-%d_%H-%M-%S")

mkdir -p "$LOG_DIR"

# === Sauvegarde SQL classique ===
PGPASSWORD="$PGPASSWORD" pg_dump -U "$USER" "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_$DATE.sql" 2> "$LOG_DIR/backup_error_sql_$DATE.log"
SQL_EXIT=$?

# === Sauvegarde format custom (.dump) pour PGAdmin ===
PGPASSWORD="$PGPASSWORD" pg_dump -U "$USER" -F c "$DB_NAME" > "$BACKUP_DIR/${DB_NAME}_$DATE.dump" 2> "$LOG_DIR/backup_error_dump_$DATE.log"
DUMP_EXIT=$?

EXIT_CODE=$((SQL_EXIT || DUMP_EXIT))

# === Gestion du résultat ===
if [ $SQL_EXIT -eq 0 ]; then
    echo "[$DATE] ✅ Backup SQL OK pour $DB_NAME" >> "$LOG_DIR/backup.log"
    if [ ! -s "$LOG_DIR/backup_error_sql_$DATE.log" ]; then
        rm "$LOG_DIR/backup_error_sql_$DATE.log"
    fi
else
    echo "[$DATE] ❌ Backup SQL ÉCHOUÉ pour $DB_NAME (code $SQL_EXIT)" >> "$LOG_DIR/backup.log"
    echo ">> Détails de l'erreur SQL :" >> "$LOG_DIR/backup.log"
    cat "$LOG_DIR/backup_error_sql_$DATE.log" >> "$LOG_DIR/backup.log"
    echo "----------------------------------------" >> "$LOG_DIR/backup.log"
fi

if [ $DUMP_EXIT -eq 0 ]; then
    echo "[$DATE] ✅ Backup DUMP OK pour $DB_NAME" >> "$LOG_DIR/backup.log"
    if [ ! -s "$LOG_DIR/backup_error_dump_$DATE.log" ]; then
        rm "$LOG_DIR/backup_error_dump_$DATE.log"
    fi
else
    echo "[$DATE] ❌ Backup DUMP ÉCHOUÉ pour $DB_NAME (code $DUMP_EXIT)" >> "$LOG_DIR/backup.log"
    echo ">> Détails de l'erreur DUMP :" >> "$LOG_DIR/backup.log"
    cat "$LOG_DIR/backup_error_dump_$DATE.log" >> "$LOG_DIR/backup.log"
    echo "----------------------------------------" >> "$LOG_DIR/backup.log"
fi

# === Suppression des sauvegardes et logs de plus de 7 jours ===
find "$BACKUP_DIR" -type f -name "*.sql" -mtime +15 -exec rm {} \;
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +15 -exec rm {} \;
find "$LOG_DIR" -type f -name "*.log" -mtime +15 -exec rm {} \;

exit $EXIT_CODE