import React, { useEffect, useRef, useState } from "react";
import { useRecoilState } from "recoil";
import { generateUUID } from "three/src/math/MathUtils";
import { AutoSizer, InfiniteLoader, List } from "react-virtualized";
import { useAuth } from "react-oidc-context";
import { viewState } from "../../atoms/viewState";
import Level from "../../models/Level";
import "./LevelList.scss";
import LevelListStories from "./LevelList.stories";
import LevelPartial from "../../models/LevelPartial";

const LevelList = () => {
  const auth = useAuth();
  const [view, setView] = useRecoilState(viewState);
  const [levels, setLevels] = useState<LevelPartial[]>([]);
  const [isNextPageLoading, setIsNextPageLoading] = useState(false);
  const [hasNextPage, setHasNextPage] = useState(true);

  const lastPage = useRef<number>(0);

  const scrollParentRef = useRef(null);

  const loadNextPage = async () => {
    setIsNextPageLoading(true);
    const token = auth.user?.id_token;
    console.log(token);
    console.log(auth);
    lastPage.current += 1;
    return fetch(
      `${process.env.REACT_APP_API_URL}/levels?currentPage=${lastPage.current}`,
      {
        headers: {
          ...(token ? { Authorization: `${token}` } : {}),
        },
      }
    )
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

  const test = () => {
    const token = auth.user?.id_token;
    return fetch(`${process.env.REACT_APP_API_URL}/levels`, {
      headers: {
        ...(token ? { Authorization: `${token}` } : {}),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: "One and Only",
        bpm: 111,
        length: 3,
        published: true,
        artistIds: ["A80F7A98-C02F-4A85-B13F-DCDF70035BDE"],
        versions: [
          {
            id: 1,
            difficulty: 1,
            objects: [
              {
                type: "Collectible",
                collectibleType: 1,
                position: {
                  x: 0.4041569099545159,
                  y: 0.26385379945425225,
                  z: 5.818181818181818,
                },
                measure: 0,
                beat: 0,
              },
            ],
          },
        ],
        audioLinks: ["string"],
      }),
      method: "POST",
    })
      .then((response) => response.json())
      .then((results) => {
        console.log(results);
      });
  };

  return (
    <div
      className="LevelList"
      data-testid="LevelList"
      ref={(ref) => {
        scrollParentRef.current = ref;
      }}
    >
      <button type="button" onClick={test} style={{ color: "white" }}>
        Test
      </button>
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
