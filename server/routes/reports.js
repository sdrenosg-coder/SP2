import express from 'express';
import { authRequired, resolveBusinessFromUser } from '../middleware/index.js';
import { getBusinessSummary, getHealthInsights } from '../services/reportService.js';

const router = express.Router();

router.get('/summary', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const summary = await getBusinessSummary(req.businessId);
    res.json({ summary });
  } catch (err) { next(err); }
});

router.get('/health', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const insights = await getHealthInsights(req.businessId);
    res.json({ insights });
  } catch (err) { next(err); }
});

export default router;
