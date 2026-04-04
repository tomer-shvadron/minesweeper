import { useState } from 'react';

import { AppearanceTab, GameplayTab, SoundTab } from './settings/SettingsTabContent';
import { type SettingsTab, SettingsTabs } from './settings/SettingsTabs';
import { useSettingsModalLogic } from './useSettingsModalLogic';

import { ResponsiveModal } from '@/components/ui/ResponsiveModal';
import { StableHeight } from '@/components/ui/StableHeight';
import { useUIStore } from '@/stores/ui.store';

const TabContent = ({ activeTab }: { activeTab: SettingsTab }) => {
  switch (activeTab) {
    case 'appearance':
      return <AppearanceTab />;
    case 'sound':
      return <SoundTab />;
    case 'gameplay':
      return <GameplayTab />;
  }
};

export const SettingsModal = () => {
  const isOpen = useUIStore((s) => s.activeModal === 'settings');
  const { layoutMode, closeModal } = useSettingsModalLogic();
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');

  const isDesktop = layoutMode === 'desktop';

  return (
    <ResponsiveModal
      isOpen={isOpen}
      title="Settings"
      onClose={closeModal}
      layoutMode={layoutMode}
      {...(isDesktop ? { modalClassName: 'w-[min(560px,92vw)]' } : {})}
      fullHeight
    >
      {isDesktop ? (
        <div className="-m-5 flex min-h-0 flex-1">
          <SettingsTabs orientation="vertical" activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-y-auto p-5">
            <TabContent activeTab={activeTab} />
          </div>
        </div>
      ) : (
        <>
          <SettingsTabs orientation="horizontal" activeTab={activeTab} onTabChange={setActiveTab} />
          <StableHeight clamp>
            <TabContent activeTab={activeTab} />
          </StableHeight>
        </>
      )}
    </ResponsiveModal>
  );
};
