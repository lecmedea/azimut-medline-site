#!/usr/bin/env python3
"""Push mobile menu, banners, article heroes, hourglass, Yandex map."""
import base64
import json
import pathlib
import sys
import time
import urllib.error
import urllib.request

REPO = "lecmedea/azimut-medline-site"
BRANCH = "main"
ROOT = pathlib.Path(__file__).resolve().parent.parent
MSG = "Mobile nav portal, photo banners, article heroes, hourglass timer, Yandex map"

TOKEN = ""
HOSTS = pathlib.Path.home() / ".config/gh/hosts.yml"
if HOSTS.exists():
    for line in HOSTS.read_text(encoding="utf-8").splitlines():
        if "oauth_token:" in line:
            TOKEN = line.split("oauth_token:", 1)[1].strip()
            break
if not TOKEN:
    sys.exit("No GitHub token")

FILES: list[str] = []
for path in sorted(ROOT.glob("*.html")):
    FILES.append(path.name)
FILES.extend([
    "css/style.css",
    "css/responsive.css",
    "js/main.js",
    "js/tests.js",
    "docs/agent-handoff-log.md",
    "scripts/push-site-polish.py",
])
for path in sorted((ROOT / "assets" / "banners").glob("*.jpg")):
    FILES.append(str(path.relative_to(ROOT)).replace("\\", "/"))

BATCH20 = [
    "social-anxiety-work", "insomnia-routine", "ocd-intrusive-thoughts", "bipolar-mood-swings",
    "adhd-adults-signs", "ptsd-after-accident", "eating-disorder-help", "panic-at-night",
    "teen-self-harm-talk", "parent-teen-conflict", "alcohol-weekend", "cannabis-dependence",
    "family-alanon", "psychiatrist-first-visit", "therapy-vs-meds", "boundaries-relationships",
    "caregiver-burnout", "seasonal-depression", "work-stress-deadline", "online-consult-privacy",
]
BATCH21 = [
    "choose-yourself-toxic-exit", "heal-toxic-relationship", "morning-anxiety-hack", "box-breathing-focus",
    "digital-detox-2026", "self-care-not-selfish", "dopamine-menu-hack", "sleep-90-minute-rule",
    "love-yourself-practice", "toxic-people-boundaries", "body-doubling-adhd", "rejection-sensitivity",
    "micro-breaks-burnout", "inner-critic-pause", "emotion-labeling", "loneliness-connection-hack",
    "anger-pause-technique", "financial-stress-calm", "meaning-small-steps", "compassion-fatigue-care",
]
for slug in BATCH20 + BATCH21:
    FILES.append(f"assets/blog/{slug}-hero.jpg")


def api(method, path, payload=None, retries=5):
    url = f"https://api.github.com{path}"
    data = None if payload is None else json.dumps(payload).encode("utf-8")
    for attempt in range(retries):
        try:
            req = urllib.request.Request(
                url,
                data=data,
                method=method,
                headers={
                    "Authorization": f"Bearer {TOKEN}",
                    "Accept": "application/vnd.github+json",
                    "User-Agent": "azimut-site-polish",
                    "Content-Type": "application/json",
                },
            )
            with urllib.request.urlopen(req, timeout=120) as resp:
                body = resp.read().decode("utf-8")
                return json.loads(body) if body else {}
        except urllib.error.HTTPError as err:
            if err.code in (502, 503, 429) and attempt < retries - 1:
                time.sleep(2 ** attempt)
                continue
            raise


def main():
    ok = 0
    for rel in FILES:
        local = ROOT / rel
        if not local.exists():
            print(f"SKIP {rel}")
            continue
        sha = None
        try:
            meta = api("GET", f"/repos/{REPO}/contents/{rel}?ref={BRANCH}")
            sha = meta.get("sha")
        except urllib.error.HTTPError as err:
            if err.code != 404:
                raise
        content = base64.b64encode(local.read_bytes()).decode("ascii")
        payload = {"message": MSG, "content": content, "branch": BRANCH}
        if sha:
            payload["sha"] = sha
        api("PUT", f"/repos/{REPO}/contents/{rel}", payload)
        ok += 1
        print(f"OK {rel}")
        time.sleep(0.35)
    print(f"done {ok}/{len(FILES)}")


if __name__ == "__main__":
    main()