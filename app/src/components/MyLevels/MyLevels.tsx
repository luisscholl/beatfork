import React, { FC } from "react";
import LevelActions from "../LevelActions/LevelActions";
import LevelDifficulty from "../LevelDifficulty/LevelDifficulty";
import LevelDifficultyMeta from "../LevelDifficultyMeta/LevelDifficultyMeta";
import LevelList from "../LevelList/LevelList";
import LevelMeta from "../LevelMeta/LevelMeta";
import NavBar from "../NavBar/NavBar";
import Preview from "../Preview/Preview";
import SearchBar from "../SearchBar/SearchBar";
import SearchCriteria from "../SearchCriteria/SearchCriteria";
import "./MyLevels.scss";

interface MyLevelsProps {}

const MyLevels: FC<MyLevelsProps> = () => (
  <div className="MyLevels" data-testid="MyLevels">
    <div className="content">
      <SearchCriteria />
      <div>
        <SearchBar />
        <LevelList />
        <Preview />
      </div>
      <div>
        <LevelMeta />
        <LevelDifficulty />
        <LevelDifficultyMeta />
        <LevelActions />
      </div>
    </div>
  </div>
);

export default MyLevels;
