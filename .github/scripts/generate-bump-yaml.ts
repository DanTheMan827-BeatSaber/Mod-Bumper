import * as yaml from "https://esm.sh/yaml@^2.0.0";
import { readModsJson } from "./shared/readModsJson.ts";
import { Mod, ModsJson } from "./shared/types/ModsJson.ts";
import { sortRecordsByKey } from "./shared/sorting.ts";

interface BumpJob {
  needs: string[];
  uses: string;
  secrets: string;
  name: string;
  with: {
    id: string;
    game_version: string;
    bs_cordl: string;
    newest_mods: string;
    repo: string;
    version: string;
    branch: string;
    install: boolean;
    build_command: string;
    qmod_command: string;
    prebump_command: string;
    force_build: string;
  };
}

const modsJson = await readModsJson();
modsJson.mods = sortRecordsByKey(modsJson.mods, true);

// Calculate dependency usage count
const dependencyUsageCount: Record<string, number> = {};

for (const mod of Object.values(modsJson.mods)) {
  for (const dependency of mod.dependencies || []) {
    dependencyUsageCount[dependency] = (dependencyUsageCount[dependency] || 0) + 1;
  }
}

const allDependencies = Object.keys(dependencyUsageCount);

for (const [modId, mod] of Object.entries(modsJson.mods)) {
  if (allDependencies.includes(modId) && mod.version) {
    modsJson.newestDependencies[modId] = mod.version;
  }
}

function trimAndDedent(str: string): string {
  // Remove any \r
  str = str.replace(/\r/g, "");
  // Trim only leading/trailing newlines
  str = str.replace(/^\n+|\n+$/g, "");

  // Find number of leading spaces on the first non-empty line
  const lines = str.split("\n");
  const firstLine = lines.find(line => line.trim().length > 0) || "";
  const match = firstLine.match(/^(\s*)/);
  const indent = match ? match[1].length : 0;

  // Remove that many spaces from the start of every line
  const dedented = lines.map(line =>
    line.startsWith(" ".repeat(indent)) ? line.slice(indent) : line
  ).join("\n");

  return dedented.trim();
}

async function getBumpJobs(mods: ModsJson) {
  const jobContainer: Record<string, any> = {};

  const dependencies = Object.entries(mods.mods)
    .filter(m => allDependencies.includes(m[0]))
    .sort((a, b) => (dependencyUsageCount[b[0]] || 0) - (dependencyUsageCount[a[0]] || 0)); // Sort by usage count

  const dependents = Object.entries(mods.mods)
    .filter(m => !allDependencies.includes(m[0]))
    .filter(m => (m[1].dependencies || []).length);

  const standaloneMods = Object.entries(mods.mods)
    .filter(m => !allDependencies.includes(m[0]))
    .filter(m => (m[1].dependencies || []).length == 0);
  
  for (const [modId, mod] of [...standaloneMods, ...dependencies, ...dependents]) {
    jobContainer[`bump-${modId}`] = {
      "needs": [
        "get-mods",
        ...(mod.dependencies || []).map(dep => `bump-${dep}`)
      ],
      "uses": "./.github/workflows/bump-reusable.yml",
      "secrets": "inherit",
      "name": `Bump ${modId}`,
      "with": {
        "id": modId,
        "game_version": "${{ needs.get-mods.outputs.packageVersion }}",
        "bs_cordl": "${{ needs.get-mods.outputs.bs-cordl }}",
        "newest_mods": "${{ needs.get-mods.outputs.newestDependencies }}",
        "repo": mod.repo,
        "version": mod.version,
        "branch": mod.branch,
        "install": allDependencies.includes(modId),
        "build_command": mod.build,
        "qmod_command": mod.qmod,
        "prebump_command": mod.prebump,
        "installed_mods": JSON.stringify(mod.dependencies || []),
        "force_build": "${{ github.event.action == 'Bump All Mods' && true }}"
      },
    };
  }

  return jobContainer;
}

const bumpData = {
  "name": "Bump mods",
  "on": {
    "repository_dispatch": {
      "types": [
        "Bump Needed Mods",
        "Bump All Mods"
      ]
    }
  },
  "concurrency": {
    "group": "${{ github.event.action }}",
    "cancel-in-progress": true
  },
  "permissions": {
    "actions": "write"
  },
  "jobs": {
    "cleanup-runs": {
      "uses": "./.github/workflows/cleanup-runs.yml",
      "secrets": "inherit",
      "permissions": {
        "contents": "write",
        "actions": "write"
      }
    },
    "get-mods": {
      "runs-on": "ubuntu-latest",
      "outputs": {
        "packageVersion": "${{ steps.parse-mods.outputs.packageVersion }}",
        "newestDependencies": "${{ steps.parse-mods.outputs.newestDependencies }}",
        "bs-cordl": "${{ steps.parse-mods.outputs.bs-cordl }}",
      },
      "steps": [
        {
          "name": "Checkout repository",
          "uses": "actions/checkout@v4"
        },
        {
          "name": "Setup qpm",
          "uses": "fernthedev/qpm-action@v1",
          "with": {
            "workflow_token": "${{ secrets.GITHUB_TOKEN}}",
            "restore": false,
            "resolve_ndk": false,
            "cache": false
          }
        },
        {
          "name": "Parse mods.json",
          "id": "parse-mods",
          "env": {
            "newestDependencies": JSON.stringify(Object.entries(modsJson.newestDependencies).map(e => e.join(":"))),
            "cordl": modsJson.newestDependencies["bs-cordl"]
          },
          "run": trimAndDedent(`
            echo "newestDependencies=$newestDependencies" >> $GITHUB_OUTPUT
            echo "bs-cordl=$cordl" >> $GITHUB_OUTPUT
            pkg_tmp="$(mktemp -d)"
            
            (
              cd "$pkg_tmp"
              qpm package create "package-test" "0.1.0"
              qpm dependency add bs-cordl -v "$cordl"
              qpm restore --update
              echo "packageVersion=$(cat extern/includes/bs-cordl/include/version.txt)" >> $GITHUB_OUTPUT
            )
            rm -r "$pkg_tmp"
            
            cat $GITHUB_OUTPUT
          `)
        }
      ]
    },
    ...await getBumpJobs(modsJson),
    "combine-artifacts": {
      "needs": Object.keys(modsJson.mods).map(modId => `bump-${modId}`),
      "runs-on": "ubuntu-latest",
      "steps": [
        {
          "name": "Download artifacts",
          "uses": "actions/download-artifact@v4",
          "with": {
            "path": "artifacts",
            "pattern": "qmod_*"
          }
        },
        {
          "name": "Move QMODs to root",
          "run": "find artifacts -type f -name '*.qmod' -exec mv {} . \\;"
        },
        {
          "name": "Upload combined artifact",
          "uses": "actions/upload-artifact@v4",
          "with": {
            "name": "all_qmods",
            "path": "*.qmod"
          }
        }
      ]
    },
    "clear-cache-end": {
      "runs-on": "ubuntu-latest",
      "if": "always()",
      "needs": Object.keys(modsJson.mods).map(modId => `bump-${modId}`),
      "steps": [
        {
          "name": "Delete all shared caches",
          "env": {
            "GH_TOKEN": "${{ github.token }}",
            "REPO": "${{ github.repository }}"
          },
          "run": trimAndDedent(`
            gh api -H "Accept: application/vnd.github+json" \\
              /repos/$REPO/actions/caches \\
              --paginate \\
              -q '.actions_caches[] | select(.key | startswith(\"shared-\${{ github.run_id }}-\")) | .id' |
            
            while read cache_id; do
              echo "Deleting cache id $cache_id"
              gh api --method DELETE "/repos/$REPO/actions/caches/$cache_id"
            done
          `)
        }
      ]
    }
  }
};

console.log(yaml.stringify(bumpData, {
  blockQuote: "literal",
  lineWidth: 0,
  minContentWidth: 0
}));
