import React, { useState, useEffect, useRef } from 'react';
import { useRecoilState } from 'recoil';
import { Outlet } from 'react-router-dom';
import Level from '../../models/Level';
import Gameplay from '../Gameplay/Gameplay/Gameplay';
import Editor from '../Editor/Editor/Editor';
import './App.scss';
import { viewState } from '../../atoms/viewState';
import Credits from '../Others/Credits/Credits';
import About from '../Others/About/About';
import MyLevels from '../LevelDiscovery/MyLevels/MyLevels';
import Browse from '../LevelDiscovery/Browse/Browse';
import Home from '../LevelDiscovery/Home/Home';
import Profile from '../Others/Profile/Profile';
import NavBar from '../Others/NavBar/NavBar';
import CompatibilityNotice from '../Others/CompatibilityNotice/CompatibilityNotice';

const App = () => {
  const [view, setView] = useRecoilState(viewState);
  const [levels, setLevels] = useState<Array<Level>>([]);
  const [gameRunning, setGameRunning] = useState(true);

  const appWrapper = useRef<HTMLDivElement>();
  //
  //  useEffect(() => {
  //    const levelPaths = [
  //      "/levels/Rolemusic - La la triororiro/La La Triororiro.json",
  //      "/levels/Ryan Andersen - One and Only/One and Only.json",
  //      "/levels/Andy G. Cohen - Sprocket/Sprocket.json",
  //    ];
  //    const levelsData = levelPaths.map((path) =>
  //      fetch(path).then((response) => response.json())
  //    );
  //    Promise.allSettled(levelsData).then((values) => {
  //      setLevels(values.map((e) => (e as any).value) as any);
  //    });
  //  }, []);

  return (
    <div className="App" data-testid="App">
      <CompatibilityNotice />
      <NavBar />
      <Outlet />
    </div>
  );
};

export default App;
