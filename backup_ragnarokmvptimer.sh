#!/bin/bash

# Define the source directory to backup
SOURCE_DIR="$(dirname "$0")"

# Define the destination directory for the backup
DEST_DIR="${HOME}"

# Get the current date and time in YYYYMMDD_HHMMSS format
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Construct the backup filename
BACKUP_FILENAME="ragnarokmvptimer_backup_full_${TIMESTAMP}.tar.gz"

# Create the full path for the backup file
BACKUP_PATH="${DEST_DIR}/${BACKUP_FILENAME}"

# Create the tar.gz archive
echo "Creating backup of ${SOURCE_DIR} to ${BACKUP_PATH}"
tar -czf "${BACKUP_PATH}" -C "$(dirname "${SOURCE_DIR}")" "$(basename "${SOURCE_DIR}")"

if [ $? -eq 0 ]; then
  echo "Backup created successfully!"
  echo "Backup file: ${BACKUP_PATH}"
else
  echo "Error: Backup failed."
fi
