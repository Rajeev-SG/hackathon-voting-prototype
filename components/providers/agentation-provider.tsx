"use client";

import { Agentation } from "agentation";

const agentationEndpoint =
  process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT || "http://localhost:4747";

export function AgentationProvider() {
  if (process.env.NODE_ENV !== "development") {
    return null;
  }

  return (
    <Agentation
      endpoint={agentationEndpoint}
      onAnnotationAdd={(annotation) => {
        console.log("Agentation annotation added", annotation);
      }}
      onSessionCreated={(sessionId) => {
        console.log("Agentation session created", sessionId);
      }}
    />
  );
}
