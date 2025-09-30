import { defineConfig } from "electron-builder";

export default defineConfig({
  appId: "com.imokhles.rnupdater",
  productName: "RNUpdater",
  directories: {
    output: "dist",
    buildResources: "src/resources/build",
  },
  files: [
    "node_modules/.dev/**/*",
    "node_modules/.bin/**/*",
    "node_modules/**/*",
    "!node_modules/.dev/**/*.map",
    "!**/node_modules/*/{CHANGELOG.md,README.md,README,readme.md,readme}",
    "!**/node_modules/*/{test,__tests__,tests,powered-test,example,examples}",
    "!**/node_modules/*.d.ts",
    "!**/node_modules/.bin",
    "!**/*.{iml,o,hprof,orig,pyc,pyo,rbc,swp,csproj,sln,xproj}",
    "!.editorconfig",
    "!**/._*",
    "!**/{.DS_Store,.git,.hg,.svn,CVS,RCS,SCCS,.gitignore,.gitattributes}",
    "!**/{__pycache__,thumbs.db,.flowconfig,.idea,.vs,.nyc_output}",
    "!**/{appveyor.yml,.travis.yml,circle.yml}",
    "!**/{npm-debug.log,yarn.lock,.yarn-integrity,.yarn-metadata.json}",
  ],
  mac: {
    icon: "src/resources/build/icons/icon.icns",
    category: "public.app-category.developer-tools",
    target: [
      {
        target: "dmg",
        arch: ["x64", "arm64"],
      },
    ],
  },
  win: {
    icon: "src/resources/build/icons/icon.ico",
    target: [
      {
        target: "nsis",
        arch: ["x64", "arm64"],
      },
    ],
  },
  linux: {
    icon: "src/resources/build/icons/",
    target: [
      {
        target: "AppImage",
        arch: ["x64", "arm64"],
      },
    ],
  },
  nsis: {
    oneClick: false,
    perMachine: false,
    allowToChangeInstallationDirectory: true,
    deleteAppDataOnUninstall: false,
  },
  dmg: {
    contents: [
      {
        x: 130,
        y: 220,
      },
      {
        x: 410,
        y: 220,
        type: "link",
        path: "/Applications",
      },
    ],
  },
});
