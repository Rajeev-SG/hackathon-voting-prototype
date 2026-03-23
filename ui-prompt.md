## Resolving the core tensions (design stance)

### Speed vs. Depth (2–3 minutes per project)

**Design move:** *Progressive disclosure with “Rapid Scoring” as the default.*

* Default view: 4 rubric categories shown as compact “score rails” (1–5) with **anchored labels** (e.g., *1 = Not evident … 5 = Exceptional*). One tap per category, optional notes, then **Auto-Advance → Next Project**.
* Depth on demand: each category expands (tap title) into “what good looks like” bullets + sub-criteria, without leaving the screen.
  This applies **Cognitive Load Theory** by minimizing *extraneous load* (extra screens, extra reading) while keeping *intrinsic load* (the rubric) available only when needed. ([Nielsen Norman Group][1])

### Network Unreliability (hackathon Wi-Fi)

**Design move:** *Offline-first, optimistic UI, with reassurance not interruption.*

* Every score is saved instantly to device; sync happens silently when possible.
* Connectivity is communicated via a small, persistent status chip (“Saved on device” → “Synced”) rather than modal alerts.
  This follows offline UX guidance: **inform state + reassure + avoid blocking**. ([web.dev][2])

### Cognitive Fatigue (40+ projects)

**Design move:** *Reduce decision fatigue through consistency, chunking, and micro-rewards.*

* Identical layout for every project (muscle memory).
* A short “calibration peek” (optional) shows your last 3 scores to reduce drift without forcing reflection every time.
* Lightweight “break nudges” at natural boundaries (e.g., every 10 projects) with one-tap snooze.
  This leverages cognitive-load minimization principles (structure/clarity/support) to keep mental effort low under repetition. ([Nielsen Norman Group][1])

---

# Phase 1: The Core User Journey (Behavioral UX)

### 0) Entry / Setup (30 seconds, once)

1. **Open app → “Join event”** (QR code or 6-digit event code).
2. **Judge identity** (name + role) and **track assignment** (if applicable).
3. App downloads the **offline pack**: project list, rubric, venue map, and any constraints.
4. A 10-second “How scoring works” overlay (dismissible forever).

> Why: Keeps onboarding choices minimal (Hick’s Law) and pushes everything else to later. ([Nielsen Norman Group][3])

### 1) Find a project (fast paths)

Judges can start from whichever is easiest in chaos:

* **Scan QR on booth** → opens project directly (best).
* **Search** by team name / booth number.
* **Queue view** (assigned track) → big cards, one thumb navigation.

### 2) Grade it (default: 20–45 seconds)

On the project screen:

1. Tap score for **Innovation** (1–5).
2. Tap score for **Execution**.
3. Tap score for **UI/UX**.
4. Tap score for **Business Value**.
5. Optional: tap **Quick Note** chips (e.g., “Great demo”, “Needs clarity”) or dictate a 5–10s voice note.
6. Tap **Next** (or swipe) → immediately lands on the next project.

**Auto-save occurs after every score tap** (no “Save” requirement).

> Why: Large targets + bottom actions reduce time and mis-taps (Fitts’s Law). ([Nielsen Norman Group][4])

### 3) Move on (zero admin)

* The judge never sees “submission states” as a task. The app handles it:

  * **Saved on device** (offline or pending)
  * **Synced** (confirmed)
  * **Needs attention** (rare conflicts)

### Edge cases (handled without drama)

**Accidentally skipped a project**

* After “Next”, show a 5-second snackbar: **“Moved on — Undo”**.

**Return to edit a score**

* Project card shows status: **Not started / Draft / Final**.
* Tap a project → edit scores → “Done”.
* If edits affect rankings later, the app flags it subtly: “1 leaderboard impacted”.

**Tied scores (end-of-round)**

* Judges don’t solve ties mid-flow. At the end:

  * App detects ties within the judge’s top N (e.g., top 5) and launches **Tie-break**: quick pairwise choice (“Which deserves to place higher?”).
  * This reduces complex comparison into small decisions (Hick’s Law + fatigue reduction). ([Nielsen Norman Group][3])

**Offline scoring & later sync**

* If offline: continue scoring normally; header chip reads **“Offline — saving locally”**.
* When online returns: chip animates to **“Syncing…” → “Synced”**.
* If a conflict exists (same project edited on two devices): present a single, clear resolver:

  * “Keep mine” vs “Keep latest” + diff preview (scores only).

Guiding principle: communicate state changes without breaking task flow. ([web.dev][2])

---

# Phase 2: Information Architecture & Layout

## IA (top-level)

* **Queue** (default): assigned track / recommended order + progress.
* **All Projects**: searchable directory + filters (track, booth, status).
* **Results** (optional, permissioned): your submitted list + tie-break prompts.
* **Settings**: accessibility, offline pack, help.

## Main Voting Screen — exact wireframe (mobile-first; scales to tablet)

**(A) Top Bar (8% height)**

* Left: Back (to Queue)
* Center: Project name (1 line) + booth/team (small)
* Right: Status chip

  * “Synced” (quiet) / “Saved on device” / “Offline” (only when needed)

**(B) Project Snapshot (14%)**

* 2-line pitch (provided by team)
* 3 small tags (Track, Tech, Stage)
* “View demo link” (if any) — secondary

**(C) Rubric Stack (58%) — 4 cards**
Each card contains:

* Title + 1-line descriptor (collapsed by default)
* **Score rail**: 5 discrete pills (1–5) with anchored endpoints visible at all times

  * Example: `1 Not evident | 2 Weak | 3 OK | 4 Strong | 5 Exceptional`
* Expand affordance (“What good looks like”) that reveals:

  * 3 bullets + optional sub-criteria checklist (read-only guidance)

**(D) Notes (10%)**

* “Add note…” field (single line)
* Quick chips: +“Great story” +“Needs clarity” +“Strong value” +“Risky but novel”

**(E) Bottom Action Bar (10%)**

* Left: “Park” (save + return later)
* Center: progress “12/40” (tap for overview)
* Right: **Primary CTA** “Next” (large), swipe-enabled
* Hidden but reachable: long-press Next → “Next + mark as finalist”

### Eye guidance (Z / F patterns)

* **Z-pattern**: top-left back → top-right status (confirmation) → mid-left rubric → bottom-right Next (action).
* **F-pattern** within rubric: consistent left-aligned titles + rails; users scan down rapidly without re-learning layout each project.

### Where theory is applied

* **Hick’s Law**: limit scoring choices to **5 anchored options per criterion**; avoid 10-point scales and avoid extra rubric branching in the default view. ([Nielsen Norman Group][3])
* **Cognitive Load Theory**: remove “save vs submit” decisions; keep guidance collapsed; maintain consistent spatial mapping for repeated tasks. ([Nielsen Norman Group][1])
* **Fitts’s Law**: bottom-right Next is largest, closest to thumb; score pills are large enough to reduce errors under fatigue. ([Nielsen Norman Group][4])

---

# Phase 3: The “Impressive” Factor (UI, Visuals, Micro-interactions)

## Design system (premium, calm, fast)

**Aesthetic goal:** “confident quiet luxury” (Stripe/Airbnb energy) — polish that *reduces perceived effort* (Aesthetic-Usability Effect). ([Nielsen Norman Group][5])

### Color palette (accessible, low fatigue)

* **Base**: Near-black ink `#0B0F14` / Warm white `#F7F5F2`
* **Surface**: `#121A24` (dark) / `#FFFFFF` (light)
* **Accent** (primary): `#4C7DFF`
* **Success**: `#2ECC71`
* **Warning**: `#F5A623`
* **Critical**: `#FF4D4F`
* **Neutral line**: `#223042`

Use color sparingly: accent only for “Next”, selected scores, and status transitions.

### Typography

* **Primary**: SF Pro (iOS) / Inter (web & Android fallback)
* Scale:

  * Title 22–24 / Semibold
  * Section 16–18 / Semibold
  * Body 14–16 / Regular
  * Meta 12–13 / Medium
* Numbers (scores) use **tabular numerals** for visual stability.

### Spacing & shape

* 8pt grid; card padding 16; rail pill height 44 (touch-first).
* Radius: 16 (cards), 12 (pills).
* Shadow: subtle elevation + soft ambient shadow (no heavy skeuomorphism).

### Material effect

* **Soft glass** only on the top status chip and bottom bar (slight blur + translucency), keeping content cards crisp for legibility.
  The “premium” feel supports trust and reduces friction via the aesthetic-usability effect. ([Nielsen Norman Group][5])

## Micro-interactions (wow, but zero slowdown)

1. **Score “snap + settle”**

   * Tap a score pill → spring animation; haptic tick (light).
   * Immediately shows a tiny inline confirmation “Saved” that fades in 300ms then disappears.

2. **Offline-to-sync “state morph”**

   * Status chip transitions: “Offline” (outline) → “Syncing…” (animated dots) → “Synced” (solid + check).
   * No modal interruptions; just reassurance. (Offline UX best practice.) ([web.dev][2])

3. **One-handed “Next” gesture**

   * Swipe left anywhere on rubric stack triggers Next (with subtle page-peel).
   * Undo appears as snackbar at the bottom.

4. **End-of-queue reflective moment (tasteful)**

   * When judge completes assigned queue: a calm full-screen moment:

     * “You’re done. Scores safely synced.”
     * A small “impact card” (e.g., “You reviewed 40 projects • 3 finalists flagged”).
       This intentionally targets **Don Norman’s reflective level** (meaning, contribution) without adding work. ([IxDF - Interaction Design Foundation][6])

### Don Norman’s Emotional Design mapping

* **Visceral:** refined typography, soft depth, responsive motion (first impression). ([IxDF - Interaction Design Foundation][6])
* **Behavioral:** rapid scoring rails, offline-first autosave, big targets. ([web.dev][2])
* **Reflective:** completion/impact summary, tie-break clarity, confidence that work counted. ([IxDF - Interaction Design Foundation][6])

---

# Phase 4: UX Writing & Error Handling

## Voice & tone

* Calm, competent, brief.
* Never blame the user or the network.
* Always answer the judge’s implicit question: **“Did my score count?”**

## Examples of friction-reducing copy

### Completion states

* **After each project (tiny toast):** “Saved.”
* **When synced:** “Synced.”
* **End of queue:**

  * Title: “All set.”
  * Body: “You’ve scored 40 projects. Everything is synced.”
  * CTA: “Review my picks” (secondary), “Done” (primary)

### Offline / bad connection

* **Status chip (persistent, non-blocking):** “Offline — saving on this device” ([web.dev][2])
* **When connection returns:** “Back online — syncing…”
* **If sync delayed:** “Still safe. We’ll sync when the connection stabilizes.”

### Conflict (rare but high-stakes)

* Title: “Two versions found”
* Body: “This project was edited on another device.”
* Options:

  * “Keep mine” (primary)
  * “Use latest” (secondary)
* Diff preview: “Innovation 4→5, Execution 3→3, UI/UX 4→4, Value 3→4”

### Guardrails for accidental actions

* When skipping: “Parked for later.” + “Undo”
* When trying to exit mid-score: “Leave without finishing?”

  * Primary: “Keep draft”
  * Secondary: “Discard”

---

## Why this will feel both seamless *and* premium

* **Seamless:** minimal decisions per project (Hick), large bottom actions (Fitts), zero “save/admin” overhead, offline-first reassurance. ([Nielsen Norman Group][3])
* **Premium:** consistent spatial rhythm, restrained color, high-quality motion, and reflective completion moments that make judges feel confident and valued—classic aesthetic-usability + emotional design. ([Nielsen Norman Group][5])

[1]: https://www.nngroup.com/articles/minimize-cognitive-load/?utm_source=chatgpt.com "Minimize Cognitive Load to Maximize Usability"
[2]: https://web.dev/articles/offline-ux-design-guidelines?utm_source=chatgpt.com "Offline UX design guidelines"
[3]: https://www.nngroup.com/videos/hicks-law-long-menus/?utm_source=chatgpt.com "Hick's Law: Designing Long Menu Lists (Video)"
[4]: https://www.nngroup.com/articles/fitts-law/?utm_source=chatgpt.com "Fitts's Law and Its Applications in UX"
[5]: https://www.nngroup.com/articles/aesthetic-usability-effect/?utm_source=chatgpt.com "The Aesthetic-Usability Effect"
[6]: https://www.interaction-design.org/literature/article/norman-s-three-levels-of-design?srsltid=AfmBOooDz8Djf7C0xmv2uHOL0FqTc-62Qy7qjqnjnbvMe-1haK5_JAT8&utm_source=chatgpt.com "Norman's Three Levels of Design"
