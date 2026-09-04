// FIRESTORE DATA SCHEMA UPDATES
// These documents outline changes to the Firestore collections for BeJoby MVP

// ===== APPLICATIONS Collection =====
// New and updated fields:

export const APPLICATION_SCHEMA_UPDATE = {
  existing_fields: [
    "candidate_id",
    "candidate_name",
    "candidate_email",
    "job_id",
    "partner_id",
    "message",
    "status",
    "cv_path",
    "consent_shared",
  ],
  
  new_fields_for_batch_processing: {
    batch_processing_status: {
      type: "string",
      enum: ["pending", "processing", "completed", "retry", "failed"],
      default: "pending",
      description: "Current state of CV analysis batch job",
    },
    batch_processing_started_at: {
      type: "timestamp",
      description: "When batch processing started",
    },
    batch_processing_completed_at: {
      type: "timestamp",
      description: "When batch processing completed",
    },
    batch_processing_retry_count: {
      type: "number",
      default: 0,
      description: "Number of retry attempts (max 3)",
    },
    batch_processing_last_error: {
      type: "string",
      description: "Last error message from batch processor",
    },
  },

  new_fields_for_ai_analysis: {
    ai_analysis: {
      type: "object",
      description: "Result of AI match analysis",
      fields: {
        score: "number (0-100)",
        summary: "string",
        strengths: "array<string>",
        gaps: "array<string>",
        recommendation: "string",
        analyzed_at: "timestamp",
      },
    },
    ai_cost_logs: {
      type: "array<object>",
      description: "Array of AI cost entries",
      fields: {
        model: "string",
        provider: "string",
        task_type: "string",
        input_tokens: "number",
        output_tokens: "number",
        total_tokens: "number",
        cost_usd: "number",
        cost_clp: "number",
        recorded_at: "timestamp",
      },
    },
    ai_requires_human_review: {
      type: "boolean",
      default: false,
      description: "CAIO governance flag for human review required",
    },
    ai_review_reason: {
      type: "string",
      description: "Reason why human review is required",
    },
    ai_governance_audit_id: {
      type: "string",
      description: "Reference to ai_audit_log document",
    },
  },

  new_fields_for_partner_submission: {
    ready_for_partner_submission: {
      type: "boolean",
      default: false,
      description: "Candidate profile ready to submit (80% complete, consent given)",
    },
    ready_for_submission_at: {
      type: "timestamp",
      description: "When candidate became ready for submission",
    },
    submitted_to_partner_at: {
      type: "timestamp",
      description: "When submitted to partner",
    },
  },

  new_fields_for_commission_tracking: {
    commission_status: {
      type: "string",
      enum: ["pending", "confirmed", "paid", "refunded"],
      default: "pending",
      description: "Payment status of candidate commission",
    },
    commission_amount_clp: {
      type: "number",
      default: 200000,
      description: "Commission amount in CLP",
    },
    commission_updated_at: {
      type: "timestamp",
      description: "Last update to commission status",
    },
    commission_notes: {
      type: "string",
      description: "Notes about commission payment/rejection",
    },
  },
};

// ===== CANDIDATES Collection =====
// New fields added:

export const CANDIDATES_SCHEMA_UPDATE = {
  new_fields_for_gamification: {
    profile_completion_percent: {
      type: "number",
      description: "Calculated completion %",
      calculated: true,
    },
    game_points: {
      type: "number",
      default: 0,
      description: "Gamification points from completed tasks",
    },
    badges: {
      type: "array<string>",
      description: "Earned badges",
    },
    last_action_at: {
      type: "timestamp",
      description: "Last time candidate interacted with platform",
    },
  },

  existing_required_fields: [
    "email",
    "phone",
    "name",
    "consent_shared",
    "cv_path",
    "salary_expected",
    "english_level",
    "availability",
    "location",
  ],
};

// ===== PARTNERS Collection =====
// Existing fields should include:

export const PARTNERS_SCHEMA = {
  required_fields: [
    "name",
    "email",
    "contact_person",
    "commission_rate_percent",
    "commission_model", // "per_accepted", "per_hired", "per_submitted"
  ],
};

// ===== TRANSACTIONS Collection (NEW) =====
// Payment and feature purchase history

export const TRANSACTIONS_SCHEMA = {
  required_fields: [
    "employer_id",      // ref to employer
    "type",             // enum: publish_job | featured_upgrade | homepage | profile_upgrade | featured_renewal
    "amount",           // number (currency units)
    "currency",         // USD | CLP | etc
    "status",           // enum: pending | completed | failed | refunded
    "created_at",       // timestamp
  ],
  optional_fields: [
    "related_entity_id",      // ref to job_posting (if applicable)
    "completed_at",           // timestamp (when status -> completed)
    "payment_method",         // credit_card | paypal | vtex_checkout
    "vtex_order_id",          // string (if from VTEX)
    "description",            // string
  ],
};

// ===== INTERACTIONS Collection (NEW) =====
// Emails, internal notes, status changes between candidate and employer

export const INTERACTIONS_SCHEMA = {
  required_fields: [
    "application_id",    // ref to application
    "from_user_id",      // user who sent (candidate or employer)
    "type",              // enum: email | internal_note | status_change
    "body",              // text content
    "created_at",        // timestamp
  ],
  optional_fields: [
    "subject",           // string (for emails)
    "is_public",         // boolean (candidate can see or not)
  ],
};

// ===== APPLICATIONS Collection (EXTEND) =====
// Add history tracking fields

export const APPLICATIONS_SCHEMA_EXTEND = {
  new_fields_for_history: {
    status: {
      type: "string",
      enum: ["enviada", "revisada", "entrevista", "rechazo", "oferta", "aceptada", "expirada"],
      default: "enviada",
    },
    status_history: {
      type: "array<object>",
      description: "Timeline of status changes",
      fields: {
        status: "string",
        timestamp: "timestamp",
        note: "string (optional)",
      },
    },
    last_updated_at: {
      type: "timestamp",
      description: "Last update to application",
    },
    feedback: {
      type: "string",
      description: "Private note from employer (not visible to candidate)",
    },
  },
  note: "status field overrides existing 'status' — ensure migration adds history",
};

// ===== JOB_POSTINGS Collection (EXTEND) =====
// Add publication tracking

export const JOB_POSTINGS_SCHEMA_EXTEND = {
  new_fields_for_history: {
    status: {
      type: "string",
      enum: ["activa", "cerrada", "archivada"],
      default: "activa",
    },
    published_at: {
      type: "timestamp",
      description: "When posting was published",
    },
    closed_at: {
      type: "timestamp",
      description: "When posting was closed (optional)",
    },
    application_count: {
      type: "number",
      default: 0,
      description: "Denormalized count for performance",
    },
  },
};

// ===== Migration Instructions =====

export const MIGRATION_STEPS = [
  "1. Add batch_processing_status = 'pending' to all existing applications",
  "2. Add batch_processing_retry_count = 0 to all existing applications",
  "3. Add ai_cost_logs = [] to all existing applications",
  "4. Add commission_status = 'pending' to all existing applications",
  "5. Add commission_amount_clp = 200000 to all existing applications",
  "6. Create ai_audit_log collection (if not exists)",
  "7. Create partners collection (if not exists)",
  "8. Verify candidates have: email, phone, name, cv_path, salary_expected, consent_shared",
  "9. [NEW] Add status_history = [] to all existing applications",
  "10. [NEW] Add status = 'enviada' to all existing applications (if not present)",
  "11. [NEW] Add last_updated_at = now() to all existing applications",
  "12. [NEW] Create transactions collection (auto-created on first insert)",
  "13. [NEW] Create interactions collection (auto-created on first insert)",
  "14. [NEW] Add status = 'activa' to all existing job_postings",
  "15. [NEW] Add published_at = now() to all existing job_postings",
  "16. [NEW] Add application_count = (query count) to all job_postings",
];
