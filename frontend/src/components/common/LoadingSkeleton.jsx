const LoadingSkeleton = ({ className = '' }) => {
  return (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
  );
};

export const StatCardSkeleton = () => (
  <div className="card">
    <LoadingSkeleton className="w-10 h-10 mb-4" />
    <LoadingSkeleton className="w-20 h-8 mb-2" />
    <LoadingSkeleton className="w-32 h-4" />
  </div>
);

export const TableRowSkeleton = () => (
  <div className="flex items-center gap-4 p-4 border-b border-gray-200">
    <LoadingSkeleton className="w-8 h-8 rounded-full" />
    <LoadingSkeleton className="flex-1 h-6" />
    <LoadingSkeleton className="w-24 h-6" />
    <LoadingSkeleton className="w-20 h-6" />
    <LoadingSkeleton className="w-16 h-6" />
    <LoadingSkeleton className="w-20 h-6" />
    <LoadingSkeleton className="w-24 h-6" />
    <LoadingSkeleton className="w-8 h-8" />
  </div>
);

export default LoadingSkeleton;