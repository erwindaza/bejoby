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
];
