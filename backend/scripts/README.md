# Backend Scripts

Utility scripts for database management and maintenance.

## Active Scripts

### `list-all-users.js`
Lists all users in the database with their roles and status.

**Usage:**
```bash
node scripts/list-all-users.js
```

**Purpose:** Admin utility for viewing all registered users.

---

### `migrate-payment-lifecycle.js`
One-time migration script to standardize payment lifecycle.

**Usage:**
```bash
node scripts/migrate-payment-lifecycle.js
```

**Purpose:** Migrates old `pending_manual_payment` status to new unified lifecycle (`pending`).

**Note:** This migration has already been run. Kept for reference and rollback purposes.

---

## Archived Scripts

Historical scripts moved to `archive/` folder:
- Analysis scripts (analyze-categories, check-accessories, etc.)
- Debug scripts (check-admin, check-db, etc.)
- One-time setup scripts (create-admin, fix-category-mapping, etc.)

These scripts are preserved for reference but are not needed for normal operations.

---

## Database Seeding

For seeding product data, use the proper seed commands from package.json:

```bash
# Seed bonsai products
npm run seed:bonsai

# Seed admin user
npm run seed:admin

# Seed all
npm run db:seed
```

See `backend/data/seeds/` for seed file implementations.
