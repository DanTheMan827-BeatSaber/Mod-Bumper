import { octokit, githubRepoRegex, Mod, ModsJson } from "./shared.ts";

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
        Object.entries(records).sort(([keyA], [keyB]) => keyA.localeCompare(keyB, undefined, { sensitivity: insensitive ? "base" : "case" }))
    );
}

async function writeJson(jsonPath: URL, mods: ModsJson): Promise<void> {
    const newJson: ModsJson = {
        newestDependencies: sortRecordsByKey(mods.newestDependencies, true),
        installedMods: await cleanMods(mods.installedMods),
        mods: await cleanMods(mods.mods)
    };

    // Write the new mods.json file
    await Deno.writeTextFile(jsonPath, JSON.stringify(newJson, null, 2));
}

async function setDefaultBranches(mods: Record<string, Mod>): Promise<void> {
    for (const [modId, mod] of Object.entries(mods)) {
        const match = githubRepoRegex.exec(mod.repo);
        if (!match) {
            continue;
        }

        let [, owner, repo] = match;

        if (repo.toLowerCase().endsWith(".git")) {
            repo = repo.slice(0, -4); // Remove the .git suffix if present
        }

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

if (import.meta.main) {
    const modsJsonPath = new URL("../../mods.json", import.meta.url);
    const mods: ModsJson = await readJson(modsJsonPath);

    await setDefaultBranches(mods.installedMods);
    await setDefaultBranches(mods.mods);

    await writeJson(modsJsonPath, mods);
}
