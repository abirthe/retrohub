import { useNavigate } from 'react-router-dom';
import { Search, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { CATEGORIES, SORT_OPTIONS, type SortValue } from '@/lib/constants';

interface CategoryFilterProps {
  search: string;
  setSearch: (val: string) => void;
  animatedPlaceholder: string;
  sort: SortValue;
  setSort: (val: SortValue) => void;
  sortOpen: boolean;
  setSortOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeCategory: string;
  setActiveCategory: (val: string) => void;
  activeSubcategory: string;
  setActiveSubcategory: (val: string) => void;
}

export function CategoryFilter({
  search, setSearch, animatedPlaceholder,
  sort, setSort, sortOpen, setSortOpen,
  activeCategory, setActiveCategory,
  activeSubcategory, setActiveSubcategory
}: CategoryFilterProps) {
  const navigate = useNavigate();
  const activeSort = SORT_OPTIONS.find(s => s.value === sort) ?? SORT_OPTIONS[0];

  return (
    <div className="relative z-50 bg-card/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3.5 sm:p-5 shadow-2xl shadow-black/50">
      <div className="flex flex-col gap-3 sm:gap-4">

        {/* Top row: search + sort (responsive side-by-side on all screens) */}
        <div className="flex flex-row gap-2 sm:gap-3 items-center justify-between">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            <Input
              id="product-search"
              placeholder={animatedPlaceholder}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 sm:pl-10 h-10 sm:h-11 bg-background/50 border-primary/20 focus:border-primary/50 focus:ring-primary/20 transition-all font-display tracking-wide text-xs sm:text-sm rounded-xl"
            />
          </div>

          {/* Sort dropdown */}
          <div className="relative shrink-0">
            <Button
              id="sort-button"
              variant="ghost"
              onClick={() => setSortOpen(o => !o)}
              className="h-10 sm:h-11 px-2.5 sm:px-4 bg-background/40 border border-white/10 rounded-xl text-xs sm:text-sm text-muted-foreground hover:border-primary/30 hover:text-white flex items-center gap-1 sm:gap-2 shadow-sm"
            >
              <span className="truncate max-w-[70px] xs:max-w-[90px] sm:max-w-none">{activeSort.label}</span>
              <ChevronDown className={cn('w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 transition-transform duration-200', sortOpen && 'rotate-180')} />
            </Button>
            {sortOpen && (
              <div className="absolute right-0 mt-1.5 w-44 sm:w-48 bg-card border border-white/10 rounded-xl shadow-2xl z-50 py-1 backdrop-blur-xl">
                {SORT_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => { setSort(opt.value as SortValue); setSortOpen(false); }}
                    className={cn(
                      'w-full text-left px-3.5 sm:px-4 py-2 sm:py-2.5 text-xs sm:text-sm transition-colors hover:bg-white/5',
                      sort === opt.value ? 'text-primary font-semibold' : 'text-muted-foreground'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category pills */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isActive = activeCategory === cat.value;
            return (
              <Button
                key={cat.value}
                id={`cat-${cat.value}`}
                variant="ghost"
                onClick={() => {
                  if (cat.value === 'custom_orders') {
                    navigate('/custom-order');
                    return;
                  }
                  setActiveCategory(cat.value);
                  if (cat.subcategories && cat.subcategories.length > 0) {
                    setActiveSubcategory(cat.subcategories[0].value);
                  } else {
                    setActiveSubcategory('');
                  }
                }}
                className={cn(
                  "rounded-xl gap-1.5 sm:gap-2 font-display text-xs sm:text-sm tracking-wide whitespace-nowrap px-3 sm:px-4 py-3.5 sm:py-5 transition-all duration-300",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25" 
                    : "bg-white/5 text-muted-foreground border border-white/10 hover:border-primary/50 hover:bg-primary/10 hover:text-white"
                )}
              >
                <Icon className={cn("h-3.5 w-3.5 sm:h-4 sm:w-4", isActive ? "text-primary-foreground" : cat.color)} />
                {cat.label}
              </Button>
            );
          })}
        </div>

        {/* Subcategories (only shows if active category has subcategories) */}
        {CATEGORIES.find(c => c.value === activeCategory)?.subcategories && (
          <div className="flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 pt-0.5 scrollbar-hide -mx-1 px-1">
            {CATEGORIES.find(c => c.value === activeCategory)?.subcategories?.map(sub => {
              const isSubActive = activeSubcategory === sub.value;
              return (
                <button
                  key={sub.value}
                  onClick={() => setActiveSubcategory(sub.value)}
                  className={cn(
                    "px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                    isSubActive 
                      ? "bg-primary/20 text-primary border border-primary/30" 
                      : "bg-white/5 text-muted-foreground border border-white/10 hover:border-primary/30 hover:text-white"
                  )}
                >
                  {sub.label}
                </button>
              );
            })}
          </div>
        )}

      </div>
    </div>
  );
}
