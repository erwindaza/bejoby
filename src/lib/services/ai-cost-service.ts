import { applications } from "@/lib/gcp/collections";
import { FieldValue } from "@google-cloud/firestore";

export interface AITokenUsage {
  input_tokens: number;
  output_tokens: number;
  total_tokens: number;
}

export interface AICostLog {
  application_id: string;
  model_id: string;
  provider: string;
  task_type: string;
  token_usage: AITokenUsage;
  estimated_cost_usd: number;
  estimated_cost_clp: number;
  recorded_at: string;
}

const USD_TO_CLP = 800; // Approximate exchange rate
const PRICING_PER_MODEL: Record<string, { input_per_1m: number; output_per_1m: number }> = {
  "gemini-2.5-flash-lite": {
    input_per_1m: 0.075,
    output_per_1m: 0.30,
  },
  "gemini-2.5-flash": {
    input_per_1m: 0.075,
    output_per_1m: 0.30,
  },
  "gemini-1.5-flash": {
    input_per_1m: 0.075,
    output_per_1m: 0.30,
  },
};

function calculateCost(model: string, tokenUsage: AITokenUsage): number {
  const pricing = PRICING_PER_MODEL[model] || PRICING_PER_MODEL["gemini-2.5-flash-lite"];
  const inputCost = (tokenUsage.input_tokens / 1000000) * pricing.input_per_1m;
  const outputCost = (tokenUsage.output_tokens / 1000000) * pricing.output_per_1m;
  return inputCost + outputCost;
}

/**
 * Log AI usage for an application.
 * Called after each AI invocation.
 */
export async function logAICost(
  applicationId: string,
  model: string,
  provider: string,
  taskType: string,
  tokenUsage: AITokenUsage,
): Promise<void> {
  const costUsd = calculateCost(model, tokenUsage);
  const costClp = costUsd * USD_TO_CLP;

  try {
    // Append to application's ai_cost_log
    await applications().doc(applicationId).update({
      ai_cost_logs: FieldValue.arrayUnion({
        model,
        provider,
        task_type: taskType,
        input_tokens: tokenUsage.input_tokens,
        output_tokens: tokenUsage.output_tokens,
        total_tokens: tokenUsage.total_tokens,
        cost_usd: costUsd,
        cost_clp: costClp,
        recorded_at: new Date().toISOString(),
      }),
    });

    console.log(
      `[AI-COST] Application ${applicationId}: ${model} ${taskType} = ${costClp.toFixed(0)} CLP (${tokenUsage.total_tokens} tokens)`,
    );
  } catch (err) {
    console.error("[logAICost]", err instanceof Error ? err.message : err);
  }
}

/**
 * Estimate total AI cost for a candidate across all applications.
 */
export async function estimateCostPerCandidate(candidateId: string): Promise<number> {
  const snapshot = await applications()
    .where("candidate_id", "==", candidateId)
    .get();

  let totalCost = 0;
  snapshot.docs.forEach((doc) => {
    const appData = doc.data() as Record<string, unknown>;
    const logs = (appData.ai_cost_logs as unknown[]) || [];
    logs.forEach((log: unknown) => {
      const logData = log as Record<string, unknown>;
      totalCost += (logData.cost_clp as number) || 0;
    });
  });

  return totalCost;
}

/**
 * Get current month's total AI spend in USD.
 */
export async function getCurrentMonthAISpendUsd(): Promise<number> {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const snapshot = await applications().get();

  let totalSpendUsd = 0;
  snapshot.docs.forEach((doc) => {
    const appData = doc.data() as Record<string, unknown>;
    const logs = (appData.ai_cost_logs as unknown[]) || [];
    logs.forEach((log: unknown) => {
      const logData = log as Record<string, unknown>;
      const recordedAt = logData.recorded_at as string;
      if (recordedAt) {
        const logDate = new Date(recordedAt);
        if (logDate >= monthStart && logDate <= monthEnd) {
          const costUsd = (logData.cost_usd as number) || 0;
          totalSpendUsd += costUsd;
        }
      }
    });
  });

  return totalSpendUsd;
}

/**
 * Enforce budget guard — throw error if monthly AI spend exceeds limit.
 * Usage: call before expensive AI operations to prevent budget overruns.
 */
export async function checkAIBudget(monthlyBudgetUsd: number = 100): Promise<boolean> {
  const currentSpend = await getCurrentMonthAISpendUsd();
  const percentUsed = (currentSpend / monthlyBudgetUsd) * 100;

  console.log(
    `[AI-BUDGET] Current month: $${currentSpend.toFixed(2)} / $${monthlyBudgetUsd} (${percentUsed.toFixed(0)}%)`,
  );

  if (currentSpend >= monthlyBudgetUsd) {
    throw new Error(
      `AI budget exceeded: $${currentSpend.toFixed(2)} >= $${monthlyBudgetUsd} monthly limit`,
    );
  }

  // Warn at 80% usage
  if (percentUsed >= 80) {
    console.warn(
      `[AI-BUDGET] WARNING: 80%+ of monthly budget used ($${currentSpend.toFixed(2)} of $${monthlyBudgetUsd})`,
    );
  }

  return true;
}
