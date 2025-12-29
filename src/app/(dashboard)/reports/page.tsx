export default function ReportsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-theme(height.header))]">
      <div className="w-full max-w-chat px-md">
        <div className="flex flex-col items-center justify-center py-2xl text-center">
          <h1 className="text-h1 text-primary mb-md">Reports</h1>
          <p className="text-body text-muted-foreground max-w-md">
            Generate and view financial reports including cash flow analysis,
            profit margins, and trend forecasts.
          </p>
        </div>

        <div className="mt-xl">
          <div className="flex items-center justify-center p-lg bg-surface border border-dashed border-border rounded-lg">
            <span className="text-body-sm text-muted-foreground">
              Report generation coming soon
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
