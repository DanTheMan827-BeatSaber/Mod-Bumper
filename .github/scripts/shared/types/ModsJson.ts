export interface Mod<DependencyType = string> {
  /** The repo containing the mod */
  repo: string;

  /** The version to tag the built artifact with */
  version?: string;

  /** A list of dependencies this mod needs to have before it can be built */
  dependencies?: DependencyType[];

  /** The command to run for building the mod */
  build?: string;

  /** The command to run for packaging the qmod */
  qmod?: string;

  /** The branch or tag to checkout */
  branch?: string;

  /** The command to run before bumping the version */
  prebump?: string;
}

export interface ModsJson {
  /** The schema */
  $schema: "https://github.com/DanTheMan827-BeatSaber/Mod-Bumper/raw/refs/heads/main/mods.schema.json";

  /** A list of dependencies and the version to set when bumping */
  newestDependencies: Record<string, string>;

  /** Mods that need to be built before any others, these are built sequentially one at a time */
  installedMods?: Record<string, Mod>;

  /** Mods that can be built in parallel */
  mods: Record<string, Mod>;
}
