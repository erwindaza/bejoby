/**
 * Gamification Events Service
 * 
 * Tracks candidate achievements, streaks, badges, and milestones.
 * Events feed drives notifications, profile level progression, and mission tracking.
 */

import { candidates, events as eventsCollection } from "@/lib/gcp/collections";
import { FieldValue } from "@google-cloud/firestore";

export enum EventType {
  // Profile Events
  PROFILE_CREATED = "profile_created",
  PROFILE_UPDATED = "profile_updated",
  PROFILE_FIELD_COMPLETED = "profile_field_completed",
  PROFILE_COMPLETION_REACHED = "profile_completion_reached",

  // Job Interaction Events
  JOB_VIEWED = "job_viewed",
  JOB_APPLIED = "job_applied",
  JOB_APPLICATION_WITHDRAWN = "job_application_withdrawn",

  // Achievement Events
  CV_UPLOADED = "cv_uploaded",
  CV_ANALYZED = "cv_analyzed",
  BADGE_EARNED = "badge_earned",
  POINTS_EARNED = "points_earned",
  PROFILE_LEVEL_UP = "profile_level_up",

  // Partner Events
  READY_FOR_PARTNER = "ready_for_partner",
  SUBMITTED_TO_PARTNER = "submitted_to_partner",
  PARTNER_ACCEPTANCE = "partner_acceptance",

  // Streak Events
  STREAK_STARTED = "streak_started",
  STREAK_MAINTAINED = "streak_maintained",
  STREAK_BROKEN = "streak_broken",

  // System Events
  DAILY_MISSION_COMPLETED = "daily_mission_completed",
  WEEKLY_GOAL_REACHED = "weekly_goal_reached",
}

export interface GameEvent {
  candidate_id: string;
  event_type: EventType;
  title: string;
  description?: string;
  points_awarded?: number;
  badge_earned?: string;
  metadata?: Record<string, unknown>;
  occurred_at: string;
}

/**
 * Log a game event for a candidate.
 */
export async function logGameEvent(
  candidateId: string,
  eventType: EventType,
  title: string,
  options?: {
    description?: string;
    points_awarded?: number;
    badge_earned?: string;
    metadata?: Record<string, unknown>;
  },
): Promise<void> {
  try {
    const event: GameEvent = {
      candidate_id: candidateId,
      event_type: eventType,
      title,
      description: options?.description,
      points_awarded: options?.points_awarded,
      badge_earned: options?.badge_earned,
      metadata: options?.metadata,
      occurred_at: new Date().toISOString(),
    };

    // Append to candidate's event history
    await candidates().doc(candidateId).update({
      game_events: FieldValue.arrayUnion(event),
      last_action_at: FieldValue.serverTimestamp(),
    });

    // Also write to events collection for analytics/dashboards
    await eventsCollection().add(event);

    console.log(`[GAME-EVENT] ${candidateId}: ${eventType} - ${title}`);
  } catch (err) {
    console.error("[logGameEvent]", err instanceof Error ? err.message : err);
  }
}

/**
 * Detect and award profile field completion.
 * Called when candidate updates profile field.
 */
export async function trackProfileFieldCompletion(candidateId: string, field: string): Promise<void> {
  try {
    await logGameEvent(
      candidateId,
      EventType.PROFILE_FIELD_COMPLETED,
      `Campo completado: ${field}`,
      {
        metadata: { field },
        points_awarded: 5,
      },
    );
  } catch (err) {
    console.error("[trackProfileFieldCompletion]", err instanceof Error ? err.message : err);
  }
}

/**
 * Award CV analysis completion event.
 * Called after successful AI match analysis.
 */
export async function trackCVAnalyzed(applicationId: string, candidateId: string, score: number): Promise<void> {
  try {
    const badge = score >= 75 ? "CV Strong Match" : score >= 50 ? "CV Good Fit" : "CV Analyzed";

    await logGameEvent(
      candidateId,
      EventType.CV_ANALYZED,
      badge,
      {
        description: `CV analizado con score ${score}/100`,
        points_awarded: score >= 75 ? 25 : score >= 50 ? 15 : 10,
        badge_earned: badge,
        metadata: { application_id: applicationId, score },
      },
    );
  } catch (err) {
    console.error("[trackCVAnalyzed]", err instanceof Error ? err.message : err);
  }
}

/**
 * Award partner submission event.
 * Called when candidate submitted to partner.
 */
export async function trackSubmittedToPartner(applicationId: string, candidateId: string): Promise<void> {
  try {
    await logGameEvent(
      candidateId,
      EventType.SUBMITTED_TO_PARTNER,
      "¡Candidato enviado a partner!",
      {
        description: "Tu perfil está siendo evaluado por un partner",
        points_awarded: 50,
        badge_earned: "Partner Candidate",
        metadata: { application_id: applicationId },
      },
    );
  } catch (err) {
    console.error("[trackSubmittedToPartner]", err instanceof Error ? err.message : err);
  }
}

/**
 * Get candidate's recent game events.
 */
export async function getRecentGameEvents(candidateId: string, limit: number = 20): Promise<GameEvent[]> {
  try {
    const candidateDoc = await candidates().doc(candidateId).get();
    if (!candidateDoc.exists) {
      return [];
    }

    const data = candidateDoc.data()!;
    const events = (data.game_events || []) as GameEvent[];

    // Sort by occurred_at descending and limit
    return events
      .sort((a, b) => new Date(b.occurred_at).getTime() - new Date(a.occurred_at).getTime())
      .slice(0, limit);
  } catch (err) {
    console.error("[getRecentGameEvents]", err instanceof Error ? err.message : err);
    return [];
  }
}

/**
 * Calculate current streak (consecutive days with activity).
 */
export async function calculateCurrentStreak(candidateId: string): Promise<number> {
  try {
    const events = await getRecentGameEvents(candidateId, 100);
    if (!events.length) return 0;

    const dates = new Set<string>();
    events.forEach((e) => {
      const date = new Date(e.occurred_at).toISOString().split("T")[0];
      dates.add(date);
    });

    // Check consecutive days from today backwards
    let streak = 0;
    const checkDate = new Date();
    while (true) {
      const dateStr = checkDate.toISOString().split("T")[0];
      if (dates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else if (streak > 0) {
        break; // Streak ended
      } else {
        checkDate.setDate(checkDate.getDate() - 1);
        // Skip if no activity yet
        if (new Date().getTime() - checkDate.getTime() > 7 * 24 * 60 * 60 * 1000) {
          break; // Don't look back more than a week
        }
      }
    }

    return streak;
  } catch (err) {
    console.error("[calculateCurrentStreak]", err instanceof Error ? err.message : err);
    return 0;
  }
}

/**
 * Award badge if conditions met.
 */
export async function awardBadgeIfEarned(candidateId: string, badgeKey: string): Promise<boolean> {
  try {
    const candidateDoc = await candidates().doc(candidateId).get();
    if (!candidateDoc.exists) return false;

    const data = candidateDoc.data()!;
    const currentBadges = data.badges || [];

    // Check if already has badge
    if (currentBadges.includes(badgeKey)) {
      return false;
    }

    // Award badge
    await candidates().doc(candidateId).update({
      badges: FieldValue.arrayUnion(badgeKey),
    });

    await logGameEvent(
      candidateId,
      EventType.BADGE_EARNED,
      `Badge earned: ${badgeKey}`,
      {
        badge_earned: badgeKey,
        points_awarded: 30,
      },
    );

    return true;
  } catch (err) {
    console.error("[awardBadgeIfEarned]", err instanceof Error ? err.message : err);
    return false;
  }
}
