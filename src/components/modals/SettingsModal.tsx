import { useState } from 'react';

import { AppearanceTab, GameplayTab, SoundTab } from './settings/SettingsTabContent';
import { type SettingsTab, SettingsTabs } from './settings/SettingsTabs';
import { useSettingsModalLogic } from './useSettingsModalLogic';

import { BottomSheet } from '@/components/ui/BottomSheet';
import { Modal } from '@/components/ui/Modal';
import { RightSheet } from '@/components/ui/RightSheet';
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

  // Desktop: centered modal with left sidebar tabs
  if (layoutMode === 'desktop') {
    return (
      <Modal
        isOpen={isOpen}
        title="Settings"
        onClose={closeModal}
        className="modal-window fixed top-1/2 left-1/2 z-[101] flex h-[min(540px,85dvh)] w-[min(560px,92vw)] -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-2xl border border-[var(--color-border)] bg-[var(--color-surface)] shadow-[0_24px_64px_rgba(0,0,0,0.2)]"
      >
        <div className="-m-5 flex min-h-0 flex-1">
          <SettingsTabs orientation="vertical" activeTab={activeTab} onTabChange={setActiveTab} />
          <div className="flex-1 overflow-y-auto p-5">
            <TabContent activeTab={activeTab} />
          </div>
        </div>
      </Modal>
    );
  }

  // Mobile landscape: right-side sheet
  if (layoutMode === 'mobile-landscape') {
    return (
      <RightSheet isOpen={isOpen} title="Settings" onClose={closeModal}>
        <SettingsTabs orientation="horizontal" activeTab={activeTab} onTabChange={setActiveTab} />
        <StableHeight>
          <TabContent activeTab={activeTab} />
        </StableHeight>
      </RightSheet>
    );
  }

  // Mobile portrait: bottom sheet (default)
  return (
    <BottomSheet isOpen={isOpen} title="Settings" onClose={closeModal}>
      <SettingsTabs orientation="horizontal" activeTab={activeTab} onTabChange={setActiveTab} />
      <StableHeight>
        <TabContent activeTab={activeTab} />
      </StableHeight>
    </BottomSheet>
  );
};
