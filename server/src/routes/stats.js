import { Router } from 'express';
import { db } from '../db.js';

const router = Router();

/* GET /api/stats */
router.get('/', async (req, res) => {
  try {
    const stats = await db.getStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
