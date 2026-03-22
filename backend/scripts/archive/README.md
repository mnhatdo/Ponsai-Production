# Archived Scripts

This directory contains development and debugging scripts that were used during initial project setup and troubleshooting. These scripts are **NOT part of the active codebase** but are preserved for reference.

## ⚠️ Warning

These scripts:
- May reference outdated database schemas
- May not work with current code structure
- Were created for specific debugging scenarios
- Should be reviewed and updated before use

## Available Scripts

### Database Analysis
- `analyze-categories.js` - Analyze product category mapping
- `check-categories.js` - Verify category structure
- `check-db.js` - Database connection and schema check

### Product Management
- `check-accessories.js` - Verify accessories data
- `fix-category-mapping.js` - Fix product-category relationships
- `fix-remaining-products.js` - Fix orphaned products

### User Management
- `check-admin.js` - Verify admin user exists
- `check-admin-login.js` - Test admin login
- `check-password-hash.js` - Debug password hashing
- `create-admin-user.js` - Create single admin user
- `create-admins.js` - Batch create admin users
- `delete-all-users.js` - **DANGEROUS:** Remove all users

### Dangerous Operations
- `drop-database.js` - **DANGEROUS:** Drop entire database

## Usage Guidelines

1. **Always backup your database first**
2. Review script code before running
3. Update MongoDB URI in script or .env
4. These scripts expect compiled TypeScript in `dist/` folder
5. Run from `backend/` directory: `node scripts/archive/script-name.js`

## Active Scripts

For current project scripts, see:
- `backend/scripts/list-all-users.js` - List all users
- `backend/scripts/migrate-payment-lifecycle.js` - Migrate payment states
- See `backend/scripts/README.md` for active scripts

## Maintenance

If you need similar functionality, consider:
1. Using active seed scripts in `backend/data/seeds/`
2. Creating new scripts in `backend/scripts/` (not archive)
3. Using MongoDB Compass for GUI-based operations
4. Writing unit tests for data validation

---

*Last Updated: January 8, 2026*
