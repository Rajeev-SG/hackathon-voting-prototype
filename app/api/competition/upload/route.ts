import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { MAX_WORKBOOK_SIZE_BYTES } from "@/lib/constants";
import { replaceEntriesFromWorkbook } from "@/lib/competition";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    await requireManagerIdentity();
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json(
        {
          error: "Upload a .xlsx file before continuing."
        },
        { status: 400 }
      );
    }

    if (!file.name.toLowerCase().endsWith(".xlsx")) {
      return NextResponse.json(
        {
          error: "Only .xlsx workbooks are supported."
        },
        { status: 400 }
      );
    }

    if (file.size > MAX_WORKBOOK_SIZE_BYTES) {
      return NextResponse.json(
        {
          error: "Workbook is too large. Keep the upload under 5 MB."
        },
        { status: 400 }
      );
    }

    const result = await replaceEntriesFromWorkbook(await file.arrayBuffer());
    if (!result.ok) {
      return NextResponse.json(
        {
          error: "The workbook has validation issues.",
          issues: result.issues
        },
        { status: 422 }
      );
    }

    return NextResponse.json(
      {
        importedCount: result.importedCount
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Workbook upload failed."
      },
      { status: 403 }
    );
  }
}
