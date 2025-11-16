import { promises as fs } from "fs";
import path from "path";

type FirmwareOption = {
  id: string;
  label: string;
  manifestUrl: string;
};

export const dynamic = "force-static";
export const revalidate = false;

export async function GET() {
  const firmwareRoot = path.join(process.cwd(), "public", "32bit");

  let entries: Awaited<ReturnType<typeof fs.readdir>> = [];
  try {
    entries = await fs.readdir(firmwareRoot, { withFileTypes: true });
  } catch {
    // If the firmware directory doesn't exist, just return an empty list
    return new Response(JSON.stringify([]), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  const options: FirmwareOption[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const manifestPath = path.join(firmwareRoot, entry.name, "manifest.json");
    try {
      await fs.access(manifestPath);
    } catch {
      continue;
    }

    const label = entry.name.replace(/_/g, " ");
    options.push({
      id: entry.name,
      label,
      manifestUrl: `/32bit/${entry.name}/manifest.json`,
    });
  }

  const sorted = options.sort((a, b) => b.label.localeCompare(a.label));

  return new Response(JSON.stringify(sorted), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}


