import { success } from "@/lib/utils/api-response";
import {
  AI_MODEL_REGISTRY,
  DATA_CLASSIFICATION_POLICY,
  VENDOR_REGISTRY,
} from "@/lib/compliance/registries";

export async function GET() {
  return success({
    version: "1.0.0",
    legal_review_required_before_production: true,
    ai_models: AI_MODEL_REGISTRY,
    vendors: VENDOR_REGISTRY,
    data_classification: DATA_CLASSIFICATION_POLICY,
    safeguards: {
      external_ai_default: "DENY_PERSONAL_DATA",
      local_models_preferred_for_personal_data: true,
      hiring_decision_requires_human_review: true,
      authentication_secrets_llm_access: "NEVER",
    },
  });
}
