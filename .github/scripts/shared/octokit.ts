import { Octokit } from "https://esm.sh/@octokit/rest";

const token = Deno.env.get("GITHUB_TOKEN");

/** An initialized octokit instance. */
export const octokit = new Octokit(token ? { auth: token } : {});