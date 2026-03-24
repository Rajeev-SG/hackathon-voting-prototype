import { redirect } from "next/navigation";

export default function ProjectDetailPage({ params }: { params: { slug: string } }) {
  void params;
  redirect("/");
}
