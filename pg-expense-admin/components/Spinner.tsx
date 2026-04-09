export function Spinner({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center py-16 ${className}`}>
      <div className="w-8 h-8 border-3 border-primary-200 border-t-primary-700 rounded-full animate-spin" />
    </div>
  );
}
