declare global {
  interface Window {
    App: {
      // Add your app-specific APIs here
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      selectProjectFolder: () => Promise<string | null>;
      readPackageJson: (projectPath: string) => Promise<any>;
      fetchRNReleases: () => Promise<string[]>;
      // Git-related APIs
      getGitInfo: (projectPath: string) => Promise<any>;
      getGitStatus: (projectPath: string) => Promise<any>;
      getRecentCommits: (projectPath: string, count?: number) => Promise<any[]>;
      // File operations
      readFile: (filePath: string) => Promise<string>;
      writeFile: (filePath: string, content: string) => Promise<boolean>;
      // Package update operations
      analyzePackageUpdates: (
        projectPath: string,
        targetRNVersion: string,
        diffContent?: string | any
      ) => Promise<any[]>;
      applyPackageUpdates: (
        projectPath: string,
        updates: any[]
      ) => Promise<any>;
      // Example: loadProject: (path: string) => Promise<any>
    };
  }
}

export {};
