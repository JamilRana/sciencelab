export function ResultsSkeleton() {
  return (
    <div className="min-h-screen bg-background animate-pulse">
      <header className="border-b p-4">
        <div className="h-6 w-32 bg-muted rounded" />
        <div className="h-4 w-48 bg-muted rounded mt-2" />
      </header>
      <main className="container mx-auto px-4 py-6">
        <div className="h-16 bg-muted rounded-xl mb-6" />
        <div className="grid grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 bg-muted rounded-xl border" />
          ))}
        </div>
      </main>
    </div>
  );
}