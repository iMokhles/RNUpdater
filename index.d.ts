declare global {
  interface Window {
    App: {
      // Add your app-specific APIs here
      getVersion: () => Promise<string>;
      getPlatform: () => Promise<string>;
      selectProjectFolder: () => Promise<string | null>;
      readPackageJson: (projectPath: string) => Promise<any>;
      fetchRNReleases: () => Promise<string[]>;
      // Example: loadProject: (path: string) => Promise<any>
    };
  }
}

export {};
