import React, { FC } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { NavLink } from "react-router-dom";
import LevelActions from "../LevelActions/LevelActions";
import LevelDifficulty from "../LevelDifficulty/LevelDifficulty";
import LevelDifficultyMeta from "../LevelDifficultyMeta/LevelDifficultyMeta";
import LevelList from "../LevelList/LevelList";
import LevelMeta from "../LevelMeta/LevelMeta";
import Preview from "../Preview/Preview";
import SearchBar from "../SearchBar/SearchBar";
import SearchCriteria from "../SearchCriteria/SearchCriteria";
import "./Browse.scss";

interface BrowseProps {}

const Browse: FC<BrowseProps> = () => (
  <div className="Browse" data-testid="Browse">
    <SearchCriteria />
    <div>
      <NavLink to="/editor" className="to-editor">
        <FontAwesomeIcon icon={faPlus} />
        New Level
      </NavLink>
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
);

export default Browse;
