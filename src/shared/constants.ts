export const APP_NAME = "RNUpdater";
export const APP_VERSION = "1.0.0";

export const IPC_CHANNELS = {
  GET_VERSION: "get-version",
  GET_PLATFORM: "get-platform",
  SELECT_PROJECT_FOLDER: "select-project-folder",
  READ_PACKAGE_JSON: "read-package-json",
  FETCH_RN_RELEASES: "fetch-rn-releases",
  GET_GIT_INFO: "get-git-info",
  GET_GIT_STATUS: "get-git-status",
  GET_RECENT_COMMITS: "get-recent-commits",
  // Add more IPC channels as needed
} as const;

export const ROUTES = {
  HOME: "/",
  SETTINGS: "/settings",
  PROJECTS: "/projects",
} as const;
