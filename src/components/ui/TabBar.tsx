interface TabBarProps<T extends string> {
  tabs: readonly T[];
  selectedTab: T;
  onTabChange: (tab: T) => void;
  tabLabel: (tab: T) => string;
  ariaLabel?: string;
}

/**
 * Underline-style tab bar used by modals with multiple difficulty/section tabs.
 * Renders nothing when there is only one tab (single-view modals).
 */
export const TabBar = <T extends string>({
  tabs,
  selectedTab,
  onTabChange,
  tabLabel,
  ariaLabel = 'Tabs',
}: TabBarProps<T>) => {
  if (tabs.length <= 1) {
    return null;
  }

  return (
    <div
      className="flex border-b border-[var(--color-border)]"
      role="tablist"
      aria-label={ariaLabel}
    >
      {tabs.map((key) => (
        <button
          key={key}
          type="button"
          role="tab"
          aria-selected={selectedTab === key}
          className={`flex-1 cursor-pointer border-none bg-transparent px-2 py-2 text-xs font-medium transition-colors duration-100 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
            selectedTab === key
              ? 'font-semibold text-[var(--color-text)]'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text)]'
          }`}
          style={
            selectedTab === key
              ? { boxShadow: 'inset 0 -2px 0 var(--color-accent)', marginBottom: '-1px' }
              : { marginBottom: '-1px' }
          }
          onClick={() => onTabChange(key)}
        >
          {tabLabel(key)}
        </button>
      ))}
    </div>
  );
};
