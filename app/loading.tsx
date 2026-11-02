export default function LoadingPage() {
  return <div role="status" aria-label="Loading page" className="mx-auto min-h-screen max-w-7xl px-4 py-10 sm:px-6">
    <div aria-hidden="true" className="animate-pulse space-y-6">
      <div className="h-8 w-48 max-w-full bg-surface-alt" />
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        {[0, 1, 2].map(index => <div key={index} className="aspect-[2/3] bg-surface-alt" />)}
      </div>
    </div>
  </div>;
}
