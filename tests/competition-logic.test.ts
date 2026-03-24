import { describe, expect, it } from "vitest";

import { isManagerEmail } from "@/lib/auth";
import { deriveCompetitionSnapshot } from "@/lib/competition-logic";

describe("competition logic", () => {
  it("marks the round complete when every participating judge has covered every eligible project", () => {
    const snapshot = deriveCompetitionSnapshot({
      status: "OPEN",
      startedAt: new Date("2026-03-23T12:00:00.000Z"),
      finalizedAt: null,
      viewer: {
        clerkUserId: "user_123",
        email: "judge.one@example.com",
        isAuthenticated: true,
        isManager: true
      },
      entries: [
        {
          id: "entry-1",
          slug: "aurora-atlas",
          projectName: "Aurora Atlas",
          teamName: "Team North Star",
          summary: "Summary",
          teamEmails: [{ email: "founder@example.com" }],
          votes: [
            { judgeEmail: "judge.one@example.com", score: 9, updatedAt: new Date("2026-03-23T12:00:00.000Z") },
            { judgeEmail: "judge.two@example.com", score: 8, updatedAt: new Date("2026-03-23T12:01:00.000Z") }
          ]
        },
        {
          id: "entry-2",
          slug: "signal-bloom",
          projectName: "Signal Bloom",
          teamName: "Team Bloom",
          summary: "Summary",
          teamEmails: [{ email: "judge.one@example.com" }],
          votes: [
            { judgeEmail: "judge.two@example.com", score: 10, updatedAt: new Date("2026-03-23T12:03:00.000Z") }
          ]
        }
      ]
    });

    expect(snapshot.progress.percentage).toBe(100);
    expect(snapshot.progress.isComplete).toBe(true);
    expect(snapshot.canFinalize).toBe(true);
    expect(snapshot.entries.find((entry) => entry.id === "entry-2")?.isSelfVoteBlocked).toBe(true);
    expect(snapshot.entries.find((entry) => entry.id === "entry-1")?.currentUserVote).toBe(9);
    expect(snapshot.entries.find((entry) => entry.id === "entry-1")?.canVote).toBe(false);
  });

  it("does not mark the round complete when an eligible project is still missing a score", () => {
    const snapshot = deriveCompetitionSnapshot({
      status: "OPEN",
      startedAt: new Date("2026-03-23T12:00:00.000Z"),
      finalizedAt: null,
      viewer: {
        clerkUserId: "user_456",
        email: "judge.three@example.com",
        isAuthenticated: true,
        isManager: false
      },
      entries: [
        {
          id: "entry-1",
          slug: "aurora-atlas",
          projectName: "Aurora Atlas",
          teamName: "Team North Star",
          summary: "Summary",
          teamEmails: [{ email: "founder@example.com" }],
          votes: [{ judgeEmail: "judge.three@example.com", score: 9, updatedAt: new Date("2026-03-23T12:00:00.000Z") }]
        },
        {
          id: "entry-2",
          slug: "signal-bloom",
          projectName: "Signal Bloom",
          teamName: "Team Bloom",
          summary: "Summary",
          teamEmails: [{ email: "builder@example.com" }],
          votes: []
        }
      ]
    });

    expect(snapshot.progress.isComplete).toBe(false);
    expect(snapshot.canFinalize).toBe(false);
    expect(snapshot.progress.percentage).toBe(50);
  });

  it("recognizes the exact manager email", () => {
    expect(isManagerEmail("rajeev.gill@omc.com")).toBe(true);
    expect(isManagerEmail("Rajeev.Gill@omc.com")).toBe(true);
    expect(isManagerEmail("someone@example.com")).toBe(false);
  });
});
