import React from "react";
import "./SearchCriteria.scss";
import MultiRangeSlider from "multi-range-slider-react";
import { useRecoilState } from "recoil";
import { viewState } from "../../atoms/viewState";

const SearchCriteria = () => {
  // todo: Extract search criteria state to own atom?
  const [view, setView] = useRecoilState(viewState);
  console.log(view);

  return (
    <div className="SearchCriteria" data-testid="SearchCriteria">
      <div className="row">
        <input type="checkbox" /> Playlists
      </div>
      <div className="row">
        Difficulty
        <MultiRangeSlider
          minValue={0}
          maxValue={0}
          onChange={(e) =>
            setView((old) => {
              return {
                ...old,
                searchCriteria: {
                  minDifficulty: e.minValue,
                  maxDifficulty: e.maxValue,
                },
              } as any;
            })
          }
        />
      </div>
      <div className="row">
        Length
        <MultiRangeSlider
          minValue={0}
          maxValue={0}
          onChange={(e) =>
            setView((old) => {
              return {
                ...old,
                searchCriteria: {
                  minLength: e.minValue,
                  maxLength: e.maxValue,
                },
              } as any;
            })
          }
        />
      </div>
    </div>
  );
};

export default SearchCriteria;
