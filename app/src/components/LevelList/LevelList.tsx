import React, { useEffect, useRef, useState } from "react";
import { useRecoilState, useRecoilValue } from "recoil";
import { generateUUID } from "three/src/math/MathUtils";
import { FixedSizeList as List } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import InfiniteLoader from "react-window-infinite-loader";
import { useAuth } from "react-oidc-context";
import { viewState } from "../../atoms/viewState";
import Level from "../../models/Level";
import "./LevelList.scss";
import LevelListStories from "./LevelList.stories";
import LevelPartial from "../../models/LevelPartial";
import { searchCriteriaState } from "../../atoms/searchCriteriaState";

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
    const token = auth.user?.id_token;
    lastPage.current += 1;
    let url = `${process.env.REACT_APP_API_URL}/levels?currentPage=${lastPage.current}`;
    for (const [key, value] of Object.entries(searchCriteria)) {
      if (key === "showPlaylists") continue;
      if (
        ["minPersonalBest", "maxPersonalBest"].includes(key) &&
        !auth.isAuthenticated
      )
        continue;
      if (["title", "author", "artist"].includes(key) && !value) continue;
      url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
    }
    return fetch(url, {
      headers: {
        ...(token ? { Authorization: `${token}` } : {}),
      },
    })
      .then((response) => response.json())
      .then((results) => {
        setLevels((old) => [...old, ...results.levels]);
        setIsNextPageLoading(false);
        if (results.statistics.currentPage === results.statistics.totalPages) {
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
  const isRowLoaded = ({ index }: { index: number }) =>
    !hasNextPage || index < levels.length;

  // Render a list item or a loading indicator.
  const rowRenderer = ({ index, style }: { index: number; style: any }) => {
    let content;

    if (!isRowLoaded({ index })) {
      content = "Loading...";
    } else {
      content = levels[index].title;
    }

    return (
      <button
        type="button"
        style={style}
        className={
          ((view as any).level && (view as any).level.id) ===
          (levels[index] && levels[index].id)
            ? "active"
            : "inactive"
        }
        onClick={(event) => {
          setView((old) => ({
            view: view.view as "home" | "browse" | "my-levels",
            level: levels[index],
          }));
        }}
      >
        <div>{content}</div>
      </button>
    );
  };

  useEffect(() => {
    if (typeof searchCriteriaChangedTimeout.current === "number")
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
      }}
    >
      <InfiniteLoader
        isItemLoaded={isRowLoaded as any}
        loadMoreItems={loadMoreRows as any}
        itemCount={rowCount}
        ref={infiniteLoader}
      >
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
                    itemSize={50}
                  >
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
