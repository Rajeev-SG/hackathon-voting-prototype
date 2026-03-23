import { auth, currentUser } from "@clerk/nextjs/server";

import { MANAGER_EMAIL } from "@/lib/constants";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isManagerEmail(email: string | null | undefined) {
  return Boolean(email && normalizeEmail(email) === MANAGER_EMAIL);
}

export async function getViewerIdentity() {
  const { userId } = await auth();
  const user = userId ? await currentUser() : null;
  const primaryEmail =
    user?.primaryEmailAddress?.emailAddress ??
    user?.emailAddresses.find((address) => address.verification?.status === "verified")?.emailAddress ??
    user?.emailAddresses[0]?.emailAddress ??
    null;

  return {
    clerkUserId: userId ?? null,
    email: primaryEmail ? normalizeEmail(primaryEmail) : null,
    isAuthenticated: Boolean(userId),
    isManager: isManagerEmail(primaryEmail)
  };
}

export async function requireManagerIdentity() {
  const viewer = await getViewerIdentity();
  if (!viewer.isAuthenticated || !viewer.isManager) {
    throw new Error("Only the manager can perform this action.");
  }

  return viewer;
}

export async function requireJudgeIdentity() {
  const viewer = await getViewerIdentity();
  if (!viewer.isAuthenticated || !viewer.email) {
    throw new Error("Please sign in before voting.");
  }

  return viewer;
}
