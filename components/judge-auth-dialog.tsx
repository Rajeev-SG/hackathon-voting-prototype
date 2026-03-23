"use client";

import * as React from "react";

import { JudgeAuthPanel } from "@/components/judge-auth-panel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

type JudgeAuthDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function JudgeAuthDialog({ open, onOpenChange }: JudgeAuthDialogProps) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent className="w-[min(94vw,34rem)] overflow-hidden p-0">
        <div className="shell-surface content-grid relative overflow-hidden p-6 md:p-8">
          <div className="absolute inset-x-0 top-0 h-28 bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_72%)]" />
          <DialogHeader className="sr-only">
            <DialogTitle>Judge access</DialogTitle>
            <DialogDescription>
              Sign in with Google or request an email code to unlock judging controls.
            </DialogDescription>
          </DialogHeader>
          <div className="relative rounded-[1.8rem] border border-border bg-card/90 p-5 md:p-6">
            <JudgeAuthPanel
              afterAuthenticate={() => onOpenChange(false)}
              description="Sign in once and Clerk keeps you ready to vote when the judging round opens."
              title="Judge access"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
