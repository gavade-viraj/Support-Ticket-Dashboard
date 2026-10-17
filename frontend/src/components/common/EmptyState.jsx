import { Plus, FilterX } from 'lucide-react';
import Button from './Button';

const EmptyState = ({
  icon: Icon,
  title,
  description,
  actionText,
  onAction,
  showClearFilters = false,
  onClearFilters,
}) => {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-500 shadow-sm">
        {Icon ? <Icon className="h-8 w-8" /> : <Plus className="h-8 w-8" />}
      </div>

      <h3 className="mb-2 text-xl font-semibold text-slate-900">{title}</h3>
      <p className="mb-6 max-w-md text-sm leading-6 text-slate-600">{description}</p>

      <div className="flex flex-col items-center gap-3 sm:flex-row">
        {actionText && onAction && <Button onClick={onAction}>{actionText}</Button>}

        {showClearFilters && onClearFilters && (
          <Button variant="ghost" onClick={onClearFilters} className="text-slate-600 hover:bg-slate-100">
            <FilterX className="mr-2 h-4 w-4" />
            Clear Filters
          </Button>
        )}
      </div>
    </div>
  );
};

export default EmptyState;