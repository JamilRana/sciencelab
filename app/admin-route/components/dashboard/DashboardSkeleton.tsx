//app/admin-route/components/dashboard/DashboardSkeleton.tsx
export function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <header className="border-b p-4">
        <div className="h-6 w-48 bg-muted rounded" />
      </header>
      <main className="container mx-auto px-4 py-6 space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-muted rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-2 gap-6">
          <div className="h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
        <div className="h-80 bg-muted rounded-xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 h-64 bg-muted rounded-xl" />
          <div className="h-64 bg-muted rounded-xl" />
        </div>
      </main>
    </div>
  );
}