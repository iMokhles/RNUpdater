import type { RNRelease } from "shared/types";

const RELEASES_URL =
  "https://raw.githubusercontent.com/react-native-community/rn-diff-purge/master/RELEASES";

export class ReleasesService {
  private static releases: RNRelease[] | null = null;

  static async fetchReleases(): Promise<RNRelease[]> {
    if (this.releases) {
      return this.releases;
    }

    try {
      const response = await fetch(RELEASES_URL);
      if (!response.ok) {
        throw new Error(`Failed to fetch releases: ${response.statusText}`);
      }

      const releasesText = await response.text();
      const versionStrings = releasesText.trim().split(/\s+/);

      this.releases = versionStrings.map((version) => {
        const isReleaseCandidate = version.includes("-rc");
        const isPrerelease = version.includes("-") && !isReleaseCandidate;
        const isStable = !isReleaseCandidate && !isPrerelease;

        return {
          version,
          isStable,
          isReleaseCandidate,
          isPrerelease,
        };
      });

      // Sort releases by version (newest first)
      this.releases.sort((a, b) => {
        const aVersion = a.version.replace(/[^\d.]/g, "");
        const bVersion = b.version.replace(/[^\d.]/g, "");
        return bVersion.localeCompare(aVersion, undefined, { numeric: true });
      });

      return this.releases;
    } catch (error) {
      console.error("Error fetching React Native releases:", error);
      throw new Error("Failed to fetch React Native releases");
    }
  }

  static async getStableReleases(): Promise<RNRelease[]> {
    const releases = await this.fetchReleases();
    return releases.filter((release) => release.isStable);
  }

  static async getReleaseCandidates(): Promise<RNRelease[]> {
    const releases = await this.fetchReleases();
    return releases.filter((release) => release.isReleaseCandidate);
  }

  static async getReleasesAfterVersion(
    currentVersion: string
  ): Promise<RNRelease[]> {
    const releases = await this.fetchReleases();
    const currentVersionClean = currentVersion.replace(/[^\d.]/g, "");

    return releases.filter((release) => {
      const releaseVersionClean = release.version.replace(/[^\d.]/g, "");
      return (
        releaseVersionClean.localeCompare(currentVersionClean, undefined, {
          numeric: true,
        }) > 0
      );
    });
  }

  static clearCache(): void {
    this.releases = null;
  }
}

