# BeJoby — Production Issues & UX Fixes (2026-09-08)

**Status:** URGENT - P0 + P1 Issues Detected  
**Date Discovered:** 2026-09-08  
**Reported by:** User Testing (Screenshots)  
**Severity:** P0 (Candidate UX) + P1 (Data Persistence)

---

## 🚨 Issue #1: Application Form Hidden Below Fold (P0 - UX)

### The Problem
When a candidate clicks **"Postularme a esta oferta"** on a job detail page:
- ✅ Form IS rendered in DOM
- ❌ Form appears at BOTTOM of page (`mt-12` spacing)
- ❌ **NO automatic scroll** to form
- ❌ User has no visual feedback that anything happened
- ❌ Candidate likely thinks submission failed or page broke

### Current Implementation
```tsx
// src/app/[locale]/jobs/[id]/page.tsx, line ~300
{showApply && !applied && (
  <div className="mt-12 max-w-xl mx-auto">
    <JobApplyForm jobId={job.id} jobTitle={job.title} locale={lang} onSuccess={...} />
  </div>
)}
```

**Problem:** No `useRef` + `scrollIntoView()` on mount.

### Impact
- 🔴 **Abandonment:** Users think form submission failed
- 🔴 **Support load:** "Did my application go through?"
- 🔴 **Conversion loss:** Lower application completion rate

---

## 🚨 Issue #2: Applications Disappear After Submit (P1 - Data)

### The Problem
1. Candidate fills form with email `example@gmail.com`
2. Form POSTs to `/api/applications` → **application saved to Firestore**
3. Candidate navigates to **"Mis Postulaciones"** dashboard
4. ❌ **Empty state appears** — "Aún no tienes postulaciones"
5. ❌ But application IS in database (verified in Firestore console)

### Root Cause Analysis

**Scenario 1: Email Mismatch**
```
Timeline:
1. Candidate (not logged in) fills form with email A
   → POST /api/applications creates candidate doc with email A
   → Response returns application_id
   → Success message shown ✓

2. Candidate navigates to dashboard
   → AuthProvider checks if candidate_id in localStorage ✓ (it is)
   → Calls GET /api/applications
   → But WAIT: User might not be logged in yet...

3. If candidate logs in with email B (different)
   → Session created with email B
   → getSessionUser() tries auto-link by email B
   → Can't find candidate with email B
   → Returns empty applications list ❌

```

**Scenario 2: No Login Between Submit & View**
- If candidate submits form anonymously (no login)
- Then opens dashboard without logging in
- `getSessionUser()` returns null
- Dashboard shows "Must log in" screen
- After login, auto-link should work IF email matches

**Current Code (auth.ts, line 40-50):**
```typescript
// Auto-link candidate profile by email
if (!candidateId && !userData.employer_id) {
  const candSnapshot = await candidates()
    .where("email", "==", userData.email)
    .limit(1)
    .get();
  if (!candSnapshot.empty) {
    candidateId = candSnapshot.docs[0].id;
    users().doc(session.user_id).update({ candidate_id: candidateId }).catch(() => {});
  }
}
```

**Issue:** This runs ONCE per session, doesn't re-run if first attempt fails.

### Impact
- 🔴 **Trust loss:** "I applied but it disappeared"
- 🔴 **Data loss perception:** Candidate thinks system is broken
- 🔴 **Orphaned records:** Applications exist in DB but unretrievable

---

## 🎯 User Stories (Bug Fixes)

### US-FIX-1: Form Scroll Guidance (UX)

**As a** candidate applying for a job  
**I want** the application form to automatically scroll into view when I click "Apply"  
**So that** I immediately see the form and understand the application process started

**Acceptance Criteria:**
- ✅ Clicking "Postularme a esta oferta" triggers smooth scroll to form
- ✅ Form has visual indicator (border highlight, background emphasis) for 1 sec
- ✅ On mobile: keyboard auto-focuses first field (Name)
- ✅ On desktop: form scrolls to top of viewport
- ✅ Works on all browsers (iOS Safari, Chrome, Firefox, Edge)
- ✅ Scroll respects existing spacing (doesn't hide heading)

**Technical Approach:**
```tsx
// Add to [id]/page.tsx
import { useRef, useEffect } from "react";

export default function JobDetailPage() {
  const formRef = useRef<HTMLDivElement>(null);
  const [showApply, setShowApply] = useState(false);

  useEffect(() => {
    if (showApply && formRef.current) {
      // Delay to allow DOM paint
      setTimeout(() => {
        formRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 50);
    }
  }, [showApply]);

  return (
    <>
      {showApply && !applied && (
        <div ref={formRef} className="mt-8 max-w-xl mx-auto scroll-mt-24">
          <JobApplyForm jobId={job.id} jobTitle={job.title} locale={lang} 
            onSuccess={() => { setApplied(true); setShowApply(false); }} />
        </div>
      )}
    </>
  );
}
```

**Files Changed:** `src/app/[locale]/jobs/[id]/page.tsx`  
**Effort:** ~1 hour  
**Testing:** Manual on mobile + desktop browsers

---

### US-FIX-2: Application Auto-Link on Login (Data)

**As a** candidate who applied anonymously  
**I want** my application to appear in the dashboard after I log in with the same email  
**So that** I can track my submissions without data loss

**Acceptance Criteria:**
- ✅ Anonymous application with email A is saved
- ✅ Candidate logs in with email A
- ✅ Dashboard immediately shows that application
- ✅ No duplicate applications if candidate tries to apply twice
- ✅ Email matching is case-insensitive (a@b.com == A@b.com)
- ✅ If candidate logs in with email B (different) → no applications shown (correct)
- ✅ Debug logs track email matching for troubleshooting

**Technical Approach:**

a) **Normalize emails in storage:**
```typescript
// Both in applications POST and candidates lookup
const normalizedEmail = email.toLowerCase().trim();
```

b) **Enhance getSessionUser() with re-link attempt:**
```typescript
// auth.ts
if (!candidateId && !userData.employer_id) {
  const candSnapshot = await candidates()
    .where("email", "==", userData.email.toLowerCase()) // normalized
    .limit(1)
    .get();
  
  if (!candSnapshot.empty) {
    candidateId = candSnapshot.docs[0].id;
    await users().doc(session.user_id).update({ candidate_id: candidateId });
    
    // Log for debugging
    console.log(`[AUTO-LINK] email=${userData.email} → candidate_id=${candidateId}`);
  } else {
    console.log(`[AUTO-LINK-MISS] No candidate found for email=${userData.email}`);
  }
}
```

c) **Add endpoint to manually sync:**
```typescript
// POST /api/candidates/sync-applications
// Allows frontend to retry linking if auto-link missed
export async function POST() {
  const user = await getSessionUser();
  if (!user || user.employer_id) return error("Unauthorized", 401);
  
  // Retry auto-link logic
  const candSnapshot = await candidates().where("email", "==", user.email.toLowerCase()).limit(1).get();
  
  if (!candSnapshot.empty && !user.candidate_id) {
    const candidateId = candSnapshot.docs[0].id;
    await users().doc(user.id).update({ candidate_id: candidateId });
    return success({ synced: true, candidate_id: candidateId });
  }
  
  return success({ synced: false });
}
```

d) **Call sync after login:**
```typescript
// AuthProvider.tsx or LoginModal.tsx
useEffect(() => {
  if (user && !user.candidate_id) {
    // Try to link candidate profile by email
    fetch("/api/candidates/sync-applications", { method: "POST" })
      .then(r => r.json())
      .then(data => {
        if (data.data?.synced) {
          // Refresh user session
          refreshUser();
        }
      })
      .catch(() => {});
  }
}, [user]);
```

**Files Changed:**
- `src/lib/auth.ts` (add email normalization + logging)
- `src/app/api/candidates/sync-applications/route.ts` (new endpoint)
- `src/components/AuthProvider.tsx` (call sync after login)
- `src/app/api/applications/route.ts` (normalize email in POST)

**Effort:** ~2-3 hours  
**Testing:** 
- Flow 1: Apply (email A) → Login (email A) → Applications appear ✓
- Flow 2: Apply (email A) → Close browser → Login (email A) → Applications appear ✓
- Flow 3: Apply (email A) → Login (email B) → No applications (correct) ✓

---

## 📋 Implementation Order

### Phase 1: Immediate (Fix UX Pain)
1. **US-FIX-1:** Scroll to form (1 hour)
   - Low risk, high impact
   - Deploy to dev → QA → staging → production
   - Test on mobile + desktop

### Phase 2: Follow-up (Fix Data Loss)
2. **US-FIX-2:** Auto-link enhancement (2-3 hours)
   - Moderate risk (touches auth flow)
   - Add logging, thorough testing
   - Deploy to dev → staging first
   - Monitor Sentry for link failures

---

## 🧪 QA Test Cases

### Test Case 1: Anonymous Apply + Login (Same Email)
```
Pre: Browser A (anon), Browser B (logged out)

Step 1: Browser A → bejoby.com/es/jobs/[id] → Click "Postularme" → Fill form with email: test@example.com
Expected: Form scrolls into view ✓, submission succeeds ✓

Step 2: Browser B → bejoby.com/es/login → Enter test@example.com, verify code
Expected: Login succeeds ✓

Step 3: Browser B → bejoby.com/es/candidate/dashboard
Expected: Application from step 1 appears in list ✓, job title + date visible ✓

Step 4: Browser B → Click application → Expand details
Expected: Timeline visible, CV info shown ✓, status = "pending" ✓
```

### Test Case 2: Apply with Different Emails
```
Pre: User logs in with email1@example.com

Step 1: Same user applies with form using email2@example.com
Expected: Application saved to database with email2@example.com

Step 2: Navigate to dashboard (still logged in as email1@example.com)
Expected: Application NOT shown (email mismatch) ✓

Step 3: Logout → Login with email2@example.com
Expected: Now application appears ✓
```

### Test Case 3: Double Apply Prevention
```
Pre: User applies anonymously with email: test@example.com

Step 1: User tries to apply to same job again from form
Expected: GET /api/applications check prevents duplicate POST ✓, error shown: "Already applied" ✓
```

---

## 📊 Success Metrics (Before/After)

| Metric | Before | Target After | How to Measure |
|--------|--------|--------------|-----------------|
| Form visibility | 0% (below fold) | 100% (scrolled into view) | Manual + automated screenshot test |
| Application persistence | ~60% (some orphaned) | 100% (all appear) | User testing + Firestore audit |
| Support tickets ("did I apply?") | Unknown | 🔻 -50% | Help desk tracking |
| Dashboard application count | Incorrect | Matches Firestore | Automated data audit |

---

## 🚀 Rollout Plan

### Dev Branch
- Merge US-FIX-1 + US-FIX-2 to `dev`
- Automated CI/CD runs (lint, type check, build, tests)

### QA Branch
- PR: dev → qa
- QA agent tests scenarios above
- Manual testing on mobile devices

### Staging
- PR: qa → staging
- E2E tests run
- Monitor Sentry for errors

### Production
- PR: staging → main
- Health check post-deploy
- Monitor metrics for 24 hours

---

## 📝 Notes for Tech Lead

1. **Email normalization:** Currently some emails might have different case/whitespace. This fix standardizes the comparison.
2. **Re-linking logic:** The sync endpoint is a safety net; most users should auto-link on first login.
3. **Logging:** Added logs will help diagnose any future email-matching issues without needing Firestore inspection.
4. **Test thoroughly:** Auto-linking is critical for candidate experience; bugs here = lost users.

