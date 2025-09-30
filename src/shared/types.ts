// App-specific types
export interface AppState {
  isLoading: boolean;
  error: string | null;
  version: string;
  platform: string;
}

export interface Project {
  id: string;
  name: string;
  path: string;
  lastModified: Date;
  // Add more project-specific properties as needed
}

export interface UpdateInfo {
  version: string;
  releaseNotes: string;
  downloadUrl: string;
  isAvailable: boolean;
}

// React Native specific types
export interface RNProject extends Project {
  reactNativeVersion: string;
  reactVersion: string;
  platform: "ios" | "android" | "both";
  bundleId?: string;
  packageJson: PackageJsonInfo;
}

export interface PackageJsonInfo {
  name: string;
  version: string;
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  reactNativeVersion: string;
  reactVersion: string;
}

export interface RNRelease {
  version: string;
  isStable: boolean;
  isReleaseCandidate: boolean;
  isPrerelease: boolean;
}

export interface ProjectAnalysis {
  currentVersion: string;
  availableReleases: RNRelease[];
  recommendedVersion?: string;
  upgradePath: string[];
}
