import React from 'react';
import LevelActions from '../LevelActions/LevelActions';
import LevelDifficulty from '../LevelDifficulty/LevelDifficulty';
import LevelDifficultyMeta from '../LevelDifficultyMeta/LevelDifficultyMeta';
import LevelList from '../LevelList/LevelList';
import LevelMeta from '../LevelMeta/LevelMeta';
import NavBar from '../NavBar/NavBar';
import Preview from '../Preview/Preview';
import SearchBar from '../SearchBar/SearchBar';
import SearchCriteria from '../SearchCriteria/SearchCriteria';
import './Home.scss';

const Home = () => (
  <div className="Home" data-testid="Home">
    <SearchCriteria />
    <div>
      <SearchBar />
      <LevelList type="home" />
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

export default Home;
