import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";

export function VersionEmpty() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Available Updates</CardTitle>
        <CardDescription>
          React Native versions available for upgrade
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No newer versions available. Your project is up to date!</p>
        </div>
      </CardContent>
    </Card>
  );
}
