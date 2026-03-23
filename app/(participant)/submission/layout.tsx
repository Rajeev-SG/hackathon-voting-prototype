import { ParticipantHeader } from "@/components/participant-header";

export default function SubmissionLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <ParticipantHeader />
      {children}
    </div>
  );
}
