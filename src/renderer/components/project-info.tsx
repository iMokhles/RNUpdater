import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Badge } from "./ui/badge";
import { Package, Smartphone, Calendar, Folder } from "lucide-react";
import { useAppStore } from "../lib/stores/app-store";
import { formatDate } from "shared/utils";

export function ProjectInfo() {
  const { currentProject } = useAppStore();

  if (!currentProject) {
    return null;
  }

  const getPlatformBadge = (platform: string) => {
    switch (platform) {
      case "ios":
        return (
          <Badge variant="secondary" className="badge-ios">
            iOS
          </Badge>
        );
      case "android":
        return (
          <Badge variant="secondary" className="badge-android">
            Android
          </Badge>
        );
      case "both":
        return (
          <div className="flex gap-1">
            <Badge variant="secondary" className="badge-ios">
              iOS
            </Badge>
            <Badge variant="secondary" className="badge-android">
              Android
            </Badge>
          </div>
        );
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          Project Information
        </CardTitle>
        <CardDescription>
          Details about your React Native project
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Project Name
              </span>
            </div>
            <p className="code-block font-mono text-sm bg-muted p-2 rounded text-foreground">
              {currentProject.name}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Platform
              </span>
            </div>
            <div className="flex items-center gap-2">
              {getPlatformBadge(currentProject.platform)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                React Native
              </span>
            </div>
            <p className="code-block font-mono text-sm bg-muted p-2 rounded text-foreground">
              {currentProject.reactNativeVersion}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">React</span>
            </div>
            <p className="code-block font-mono text-sm bg-muted p-2 rounded text-foreground">
              {currentProject.reactVersion}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Last Modified
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              {formatDate(currentProject.lastModified)}
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">
                Project Path
              </span>
            </div>
            <p className="code-block font-mono text-xs bg-muted p-2 rounded break-all text-foreground">
              {currentProject.path}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
