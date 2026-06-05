/**
 * Platform Group — PM Dashboard API Server v2
 * Phase 3: File Attachments + Versioning + Audit Trail + Comments
 *
 * GET    /health               → health check
 * GET    /db                   → ดึง DB ทั้งหมด
 * POST   /db                   → บันทึก DB ทั้งหมด
 * POST   /files/upload         → อัปโหลดไฟล์ → GridFS (multipart/form-data)
 * GET    /files/:id            → download/stream ไฟล์
 * GET    /files/:id/info       → metadata ของไฟล์
 * GET    /files/project/:projId → รายการไฟล์ทั้งหมดของ project
 * GET    /files/task/:taskId   → รายการไฟล์ทั้งหมดของ task
 * DELETE /files/:id            → soft delete ไฟล์
 * POST   /audit                → บันทึก audit event (append-only)
 * GET    /audit                → ดู audit trail (filter by projectId, userId, action)
 */

const express     = require('express');
const cors        = require('cors');
const multer      = require('multer');
const { MongoClient, GridFSBucket, ObjectId } = require('mongodb');

const app  = express();
const PORT = process.env.PORT || 3000;

// ─── Config ────────────────────────────────────────────────────────────────
const MONGO_URI  = process.env.MONGO_URI;
const DB_NAME    = process.env.DB_NAME    || 'project_dashboard';
const COLLECTION = process.env.COLLECTION || 'projects_db';
const API_SECRET = process.env.API_SECRET || '';
const MAX_FILE_MB = parseInt(process.env.MAX_FILE_MB || '20');

// ─── Middleware ────────────────────────────────────────────────────────────
app.use(cors({ origin: '*', methods: ['GET','POST','DELETE','OPTIONS'], allowedHeaders: ['Content-Type','x-api-secret'] }));
app.use(express.json({ limit: '10mb' }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024 },
});

// ─── Auth ──────────────────────────────────────────────────────────────────
function checkSecret(req, res) {
  if (!API_SECRET) return true;
  const sent = req.headers['x-api-secret'] || req.query.secret;
  if (sent !== API_SECRET) { res.status(401).json({ error: 'Unauthorized' }); return false; }
  return true;
}

// ─── MongoDB ───────────────────────────────────────────────────────────────
let client, db;
async function getDB() {
  if (!client || !client.topology?.isConnected()) {
    client = new MongoClient(MONGO_URI, { serverSelectionTimeoutMS: 5000 });
    await client.connect();
    db = client.db(DB_NAME);
    console.log('✅ MongoDB connected');
  }
  return db;
}
async function getCol(name = COLLECTION) { return (await getDB()).collection(name); }

// ─── Routes: Health + DB ───────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try { await getDB(); res.json({ ok: true, ts: new Date().toISOString(), db: DB_NAME }); }
  catch (e) { res.status(500).json({ ok: false, error: e.message }); }
});

app.get('/db', async (req, res) => {
  if (!checkSecret(req, res)) return;
  try {
    const col = await getCol();
    const doc = await col.findOne({ _id: 'main' });
    if (!doc) return res.json(null);
    const { _id, ...data } = doc;
    res.json(data);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/db', async (req, res) => {
  if (!checkSecret(req, res)) return;
  try {
    const col = await getCol();
    await col.replaceOne({ _id: 'main' }, { _id: 'main', ...req.body }, { upsert: true });
    // Audit: db sync
    await appendAudit({ action: 'db_sync', userId: req.body?.sessionUser || 'unknown', detail: 'DB saved', ts: new Date() });
    res.json({ ok: true, savedAt: new Date().toISOString() });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── File Upload ───────────────────────────────────────────────────────────
app.post('/files/upload', checkSecretMiddleware, upload.single('file'), async (req, res) => {
  try {
    const database = await getDB();
    const bucket = new GridFSBucket(database, { bucketName: 'uploads' });

    const { projectId, taskId, uploadedBy, description } = req.body;
    if (!req.file) return res.status(400).json({ error: 'No file provided' });

    // Check for existing versions (same name + projectId/taskId)
    const metaCol = await getCol('file_metadata');
    const existing = await metaCol.findOne({
      originalName: req.file.originalname,
      projectId: projectId || null,
      taskId: taskId || null,
      deleted: { $ne: true }
    });
    const version = existing ? (existing.latestVersion || 1) + 1 : 1;

    // Stream to GridFS
    const uploadStream = bucket.openUploadStream(req.file.originalname, {
      metadata: { projectId, taskId, uploadedBy, version, contentType: req.file.mimetype }
    });

    uploadStream.end(req.file.buffer);

    await new Promise((resolve, reject) => {
      uploadStream.on('finish', resolve);
      uploadStream.on('error', reject);
    });

    const fileId = uploadStream.id.toString();

    // Save metadata
    const meta = {
      fileId,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      projectId: projectId || null,
      taskId: taskId || null,
      uploadedBy: uploadedBy || 'unknown',
      description: description || '',
      version,
      latestVersion: version,
      uploadedAt: new Date(),
      deleted: false,
    };
    await metaCol.insertOne(meta);

    // Mark old version if exists
    if (existing) {
      await metaCol.updateMany(
        { originalName: req.file.originalname, projectId: projectId||null, taskId: taskId||null, fileId: { $ne: fileId } },
        { $set: { latestVersion: version } }
      );
    }

    // Audit
    await appendAudit({ action: 'file_upload', userId: uploadedBy, projectId, taskId, detail: `${req.file.originalname} v${version}`, fileId, ts: new Date() });

    res.json({ ok: true, fileId, version, name: req.file.originalname, size: req.file.size, mimeType: req.file.mimetype });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message }); }
});

// GET file info
app.get('/files/:id/info', checkSecretMiddleware, async (req, res) => {
  try {
    const col = await getCol('file_metadata');
    const meta = await col.findOne({ fileId: req.params.id });
    if (!meta) return res.status(404).json({ error: 'Not found' });
    res.json(meta);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET files by project
app.get('/files/project/:projId', checkSecretMiddleware, async (req, res) => {
  try {
    const col = await getCol('file_metadata');
    const files = await col.find({ projectId: req.params.projId, deleted: { $ne: true } }).sort({ uploadedAt: -1 }).toArray();
    res.json(files);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET files by task
app.get('/files/task/:taskId', checkSecretMiddleware, async (req, res) => {
  try {
    const col = await getCol('file_metadata');
    const files = await col.find({ taskId: req.params.taskId, deleted: { $ne: true } }).sort({ uploadedAt: -1 }).toArray();
    res.json(files);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// GET all versions of a file by name+project
app.get('/files/versions', checkSecretMiddleware, async (req, res) => {
  try {
    const { name, projectId, taskId } = req.query;
    const col = await getCol('file_metadata');
    const versions = await col.find({ originalName: name, projectId: projectId||null, taskId: taskId||null }).sort({ version: -1 }).toArray();
    res.json(versions);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Stream / download file
app.get('/files/:id', checkSecretMiddleware, async (req, res) => {
  try {
    const database = await getDB();
    const bucket = new GridFSBucket(database, { bucketName: 'uploads' });
    const col = await getCol('file_metadata');
    const meta = await col.findOne({ fileId: req.params.id });

    let objectId;
    try { objectId = new ObjectId(req.params.id); } catch { return res.status(400).json({ error: 'Invalid ID' }); }

    const files = await bucket.find({ _id: objectId }).toArray();
    if (!files.length) return res.status(404).json({ error: 'File not found' });

    const file = files[0];
    const contentType = meta?.mimeType || file.metadata?.contentType || 'application/octet-stream';
    const isPreview = req.query.preview === '1';

    res.set('Content-Type', contentType);
    res.set('Content-Disposition', `${isPreview ? 'inline' : 'attachment'}; filename="${encodeURIComponent(file.filename)}"`);
    res.set('Content-Length', file.length);

    bucket.openDownloadStream(objectId).pipe(res);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Soft delete
app.delete('/files/:id', checkSecretMiddleware, async (req, res) => {
  try {
    const col = await getCol('file_metadata');
    const meta = await col.findOne({ fileId: req.params.id });
    if (!meta) return res.status(404).json({ error: 'Not found' });
    await col.updateOne({ fileId: req.params.id }, { $set: { deleted: true, deletedAt: new Date(), deletedBy: req.query.by || 'unknown' } });
    await appendAudit({ action: 'file_delete', userId: req.query.by, projectId: meta.projectId, detail: meta.originalName, fileId: req.params.id, ts: new Date() });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Audit Trail ───────────────────────────────────────────────────────────
async function appendAudit(event) {
  try {
    const col = await getCol('audit_trail');
    await col.insertOne({ ...event, _recorded: new Date() });
  } catch (e) { console.error('Audit error:', e.message); }
}

app.post('/audit', checkSecretMiddleware, async (req, res) => {
  try {
    await appendAudit({ ...req.body, ts: new Date() });
    res.json({ ok: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/audit', checkSecretMiddleware, async (req, res) => {
  try {
    const col = await getCol('audit_trail');
    const query = {};
    if (req.query.projectId) query.projectId = req.query.projectId;
    if (req.query.userId)    query.userId    = req.query.userId;
    if (req.query.action)    query.action    = req.query.action;
    if (req.query.from)      query.ts = { $gte: new Date(req.query.from) };
    const limit = Math.min(parseInt(req.query.limit || '100'), 500);
    const events = await col.find(query).sort({ ts: -1 }).limit(limit).toArray();
    res.json(events);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ─── Middleware helper ─────────────────────────────────────────────────────
function checkSecretMiddleware(req, res, next) {
  if (!API_SECRET) return next();
  const sent = req.headers['x-api-secret'] || req.query.secret;
  if (sent !== API_SECRET) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

// ─── Start ─────────────────────────────────────────────────────────────────
if (!MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

app.listen(PORT, () => {
  console.log(`✅ Platform API v2 running on port ${PORT}`);
  console.log(`   DB: ${DB_NAME} | Max file: ${MAX_FILE_MB}MB`);
});
