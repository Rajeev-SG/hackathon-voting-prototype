"use client";

import Link from "next/link";
import * as React from "react";
import { FlowsProvider } from "@flows/react";
import * as components from "@flows/react-components";
import * as tourComponents from "@flows/react-components/tour";

import "@flows/react-components/index.css";

function getAnonymousVisitorId() {
  const storageKey = "hackathon-voting-public-visitor";
  const existing = window.localStorage.getItem(storageKey);
  if (existing) return existing;

  const value = `public-${crypto.randomUUID()}`;
  window.localStorage.setItem(storageKey, value);
  return value;
}

export function FlowsRoot({
  children,
  userId
}: {
  children: React.ReactNode;
  userId: string | null;
}) {
  const organizationId = process.env.NEXT_PUBLIC_FLOWS_ORGANIZATION_ID;
  const environment = process.env.NEXT_PUBLIC_FLOWS_ENVIRONMENT ?? "production";
  const [resolvedUserId, setResolvedUserId] = React.useState<string | null>(userId);

  React.useEffect(() => {
    if (!organizationId) return;
    if (userId) {
      setResolvedUserId(userId);
      return;
    }

    setResolvedUserId(getAnonymousVisitorId());
  }, [organizationId, userId]);

  if (!organizationId || !resolvedUserId) {
    return <>{children}</>;
  }

  function FlowsLink({ href, children }: { href: string; children?: React.ReactNode }) {
    return <Link href={href}>{children}</Link>;
  }

  return (
    <FlowsProvider
      organizationId={organizationId}
      userId={resolvedUserId}
      environment={environment}
      components={{ ...components }}
      tourComponents={{ ...tourComponents }}
      LinkComponent={FlowsLink}
    >
      {children}
    </FlowsProvider>
  );
}
