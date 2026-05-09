import { Router } from 'express';
import { verifyJWT } from '../middleware/auth.js';
import db from '../db/database.js';

const router = Router();

function generateSlug(title) {
  return title
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

router.get('/', (req, res) => {
  const isAuth = req.headers['authorization']?.startsWith('Bearer ');
  const articles = isAuth
    ? db.prepare('SELECT * FROM articles ORDER BY created_at DESC').all()
    : db.prepare("SELECT * FROM articles WHERE status = 'published' ORDER BY created_at DESC").all();
  res.json(articles);
});

router.get('/:id', (req, res) => {
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Artículo no encontrado' });
  res.json(article);
});

router.post('/', verifyJWT, (req, res) => {
  const { title, content, excerpt, status = 'draft' } = req.body;
  if (!title || !content) return res.status(400).json({ error: 'Título y contenido requeridos' });

  let slug = generateSlug(title);
  let suffix = 0;
  while (db.prepare('SELECT id FROM articles WHERE slug = ?').get(slug + (suffix ? `-${suffix}` : ''))) {
    suffix++;
  }
  if (suffix) slug = `${slug}-${suffix}`;

  const result = db.prepare(
    'INSERT INTO articles (title, slug, content, excerpt, status) VALUES (?, ?, ?, ?, ?)'
  ).run(title, slug, content, excerpt || '', status);

  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(article);
});

router.put('/:id', verifyJWT, (req, res) => {
  const { title, content, excerpt, status } = req.body;
  const article = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!article) return res.status(404).json({ error: 'Artículo no encontrado' });

  db.prepare(
    `UPDATE articles SET
      title = COALESCE(?, title),
      content = COALESCE(?, content),
      excerpt = COALESCE(?, excerpt),
      status = COALESCE(?, status),
      updated_at = datetime('now')
    WHERE id = ?`
  ).run(title, content, excerpt, status, req.params.id);

  res.json(db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id));
});

router.delete('/:id', verifyJWT, (req, res) => {
  const result = db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Artículo no encontrado' });
  res.json({ success: true });
});

export default router;
