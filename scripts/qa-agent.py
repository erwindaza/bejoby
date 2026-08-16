#!/usr/bin/env python3
"""
BeJoby QA Agent - Post-deploy automated verification.
Runs against a live URL to verify health, pages, API, and security.

Usage:
  python scripts/qa-agent.py                  # Full QA checks
  python scripts/qa-agent.py --production     # Production health check only (critical tests)

Environment:
  QA_TARGET_URL  - Base URL to test (default: https://www.bejoby.com)
"""

import json
import os
import sys
import time
import requests

TARGET = os.environ.get("QA_TARGET_URL", "https://www.bejoby.com").rstrip("/")
PRODUCTION_MODE = "--production" in sys.argv
TIMEOUT = 15  # seconds per request
REPORT_FILE = "qa-report.json"

results = []
passed = 0
failed = 0
warnings = 0


def log(icon, msg):
    print(f"  {icon} {msg}")


def test(name, critical=True):
    """Decorator to register a test function."""
    def decorator(fn):
        fn._test_name = name
        fn._critical = critical
        return fn
    return decorator


def run_test(fn):
    global passed, failed, warnings
    name = fn._test_name
    critical = fn._critical
    try:
        ok, detail = fn()
        status = "PASS" if ok else ("FAIL" if critical else "WARN")
        if ok:
            passed += 1
            log("\u2705", f"{name}")
        elif critical:
            failed += 1
            log("\u274c", f"{name} - {detail}")
        else:
            warnings += 1
            log("\u26a0\ufe0f", f"{name} - {detail}")
        results.append({"test": name, "status": status, "detail": detail, "critical": critical})
    except Exception as e:
        failed += 1
        detail = str(e)
        log("\u274c", f"{name} - EXCEPTION: {detail}")
        results.append({"test": name, "status": "ERROR", "detail": detail, "critical": critical})


# ---------------------------------------------------------------------------
# HEALTH CHECKS (always run)
# ---------------------------------------------------------------------------

@test("Health endpoint returns 200", critical=True)
def test_health_200():
    r = requests.get(f"{TARGET}/api/ping", timeout=TIMEOUT)
    if r.status_code != 200:
        return False, f"Status {r.status_code}"
    data = r.json()
    if data.get("status") != "ok":
        return False, f"Status field: {data.get('status')}"
    return True, "ok"


@test("Firestore connected", critical=True)
def test_firestore():
    r = requests.get(f"{TARGET}/api/ping", timeout=TIMEOUT)
    data = r.json()
    fs = data.get("firestore", {})
    if fs.get("status") != "ok":
        return False, f"Firestore: {fs}"
    return True, "ok"


@test("SMTP configured", critical=False)
def test_smtp():
    r = requests.get(f"{TARGET}/api/ping", timeout=TIMEOUT)
    data = r.json()
    email = data.get("email", data.get("env", {}))
    # Check new format
    if isinstance(email, dict) and "configured" in email:
        if not email["configured"]:
            return False, "SMTP not configured"
        return True, "ok"
    # Fallback: check env booleans
    env = data.get("env", {})
    if not env.get("SMTP_USER") or not env.get("SMTP_PASS"):
        return False, "SMTP_USER or SMTP_PASS missing"
    return True, "ok"


@test("Service account key valid", critical=True)
def test_sa_key():
    r = requests.get(f"{TARGET}/api/ping", timeout=TIMEOUT)
    data = r.json()
    if not data.get("serviceAccountKeyValid"):
        return False, "Invalid service account key"
    return True, "ok"


# ---------------------------------------------------------------------------
# PAGE CHECKS
# ---------------------------------------------------------------------------

PAGE_CHECKS = [
    ("/es", "BeJoby", True),
    ("/en", "BeJoby", True),
    ("/es/jobs", "BeJoby", True),
    ("/en/jobs", "BeJoby", True),
    ("/es/legal/privacy", "privacidad", False),
    ("/es/legal/terms", "condiciones", False),
    ("/en/legal/privacy", "privacy", False),
    ("/en/legal/terms", "terms", False),
    ("/es/post-job", "BeJoby", False),
]


def make_page_test(path, keyword, critical):
    @test(f"Page {path} returns 200 + '{keyword}'", critical=critical)
    def _test():
        r = requests.get(f"{TARGET}{path}", timeout=TIMEOUT, allow_redirects=True)
        if r.status_code != 200:
            return False, f"Status {r.status_code}"
        if keyword.lower() not in r.text.lower():
            return False, f"Keyword '{keyword}' not found in HTML"
        return True, "ok"
    return _test


page_tests = [make_page_test(p, k, c) for p, k, c in PAGE_CHECKS]


# ---------------------------------------------------------------------------
# API ENDPOINT CHECKS
# ---------------------------------------------------------------------------

@test("GET /api/jobs returns 200", critical=True)
def test_api_jobs():
    r = requests.get(f"{TARGET}/api/jobs", timeout=TIMEOUT)
    if r.status_code != 200:
        return False, f"Status {r.status_code}"
    data = r.json()
    if not data.get("ok"):
        return False, f"Response: {data}"
    return True, f"{len(data.get('data', []))} jobs"


@test("POST /api/auth/send-code with invalid email returns 400", critical=True)
def test_send_code_invalid():
    r = requests.post(
        f"{TARGET}/api/auth/send-code",
        json={"email": "not-an-email"},
        timeout=TIMEOUT,
    )
    if r.status_code != 400:
        return False, f"Expected 400, got {r.status_code}"
    return True, "ok"


@test("POST /api/auth/send-code with empty body returns 400", critical=True)
def test_send_code_empty():
    r = requests.post(
        f"{TARGET}/api/auth/send-code",
        json={},
        timeout=TIMEOUT,
    )
    if r.status_code != 400:
        return False, f"Expected 400, got {r.status_code}"
    return True, "ok"


@test("POST /api/auth/verify-code with empty body returns 400", critical=True)
def test_verify_empty():
    r = requests.post(
        f"{TARGET}/api/auth/verify-code",
        json={},
        timeout=TIMEOUT,
    )
    if r.status_code != 400:
        return False, f"Expected 400, got {r.status_code}"
    return True, "ok"


@test("POST /api/auth/verify-code with wrong code returns 401", critical=True)
def test_verify_wrong():
    r = requests.post(
        f"{TARGET}/api/auth/verify-code",
        json={"email": "test@qagent.local", "code": "000000"},
        timeout=TIMEOUT,
    )
    if r.status_code not in (400, 401):
        return False, f"Expected 400/401, got {r.status_code}"
    return True, "ok"


@test("GET /api/auth/me without cookie returns 401", critical=True)
def test_me_unauth():
    r = requests.get(f"{TARGET}/api/auth/me", timeout=TIMEOUT)
    if r.status_code != 401:
        return False, f"Expected 401, got {r.status_code}"
    return True, "ok"


@test("POST /api/contact with empty body returns 400", critical=False)
def test_contact_empty():
    r = requests.post(
        f"{TARGET}/api/contact",
        json={},
        timeout=TIMEOUT,
    )
    if r.status_code != 400:
        return False, f"Expected 400, got {r.status_code}"
    return True, "ok"


@test("GET /api/employers returns 200", critical=False)
def test_api_employers():
    r = requests.get(f"{TARGET}/api/employers", timeout=TIMEOUT)
    if r.status_code != 200:
        return False, f"Status {r.status_code}"
    return True, "ok"


# ---------------------------------------------------------------------------
# SECURITY CHECKS
# ---------------------------------------------------------------------------

@test("HTTPS enforced (HTTP redirects)", critical=True)
def test_https():
    http_url = TARGET.replace("https://", "http://")
    try:
        r = requests.get(http_url, timeout=TIMEOUT, allow_redirects=False)
        if r.status_code in (301, 302, 307, 308):
            location = r.headers.get("Location", "")
            if location.startswith("https://"):
                return True, f"Redirects to {location}"
            return False, f"Redirects to non-HTTPS: {location}"
        if r.status_code == 200:
            return False, "HTTP works without redirect to HTTPS"
        return True, f"Status {r.status_code}"
    except requests.exceptions.ConnectionError:
        return True, "HTTP connection refused (good)"


@test("X-Content-Type-Options header present", critical=False)
def test_xcto():
    r = requests.get(f"{TARGET}/es", timeout=TIMEOUT)
    val = r.headers.get("X-Content-Type-Options", "")
    if val.lower() == "nosniff":
        return True, "ok"
    return False, f"Missing or wrong: '{val}'"


@test("No API keys exposed in homepage HTML", critical=True)
def test_no_keys_leaked():
    r = requests.get(f"{TARGET}/es", timeout=TIMEOUT)
    html = r.text
    suspicious = ["AIza", "sk-", "AKIA", "ghp_", "private_key"]
    for pattern in suspicious:
        if pattern in html:
            return False, f"Possible key leak: found '{pattern}' in HTML"
    return True, "ok"


@test("CORS: API does not allow wildcard origin", critical=False)
def test_cors():
    r = requests.options(
        f"{TARGET}/api/jobs",
        headers={"Origin": "https://evil.com", "Access-Control-Request-Method": "GET"},
        timeout=TIMEOUT,
    )
    acao = r.headers.get("Access-Control-Allow-Origin", "")
    if acao == "*":
        return False, "Wildcard CORS origin (*) - too permissive"
    return True, f"CORS: '{acao}'"


# ---------------------------------------------------------------------------
# RUNNER
# ---------------------------------------------------------------------------

def collect_tests():
    """Collect all test functions from this module."""
    tests = []
    for name, obj in globals().items():
        if callable(obj) and hasattr(obj, "_test_name"):
            tests.append(obj)
    # Also run dynamic page tests
    tests.extend(page_tests)
    return tests


def main():
    global passed, failed, warnings

    mode = "PRODUCTION HEALTH CHECK" if PRODUCTION_MODE else "FULL QA"
    print(f"\n{'='*60}")
    print(f"  BeJoby QA Agent - {mode}")
    print(f"  Target: {TARGET}")
    print(f"  Time:   {time.strftime('%Y-%m-%d %H:%M:%S UTC', time.gmtime())}")
    print(f"{'='*60}\n")

    all_tests = collect_tests()

    if PRODUCTION_MODE:
        # Production mode: only critical tests
        all_tests = [t for t in all_tests if t._critical]

    for t in all_tests:
        run_test(t)

    # Summary
    total = passed + failed + warnings
    print(f"\n{'='*60}")
    print(f"  Results: {passed} passed, {failed} failed, {warnings} warnings / {total} total")
    print(f"{'='*60}\n")

    # Write report
    report = {
        "target": TARGET,
        "mode": "production" if PRODUCTION_MODE else "qa",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "summary": {
            "total": total,
            "passed": passed,
            "failed": failed,
            "warnings": warnings,
        },
        "tests": results,
    }

    with open(REPORT_FILE, "w") as f:
        json.dump(report, f, indent=2)
    print(f"  Report saved to {REPORT_FILE}")

    # Exit code
    if failed > 0:
        print(f"\n  BLOCKED: {failed} critical test(s) failed.\n")
        sys.exit(1)
    else:
        print(f"\n  ALL CRITICAL TESTS PASSED.\n")
        sys.exit(0)


if __name__ == "__main__":
    main()
