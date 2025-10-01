import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type {
  AppState,
  Project,
  UpdateInfo,
  RNProject,
  RNRelease,
  ProjectAnalysis,
} from "shared/types";
import type { ReactNativeDiff } from "../services/diff-service";
import type { MajorVersionUpdateResult } from "../services/package-updater-service";

interface AppStore extends AppState {
  projects: RNProject[];
  currentProject: RNProject | null;
  updateInfo: UpdateInfo | null;
  availableReleases: RNRelease[];
  projectAnalysis: ProjectAnalysis | null;
  selectedDiff: ReactNativeDiff | null;
  isDiffLoading: boolean;

  // Major Version Update state
  majorVersionUpdate: MajorVersionUpdateResult | null;
  isMajorVersionAnalyzing: boolean;
  showMajorVersionUpdater: boolean;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setVersion: (version: string) => void;
  setPlatform: (platform: string) => void;
  addProject: (project: RNProject) => void;
  removeProject: (projectId: string) => void;
  setCurrentProject: (project: RNProject | null) => void;
  setUpdateInfo: (updateInfo: UpdateInfo | null) => void;
  setAvailableReleases: (releases: RNRelease[]) => void;
  setProjectAnalysis: (analysis: ProjectAnalysis | null) => void;
  setSelectedDiff: (diff: ReactNativeDiff | null) => void;
  setDiffLoading: (loading: boolean) => void;
  clearError: () => void;

  // Major Version Update actions
  setMajorVersionUpdate: (update: MajorVersionUpdateResult | null) => void;
  setMajorVersionAnalyzing: (analyzing: boolean) => void;
  setShowMajorVersionUpdater: (show: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      isLoading: false,
      error: null,
      version: "1.0.0",
      platform: "unknown",
      projects: [],
      currentProject: null,
      updateInfo: null,
      availableReleases: [],
      projectAnalysis: null,
      selectedDiff: null,
      isDiffLoading: false,

      // Major Version Update state
      majorVersionUpdate: null,
      isMajorVersionAnalyzing: false,
      showMajorVersionUpdater: false,

      // Actions
      setLoading: (loading: boolean) => set({ isLoading: loading }),

      setError: (error: string | null) => set({ error }),

      setVersion: (version: string) => set({ version }),

      setPlatform: (platform: string) => set({ platform }),

      addProject: (project: Project) =>
        set((state) => ({
          projects: [...state.projects, project],
        })),

      removeProject: (projectId: string) =>
        set((state) => ({
          projects: state.projects.filter((p) => p.id !== projectId),
          currentProject:
            state.currentProject?.id === projectId
              ? null
              : state.currentProject,
        })),

      setCurrentProject: (project: Project | null) =>
        set({ currentProject: project }),

      setUpdateInfo: (updateInfo: UpdateInfo | null) => set({ updateInfo }),

      setAvailableReleases: (releases: RNRelease[]) =>
        set({ availableReleases: releases }),

      setProjectAnalysis: (analysis: ProjectAnalysis | null) =>
        set({ projectAnalysis: analysis }),

      setSelectedDiff: (diff: ReactNativeDiff | null) =>
        set({ selectedDiff: diff }),

      setDiffLoading: (loading: boolean) => set({ isDiffLoading: loading }),

      clearError: () => set({ error: null }),

      // Major Version Update actions
      setMajorVersionUpdate: (update: MajorVersionUpdateResult | null) =>
        set({ majorVersionUpdate: update }),

      setMajorVersionAnalyzing: (analyzing: boolean) =>
        set({ isMajorVersionAnalyzing: analyzing }),

      setShowMajorVersionUpdater: (show: boolean) =>
        set({ showMajorVersionUpdater: show }),
    }),
    {
      name: "app-store",
    }
  )
);
