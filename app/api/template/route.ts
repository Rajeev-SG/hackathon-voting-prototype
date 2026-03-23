import { NextResponse } from "next/server";

import { requireManagerIdentity } from "@/lib/auth";
import { buildTemplateWorkbook } from "@/lib/xlsx";

export const runtime = "nodejs";

export async function GET() {
  try {
    await requireManagerIdentity();

    const workbook = buildTemplateWorkbook();

    return new NextResponse(workbook, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": 'attachment; filename="hackathon-voting-template.xlsx"'
      }
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Template download failed."
      },
      { status: 403 }
    );
  }
}
