// To parse this data:
//
//   import { Convert, SharedPackageConfig } from "./file";
//
//   const sharedPackageConfig = Convert.toSharedPackageConfig(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

/**
 * Shared package configuration.
 */
export interface SharedPackageConfig {
  /**
   * A copy of the package configuration stored in qpm.json for convenience.
   */
  config: PackageConfig;
  /**
   * The resolved dependencies of the package.
   */
  restoredDependencies: SharedDependency[];
  [property: string]: any;
}

/**
 * A copy of the package configuration stored in qpm.json for convenience.
 *
 * Configuration for a package.
 */
export interface PackageConfig {
  /**
   * The dependencies of the package.
   */
  dependencies: PackageDependency[];
  /**
   * The directory where dependencies are stored.
   */
  dependenciesDir: string;
  /**
   * The package metadata.
   */
  info: PackageMetadata;
  /**
   * The directory where shared files are stored.
   */
  sharedDir: string;
  /**
   * The version of the package configuration.
   */
  version?: string;
  /**
   * The workspace configuration.
   */
  workspace?: WorkspaceConfig;
  [property: string]: any;
}

/**
 * A dependency of the package.
 */
export interface PackageDependency {
  /**
   * Additional metadata for the dependency
   */
  additionalData: PackageDependencyModifier;
  /**
   * The unique identifier of the dependency
   */
  id: string;
  /**
   * The version range of the dependency
   */
  versionRange: string;
  [property: string]: any;
}

/**
 * Additional metadata for the dependency
 *
 * Modifies how a dependency should be restored.
 */
export interface PackageDependencyModifier {
  /**
   * Additional files to be downloaded.
   */
  extraFiles?: string[] | null;
  /**
   * If the mod dependency should be included in the generated mod.json. Defaults to true.
   */
  includeQmod?: boolean | null;
  /**
   * Specifies how to restore this dependency.
   */
  libType?: DependencyLIBType | null;
  /**
   * Copy a dependency from a location that is local to this root path instead of from a
   * remote URL.
   */
  localPath?: null | string;
  /**
   * Whether or not the dependency is private and should be used in restore.
   */
  private?: boolean | null;
  /**
   * Whether the mod is optional or required. If omitted, assume true.
   */
  required?: boolean | null;
  [property: string]: any;
}

/**
 * Shared library
 *
 * Static library
 *
 * Header only
 */
export enum DependencyLIBType {
  HeaderOnly = "headerOnly",
  Shared = "shared",
  Static = "static",
}

/**
 * The package metadata.
 *
 * Metadata information about the package.
 */
export interface PackageMetadata {
  /**
   * Additional metadata for the package.
   */
  additionalData: AdditionalPackageMetadata;
  /**
   * The unique identifier of the package.
   */
  id: string;
  /**
   * The name of the package.
   */
  name: string;
  /**
   * The website for the package.
   */
  url?: null | string;
  /**
   * The version of the package.
   */
  version: string;
  [property: string]: any;
}

/**
 * Additional metadata for the package.
 *
 * Additional metadata for the dependency. Deprecated, use packageConfig.additionalData
 * instead.
 */
export interface AdditionalPackageMetadata {
  /**
   * The branch name of a GitHub repository. Only used when a valid GitHub URL is provided.
   */
  branchName?: null | string;
  /**
   * Whether to generate CMake files on restore.
   */
  cmake?: boolean | null;
  /**
   * Additional compile options for the package.
   */
  compileOptions?: null | CompileOptions;
  /**
   * The link to the debug shared object file.
   */
  debugSoLink?: null | string;
  /**
   * Whether or not the package is header only
   */
  headersOnly?: boolean | null;
  /**
   * The link to the qmod file.
   */
  modLink?: null | string;
  /**
   * The override name for the shared object file.
   */
  overrideSoName?: null | string;
  /**
   * The override name for the static library file.
   */
  overrideStaticName?: null | string;
  /**
   * The link to the shared object file.
   */
  soLink?: null | string;
  /**
   * The link to the static library file.
   */
  staticLink?: null | string;
  /**
   * Whether the package is statically linked. Deprecated, use staticLink instead.
   */
  staticLinking?: boolean | null;
  /**
   * Sub-folder to use from the downloaded repository or zip, so one repository can contain
   * multiple packages.
   */
  subFolder?: null | string;
  /**
   * Path to generate a toolchain JSON file describing the project setup configuration.
   */
  toolchainOut?: null | string;
  [property: string]: any;
}

/**
 * Additional options for compilation and edits to compilation related files.
 */
export interface CompileOptions {
  /**
   * Additional C flags to add.
   */
  cFlags?: string[] | null;
  /**
   * Additional C++ features to add. Deprecated, unused and exclusive to CMake.
   */
  cppFeatures?: string[] | null;
  /**
   * Additional C++ flags to add.
   */
  cppFlags?: string[] | null;
  /**
   * Additional include paths to add, relative to the extern directory.
   */
  includePaths?: string[] | null;
  /**
   * Additional system include paths to add, relative to the extern directory.
   */
  systemIncludes?: string[] | null;
  [property: string]: any;
}

/**
 * The workspace configuration.
 *
 * Configuration for the workspace.
 */
export interface WorkspaceConfig {
  /**
   * The NDK version range.
   */
  ndk: string;
  /**
   * List of directories to search during qmod creation.
   */
  qmodIncludeDirs?: string[];
  /**
   * List of files to include in the resulting qmod.
   */
  qmodIncludeFiles?: string[];
  /**
   * Output path for the qmod.
   */
  qmodOutput?: null | string;
  /**
   * Scripts associated with the workspace.
   */
  scripts?: { [key: string]: string[] };
  [property: string]: any;
}

/**
 * A resolved dependency of the package.
 */
export interface SharedDependency {
  /**
   * The resolved dependency
   */
  dependency: Dependency;
  /**
   * The resolved version of the dependency
   */
  version: string;
  [property: string]: any;
}

/**
 * The resolved dependency
 *
 * A dependency of the package.
 */
export interface Dependency {
  /**
   * Additional metadata for the dependency. Deprecated, use packageConfig.additionalData
   * instead.
   */
  additionalData: AdditionalPackageMetadata;
  id: string;
  /**
   * The version range of the dependency
   */
  versionRange: string;
  [property: string]: any;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
  public static toSharedPackageConfig(json: string): SharedPackageConfig {
    return cast(JSON.parse(json), r("SharedPackageConfig"));
  }

  public static sharedPackageConfigToJson(value: SharedPackageConfig): string {
    return JSON.stringify(uncast(value, r("SharedPackageConfig")), null, 2);
  }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
  const prettyTyp = prettyTypeName(typ);
  const parentText = parent ? ` on ${parent}` : '';
  const keyText = key ? ` for key "${key}"` : '';
  throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
  if (Array.isArray(typ)) {
    if (typ.length === 2 && typ[0] === undefined) {
      return `an optional ${prettyTypeName(typ[1])}`;
    } else {
      return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
    }
  } else if (typeof typ === "object" && typ.literal !== undefined) {
    return typ.literal;
  } else {
    return typeof typ;
  }
}

function jsonToJSProps(typ: any): any {
  if (typ.jsonToJS === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
    typ.jsonToJS = map;
  }
  return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
  if (typ.jsToJSON === undefined) {
    const map: any = {};
    typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
    typ.jsToJSON = map;
  }
  return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
  function transformPrimitive(typ: string, val: any): any {
    if (typeof typ === typeof val) return val;
    return invalidValue(typ, val, key, parent);
  }

  function transformUnion(typs: any[], val: any): any {
    // val must validate against one typ in typs
    const l = typs.length;
    for (let i = 0; i < l; i++) {
      const typ = typs[i];
      try {
        return transform(val, typ, getProps);
      } catch (_) { }
    }
    return invalidValue(typs, val, key, parent);
  }

  function transformEnum(cases: string[], val: any): any {
    if (cases.indexOf(val) !== -1) return val;
    return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
  }

  function transformArray(typ: any, val: any): any {
    // val must be an array with no invalid elements
    if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
    return val.map(el => transform(el, typ, getProps));
  }

  function transformDate(val: any): any {
    if (val === null) {
      return null;
    }
    const d = new Date(val);
    if (isNaN(d.valueOf())) {
      return invalidValue(l("Date"), val, key, parent);
    }
    return d;
  }

  function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
    if (val === null || typeof val !== "object" || Array.isArray(val)) {
      return invalidValue(l(ref || "object"), val, key, parent);
    }
    const result: any = {};
    Object.getOwnPropertyNames(props).forEach(key => {
      const prop = props[key];
      const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
      result[prop.key] = transform(v, prop.typ, getProps, key, ref);
    });
    Object.getOwnPropertyNames(val).forEach(key => {
      if (!Object.prototype.hasOwnProperty.call(props, key)) {
        result[key] = transform(val[key], additional, getProps, key, ref);
      }
    });
    return result;
  }

  if (typ === "any") return val;
  if (typ === null) {
    if (val === null) return val;
    return invalidValue(typ, val, key, parent);
  }
  if (typ === false) return invalidValue(typ, val, key, parent);
  let ref: any = undefined;
  while (typeof typ === "object" && typ.ref !== undefined) {
    ref = typ.ref;
    typ = typeMap[typ.ref];
  }
  if (Array.isArray(typ)) return transformEnum(typ, val);
  if (typeof typ === "object") {
    return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
      : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
        : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
          : invalidValue(typ, val, key, parent);
  }
  // Numbers can be parsed by Date but shouldn't be.
  if (typ === Date && typeof val !== "number") return transformDate(val);
  return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
  return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
  return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
  return { literal: typ };
}

function a(typ: any) {
  return { arrayItems: typ };
}

function u(...typs: any[]) {
  return { unionMembers: typs };
}

function o(props: any[], additional: any) {
  return { props, additional };
}

function m(additional: any) {
  return { props: [], additional };
}

function r(name: string) {
  return { ref: name };
}

const typeMap: any = {
  "SharedPackageConfig": o([
    { json: "config", js: "config", typ: r("PackageConfig") },
    { json: "restoredDependencies", js: "restoredDependencies", typ: a(r("SharedDependency")) },
  ], "any"),
  "PackageConfig": o([
    { json: "dependencies", js: "dependencies", typ: a(r("PackageDependency")) },
    { json: "dependenciesDir", js: "dependenciesDir", typ: "" },
    { json: "info", js: "info", typ: r("PackageMetadata") },
    { json: "sharedDir", js: "sharedDir", typ: "" },
    { json: "version", js: "version", typ: u(undefined, "") },
    { json: "workspace", js: "workspace", typ: u(undefined, r("WorkspaceConfig")) },
  ], "any"),
  "PackageDependency": o([
    { json: "additionalData", js: "additionalData", typ: r("PackageDependencyModifier") },
    { json: "id", js: "id", typ: "" },
    { json: "versionRange", js: "versionRange", typ: "" },
  ], "any"),
  "PackageDependencyModifier": o([
    { json: "extraFiles", js: "extraFiles", typ: u(undefined, u(a(""), null)) },
    { json: "includeQmod", js: "includeQmod", typ: u(undefined, u(true, null)) },
    { json: "libType", js: "libType", typ: u(undefined, u(r("DependencyLIBType"), null)) },
    { json: "localPath", js: "localPath", typ: u(undefined, u(null, "")) },
    { json: "private", js: "private", typ: u(undefined, u(true, null)) },
    { json: "required", js: "required", typ: u(undefined, u(true, null)) },
  ], "any"),
  "PackageMetadata": o([
    { json: "additionalData", js: "additionalData", typ: r("AdditionalPackageMetadata") },
    { json: "id", js: "id", typ: "" },
    { json: "name", js: "name", typ: "" },
    { json: "url", js: "url", typ: u(undefined, u(null, "")) },
    { json: "version", js: "version", typ: "" },
  ], "any"),
  "AdditionalPackageMetadata": o([
    { json: "branchName", js: "branchName", typ: u(undefined, u(null, "")) },
    { json: "cmake", js: "cmake", typ: u(undefined, u(true, null)) },
    { json: "compileOptions", js: "compileOptions", typ: u(undefined, u(null, r("CompileOptions"))) },
    { json: "debugSoLink", js: "debugSoLink", typ: u(undefined, u(null, "")) },
    { json: "headersOnly", js: "headersOnly", typ: u(undefined, u(true, null)) },
    { json: "modLink", js: "modLink", typ: u(undefined, u(null, "")) },
    { json: "overrideSoName", js: "overrideSoName", typ: u(undefined, u(null, "")) },
    { json: "overrideStaticName", js: "overrideStaticName", typ: u(undefined, u(null, "")) },
    { json: "soLink", js: "soLink", typ: u(undefined, u(null, "")) },
    { json: "staticLink", js: "staticLink", typ: u(undefined, u(null, "")) },
    { json: "staticLinking", js: "staticLinking", typ: u(undefined, u(true, null)) },
    { json: "subFolder", js: "subFolder", typ: u(undefined, u(null, "")) },
    { json: "toolchainOut", js: "toolchainOut", typ: u(undefined, u(null, "")) },
  ], "any"),
  "CompileOptions": o([
    { json: "cFlags", js: "cFlags", typ: u(undefined, u(a(""), null)) },
    { json: "cppFeatures", js: "cppFeatures", typ: u(undefined, u(a(""), null)) },
    { json: "cppFlags", js: "cppFlags", typ: u(undefined, u(a(""), null)) },
    { json: "includePaths", js: "includePaths", typ: u(undefined, u(a(""), null)) },
    { json: "systemIncludes", js: "systemIncludes", typ: u(undefined, u(a(""), null)) },
  ], "any"),
  "WorkspaceConfig": o([
    { json: "ndk", js: "ndk", typ: "" },
    { json: "qmodIncludeDirs", js: "qmodIncludeDirs", typ: u(undefined, a("")) },
    { json: "qmodIncludeFiles", js: "qmodIncludeFiles", typ: u(undefined, a("")) },
    { json: "qmodOutput", js: "qmodOutput", typ: u(undefined, u(null, "")) },
    { json: "scripts", js: "scripts", typ: u(undefined, m(a(""))) },
  ], "any"),
  "SharedDependency": o([
    { json: "dependency", js: "dependency", typ: r("Dependency") },
    { json: "version", js: "version", typ: "" },
  ], "any"),
  "Dependency": o([
    { json: "additionalData", js: "additionalData", typ: r("AdditionalPackageMetadata") },
    { json: "id", js: "id", typ: "" },
    { json: "versionRange", js: "versionRange", typ: "" },
  ], "any"),
  "DependencyLIBType": [
    "headerOnly",
    "shared",
    "static",
  ],
};
