import React, { useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { generateUUID } from "three/src/math/MathUtils";
import { AutoSizer, InfiniteLoader, List } from "react-virtualized";
import { viewState } from "../../atoms/viewState";
import Level from "../../models/Level";
import "./LevelList.scss";
import LevelListStories from "./LevelList.stories";
import LevelPartial from "../../models/LevelPartial";

const LevelList = () => {
  const [view, setView] = useRecoilState(viewState);
  const [levels, setLevels] = useState<LevelPartial[]>([]);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const scrollParentRef = useRef(null);

  const loadNextPage = async () => {
    if (isNextPageLoading) return;
    setIsNextPageLoading(true);
    setLevels((old) => [
      ...old,
      {
        self: "test",
        id: generateUUID(),
        title: `${view.view} ${Math.random()}`,
        published: true,
        rating: 0.7,
        bpm: 120,
        artists: [
          {
            self: "test",
            id: "test",
            name: "Dj Test",
            website: "www.test.de",
          },
        ],
        author: {
          self: "test",
          id: "test",
          username: "Max Mustermann",
        },
        versions: [
          {
            self: "test",
            id: 1,
            difficulty: 1,
          },
          {
            self: "test",
            id: 2,
            difficulty: 20,
          },
          {
            self: "test",
            id: 3,
            difficulty: 13,
          },
          {
            self: "test",
            id: 4,
            difficulty: 7,
          },
        ],
        audio: "test",
        length: 201,
      },
    ]);
    setIsNextPageLoading(false);
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
  const rowRenderer = ({
    index,
    key,
    style,
  }: {
    index: number;
    key: any;
    style: any;
  }) => {
    let content;

    if (!isRowLoaded({ index })) {
      content = "Loading...";
    } else {
      content = levels[index].title;
    }

    return (
      <button
        type="button"
        key={key}
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

  return (
    <div
      className="LevelList"
      data-testid="LevelList"
      ref={(ref) => {
        scrollParentRef.current = ref;
      }}
    >
      <InfiniteLoader
        isRowLoaded={isRowLoaded}
        loadMoreRows={loadMoreRows as any}
        rowCount={rowCount}
      >
        {({ onRowsRendered, registerChild }) => {
          return (
            <AutoSizer>
              {({ width, height }) => {
                return (
                  <List
                    ref={registerChild}
                    onRowsRendered={onRowsRendered}
                    rowRenderer={rowRenderer}
                    width={width}
                    height={height}
                    rowCount={rowCount}
                    rowHeight={50}
                  />
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
