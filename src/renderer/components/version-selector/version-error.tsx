import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "../ui/alert";

interface VersionErrorProps {
  error: string;
  onDismiss?: () => void;
}

export function VersionError({ error, onDismiss }: VersionErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertDescription>{error}</AlertDescription>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="ml-auto text-sm underline hover:no-underline"
        >
          Dismiss
        </button>
      )}
    </Alert>
  );
}
