import { Gamepad2, Palette, Volume2 } from 'lucide-react';

export type SettingsTab = 'appearance' | 'sound' | 'gameplay';

interface SettingsTabsProps {
  orientation: 'horizontal' | 'vertical';
  activeTab: SettingsTab;
  onTabChange: (tab: SettingsTab) => void;
}

const TABS: { key: SettingsTab; label: string; Icon: typeof Palette }[] = [
  { key: 'appearance', label: 'Appearance', Icon: Palette },
  { key: 'sound', label: 'Sound', Icon: Volume2 },
  { key: 'gameplay', label: 'Gameplay', Icon: Gamepad2 },
];

export const SettingsTabs = ({ orientation, activeTab, onTabChange }: SettingsTabsProps) => {
  const isVertical = orientation === 'vertical';

  return (
    <div
      className={
        isVertical
          ? 'flex min-w-[130px] flex-col gap-1 border-r border-[var(--color-border)] py-3 pr-1 pl-2'
          : 'sticky top-0 z-10 flex gap-1 border-b border-[var(--color-border)] bg-[var(--color-surface)] pb-2'
      }
      role="tablist"
      aria-label="Settings sections"
    >
      {TABS.map(({ key, label, Icon }) => {
        const isActive = activeTab === key;
        return (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabChange(key)}
            className={`flex cursor-pointer items-center gap-2 border-none transition-colors duration-100 outline-none focus-visible:outline-2 focus-visible:outline-[var(--color-accent)] ${
              isVertical
                ? `rounded-lg px-3 py-2.5 text-sm ${
                    isActive
                      ? 'bg-[var(--color-accent)] font-semibold text-white'
                      : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2,var(--color-surface))] hover:text-[var(--color-text)]'
                  }`
                : `rounded-lg px-3 py-1.5 text-xs font-medium ${
                    isActive
                      ? 'bg-[var(--color-accent)] text-white'
                      : 'bg-transparent text-[var(--color-text-muted)] hover:bg-[var(--color-surface-2,var(--color-surface))] hover:text-[var(--color-text)]'
                  }`
            }`}
          >
            <Icon size={isVertical ? 16 : 14} strokeWidth={1.75} />
            <span>{label}</span>
          </button>
        );
      })}
    </div>
  );
};
