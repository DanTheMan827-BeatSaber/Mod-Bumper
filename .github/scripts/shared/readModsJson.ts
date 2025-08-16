import { modsJsonPath } from "./paths.ts";
import { ModsJson } from "./types/ModsJson.ts";

/**
 * Reads and parses the mods.json file.
 * @returns A promise that resolves to the parsed ModsJson object.
 * @throws Exits the process if reading or parsing fails.
 */
export async function readModsJson(): Promise<ModsJson> {
  try {
    const data = await Deno.readTextFile(modsJsonPath);
    return JSON.parse(data);
  } catch (err) {
    console.error("Failed to read or parse mods.json:", err);
    Deno.exit(1);
  }
}