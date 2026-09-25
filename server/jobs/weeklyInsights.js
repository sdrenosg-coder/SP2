import { db } from '../db/index.js';
import { businesses } from '../db/schema.js';
import { generateWeeklyInsights } from '../services/insightsService.js';

export async function runWeeklyInsights() {
  const bizs = await db.select().from(businesses);
  for (const biz of bizs) {
    const insights = await generateWeeklyInsights(biz.id);
    console.log('Weekly insights for business', biz.id, insights);
  }
}
