import { exec } from "child_process";
import { promisify } from "util";
import { join } from "path";
import type { GitInfo } from "shared/types";

const execAsync = promisify(exec);

export class GitService {
  /**
   * Get git information for a project directory
   */
  static async getGitInfo(projectPath: string): Promise<GitInfo> {
    try {
      // Check if the directory is a git repository
      const isGitRepo = await this.isGitRepository(projectPath);

      if (!isGitRepo) {
        return {
          branch: "Not a git repository",
          remoteUrl: "N/A",
          isGitRepository: false,
        };
      }

      // Get current branch name
      const branch = await this.getCurrentBranch(projectPath);

      // Get remote URL
      const remoteUrl = await this.getRemoteUrl(projectPath);

      return {
        branch,
        remoteUrl,
        isGitRepository: true,
      };
    } catch (error) {
      console.error("Error getting git info:", error);
      return {
        branch: "Error getting branch",
        remoteUrl: "Error getting remote",
        isGitRepository: false,
      };
    }
  }

  /**
   * Check if a directory is a git repository
   */
  private static async isGitRepository(projectPath: string): Promise<boolean> {
    try {
      await execAsync("git rev-parse --git-dir", { cwd: projectPath });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get the current branch name
   */
  private static async getCurrentBranch(projectPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync("git branch --show-current", {
        cwd: projectPath,
      });
      return stdout.trim() || "No branch";
    } catch (error) {
      console.error("Error getting current branch:", error);
      return "Unknown branch";
    }
  }

  /**
   * Get the remote URL (origin)
   */
  private static async getRemoteUrl(projectPath: string): Promise<string> {
    try {
      const { stdout } = await execAsync("git remote get-url origin", {
        cwd: projectPath,
      });
      return stdout.trim() || "No remote";
    } catch (error) {
      // Try to get any remote URL if origin doesn't exist
      try {
        const { stdout } = await execAsync("git remote -v", {
          cwd: projectPath,
        });
        const lines = stdout.trim().split("\n");
        if (lines.length > 0 && lines[0]) {
          const firstRemote = lines[0].split("\t")[1];
          return firstRemote?.split(" ")[0] || "No remote";
        }
        return "No remote";
      } catch {
        console.error("Error getting remote URL:", error);
        return "No remote";
      }
    }
  }

  /**
   * Get git status information
   */
  static async getGitStatus(projectPath: string): Promise<{
    hasChanges: boolean;
    stagedFiles: number;
    unstagedFiles: number;
    untrackedFiles: number;
  }> {
    try {
      const isGitRepo = await this.isGitRepository(projectPath);
      if (!isGitRepo) {
        return {
          hasChanges: false,
          stagedFiles: 0,
          unstagedFiles: 0,
          untrackedFiles: 0,
        };
      }

      const { stdout } = await execAsync("git status --porcelain", {
        cwd: projectPath,
      });

      const lines = stdout
        .trim()
        .split("\n")
        .filter((line) => line.length > 0);

      let stagedFiles = 0;
      let unstagedFiles = 0;
      let untrackedFiles = 0;

      lines.forEach((line) => {
        const status = line.substring(0, 2);
        if (
          status.includes("A") ||
          status.includes("M") ||
          status.includes("D")
        ) {
          if (status.charAt(0) !== " ") stagedFiles++;
          if (status.charAt(1) !== " ") unstagedFiles++;
        } else if (status.includes("??")) {
          untrackedFiles++;
        }
      });

      return {
        hasChanges: lines.length > 0,
        stagedFiles,
        unstagedFiles,
        untrackedFiles,
      };
    } catch (error) {
      console.error("Error getting git status:", error);
      return {
        hasChanges: false,
        stagedFiles: 0,
        unstagedFiles: 0,
        untrackedFiles: 0,
      };
    }
  }

  /**
   * Get recent commits
   */
  static async getRecentCommits(
    projectPath: string,
    count: number = 5
  ): Promise<
    Array<{
      hash: string;
      message: string;
      author: string;
      date: string;
    }>
  > {
    try {
      const isGitRepo = await this.isGitRepository(projectPath);
      if (!isGitRepo) {
        return [];
      }

      const { stdout } = await execAsync(
        `git log --oneline --format="%h|%s|%an|%ad" --date=short -n ${count}`,
        { cwd: projectPath }
      );

      return stdout
        .trim()
        .split("\n")
        .map((line) => {
          const [hash, message, author, date] = line.split("|");
          return { hash, message, author, date };
        });
    } catch (error) {
      console.error("Error getting recent commits:", error);
      return [];
    }
  }
}
