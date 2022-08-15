import React, { useEffect, useRef, useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { generateUUID } from 'three/src/math/MathUtils';
import { FixedSizeList as List } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import InfiniteLoader from 'react-window-infinite-loader';
import { useAuth } from 'react-oidc-context';
import { viewState } from '../../atoms/viewState';
import Level from '../../models/Level';
import './LevelList.scss';
import LevelListStories from './LevelList.stories';
import LevelPartial from '../../models/LevelPartial';
import { searchCriteriaState } from '../../atoms/searchCriteriaState';
import { LevelService } from '../../services/LevelService';

const LevelList = () => {
  const auth = useAuth();
  const [view, setView] = useRecoilState(viewState);
  const [levels, setLevels] = useState<LevelPartial[]>([]);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);
  const searchCriteria = useRecoilValue(searchCriteriaState);

  const lastPage = useRef<number>(0);
  const searchCriteriaChangedTimeout = useRef<number>(null);

  const scrollParentRef = useRef(null);
  const infiniteLoader = useRef();

  const loadNextPage = async () => {
    setIsNextPageLoading(true);
    lastPage.current += 1;
    const options = JSON.parse(JSON.stringify(searchCriteria));
    if (options.maxLength === 300) options.maxLength = Infinity;
    delete options.showPlaylists;
    LevelService.searchLevel(options, lastPage.current).then((results) => {
      setIsNextPageLoading(false);
      if (results.length > 0) {
        setLevels((old) => [...old, ...results]);
      } else {
        setHasNextPage(false);
      }
    });
  };

  // If there are more items to be loaded then add an extra row to hold a loading indicator.
  const rowCount = hasNextPage ? levels.length + 1 : levels.length;

  // Only load 1 page of items at a time.
  // Pass an empty callback to InfiniteLoader in case it asks us to load more than once.
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  const loadMoreRows = isNextPageLoading ? () => {} : loadNextPage;

  // Every row is loaded except for our loading indicator row.
  const isRowLoaded = ({ index }: { index: number }) => !hasNextPage || index < levels.length;

  // Render a list item or a loading indicator.
  const rowRenderer = ({ index, style }: { index: number; style: any }) => {
    let content;

    if (!isRowLoaded({ index })) {
      content = 'Loading...';
    } else {
      content = levels[index].title;
    }

    return (
      <button
        type="button"
        style={style}
        className={
          ((view as any).level && (view as any).level.id) === (levels[index] && levels[index].id)
            ? 'active'
            : 'inactive'
        }
        onClick={(event) => {
          setView((old) => ({
            ...old,
            level: levels[index]
          }));
        }}>
        <div>{content}</div>
      </button>
    );
  };

  useEffect(() => {
    if (typeof searchCriteriaChangedTimeout.current === 'number')
      clearTimeout(searchCriteriaChangedTimeout.current);
    searchCriteriaChangedTimeout.current = setTimeout(() => {
      lastPage.current = 0;
      setLevels([]);
      loadMoreRows();
    }, 200) as any as number;
  }, [searchCriteria]);

  return (
    <div
      className="LevelList"
      data-testid="LevelList"
      ref={(ref) => {
        scrollParentRef.current = ref;
      }}>
      <InfiniteLoader
        isItemLoaded={isRowLoaded as any}
        loadMoreItems={loadMoreRows as any}
        itemCount={rowCount}
        ref={infiniteLoader}>
        {({ onItemsRendered, ref }) => {
          return (
            <AutoSizer>
              {({ width, height }) => {
                return (
                  <List
                    ref={ref}
                    onItemsRendered={onItemsRendered}
                    width={width}
                    height={height}
                    itemCount={rowCount}
                    itemSize={50}>
                    {rowRenderer}
                  </List>
                );
              }}
            </AutoSizer>
          );
        }}
      </InfiniteLoader>
    </div>
  );
};

export default LevelList;
