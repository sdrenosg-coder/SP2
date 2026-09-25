import { getBusinessSummary, getHealthInsights } from './reportService.js';

export async function generateWeeklyInsights(businessId) {
  const summary = await getBusinessSummary(businessId);
  const insights = await getHealthInsights(businessId);
  return { businessId, generatedAt: new Date(), summary, insights };
}
