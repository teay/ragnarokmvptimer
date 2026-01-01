import React from 'react';
import { useMvpsContext } from './contexts/MvpsContext';
import MvpCardText from './components/MvpCardText/MvpCardText'; // Import the new component
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

const AppTextOnly: React.FC = () => {
  const { activeMvps, allMvps, isLoading } = useMvpsContext();

  if (isLoading) {
    return (
      <div>
        <h1>Loading MVP Data...</h1>
      </div>
    );
  }

  const activeMvpIds = new Set(activeMvps.map((mvp) => mvp.id));
  const otherMvps = allMvps.filter((mvp) => !activeMvpIds.has(mvp.id));

  // Combine active and other MVPs, active first
  const mvpsToDisplay = [...activeMvps, ...otherMvps];

  const NUM_COLUMNS = 4;
  const NUM_ROWS = 10;
  const TOTAL_CELLS = NUM_COLUMNS * NUM_ROWS;

  // Prepare cells for the grid
  const cells = mvpsToDisplay.slice(0, TOTAL_CELLS).map((mvp, index) => {
    const isActive = activeMvpIds.has(mvp.id);
    return (
      <MvpCardText
        key={`${mvp.id}-${mvp.deathMap || (mvp.spawn.length > 0 ? mvp.spawn[0].mapname : 'N/A')}-${index}`}
        mvp={mvp}
        isActive={isActive}
      />
    );
  });

  // Fill remaining cells if less than TOTAL_CELLS
  while (cells.length < TOTAL_CELLS) {
    cells.push(
      <div key={`empty-${cells.length}`} className="mvp-card-text empty-card"></div>
    );
  }

  // Arrange cells into rows and columns (no longer needed for grid CSS)
  // The grid will be handled by CSS directly on the container

  return (
    <div className="app-text-only-container">
      <h1>MVP Timer (Text Mode UI)</h1>
      <div className="mvp-grid">
        {cells.map((cellContent, index) => (
          <React.Fragment key={index}>
            {cellContent}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default AppTextOnly;