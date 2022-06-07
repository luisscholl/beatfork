import React, { ChangeEvent, useCallback } from "react";
import "./SearchCriteria.scss";
import { useRecoilState } from "recoil";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheckSquare, faSquare } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "react-oidc-context";
import MultiRangeSlider from "../../vendor/components/MultiRangeSlider/MultiRangeSlider";
import { viewState } from "../../atoms/viewState";
import { searchCriteriaState } from "../../atoms/searchCriteriaState";

const SearchCriteria = () => {
  const [view, setView] = useRecoilState(viewState);
  const [searchCriteria, setSearchCritera] =
    useRecoilState(searchCriteriaState);
  const auth = useAuth();

  const wrapperFormatter = useCallback((val: number) => {
    return <div>{val}</div>;
  }, []);

  const secondsMinutesFormatter = useCallback((seconds: number) => {
    if (seconds === 5 * 60) return "5min+";
    return `${Math.floor(seconds / 60)}min`;
  }, []);

  const secondsMinutesAndSecondsFormatter = useCallback((seconds: number) => {
    if (seconds === 5 * 60) return <div>∞</div>;
    return (
      <div>{`${Math.floor(seconds / 60)}:${Math.round(seconds % 60)
        .toString()
        .padStart(2, "0")}`}</div>
    );
  }, []);

  const percentageFormatter = useCallback((percentage: number) => {
    return `${percentage}%`;
  }, []);

  const percentageWrapperFormatter = useCallback((percentage: number) => {
    return <div>{`${percentage}%`}</div>;
  }, []);

  return (
    <div className="SearchCriteria" data-testid="SearchCriteria">
      <div className="row">
        <label htmlFor="order-by">
          Order By
          <select name="Order By" id="oder-by">
            <option value="rating">Rating</option>
            <option value="difficulty">Difficulty</option>
            <option value="alphabetical">Alphabetical</option>
            <option value="length">Length</option>
            {auth.isAuthenticated && (
              <option value="personalBest">Personal Best</option>
            )}
          </select>
        </label>
        <label htmlFor="order-direction">
          <select name="order-direction">
            <option value="ascending">Ascending</option>
            <option value="descending">Descending</option>
          </select>
        </label>
      </div>
      <div className="row">
        Difficulty
        <MultiRangeSlider
          min={1}
          max={20}
          step={1}
          ruler={false}
          label
          minValue={searchCriteria.minDifficulty}
          maxValue={searchCriteria.maxDifficulty}
          minValueFormatter={wrapperFormatter}
          maxValueFormatter={wrapperFormatter}
          onChange={(e) =>
            setSearchCritera((old) => {
              return {
                ...old,
                minDifficulty: e.minValue,
                maxDifficulty: e.maxValue,
              };
            })
          }
        />
      </div>
      <div className="row">
        Length
        <MultiRangeSlider
          min={0}
          max={5 * 60}
          /* Note: Step does work like it would be intuitive. It seems like "step" is minimum distance between minValue and maxValue, for which I am using step here. */
          step={10}
          ruler={false}
          label
          minValue={searchCriteria.minLength}
          maxValue={searchCriteria.maxLength}
          minFormatter={secondsMinutesFormatter}
          maxFormatter={secondsMinutesFormatter}
          minValueFormatter={secondsMinutesAndSecondsFormatter}
          maxValueFormatter={secondsMinutesAndSecondsFormatter}
          onChange={(e) =>
            setSearchCritera((old) => {
              return {
                ...old,
                minLength: e.minValue,
                maxLength: e.maxValue,
              };
            })
          }
        />
      </div>
      {auth.isAuthenticated && (
        <div className="row">
          Personal Best
          <MultiRangeSlider
            min={0}
            max={100}
            /* Note: Step does work like it would be intuitive. It seems like "step" is minimum distance between minValue and maxValue, for which I am using step here. */
            step={5}
            ruler={false}
            label
            minValue={searchCriteria.minPersonalBest}
            maxValue={searchCriteria.maxPersonalBest}
            minFormatter={percentageFormatter}
            maxFormatter={percentageFormatter}
            minValueFormatter={percentageWrapperFormatter}
            maxValueFormatter={percentageWrapperFormatter}
            onChange={(e) =>
              setSearchCritera((old) => {
                return {
                  ...old,
                  minPersonalBest: e.minValue,
                  maxPersonalBest: e.maxValue,
                };
              })
            }
          />
        </div>
      )}
      <div className="row">
        <label
          htmlFor="show-playlists"
          className={searchCriteria.showPlaylists ? "checked" : ""}
        >
          <input
            type="checkbox"
            id="show-playlists"
            checked={searchCriteria.showPlaylists}
            onChange={(e: ChangeEvent<HTMLInputElement>) => {
              setSearchCritera((old) => {
                return { ...old, showPlaylists: e.target.checked };
              });
            }}
          />
          <FontAwesomeIcon icon={faSquare} />
          {searchCriteria.showPlaylists && (
            <span className="check">
              <FontAwesomeIcon icon={faCheckSquare} />
            </span>
          )}
          Show Playlists
        </label>
      </div>
    </div>
  );
};

export default SearchCriteria;
