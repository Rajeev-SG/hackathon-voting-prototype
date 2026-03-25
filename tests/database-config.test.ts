import { describe, expect, it } from "vitest";

import { resolveDatabaseUrls } from "@/lib/database-config";

describe("resolveDatabaseUrls", () => {
  it("prefers the emergency hotfix runtime when present", () => {
    expect(
      resolveDatabaseUrls({
        DATABASE_URL: "postgres://primary",
        HOTFIX_DATABASE_URL: "postgres://hotfix"
      })
    ).toEqual({
      runtimeUrl: "postgres://hotfix",
      migrationUrl: "postgres://hotfix",
      usingHotfixUrl: true
    });
  });

  it("uses the unpooled hotfix url for migrations when available", () => {
    expect(
      resolveDatabaseUrls({
        DATABASE_URL: "postgres://primary",
        HOTFIX_DATABASE_URL: "postgres://hotfix",
        HOTFIX_DATABASE_URL_UNPOOLED: "postgres://hotfix-direct"
      })
    ).toEqual({
      runtimeUrl: "postgres://hotfix",
      migrationUrl: "postgres://hotfix-direct",
      usingHotfixUrl: true
    });
  });

  it("falls back to the primary database when no hotfix url exists", () => {
    expect(
      resolveDatabaseUrls({
        DATABASE_URL: "postgres://primary"
      })
    ).toEqual({
      runtimeUrl: "postgres://primary",
      migrationUrl: "postgres://primary",
      usingHotfixUrl: false
    });
  });
});
