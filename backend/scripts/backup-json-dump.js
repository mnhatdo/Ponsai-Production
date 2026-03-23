const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

(async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/ponsai';
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const outDir = path.resolve(__dirname, '..', 'backups', `db-unify-${stamp}`, 'json-dump');
  fs.mkdirSync(outDir, { recursive: true });

  await mongoose.connect(uri);
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();

  const meta = {
    uri,
    dbName: db.databaseName,
    exportedAt: new Date().toISOString(),
    collections: []
  };

  for (const collection of collections) {
    const docs = await db.collection(collection.name).find({}).toArray();
    fs.writeFileSync(path.join(outDir, `${collection.name}.json`), JSON.stringify(docs, null, 2));
    meta.collections.push({ name: collection.name, count: docs.length });
  }

  fs.writeFileSync(path.join(outDir, '_meta.json'), JSON.stringify(meta, null, 2));
  console.log(`JSON_DUMP_DIR=${outDir}`);

  await mongoose.disconnect();
})().catch(async (error) => {
  console.error('Backup failed:', error);
  try {
    await mongoose.disconnect();
  } catch (_) {}
  process.exit(1);
});

