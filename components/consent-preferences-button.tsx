"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";

type ConsentPreferencesButtonProps = React.ComponentProps<typeof Button> & {
  label?: string;
};

export function ConsentPreferencesButton({
  label = "Privacy settings",
  onClick,
  ...props
}: ConsentPreferencesButtonProps) {
  return (
    <Button
      {...props}
      onClick={(event) => {
        window.dispatchEvent(new Event("analytics-consent:open"));
        onClick?.(event);
      }}
      type="button"
    >
      {label}
    </Button>
  );
}
