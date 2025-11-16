import { promises as fs } from "fs";
import path from "path";
import FirmwareInstallerApp, { FirmwareOption } from "./installer-section";
import styles from "./page.module.css";

async function listFirmwareOptions(): Promise<FirmwareOption[]> {
  const firmwareRoot = path.join(process.cwd(), "public", "32bit");
  let entries: Awaited<ReturnType<typeof fs.readdir>> = [];
  try {
    entries = await fs.readdir(firmwareRoot, { withFileTypes: true });
  } catch {
    return [];
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

  return options.sort((a, b) => b.label.localeCompare(a.label));
}

export default async function Placeholder32UI() {
  const firmwareOptions = await listFirmwareOptions();

  return (
    <FirmwareInstallerApp firmwares={firmwareOptions} />
  );
}
