import { Button } from "@/components/ui/button";

export type OrderFilterTab = "all" | "unpaid" | "fulfilled" | "active";

interface OrderFilterTabsProps {
  filterTab: OrderFilterTab;
  onSelectTab: (tab: OrderFilterTab) => void;
  totalCount: number;
  unpaidCount: number;
  inProgressCount: number;
  fulfilledCount: number;
}

export function OrderFilterTabs({
  filterTab,
  onSelectTab,
  totalCount,
  unpaidCount,
  inProgressCount,
  fulfilledCount,
}: OrderFilterTabsProps) {
  return (
    <div className="flex items-center justify-between border-b border-white/5 pb-2 overflow-x-auto">
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={filterTab === "all" ? "default" : "ghost"}
          onClick={() => onSelectTab("all")}
          className={
            filterTab === "all"
              ? "gradient-primary text-xs"
              : "text-xs text-muted-foreground hover:text-white"
          }
        >
          All ({totalCount})
        </Button>
        {unpaidCount > 0 && (
          <Button
            size="sm"
            variant={filterTab === "unpaid" ? "default" : "ghost"}
            onClick={() => onSelectTab("unpaid")}
            className={
              filterTab === "unpaid"
                ? "bg-amber-500 hover:bg-amber-600 text-black font-semibold text-xs"
                : "text-xs text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
            }
          >
            Awaiting Payment ({unpaidCount})
          </Button>
        )}
        <Button
          size="sm"
          variant={filterTab === "active" ? "default" : "ghost"}
          onClick={() => onSelectTab("active")}
          className={
            filterTab === "active"
              ? "gradient-primary text-xs"
              : "text-xs text-muted-foreground hover:text-white"
          }
        >
          In Progress ({inProgressCount})
        </Button>
        <Button
          size="sm"
          variant={filterTab === "fulfilled" ? "default" : "ghost"}
          onClick={() => onSelectTab("fulfilled")}
          className={
            filterTab === "fulfilled"
              ? "gradient-primary text-xs"
              : "text-xs text-muted-foreground hover:text-white"
          }
        >
          Delivered ({fulfilledCount})
        </Button>
      </div>
    </div>
  );
}

export default OrderFilterTabs;
