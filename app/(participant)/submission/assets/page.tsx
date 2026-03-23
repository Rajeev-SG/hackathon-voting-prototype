import { notFound } from "next/navigation";

import { AssetUploadWorkspace } from "@/components/asset-upload-workspace";
import { assetDraft, getProjectBySlug } from "@/lib/mock-data";

export default function AssetUploadPage() {
  const project = getProjectBySlug(assetDraft.projectSlug);

  if (!project) {
    notFound();
  }

  return <AssetUploadWorkspace draft={assetDraft} project={project} />;
}
