export type ApprovalStatus = "APPROVED" | "RESTRICTED" | "BLOCKED" | "PENDING_REVIEW";

export const AI_MODEL_REGISTRY = [
  {
    model_id: "gemini-2.5-flash-lite",
    provider: "Google",
    model_name: "Gemini 2.5 Flash Lite",
    model_version: "2.5",
    hosting_location: "Google Cloud",
    processing_location: "external_cloud",
    data_categories_allowed: ["PUBLIC", "INTERNAL"],
    training_on_customer_data: false,
    retention_policy: "provider_contract_required",
    subprocessors: ["Google Cloud"],
    transfer_mechanism: "requires_privacy_review",
    security_review_status: "PENDING_REVIEW",
    privacy_review_status: "PENDING_REVIEW",
    approval_status: "RESTRICTED" satisfies ApprovalStatus,
    notes: "Personal data is denied by default unless a specific reviewed workflow minimizes or pseudonymizes input.",
  },
  {
    model_id: "local-slm-private-zone",
    provider: "BeJoby",
    model_name: "Private AI Zone SLM",
    model_version: "pending",
    hosting_location: "BeJoby controlled infrastructure",
    processing_location: "private_inference_zone",
    data_categories_allowed: ["PUBLIC", "INTERNAL", "PERSONAL"],
    training_on_customer_data: false,
    retention_policy: "no_raw_prompt_retention_by_default",
    subprocessors: [],
    transfer_mechanism: "none_local_processing",
    security_review_status: "PENDING_REVIEW",
    privacy_review_status: "PENDING_REVIEW",
    approval_status: "PENDING_REVIEW" satisfies ApprovalStatus,
    notes: "Preferred target for CV parsing, skill extraction, embeddings and matching over personal data.",
  },
];

export const VENDOR_REGISTRY = [
  {
    vendor: "Google Cloud",
    service: "Firestore, Cloud Storage, AI APIs where approved",
    data_access: "platform_data_and_restricted_ai_workflows",
    data_categories: ["PUBLIC", "INTERNAL", "PERSONAL"],
    processing_country: "contractual_region_or_provider_location",
    storage_country: "configured_cloud_region",
    subprocessors: "provider_disclosure_required",
    dpa: "REQUIRED",
    security_review: "PENDING_REVIEW",
    privacy_review: "PENDING_REVIEW",
    retention: "service_specific",
    deletion_process: "provider_contract_required",
    incident_process: "provider_contract_required",
    approval_status: "PENDING_REVIEW" satisfies ApprovalStatus,
  },
  {
    vendor: "Vercel",
    service: "Frontend hosting and serverless runtime",
    data_access: "runtime_metadata_and_request_processing",
    data_categories: ["PUBLIC", "INTERNAL", "PERSONAL"],
    processing_country: "provider_location",
    storage_country: "provider_location",
    subprocessors: "provider_disclosure_required",
    dpa: "REQUIRED",
    security_review: "PENDING_REVIEW",
    privacy_review: "PENDING_REVIEW",
    retention: "service_specific",
    deletion_process: "provider_contract_required",
    incident_process: "provider_contract_required",
    approval_status: "PENDING_REVIEW" satisfies ApprovalStatus,
  },
];

export const DATA_CLASSIFICATION_POLICY = {
  PUBLIC: {
    ai_policy: "approved_cloud_or_local",
    examples: ["Public job descriptions", "Public company information"],
  },
  INTERNAL: {
    ai_policy: "approved_internal_or_restricted_cloud",
    examples: ["Operational metadata", "Internal analytics"],
  },
  PERSONAL: {
    ai_policy: "local_first_external_denied_by_default",
    examples: ["CV", "Email", "Work history", "Education", "Application history"],
  },
  SENSITIVE_OR_SPECIAL_CATEGORY: {
    ai_policy: "block_by_default_special_workflow_required",
    examples: ["Health information", "Biometric information", "Political opinions", "Religious beliefs"],
  },
  AUTHENTICATION_SECRET: {
    ai_policy: "never_send_to_llm",
    examples: ["Passwords", "API keys", "Access tokens", "Private keys"],
  },
};
