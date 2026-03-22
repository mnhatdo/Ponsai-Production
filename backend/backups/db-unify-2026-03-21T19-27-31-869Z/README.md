# Database Unification Backup

Created at: 2026-03-21T19:27:31Z

## Contents
- `json-dump/`: JSON export of all collections from `MONGODB_URI`.
- `config-snapshot/`: Snapshot of DB-related config and scripts before/while unifying to one DB URI.

## Restore (manual)
1. Review `json-dump/_meta.json` for collection names and counts.
2. Import each `*.json` back to MongoDB with your preferred tool (`mongoimport`, script, or custom migration).
3. Restore config/script files from `config-snapshot/` if needed.
