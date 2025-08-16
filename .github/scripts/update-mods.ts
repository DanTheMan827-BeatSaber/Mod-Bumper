import { octokit, githubRepoRegex, Mod, ModsJson } from "./shared.ts";
import { PackageConfig } from "./SharedPackageConfig.ts";
function caseInsensitiveAbcSorter(keyA: string, keyB: string) {
    return keyA.localeCompare(keyB, undefined, { sensitivity: "base" })
}
function abcSorter(keyA: string, keyB: string) {
    return keyA.localeCompare(keyB, undefined, { sensitivity: "case" })
}
function caseInsensitiveAbcEntrySorter<T>([keyA, ]: [string, T], [keyB, ]: [string, T]) {
    return keyA.localeCompare(keyB, undefined, { sensitivity: "base" })
}
function abcEntrySorter<T>([keyA, ]: [string, T], [keyB, ]: [string, T]) {
    return keyA.localeCompare(keyB, undefined, { sensitivity: "case" })
}

async function readJson(jsonPath: URL): Promise<ModsJson> {
    try {
        const data = await Deno.readTextFile(jsonPath);
        return JSON.parse(data);
    } catch (err) {
        console.error("Failed to read or parse mods.json:", err);
        Deno.exit(1);
    }
}

function sortRecordsByKey<T>(records: Record<string, T>, insensitive: boolean): Record<string, T> {
    return Object.fromEntries(
        Object.entries(records).sort(insensitive ? caseInsensitiveAbcEntrySorter : abcEntrySorter)
    );
}

async function writeJson(jsonPath: URL, mods: ModsJson): Promise<void> {
    const newJson: ModsJson = {
        "$schema": "https://github.com/DanTheMan827-BeatSaber/Mod-Bumper/raw/refs/heads/main/mods.schema.json",
        newestDependencies: sortRecordsByKey(mods.newestDependencies, true),
        installedMods: await cleanMods(mods.installedMods),
        mods: await cleanMods(mods.mods)
    };

    // Write the new mods.json file
    await Deno.writeTextFile(jsonPath, JSON.stringify(newJson, null, 2));
}

function getRepo(url: string): { owner: string; repo: string } | null {
    const match = githubRepoRegex.exec(url);
    if (!match) {
        return null;
    }

    let [, owner, repo] = match;

    if (repo.toLowerCase().endsWith(".git")) {
        repo = repo.slice(0, -4); // Remove the .git suffix if present
    }

    return { owner, repo };
}

async function getDefaultBranch(url: string): Promise<string> {
    const match = getRepo(url);
    if (!match) {
        throw new Error(`Invalid repo URL: ${url}`);
    }

    const { owner, repo } = match;

    try {
        const { data: repoData } = await octokit.repos.get({ owner, repo });
        return repoData.default_branch;
    } catch (error) {
        console.error(`Failed to fetch default branch for ${owner}/${repo}:`, error);
        throw error;
    }
}

async function setDefaultBranches(mods: Record<string, Mod>): Promise<void> {
    for (const [modId, mod] of Object.entries(mods)) {
        const match = getRepo(mod.repo);
        if (!match) {
            continue;
        }

        let {owner, repo} = match;

        try {
            console.log(`Processing: ${owner}/${repo}`)
            const { data: repoData  } = await octokit.repos.get({ owner, repo });
            const { data: branches } = await octokit.repos.listBranches({ owner, repo });

            if (!mod.branch || !branches.map(b => b.name).includes(mod.branch)) {
                // If no branch is set, or the branch doesn't exist in the repo branches, use the default branch
                mod.branch = repoData.default_branch;
            }

            mod.repo = repoData.clone_url;
        } catch (error) {
            console.error(`Failed to fetch default branch for ${owner}/${repo}:`, error);
        }

        continue;
    }
}

function cleanMods(mods: Record<string, Mod>, sort: boolean = false): Record<string, Mod> {
    const newMods: [string, Mod][] = [];

    for (const [modId, {repo, version, dependencies, build, qmod, branch, prebump}] of Object.entries(mods)) {
        const newMod: Mod = {
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

async function downloadPackageJson(url: string): Promise<PackageConfig> {
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to download QPM JSON from ${url}: ${response.statusText}`);
    }
    const json = await response.json();
    return json;
}

async function setNeeds(mods: Record<string, Mod>, allModIds: string[]): Promise<void> {
    for (const [modId, mod] of Object.entries(mods)) {
        const match = getRepo(mod.repo);
        if (!match) {
            continue;
        }

        let {owner, repo} = match;

        try {
            console.log(`Processing: ${owner}/${repo}`);
            const qpmPackage = await downloadPackageJson(`https://github.com/${owner}/${repo}/raw/refs/heads/${mod.branch || await getDefaultBranch(mod.repo)}/qpm.json`);
            
            const packageDependencies = qpmPackage.dependencies.map(d => d.id).filter(d => allModIds.includes(d));
            mod.dependencies = mod.dependencies || [];
            mod.dependencies.push(...packageDependencies);

            mod.dependencies = mod.dependencies.filter((v, i, a) => a.indexOf(v) === i); // Remove duplicates
            mod.dependencies.sort(caseInsensitiveAbcSorter);
        } catch (error) {
            console.error(`Failed to fetch default branch for ${owner}/${repo}:`, error);
        }

        continue;
    }
}

if (import.meta.main) {
    const modsJsonPath = new URL("../../mods.json", import.meta.url);
    const mods: ModsJson = await readJson(modsJsonPath);
    const allModIds = [
        ...Object.keys(mods.installedMods), 
        ...Object.keys(mods.mods)
    ].filter((v, i, a) => a.indexOf(v) === i);

    await setDefaultBranches(mods.installedMods);
    await setDefaultBranches(mods.mods);
    
    await setNeeds(mods.installedMods, allModIds);
    await setNeeds(mods.mods, allModIds);

    await writeJson(modsJsonPath, mods);
}
