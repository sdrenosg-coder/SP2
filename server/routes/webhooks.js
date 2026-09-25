import express from 'express';
import { handleWebhook } from '../services/paymentService.js';

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['stripe-signature'];
    const result = await handleWebhook(req.body, signature);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
