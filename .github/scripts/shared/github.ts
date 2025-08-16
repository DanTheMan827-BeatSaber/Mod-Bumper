import { octokit } from "./octokit.ts";

const githubRepoRegex = /^https?:\/\/(?:www\.)?github\.com\/([^\/]+)\/([^\/]+)/i;

/**
 * Extracts the owner and repository name from a GitHub repository URL.
 * @param url - The GitHub repository URL.
 * @returns An object with owner and repo properties, or null if the URL is invalid.
 */
export function getRepo(url: string): { owner: string; repo: string } | null {
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

/**
 * Retrieves the default branch name for a given GitHub repository URL.
 * @param url - The GitHub repository URL.
 * @returns A promise that resolves to the default branch name.
 * @throws If the repository cannot be found or accessed.
 */
export async function getDefaultBranch(url: string): Promise<string> {
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