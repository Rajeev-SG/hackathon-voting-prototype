import { redirect } from "next/navigation";

export default function ScorePage({ params }: { params: { slug: string } }) {
  void params;
  redirect("/");
}
