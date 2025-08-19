import { modsJsonPath } from "./shared/paths.ts";
import { octokit } from "./shared/octokit.ts";
import { readModsJson } from "./shared/readModsJson.ts";
import { sortRecordsByKey, caseInsensitiveAbcSorter } from "./shared/sorting.ts";
import { Mod, ModsJson } from "./shared/types/ModsJson.ts";
import { PackageConfig } from "./shared/types/SharedPackageConfig.ts";
import { getRepo, getDefaultBranch } from "./shared/github.ts";

/**
 * Writes the provided ModsJson object to mods.json, cleaning and sorting its contents.
 * @param jsonPath - The URL path to write the mods.json file to.
 * @param mods - The ModsJson object to write.
 */
async function writeJson(mods: ModsJson): Promise<void> {
  const newJson: ModsJson = {
    "$schema": "https://github.com/DanTheMan827-BeatSaber/Mod-Bumper/raw/refs/heads/main/mods.schema.json",
    newestDependencies: sortRecordsByKey(mods.newestDependencies, true),
    mods: await cleanMods(mods.mods, true)
  };

  // Write the new mods.json file
  await Deno.writeTextFile(modsJsonPath, JSON.stringify(newJson, null, 2)) + "\n";
}

/**
 * Ensures each mod in the provided record has a valid branch set, defaulting to the repository's default branch if necessary.
 * Also updates the repo field to the repository's clone URL.
 * @param mods - The record of mods to update.
 */
async function setRepoData(mods: Record<string, Mod>): Promise<void> {
  await Promise.all(Object.entries(mods).map(async ([modId, mod]) => {
    const match = getRepo(mod.repo);
    if (!match) {
      return;
    }

    let { owner, repo } = match;

    try {
      console.log(`Processing: ${owner}/${repo}`)
      const { data: repoData } = await octokit.repos.get({ owner, repo });
      const { data: branches } = await octokit.repos.listBranches({ owner, repo });

      if (!mod.branch || !branches.map(b => b.name).includes(mod.branch)) {
        // If no branch is set, or the branch doesn't exist in the repo branches, use the default branch
        mod.branch = repoData.default_branch;
      }

      mod.repo = repoData.clone_url;
    } catch (error) {
      console.error(`Failed to fetch default branch for ${owner}/${repo}:`, error);
    }

    return;
  }));
}

/**
 * Cleans a record of mods by removing unset fields and optionally sorting the entries by key.
 * @param mods - The record of mods to clean.
 * @param sort - Whether to sort the entries by key (default: false).
 * @returns A new record with cleaned and optionally sorted mods.
 */
function cleanMods(mods: Record<string, Mod>, sort: boolean = false): Record<string, Mod> {
  const newMods: [string, Mod][] = [];

  for (const [modId, { name, repo, version, dependencies, build, qmod, branch, prebump }] of Object.entries(mods)) {
    const newMod: Mod = {
      name,
      repo,
      branch,
      version,
      dependencies,
      prebump,
      build,
      qmod
    }

    // Remove any fields that are not set
    for (const key of Object.keys(newMod) as (keyof Mod)[]) {
      if (newMod[key] === undefined || newMod[key] === null) {
        delete newMod[key];
      }
    }

    newMods.push([modId, newMod]);
  }

  if (sort) {
    // Sort newMods by the first element in a case insensitive manner
    return sortRecordsByKey(Object.fromEntries(newMods), true);
  }

  return Object.fromEntries(newMods);
}

/**
 * Downloads and parses a QPM package JSON from the specified URL.
 * @param url - The URL to the qpm.json file.
 * @returns A promise that resolves to the parsed PackageConfig object.
 * @throws If the file cannot be downloaded or parsed.
 */
async function downloadPackageJson(url: string): Promise<PackageConfig> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download QPM JSON from ${url}: ${response.statusText}`);
  }
  const json = await response.json();
  return json;
}

/**
 * Updates the dependencies for each mod in the provided record by fetching and merging dependencies from their qpm.json files.
 * @param mods - The record of mods to update.
 * @param allModIds - An array of all mod IDs to consider as valid dependencies.
 */
async function setNeeds(mods: Record<string, Mod>): Promise<void> {
  const allModIds = Object.keys(mods);

  await Promise.all(Object.entries(mods).map(async ([modId, mod]) => {
    const match = getRepo(mod.repo);
    if (!match) {
      return;
    }

    let { owner, repo } = match;

    try {
      console.log(`Processing: ${owner}/${repo}`);
      const qpmPackage = await downloadPackageJson(`https://github.com/${owner}/${repo}/raw/refs/heads/${mod.branch || await getDefaultBranch(mod.repo)}/qpm.json`);
      const packageDependencies = qpmPackage.dependencies.map(d => d.id).filter(d => allModIds.includes(d));
      mod.dependencies = mod.dependencies || [];
      mod.dependencies.push(...packageDependencies);

      mod.dependencies = mod.dependencies.filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
      mod.dependencies.sort(caseInsensitiveAbcSorter);
      mod.name = qpmPackage.info.name;
    } catch (error) {
      console.error(`Failed to fetch default branch for ${owner}/${repo}:`, error);
    }

    return;
  }));
}

if (import.meta.main) {
  const mods: ModsJson = await readModsJson();
  
  mods.mods = {
    ...mods.installedMods || {},
    ...mods.mods
  }
  
  for (const [modId, mod] of Object.entries(mods.mods)) {
    if (mod.version) {
      delete mods.newestDependencies[modId];
    }
    delete mod.dependencies;
  }
  
  delete mods.installedMods;

  await setRepoData(mods.mods);
  await setNeeds(mods.mods);
  

  await writeJson(mods);
}
