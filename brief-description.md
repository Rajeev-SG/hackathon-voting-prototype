This is a **Hackathon Management and Judging Platform** designed to streamline project submissions and the evaluation process. It serves two distinct user personas (Participants and Judges) through a cohesive, dark-mode-first interface.

### What it is
The app acts as a central hub where hackathon teams build their project portfolios and judges evaluate them against standardized rubrics to determine winners. 

### How it works from a UX/UI Perspective

**1. Judge Experience (Evaluation Flow)**
*   **Directory & Triage:** Judges start at the [all-projects-screen](cci:9://file:///Users/rajeev_gill/Desktop/2026/Projects/hackathon-ideas-prompts/voting-app/all-projects-screen:0:0-0:0) to filter, sort, and track their assigned workload using clear status badges ("Not Started", "In Progress", "Scored").
*   **Context Gathering:** The [project-screen](cci:9://file:///Users/rajeev_gill/Desktop/2026/Projects/hackathon-ideas-prompts/voting-app/project-screen:0:0-0:0) acts as the project's landing page, giving judges a highly visual, readable overview of the pitch, tech stack, and team details.
*   **Frictionless Scoring:** The [scoring-screen](cci:9://file:///Users/rajeev_gill/Desktop/2026/Projects/hackathon-ideas-prompts/voting-app/scoring-screen:0:0-0:0) utilizes atomic, distinct rubric cards (Innovation, Execution, etc.) with 1-5 toggle buttons and expandable "What Good Looks Like" guidelines to remove cognitive load. Quick-add chips make qualitative feedback rapid.
*   **Resolution & Finalization:** The [dashboard-results-screen](cci:9://file:///Users/rajeev_gill/Desktop/2026/Projects/hackathon-ideas-prompts/voting-app/dashboard-results-screen:0:0-0:0) uses high-priority UI patterns (like amber-colored "Tie-Break" alert cards) to draw attention to critical final actions before locking in scores.

**2. Participant Experience (Submission Flow)**
*   **Guided Onboarding:** The [asset-upload-screen](cci:9://file:///Users/rajeev_gill/Desktop/2026/Projects/hackathon-ideas-prompts/voting-app/asset-upload-screen:0:0-0:0) acts as a smart form for uploading deliverables. 
*   **Live Feedback:** It features a real-time "Judge's View" mockup and a "Visual Readiness" progress bar, gamifying the submission process and directly showing participants how their uploads will be perceived by judges.

**3. Core UI Principles**
*   **Progress Visibility:** Heavy use of progress bars, completion fractions (e.g., 12/40), and step indicators so users always know their current state.
*   **Information Architecture:** Complex data is chunked into standard `Card` components, utilizing `Badge` primitives for quick metadata scanning (tracks, booths, statuses).
*   **Modern Aesthetics:** Relies on a premium dark theme with high-contrast, neon primary accents (cyan/emerald) to highlight CTAs, active states, and successful actions, paired with glassmorphism (backdrop blurs) on sticky headers and footers.