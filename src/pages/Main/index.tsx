import { useState, useEffect } from 'react';
import { FormattedMessage } from 'react-intl';

import { MvpCard } from '@/components/MvpCard';
import { useMvpsContext } from '@/contexts/MvpsContext';
import { MvpsContainerFilter } from '@/components/MvpsContainerFilter';
import { MvpCardSkeleton } from '@/components/Skeletons/MvpCardSkeleton';
import { ModalEditMvp, ModalEditTime, ModalKillMvp } from '@/modals';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useKey } from '@/hooks';
import { useSettings } from '@/contexts/SettingsContext';

import { sortBy } from '@/utils/sort';
import { runBenchmark } from '@/utils/textMeasurement';

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

  const [searchQuery, setSearchQuery] = useState<string>(
    sessionStorage.getItem('search') || ''
  );
  const [currentSort, setCurrentSort] = useState<string>(
    sessionStorage.getItem('sort') || 'respawnTime'
  );
  const [reverseSort, setReverseSort] = useState<boolean>(
    sessionStorage.getItem('reverse') === 'true'
  );

  const activeSort = sortBy(currentSort);

  const filteredActive = activeMvps.filter((m) => m.deathTime);
  const filteredPinned = activeMvps.filter((m) => m.isPinned && !m.deathTime);

  const sortedActive = [...filteredActive].sort(activeSort);
  const sortedPinned = [...filteredPinned].sort(activeSort);

  const normalActiveMvps = reverseSort
    ? sortedActive.reverse()
    : sortedActive;

  const pinnedMvps = reverseSort
    ? sortedPinned.reverse()
    : sortedPinned;

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

  useEffect(() => {
    // Run the benchmark once we have any data
    const anyMvp = activeMvps[0] || nonActiveMvps[0];
    
    if (!isLoading && anyMvp) {
      // console.log('%c --- Performance Test Starting --- ', 'background: #222; color: #bada55');
      runBenchmark(anyMvp.name, 100);
    } else if (!isLoading && !anyMvp) {
      console.warn('Benchmark skipped: No MVPs found in data.');
    }
  }, [isLoading, activeMvps.length, nonActiveMvps.length]);

  return (
    <>
      {isLoading && <LoadingOverlay />}
      <Container>
        {normalActiveMvps.length > 0 && (
          <Section>
            <SectionTitle>
              <FormattedMessage id='active' />
            </SectionTitle>

            <MvpsContainer>
              {normalActiveMvps.map((mvp: IMvp) => (
                <MvpCard
                  key={`${mvp.id}-${mvp.deathMap}`}
                  mvp={mvp}
                  zone='active'
                />
              ))}
            </MvpsContainer>
          </Section>
        )}

        {pinnedMvps.length > 0 && (
          <Section>
            <SectionTitle>
              <FormattedMessage id='pinned' />
            </SectionTitle>

            <MvpsContainer>
              {pinnedMvps.map((mvp: IMvp) => (
                <MvpCard
                  key={`${mvp.id}-${mvp.deathMap}`}
                  mvp={mvp}
                  zone='wait'
                />
              ))}
            </MvpsContainer>
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
            <MvpsContainer>
              {nonActiveMvps.map((mvp: IMvp) => (
                <MvpCard
                  key={`${mvp.id}-${mvp.deathMap}`}
                  mvp={mvp}
                  zone='all'
                />
              ))}
            </MvpsContainer>
          )}
        </Section>
      </Container>

      {!!editingMvp && <ModalEditMvp />}
      {!!editingTimeMvp && <ModalEditTime />}
      {!!killingMvp && <ModalKillMvp />}
    </>
  );
}
