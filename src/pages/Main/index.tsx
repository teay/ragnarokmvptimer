import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { MvpTable } from '@/components/MvpTable';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { MvpsContainerFilter } from '@/components/MvpsContainerFilter';
import { MvpCardSkeleton } from '@/components/Skeletons/MvpCardSkeleton';
import { ModalEditMvp, ModalEditTime, ModalKillMvp } from '@/modals';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';

import { sortBy } from '@/utils/sort';

import { Container, Section, SectionTitle, MvpsContainer } from './styles';

export function Main() {
  const {
    activeMvps,
    allMvps,
    editingMvp,
    editingTimeMvp,
    killingMvp,
    isLoading,
  } = useMvpsContext();

  const normalActiveMvps = activeMvps.filter((m) => m.deathTime);
  const pinnedMvps = activeMvps.filter((m) => m.isPinned && !m.deathTime);
  const [searchQuery, setSearchQuery] = useState<string>(
    sessionStorage.getItem('search') || ''
  );
  const [currentSort, setCurrentSort] = useState<string>(
    sessionStorage.getItem('sort') || 'id'
  );
  const [reverseSort, setReverseSort] = useState<boolean>(
    sessionStorage.getItem('reverse') === 'true'
  );

  const allMvpsFilteredAndSorted = (
    searchQuery
      ? allMvps.filter((i) =>
          `${i.id}-${i.name}`
            .toLocaleLowerCase()
            .includes(searchQuery.toLocaleLowerCase())
        )
      : allMvps
  ).sort(sortBy(currentSort));

  const displayAllMvps = reverseSort
    ? allMvpsFilteredAndSorted.reverse()
    : allMvpsFilteredAndSorted;

  const nonActiveMvps = displayAllMvps;

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <Container>
        {normalActiveMvps.length > 0 && (
          <Section>
            <SectionTitle>
              <FormattedMessage id='active' />
            </SectionTitle>

            {normalActiveMvps.length > 0 && (
              <MvpTable mvps={normalActiveMvps} zone='active' />
            )}
          </Section>
        )}

        {pinnedMvps.length > 0 && (
          <Section>
            <SectionTitle>
              <FormattedMessage id='pinned' />
            </SectionTitle>

            {pinnedMvps.length > 0 && (
              <MvpTable mvps={pinnedMvps} zone='wait' />
            )}
          </Section>
        )}

        <Section>
          <SectionTitle>
            <FormattedMessage id='all' />
          </SectionTitle>

          <MvpsContainerFilter
            searchQuery={searchQuery}
            onChangeQuery={setSearchQuery}
            currentSort={currentSort}
            onSelectSort={setCurrentSort}
            isReverse={reverseSort}
            onReverse={() => setReverseSort((s) => !s)}
          />

          {isLoading && (
            <MvpsContainer>
              {[...Array(64)].map((_, index) => (
                <MvpCardSkeleton key={`skeleton-${index}`} />
              ))}
            </MvpsContainer>
          )}

          {nonActiveMvps.length > 0 && (
            <MvpTable mvps={nonActiveMvps} zone='all' />
          )}
        </Section>
      </Container>

      {!!editingMvp && <ModalEditMvp />}
      {!!editingTimeMvp && <ModalEditTime />}
      {!!killingMvp && <ModalKillMvp />}
    </>
  );
}
