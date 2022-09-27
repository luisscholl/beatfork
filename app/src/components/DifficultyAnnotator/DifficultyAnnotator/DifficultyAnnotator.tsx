import { PerspectiveCamera } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import React, { useMemo, useEffect, useRef, useState, useCallback, FormEvent } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCogs,
  faStop,
  faFolderOpen,
  faAngry,
  faSave,
  faPlay,
  faPause,
  faTrash,
  faCaretUp,
  faCaretDown,
  faCoffee,
  faTable,
  faBorderAll,
  faMagnet,
  faCopy,
  faToggleOn,
  faToggleOff,
  faThLarge,
  faTimes,
  faHome,
  faRunning,
  faMinus,
  faPlus,
  faCaretLeft,
  faCaretRight
} from '@fortawesome/free-solid-svg-icons';
import FileSaver from 'file-saver';
import * as hash from 'object-hash';
import * as THREE from 'three';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DoubleSide, Mesh, Raycaster, Vector2 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils';
import {
  // eslint-disable-next-line camelcase
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
  useRecoilValue,
  useSetRecoilState
} from 'recoil';
import { Howl } from 'howler';
import Collectible, { CollectibleType } from '../../../models/Collectible';
import './DifficultyAnnotator.scss';
import Vector3D from '../../../models/Vector3D';
import Ground from '../../Others/Ground/Ground';
import Obstacle from '../../../models/Obstacle';
import { settingsState } from '../../../atoms/settingsState';
import DifficultyAnnotatorCollectibles, {
  DifficultyAnnotatorCollectiblesRefAttributes
} from '../DifficultyAnnotatorCollectibles/DifficultyAnnotatorCollectibles';
import DifficultyAnnotatorObstacles, {
  DifficultyAnnotatorObstaclesRefAttributes
} from '../DifficultyAnnotatorObstacles/DifficultyAnnotatorObstacles';
import SettingsRow from '../../Editor/SettingsRow/SettingsRow';
import { LevelService } from '../../../services/LevelService';
import Artist from '../../../models/Artist';
import User from '../../../models/User';
import { viewState } from '../../../atoms/viewState';
import Level from '../../../models/Level';

const chunkSize = 8;

const Editor = () => {
  const navigate = useNavigate();
  const setView = useSetRecoilState(viewState);
  const { levelId, versionId } = useParams();
  const lastLevelIdAndVersionId = useRef<string>('null');

  const settings = useRecoilValue(settingsState);
  const RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const tSince0 = useRef<number>(0);
  const [activeChunk, setActiveChunk] = useState<number>(0);
  const [id, setId] = useState<string>(generateUUID());
  const [title, setTitle] = useState<string>('My Level');
  const [bpm, setBpm] = useState<number>(120);
  const [difficulty, setDifficulty] = useState<number>(1);
  const audio = useRef<Howl>(null);
  const [audioPath, setAudioPath] = useState<string>('/levels/Für Elise/silence.mp3');
  // Holds indexes of selected collectibles and obstacles
  const selectedCollectibles = useRef<number[]>([]);
  const selectedObstacles = useRef<number[]>([]);
  const selected = {
    collectibles: selectedCollectibles,
    obstacles: selectedObstacles
  };
  const level = useRef<Level>(null);
  const [chunkDifficulties, setChunkDifficulties] = useState<number[]>([]);
  const [overallDifficulty, setOverallDifficulty] = useState<number>(1);
  const [acceptedDisclaimer, setAcceptedDisclaimer] = useState<boolean>(false);

  const collectibles = useRef<DifficultyAnnotatorCollectiblesRefAttributes>(null);
  const collectiblesCb = useCallback((node) => {
    if (node) {
      collectibles.current = node;
      loadLevel();
    }
  }, []);
  const obstacles = useRef<DifficultyAnnotatorObstaclesRefAttributes>(null);
  const obstaclesCb = useCallback((node) => {
    if (node) {
      obstacles.current = node;
      loadLevel();
    }
  }, []);
  const levelObjectRefs = {
    collectibles,
    obstacles
  };
  const sideBarRef = useRef<HTMLDivElement>(null);
  const ground = useRef<{ animate: (t: number) => void }>(null);

  // Using just useRef would result in ground.current being undefined on the first frame.
  // Note that we don't need to useCallback for the other things rendered in animate as they are either non-existent on the first frame or already at their correct position.
  const groundCallback = useCallback((node) => {
    if (node) {
      ground.current = node;
      renderAtTime(tSince0.current);
    }
  }, []);
  const raycaster = useRef<Raycaster>(new Raycaster());
  const camera = useRef<THREE.PerspectiveCamera>();
  const tLastMouseDown = useRef<number>(0);
  const animationFrameRequest = useRef<number>(null);

  const loadLevel = () => {
    if (
      `${levelId}:${versionId}` === lastLevelIdAndVersionId.current ||
      !collectibles.current ||
      !obstacles.current
    )
      return;
    level.current = LevelService.getTemporaryLevel();
    if (!levelId || !versionId) {
      if (level.current) {
        // no level in db, but temporary level
        setTitle(level.current.title);
        setBpm(level.current.bpm);
        collectibles.current.remove(
          Array.from({ length: collectibles.current.getLastIndex() }, (e, i) => i)
        );
        obstacles.current.remove(
          Array.from({ length: obstacles.current.getLastIndex() }, (e, i) => i)
        );
        level.current.versions['1'].objects.forEach((f: Collectible | Obstacle) => {
          if (f.type === 'Collectible') {
            collectibles.current.addCollectible(f);
          } else if (f.type === 'Obstacle') {
            obstacles.current.addObstacle(f);
          }
        });
        if (level.current.audioLinks.length > 0) setAudioPath(level.current.audioLinks[0]);
        setChunkDifficulties(
          Array.from(
            {
              length: Math.ceil(level.current.versions[versionId].objects.length / chunkSize)
            },
            () => 1
          )
        );
        selectChunk(0);
      }
    } else {
      lastLevelIdAndVersionId.current = `${levelId}:${versionId}`;
      LevelService.get(levelId, versionId).then((levelData) => {
        level.current = levelData;
        if (levelData.id) setId(levelData.id);
        if (levelData.title) setTitle((level.current || levelData).title);
        if (levelData.bpm) setBpm((level.current || levelData).bpm);
        collectibles.current.remove(
          Array.from({ length: collectibles.current.getLastIndex() }, (e, i) => i)
        );
        obstacles.current.remove(
          Array.from({ length: obstacles.current.getLastIndex() }, (e, i) => i)
        );
        (level.current || levelData).versions[level.current ? '1' : versionId].objects.forEach(
          (f: Collectible | Obstacle) => {
            if (f.type === 'Collectible') {
              collectibles.current.addCollectible(f);
            } else if (f.type === 'Obstacle') {
              obstacles.current.addObstacle(f);
            }
          }
        );
        if ((level.current || levelData).audioLinks.length > 0)
          setAudioPath((level.current || levelData).audioLinks[0]);
        setChunkDifficulties(
          Array.from(
            {
              length: Math.ceil(level.current.versions[versionId].objects.length / chunkSize)
            },
            () => 1
          )
        );
        selectChunk(0);
      });
    }
    LevelService.setTemporaryLevel(null);
  };

  // Load level
  useEffect(loadLevel, [levelId, versionId]);

  // Load audio file
  useEffect(() => {
    if (!audioPath) {
      audio.current = null;
    } else {
      audio.current = new Howl({
        src: audioPath
      });
    }
  }, [audioPath]);

  // todo
  const selectLevelObject = (
    event: ThreeEvent<MouseEvent>,
    i: number,
    type: 'collectibles' | 'obstacles'
  ) => {
    // Ignore long clicks
    if (performance.now() - tLastMouseDown.current < 300) {
      if (event.nativeEvent.shiftKey) {
        if (selected[type].current.includes(i)) {
          levelObjectRefs[type].current.deselect([i]);
        } else {
          levelObjectRefs[type].current.select([i]);
        }
      } else {
        levelObjectRefs.collectibles.current.deselect(selected.collectibles.current);
        levelObjectRefs.obstacles.current.deselect(selected.obstacles.current);
        if (!selected.collectibles.current.includes(i) && !selected.obstacles.current.includes(i)) {
          levelObjectRefs[type].current.select([i]);
        }
      }
    }
  };

  const toggleSettings = () => {
    setSettingsOpen((old) => !old);
  };

  const stop = () => {
    if (typeof animationFrameRequest.current === 'number') {
      cancelAnimationFrame(animationFrameRequest.current);
      animationFrameRequest.current = null;
    }
    audio.current.stop();
    tSince0.current = 0;
    renderAtTime(0);
    setPlaying(false);
  };

  const save = async () => {
    const blob = new Blob([
      JSON.stringify(
        {
          _id: {
            levelId,
            versionId
          },
          overallDifficulty,
          chunkSize,
          chunkDifficulties
        },
        null,
        2
      )
    ]);
    FileSaver.saveAs(blob, `chunk_difficulties_${levelId}_${versionId}.json`);
  };

  const switchToGameplay = () => {
    const objects = [collectibles.current.export(), obstacles.current.export()]
      .flat()
      .sort((a, b) => a.position.z - b.position.z);
    const localLevel = {
      id: 'preview',
      title,
      bpm,
      published: false,
      averageRating: 0,
      artists: [] as Artist[],
      author: null as User,
      versions: {
        '1': {
          id: '1',
          difficulty,
          objects
        }
      },
      audioLinks: [audioPath],
      length: audio.current.duration()
    };
    LevelService.setTemporaryLevel(localLevel);
    setView((old) => {
      return {
        ...old,
        returnView: `/annotate-difficulty/${levelId}/${versionId}`
      };
    });
    navigate('/gameplay/preview/1');
  };

  const onWheel = (event: React.WheelEvent) => {
    renderAtTime(tSince0.current + -event.deltaY / 100);
  };

  const animate = () => {
    animationFrameRequest.current = requestAnimationFrame(animate);
    renderAtTime(audio.current.seek());
  };

  const play = () => {
    setPlaying(true);
    audio.current.seek(tSince0.current);
    audio.current.play();
    animationFrameRequest.current = requestAnimationFrame(animate);
  };

  const pause = () => {
    if (typeof animationFrameRequest.current === 'number') {
      cancelAnimationFrame(animationFrameRequest.current);
      animationFrameRequest.current = null;
    }
    audio.current.pause();
    setPlaying(false);
  };

  const renderAtTime = (t: number) => {
    tSince0.current = t;
    ground.current?.animate(t);
    camera.current?.position.setZ(-settings.editorTimeScaleFactor * t + 2.6);
  };

  const incrementChunkDifficulty = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setChunkDifficulties((old) => {
      const newVal = [...old];
      newVal[i] = Math.min(Math.max(1, newVal[i] + 1), 20);
      return newVal;
    });
  };

  const decrementChunkDifficulty = (e: React.MouseEvent, i: number) => {
    e.stopPropagation();
    setChunkDifficulties((old) => {
      const newVal = [...old];
      newVal[i] = Math.min(Math.max(1, newVal[i] - 1), 20);
      return newVal;
    });
  };

  const handleChunkDifficultyInput = (e: FormEvent<HTMLInputElement>, i: number) => {
    const n = parseInt(e.currentTarget.value, 10);
    if (Number.isNaN(n)) return;
    setChunkDifficulties((old) => {
      const newVal = [...old];
      newVal[i] = Math.min(Math.max(1, n), 20);
      return newVal;
    });
  };
  const incrementOverallDifficulty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverallDifficulty((old) => old + 1);
  };

  const decrementOverallDifficulty = (e: React.MouseEvent) => {
    e.stopPropagation();
    setOverallDifficulty((old) => old - 1);
  };

  const handleOverallDifficultyInput = (e: FormEvent<HTMLInputElement>) => {
    const n = parseInt(e.currentTarget.value, 10);
    if (Number.isNaN(n)) return;
    setOverallDifficulty(Math.min(Math.max(1, n), 20));
  };
  const selectChunk = (n: number) => {
    // Highlight 3D objects
    collectibles.current.deselect(selectedCollectibles.current);
    obstacles.current.deselect(selectedObstacles.current);
    const { objects } = level.current.versions[versionId];
    n = Math.min(Math.max(0, n), Math.floor(objects.length / chunkSize));
    setActiveChunk(n);
    let collectibleI = 0;
    let obstacleI = 0;
    for (let i = 0; i < n * chunkSize; i += 1) {
      if (objects[i].type === 'Collectible') {
        collectibleI += 1;
      } else {
        obstacleI += 1;
      }
    }
    for (let i = 0; i < chunkSize && n * chunkSize + i < objects.length; i += 1) {
      if (objects[n * chunkSize + i].type === 'Collectible') {
        collectibles.current.select([collectibleI]);
        collectibleI += 1;
      } else {
        obstacles.current.select([obstacleI]);
        obstacleI += 1;
      }
    }
    // Go to chunk in 3D
    const firstOjbectInChunk = level.current.versions[versionId].objects[n * chunkSize];
    if (firstOjbectInChunk.type === 'Collectible') {
      renderAtTime(firstOjbectInChunk.position.z - 0.125);
    } else {
      renderAtTime(firstOjbectInChunk.position.z - firstOjbectInChunk.dimensions.z / 2);
    }
  };

  const scrollSideBarToChunk = (n: number) => {
    const { objects } = level.current.versions[versionId];
    n = Math.min(Math.max(0, n), Math.floor(objects.length / chunkSize));
    const child = sideBarRef.current.children[n];
    sideBarRef.current.scrollTo(0, child.getBoundingClientRect().height * (n - 2));
  };

  if (!acceptedDisclaimer) {
    return (
      <div
        className="DifficultyAnnotator disclaimer"
        data-testid="DifficultyAnnotator"
        onWheel={onWheel}>
        <p>
          <h2>Important Notice</h2>
          Hi,
          <br />
          thanks for participating in study. In order to achieve meaningful results, I need you to
          accept and keep in mind a number of things.
          <ul>
            <li>
              Do not participate in this study, if you are not fit enough to play BeatFork in a safe
              fashion.
              <br />
              Do not put yourself into a position in which you could injure yourself.
              <br />
              Play in a safe environment.
              <br />
              Warum up before playing.
              <br />
              You choose to participate at your own risk.
              <br />
              (I do not expect anyone to hurt themselves playing BeatFork, but playing BeatFork can
              be a highly intense cardio workout depending on level and player. Therefore, take any
              considerations into account, which you would for working out traditionally.)
            </li>
            <li>Only rate difficulty of levels, which you have completed.</li>
            <li>
              This study aims to find out how to rate difficulty of BeatFork. Therefore there is no
              guideline on how to rate difficulty. However, the scale ranges from 1-20, because it
              looks good in level selection.
              <br />
              Please orient at{' '}
              <a href="https://www.wikiwand.com/en/In_the_Groove_(video_game)">
                In the Groove
              </a> and <a href="https://scoresaber.com/">ScoreSaber</a> difficulty ratings.
            </li>
            <li>
              You will rate difficulty on chunks of {chunkSize} game objects as well as overall
              difficulty at the bottom of the chunk list.
            </li>
            <li>
              When you are done, click on the floppy disk icon and send me the file via email to{' '}
              <a href="mailto:difficulty-estimation@beatfork.com">
                difficulty-estimation@beatfork.com
              </a>
              .
              <br />
              This file does not contain any personal identification. You can make sure by opening
              it in a text editor.
            </li>
            <li>
              You grant every person including me (Luis Scholl) a worldwide, royalty-free,
              transferable, sub-licensable, and non-exclusive license to use, reproduce, modify,
              distribute, adapt, publicly display, and publish everything, which you send to
              <a href="mailto:difficulty-estimation@beatfork.com">
                difficulty-estimation@beatfork.com
              </a>
              .
            </li>
          </ul>
          <button type="button" onClick={() => setAcceptedDisclaimer(true)}>
            Accept
          </button>
        </p>
      </div>
    );
  }

  return (
    <div className="DifficultyAnnotator" data-testid="DifficultyAnnotator" onWheel={onWheel}>
      <Canvas>
        <RecoilBridge>
          <color attach="background" args={['#158ed4']} />
          <PerspectiveCamera makeDefault position={[0, 0, 3]} rotation={[0, 0, 0]} ref={camera} />
          <directionalLight position={[5, 20, 35]} />
          <Ground ref={groundCallback} bpm={bpm} timeScaleFactor={settings.editorTimeScaleFactor} />
          <DifficultyAnnotatorCollectibles
            ref={collectiblesCb}
            onClick={selectLevelObject}
            selected={selected.collectibles}
            snappingModulusXY={1}
          />
          <DifficultyAnnotatorObstacles
            ref={obstaclesCb}
            triggerSelectLevelObject={selectLevelObject}
            obstaclesResizeFlag={null}
            selected={selected.obstacles}
          />
        </RecoilBridge>
      </Canvas>
      <div className="UI">
        <div className="top-bar">
          <div className="chunk-selection">
            <button
              className={activeChunk === 0 ? 'deactivated' : ''}
              type="button"
              onClick={() => {
                selectChunk(activeChunk - 1);
                scrollSideBarToChunk(activeChunk - 1);
              }}>
              <FontAwesomeIcon icon={faCaretLeft} />
            </button>
            <button
              className={
                activeChunk ===
                (level.current &&
                  Math.floor(level.current.versions[versionId].objects.length / chunkSize))
                  ? 'deactivated'
                  : ''
              }
              type="button"
              onClick={() => {
                selectChunk(activeChunk + 1);
                scrollSideBarToChunk(activeChunk + 1);
              }}>
              <FontAwesomeIcon icon={faCaretRight} />
            </button>
          </div>
          <div className="others">
            <Link to="/browse">
              <FontAwesomeIcon icon={faHome} />
            </Link>
            <button type="button" onClick={() => toggleSettings()}>
              <FontAwesomeIcon icon={faCogs} />
            </button>
            <button type="button" onClick={() => save()}>
              <FontAwesomeIcon icon={faSave} />
            </button>
            <button type="button" onClick={() => switchToGameplay()}>
              <FontAwesomeIcon icon={faRunning} />
            </button>
            <button type="button" onClick={() => stop()}>
              <FontAwesomeIcon icon={faStop} />
            </button>
            {playing ? (
              <button type="button" onClick={() => pause()}>
                <FontAwesomeIcon icon={faPause} />
              </button>
            ) : (
              <button type="button" onClick={() => play()}>
                <FontAwesomeIcon icon={faPlay} />
              </button>
            )}
          </div>
        </div>
        <div className="sidebar" onWheel={(f) => f.stopPropagation()} ref={sideBarRef}>
          {level.current &&
            Array.from(
              { length: Math.ceil(level.current.versions[versionId].objects.length / chunkSize) },
              (e, i) => (
                <button
                  type="button"
                  className={`chunk ${activeChunk === i ? 'active' : ''}`}
                  onClick={() => selectChunk(i)}>
                  <p>Chunk #{i}</p>
                  <div className="controls">
                    <button type="button" onClick={(f) => decrementChunkDifficulty(f, i)}>
                      <FontAwesomeIcon icon={faMinus} />
                    </button>
                    <input
                      type="text"
                      value={chunkDifficulties[i]}
                      min="1"
                      max="20"
                      onInput={(f) => handleChunkDifficultyInput(f, i)}
                      onClick={(f) => f.currentTarget.select()}
                    />
                    <button type="button" onClick={(f) => incrementChunkDifficulty(f, i)}>
                      <FontAwesomeIcon icon={faPlus} />
                    </button>
                  </div>
                </button>
              )
            )}
          <button type="button" className="chunk">
            <p>Overall</p>
            <div className="controls">
              <button type="button" onClick={(f) => decrementOverallDifficulty(f)}>
                <FontAwesomeIcon icon={faMinus} />
              </button>
              <input
                type="text"
                value={overallDifficulty}
                min="1"
                max="20"
                onInput={(f) => handleOverallDifficultyInput(f)}
                onClick={(f) => f.currentTarget.select()}
              />
              <button type="button" onClick={(f) => incrementOverallDifficulty(f)}>
                <FontAwesomeIcon icon={faPlus} />
              </button>
            </div>
          </button>
        </div>
        <div className="top-view" />
        <div className="timeline" />
        {settingsOpen && (
          <div className="settings-wrapper" onClick={toggleSettings}>
            <div className="settings" onClick={(e) => e.stopPropagation()}>
              <SettingsRow title="Title" value={title} setter={setTitle} type="text" />
              <SettingsRow
                title="BPM"
                value={bpm}
                setter={(e) => setBpm(parseFloat(e))}
                type="number"
              />
              <SettingsRow title="Audio Path" value={audioPath} setter={setAudioPath} type="text" />
              <SettingsRow
                title="Difficulty"
                value={difficulty}
                setter={(n) => setDifficulty(Math.max(1, Math.min(Math.round(n), 20)))}
                type="number"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Editor;
