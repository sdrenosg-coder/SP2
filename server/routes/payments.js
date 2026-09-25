import express from 'express';
import { createPaymentIntent } from '../services/paymentService.js';
import { authRequired, resolveBusinessFromUser } from '../middleware/index.js';

const router = express.Router();

router.post('/create-intent', authRequired, resolveBusinessFromUser, async (req, res, next) => {
  try {
    const { amount, currency, customerEmail, metadata } = req.body;
    const result = await createPaymentIntent({ amount, currency, customerEmail, metadata });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
