import React, { useState, useEffect, useRef } from "react";
import { useRecoilState } from "recoil";
import Level from "../../models/Level";
import Gameplay from "../Gameplay/Gameplay";
import Editor from "../Editor/Editor";
import "./App.scss";
import { viewState } from "../../atoms/viewState";
import Credits from "../Credits/Credits";
import About from "../About/About";
import MyLevels from "../MyLevels/MyLevels";
import Browse from "../Browse/Browse";
import Home from "../Home/Home";
import Profile from "../Profile/Profile";
import NavBar from "../NavBar/NavBar";

const App = () => {
  const [view, setView] = useRecoilState(viewState);
  const [levels, setLevels] = useState<Array<Level>>([]);
  const [gameRunning, setGameRunning] = useState(true);

  const appWrapper = useRef<HTMLDivElement>();

  useEffect(() => {
    const levelPaths = [
      "/levels/Rolemusic - La la triororiro/La La Triororiro.json",
      "/levels/Ryan Andersen - One and Only/One and Only.json",
      "/levels/Andy G. Cohen - Sprocket/Sprocket.json",
    ];
    const levelsData = levelPaths.map((path) =>
      fetch(path).then((response) => response.json())
    );
    Promise.allSettled(levelsData).then((values) => {
      setLevels(values.map((e) => (e as any).value) as any);
    });
  }, []);

  return (
    <div className="App" data-testid="App">
      <NavBar />
      {/* view.view === "main-menu" && (
        // Note: We need the user to interact before with the page, because autoplay is disabled otherwise
        <div className="centered">
          <div className="title">BeatFork</div>
          <button
            type="button"
            className="start-button"
            onClick={() => {
              setView({ view: "level-select" });
            }}
          >
            Start Game
          </button>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView({ view: "level-editor" });
            }}
          >
            Level Editor
          </button>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView({ view: "options" });
            }}
          >
            Options
          </button>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView({ view: "credits" });
            }}
          >
            Credits
          </button>
        </div>
          ) */}
      {view.view === "about" && <About />}
      {view.view === "home" && <Browse />}
      {view.view === "browse" && <Browse />}
      {view.view === "my-levels" && <Browse />}
      {view.view === "profile" && <Profile />}
      {view.view === "gameplay" && (
        <Gameplay level={view.level} debug={!!process.env.REACT_APP_DEBUG} />
      )}
      {/* view.view === "level-select" && (
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setView({ view: "main-menu" });
            }}
          >
            BACK
          </button>
          <div className="level-container">
            {levels.map((level) => {
              return (
                <button
                  type="button"
                  className="square"
                  key={level.id}
                  onClick={() => {
                    setView({ view: "gameplay", level });
                  }}
                >
                  <div className="square-content">{level.title}</div>
                </button>
              );
            })}
            <button
              type="button"
              className="add-level"
              onClick={() => {
                setView({ view: "level-editor" });
              }}
            >
              <div className="add-level-content">+</div>
            </button>
          </div>
        </div>
            ) */}
      {view.view === "level-editor" && <Editor />}
      {view.view === "options" && (
        <div>
          <button
            type="button"
            className="back-button"
            onClick={() => {
              setView({
                view: "browse" /* todo: Return to where they were before going to options */,
              });
            }}
          >
            BACK
          </button>
        </div>
      )}
      {view.view === "credits" && <Credits />}
      {view.view === "game-over" && (
        <div className="centered">
          <div className="game-over">GAME OVER</div>
          <button
            type="button"
            className="menu-button"
            onClick={() =>
              setView((old) => {
                return { view: "gameplay", level: (old as any).level };
              })
            }
          >
            Try Again!
          </button>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView({
                view: "browse" /* todo: return user to where they were before gameplay */,
              });
            }}
          >
            Menu
          </button>
        </div>
      )}
      {view.view === "level-completed" && (
        <div className="centered">
          <div className="level-completed">LEVEL COMPLETED!</div>
          <br />
          <div className="end-score">{view.score} Points</div>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView((old) => {
                return { view: "gameplay", level: (old as any).level };
              });
            }}
          >
            Play Again!
          </button>
          <br />
          <button
            type="button"
            className="menu-button"
            onClick={() => {
              setView({
                view: "browse" /* todo: return user to were they were before gameplay */,
              });
            }}
          >
            Menu
          </button>
        </div>
      )}
    </div>
  );
};

export default App;
