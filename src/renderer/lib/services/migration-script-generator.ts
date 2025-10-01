import type {
  MajorVersionUpdatePlan,
  ComplexChange,
  MigrationStep,
} from "./major-version-updater";
import type { NativeCodeChange } from "./native-code-updater";
import type { BinaryFileInfo } from "./binary-file-updater";

export interface MigrationScript {
  id: string;
  title: string;
  description: string;
  version: string;
  steps: MigrationStep[];
  prerequisites: string[];
  warnings: string[];
  rollbackInstructions: string[];
  estimatedTime: string;
  difficulty: "beginner" | "intermediate" | "advanced" | "expert";
}

export interface MigrationTemplate {
  name: string;
  description: string;
  category: "react_native" | "gradle" | "native" | "configuration" | "binary";
  template: string;
  variables: Array<{
    name: string;
    type: "string" | "number" | "boolean" | "array";
    description: string;
    required: boolean;
    defaultValue?: any;
  }>;
}

export class MigrationScriptGenerator {
  /**
   * Generate migration script from update plan
   */
  static generateMigrationScript(
    updatePlan: MajorVersionUpdatePlan
  ): MigrationScript {
    const script: MigrationScript = {
      id: `rn_${updatePlan.fromVersion}_to_${updatePlan.toVersion}`,
      title: `React Native ${updatePlan.fromVersion} to ${updatePlan.toVersion} Migration`,
      description: `Comprehensive migration guide for upgrading React Native from ${updatePlan.fromVersion} to ${updatePlan.toVersion}`,
      version: "1.0.0",
      steps: updatePlan.migrationSteps,
      prerequisites: this.generatePrerequisites(updatePlan),
      warnings: this.generateWarnings(updatePlan),
      rollbackInstructions: this.generateRollbackInstructions(updatePlan),
      estimatedTime: this.estimateMigrationTime(updatePlan),
      difficulty: this.assessDifficulty(updatePlan),
    };

    return script;
  }

  /**
   * Generate prerequisites
   */
  private static generatePrerequisites(
    updatePlan: MajorVersionUpdatePlan
  ): string[] {
    const prerequisites = [
      "Node.js 18+ installed",
      "React Native CLI installed",
      "Android Studio (for Android development)",
      "Xcode (for iOS development)",
      "Git repository with clean working directory",
    ];

    // Add specific prerequisites based on changes
    if (updatePlan.complexChanges.some((c) => c.type === "gradle")) {
      prerequisites.push("Gradle 8.14.1+ installed");
    }

    if (updatePlan.complexChanges.some((c) => c.type === "native_code")) {
      prerequisites.push("Android NDK installed");
      prerequisites.push("Xcode Command Line Tools installed");
    }

    if (updatePlan.complexChanges.some((c) => c.type === "binary")) {
      prerequisites.push("Sufficient disk space for binary downloads");
    }

    return prerequisites;
  }

  /**
   * Generate warnings
   */
  private static generateWarnings(
    updatePlan: MajorVersionUpdatePlan
  ): string[] {
    const warnings = [
      "⚠️ Always create a backup of your project before starting migration",
      "⚠️ Test the migration on a copy of your project first",
      "⚠️ Some changes may require manual intervention",
    ];

    // Add specific warnings based on changes
    if (updatePlan.breakingChangesCount > 0) {
      warnings.push(
        `⚠️ ${updatePlan.breakingChangesCount} breaking changes detected - manual review required`
      );
    }

    if (updatePlan.complexChanges.some((c) => c.severity === "critical")) {
      warnings.push(
        "⚠️ Critical changes detected - migration may affect app functionality"
      );
    }

    if (updatePlan.complexChanges.some((c) => c.type === "native_code")) {
      warnings.push(
        "⚠️ Native code changes detected - may require platform-specific testing"
      );
    }

    if (updatePlan.complexChanges.some((c) => c.type === "binary")) {
      warnings.push(
        "⚠️ Binary files will be updated - ensure compatibility with your build environment"
      );
    }

    return warnings;
  }

  /**
   * Generate rollback instructions
   */
  private static generateRollbackInstructions(
    updatePlan: MajorVersionUpdatePlan
  ): string[] {
    const instructions = [
      "1. Stop any running development servers",
      "2. Revert Git changes: `git reset --hard HEAD~1`",
      "3. Restore package.json from backup",
      "4. Run `npm install` or `yarn install`",
      "5. Clean build artifacts: `npx react-native clean`",
      "6. Rebuild the project",
    ];

    // Add specific rollback instructions based on changes
    if (updatePlan.complexChanges.some((c) => c.type === "gradle")) {
      instructions.push("7. Restore Gradle files from backup");
      instructions.push("8. Clean Gradle cache: `./gradlew clean`");
    }

    if (updatePlan.complexChanges.some((c) => c.type === "native_code")) {
      instructions.push("9. Restore native code files from backup");
      instructions.push("10. Clean native build artifacts");
    }

    if (updatePlan.complexChanges.some((c) => c.type === "binary")) {
      instructions.push("11. Restore binary files from backup");
    }

    return instructions;
  }

  /**
   * Estimate migration time
   */
  private static estimateMigrationTime(
    updatePlan: MajorVersionUpdatePlan
  ): string {
    let baseTime = 30; // Base 30 minutes

    // Add time based on complexity
    baseTime += updatePlan.complexChanges.length * 10;
    baseTime += updatePlan.breakingChangesCount * 20;
    baseTime +=
      updatePlan.migrationSteps.filter((s) => s.type === "manual").length * 15;

    if (updatePlan.estimatedRisk === "high") {
      baseTime += 60;
    } else if (updatePlan.estimatedRisk === "medium") {
      baseTime += 30;
    }

    if (baseTime < 60) {
      return `${baseTime} minutes`;
    } else {
      const hours = Math.floor(baseTime / 60);
      const minutes = baseTime % 60;
      return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
    }
  }

  /**
   * Assess migration difficulty
   */
  private static assessDifficulty(
    updatePlan: MajorVersionUpdatePlan
  ): "beginner" | "intermediate" | "advanced" | "expert" {
    let score = 0;

    // Base score
    score += updatePlan.complexChanges.length;
    score += updatePlan.breakingChangesCount * 2;
    score +=
      updatePlan.migrationSteps.filter((s) => s.type === "manual").length * 2;

    // Risk factor
    if (updatePlan.estimatedRisk === "high") score += 3;
    else if (updatePlan.estimatedRisk === "medium") score += 1;

    // Critical changes
    if (updatePlan.complexChanges.some((c) => c.severity === "critical"))
      score += 2;

    // Native code changes
    if (updatePlan.complexChanges.some((c) => c.type === "native_code"))
      score += 2;

    if (score <= 2) return "beginner";
    if (score <= 5) return "intermediate";
    if (score <= 8) return "advanced";
    return "expert";
  }

  /**
   * Generate detailed migration steps
   */
  static generateDetailedSteps(updatePlan: MajorVersionUpdatePlan): string {
    let steps = `# React Native ${updatePlan.fromVersion} to ${updatePlan.toVersion} Migration\n\n`;

    steps += `## Overview\n`;
    steps += `This migration involves ${updatePlan.complexChanges.length} complex changes and ${updatePlan.packageUpdates.length} package updates.\n\n`;

    steps += `## Risk Assessment\n`;
    steps += `- **Risk Level:** ${updatePlan.estimatedRisk.toUpperCase()}\n`;
    steps += `- **Breaking Changes:** ${updatePlan.breakingChangesCount}\n`;
    steps += `- **Manual Review Required:** ${
      updatePlan.requiresManualReview ? "Yes" : "No"
    }\n\n`;

    steps += `## Prerequisites\n`;
    updatePlan.migrationSteps.forEach((step, index) => {
      steps += `${index + 1}. ${step.description}\n`;
    });

    steps += `\n## Detailed Steps\n\n`;

    // Package updates
    if (updatePlan.packageUpdates.length > 0) {
      steps += `### 1. Package Updates\n\n`;
      steps += `Update the following packages in your \`package.json\`:\n\n`;
      updatePlan.packageUpdates.forEach((update) => {
        steps += `- **${update.name}**: ${update.currentVersion} → ${update.targetVersion}\n`;
      });
      steps += `\n\`\`\`bash\nnpm install\n# or\nyarn install\n\`\`\`\n\n`;
    }

    // Configuration changes
    const configChanges = updatePlan.complexChanges.filter(
      (c) => c.type === "configuration"
    );
    if (configChanges.length > 0) {
      steps += `### 2. Configuration Updates\n\n`;
      configChanges.forEach((change) => {
        steps += `#### ${change.filePath}\n`;
        steps += `${change.description}\n\n`;
        if (change.breakingChanges) {
          steps += `**Breaking Changes:**\n`;
          change.breakingChanges.forEach((bc) => {
            steps += `- ${bc}\n`;
          });
          steps += `\n`;
        }
      });
    }

    // Gradle changes
    const gradleChanges = updatePlan.complexChanges.filter(
      (c) => c.type === "gradle"
    );
    if (gradleChanges.length > 0) {
      steps += `### 3. Gradle Configuration Updates\n\n`;
      gradleChanges.forEach((change) => {
        steps += `#### ${change.filePath}\n`;
        steps += `${change.description}\n\n`;
      });
    }

    // Native code changes
    const nativeChanges = updatePlan.complexChanges.filter(
      (c) => c.type === "native_code"
    );
    if (nativeChanges.length > 0) {
      steps += `### 4. Native Code Updates\n\n`;
      nativeChanges.forEach((change) => {
        steps += `#### ${change.filePath}\n`;
        steps += `${change.description}\n\n`;
        if (change.breakingChanges) {
          steps += `**Breaking Changes:**\n`;
          change.breakingChanges.forEach((bc) => {
            steps += `- ${bc}\n`;
          });
          steps += `\n`;
        }
      });
    }

    // Source code changes
    const sourceChanges = updatePlan.complexChanges.filter(
      (c) => c.type === "source_code"
    );
    if (sourceChanges.length > 0) {
      steps += `### 5. Source Code Updates\n\n`;
      sourceChanges.forEach((change) => {
        steps += `#### ${change.filePath}\n`;
        steps += `${change.description}\n\n`;
        if (change.breakingChanges) {
          steps += `**Breaking Changes:**\n`;
          change.breakingChanges.forEach((bc) => {
            steps += `- ${bc}\n`;
          });
          steps += `\n`;
        }
      });
    }

    // Binary file changes
    const binaryChanges = updatePlan.complexChanges.filter(
      (c) => c.type === "binary"
    );
    if (binaryChanges.length > 0) {
      steps += `### 6. Binary File Updates\n\n`;
      steps += `The following binary files will be updated:\n\n`;
      binaryChanges.forEach((change) => {
        steps += `- ${change.filePath}\n`;
      });
      steps += `\nThese files will be automatically downloaded and replaced.\n\n`;
    }

    steps += `## Post-Migration Steps\n\n`;
    steps += `1. Clean build artifacts: \`npx react-native clean\`\n`;
    steps += `2. Rebuild the project: \`npx react-native run-android\` / \`npx react-native run-ios\`\n`;
    steps += `3. Test all functionality thoroughly\n`;
    steps += `4. Update any custom native modules if needed\n`;
    steps += `5. Update documentation and deployment scripts\n\n`;

    steps += `## Troubleshooting\n\n`;
    steps += `If you encounter issues:\n\n`;
    steps += `1. Check the [React Native upgrade guide](https://reactnative.dev/docs/upgrading)\n`;
    steps += `2. Review the [changelog](https://github.com/facebook/react-native/releases)\n`;
    steps += `3. Check for known issues in the React Native repository\n`;
    steps += `4. Consider rolling back if critical issues persist\n\n`;

    return steps;
  }

  /**
   * Generate migration templates
   */
  static getMigrationTemplates(): MigrationTemplate[] {
    return [
      {
        name: "react_native_major_upgrade",
        description: "Template for major React Native version upgrades",
        category: "react_native",
        template: `# React Native {{fromVersion}} to {{toVersion}} Migration

## Overview
This migration upgrades React Native from {{fromVersion}} to {{toVersion}}.

## Prerequisites
- Node.js 18+
- React Native CLI
- Android Studio / Xcode
- Clean Git working directory

## Steps
1. Update package.json dependencies
2. Update native dependencies
3. Update configuration files
4. Test the application
5. Deploy changes

## Breaking Changes
{{breakingChanges}}

## Estimated Time
{{estimatedTime}}

## Difficulty
{{difficulty}}`,
        variables: [
          {
            name: "fromVersion",
            type: "string",
            description: "Source version",
            required: true,
          },
          {
            name: "toVersion",
            type: "string",
            description: "Target version",
            required: true,
          },
          {
            name: "breakingChanges",
            type: "array",
            description: "List of breaking changes",
            required: false,
          },
          {
            name: "estimatedTime",
            type: "string",
            description: "Estimated migration time",
            required: false,
            defaultValue: "2-4 hours",
          },
          {
            name: "difficulty",
            type: "string",
            description: "Migration difficulty",
            required: false,
            defaultValue: "intermediate",
          },
        ],
      },
      {
        name: "gradle_configuration_update",
        description: "Template for Gradle configuration updates",
        category: "gradle",
        template: `# Gradle Configuration Update

## Overview
Update Gradle configuration for React Native {{version}}.

## Changes
- Update Kotlin version to {{kotlinVersion}}
- Update Gradle wrapper to {{gradleVersion}}
- Update build tools version to {{buildToolsVersion}}

## Files Modified
{{files}}

## Commands
\`\`\`bash
./gradlew clean
./gradlew build
\`\`\``,
        variables: [
          {
            name: "version",
            type: "string",
            description: "React Native version",
            required: true,
          },
          {
            name: "kotlinVersion",
            type: "string",
            description: "Kotlin version",
            required: true,
          },
          {
            name: "gradleVersion",
            type: "string",
            description: "Gradle version",
            required: true,
          },
          {
            name: "buildToolsVersion",
            type: "string",
            description: "Build tools version",
            required: true,
          },
          {
            name: "files",
            type: "array",
            description: "Modified files",
            required: false,
          },
        ],
      },
    ];
  }

  /**
   * Generate migration script for specific change type
   */
  static generateChangeSpecificScript(
    change: ComplexChange,
    context: {
      fromVersion: string;
      toVersion: string;
      projectPath: string;
    }
  ): string {
    let script = `# ${change.description}\n\n`;
    script += `**File:** ${change.filePath}\n`;
    script += `**Severity:** ${change.severity}\n`;
    script += `**Type:** ${change.type}\n\n`;

    if (change.breakingChanges) {
      script += `## Breaking Changes\n\n`;
      change.breakingChanges.forEach((bc) => {
        script += `- ${bc}\n`;
      });
      script += `\n`;
    }

    script += `## Migration Steps\n\n`;

    switch (change.type) {
      case "configuration":
        script += this.generateConfigurationMigrationScript(change, context);
        break;
      case "source_code":
        script += this.generateSourceCodeMigrationScript(change, context);
        break;
      case "native_code":
        script += this.generateNativeCodeMigrationScript(change, context);
        break;
      case "gradle":
        script += this.generateGradleMigrationScript(change, context);
        break;
      case "binary":
        script += this.generateBinaryMigrationScript(change, context);
        break;
      default:
        script += `Manual review and update required for ${change.filePath}.\n`;
    }

    return script;
  }

  /**
   * Generate configuration migration script
   */
  private static generateConfigurationMigrationScript(
    change: ComplexChange,
    context: { fromVersion: string; toVersion: string; projectPath: string }
  ): string {
    let script = `1. Open ${change.filePath}\n`;
    script += `2. Review the changes in the diff\n`;
    script += `3. Apply the configuration updates\n`;
    script += `4. Test the configuration changes\n\n`;

    if (change.filePath.includes("tsconfig.json")) {
      script += `**Note:** TypeScript configuration has been updated to use the new format.\n`;
      script += `Make sure your project is compatible with the new configuration.\n\n`;
    }

    if (change.filePath.includes(".prettierrc")) {
      script += `**Note:** Prettier configuration has been updated.\n`;
      script += `Run \`npx prettier --write .\` to format your code with the new configuration.\n\n`;
    }

    return script;
  }

  /**
   * Generate source code migration script
   */
  private static generateSourceCodeMigrationScript(
    change: ComplexChange,
    context: { fromVersion: string; toVersion: string; projectPath: string }
  ): string {
    let script = `1. Open ${change.filePath}\n`;
    script += `2. Review the changes in the diff\n`;
    script += `3. Apply the source code updates\n`;
    script += `4. Test the application functionality\n\n`;

    if (change.filePath.includes("App.tsx")) {
      script += `**Note:** App.tsx has been completely restructured.\n`;
      script += `You may need to migrate your custom app content to the new structure.\n\n`;
    }

    return script;
  }

  /**
   * Generate native code migration script
   */
  private static generateNativeCodeMigrationScript(
    change: ComplexChange,
    context: { fromVersion: string; toVersion: string; projectPath: string }
  ): string {
    let script = `1. Open ${change.filePath}\n`;
    script += `2. Review the changes in the diff\n`;
    script += `3. Apply the native code updates\n`;
    script += `4. Clean and rebuild the project\n`;
    script += `5. Test on both platforms\n\n`;

    if (change.filePath.includes("MainApplication")) {
      script += `**Note:** MainApplication has been updated with new React Native initialization.\n`;
      script += `Make sure your custom native modules are compatible with the new initialization.\n\n`;
    }

    return script;
  }

  /**
   * Generate Gradle migration script
   */
  private static generateGradleMigrationScript(
    change: ComplexChange,
    context: { fromVersion: string; toVersion: string; projectPath: string }
  ): string {
    let script = `1. Open ${change.filePath}\n`;
    script += `2. Review the changes in the diff\n`;
    script += `3. Apply the Gradle configuration updates\n`;
    script += `4. Clean Gradle cache: \`./gradlew clean\`\n`;
    script += `5. Rebuild the project: \`./gradlew build\`\n\n`;

    if (change.filePath.includes("build.gradle")) {
      script += `**Note:** Build configuration has been updated.\n`;
      script += `Make sure your project is compatible with the new Gradle version.\n\n`;
    }

    return script;
  }

  /**
   * Generate binary migration script
   */
  private static generateBinaryMigrationScript(
    change: ComplexChange,
    context: { fromVersion: string; toVersion: string; projectPath: string }
  ): string {
    let script = `1. The binary file ${change.filePath} will be automatically updated\n`;
    script += `2. Verify the file has been updated correctly\n`;
    script += `3. Clean and rebuild the project\n`;
    script += `4. Test the application functionality\n\n`;

    script += `**Note:** Binary files are automatically downloaded and replaced.\n`;
    script += `Make sure your build environment is compatible with the new binary files.\n\n`;

    return script;
  }
}
