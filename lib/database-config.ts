type DatabaseEnv = {
  DATABASE_URL?: string;
  HOTFIX_DATABASE_URL?: string;
  HOTFIX_DATABASE_URL_UNPOOLED?: string;
};

export function resolveDatabaseUrls(env: DatabaseEnv) {
  const runtimeUrl = env.HOTFIX_DATABASE_URL || env.DATABASE_URL || "";
  const migrationUrl =
    env.HOTFIX_DATABASE_URL_UNPOOLED || env.HOTFIX_DATABASE_URL || env.DATABASE_URL || "";

  return {
    runtimeUrl,
    migrationUrl,
    usingHotfixUrl: Boolean(env.HOTFIX_DATABASE_URL)
  };
}
