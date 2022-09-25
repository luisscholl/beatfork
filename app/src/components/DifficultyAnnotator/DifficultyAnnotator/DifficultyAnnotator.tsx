import { PerspectiveCamera } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
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
  faRunning
} from '@fortawesome/free-solid-svg-icons';
import * as hash from 'object-hash';
import * as THREE from 'three';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { DoubleSide, Mesh, Raycaster, Vector2 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils';
import { useAuth } from 'react-oidc-context';
import {
  // eslint-disable-next-line camelcase
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
  useRecoilValue,
  useSetRecoilState
} from 'recoil';
import { Howl } from 'howler';
import Collectible, { CollectibleType } from '../../../models/Collectible';
import EditorSideBarCollectible from '../../Editor/EditorSideBarCollectible/EditorSideBarCollectible';
import MusicIcon from '../../Editor/MusicIcon/MusicIcon';
import './DifficultyAnnotator.scss';
import Vector3D from '../../../models/Vector3D';
import Ground from '../../Others/Ground/Ground';
import Obstacle from '../../../models/Obstacle';
import { settingsState } from '../../../atoms/settingsState';
import EditorCollectibles, {
  EditorCollectiblesRefAttributes
} from '../../Editor/EditorCollectibles/EditorCollectibles';
import editorObstacleFragmentShader from '../../../shaders/editorObstacleFragmentShader.glsl';
import editorCollectibleFragmentShader from '../../../shaders/editorCollectibleFragmentShader.glsl';
import editorObstacleVertexShader from '../../../shaders/editorObstacleVertexShader.glsl';
import editorCollectibleVertexShader from '../../../shaders/editorCollectibleVertexShader.glsl';
import EditorSideBarObstacle from '../../Editor/EditorSideBarObstacle/EditorSideBarObstacle';
import EditorObstacles, {
  EditorObstaclesRefAttributes
} from '../../Editor/EditorObstacles/EditorObstacles';
import SettingsRow from '../../Editor/SettingsRow/SettingsRow';
import { LevelService } from '../../../services/LevelService';
import Artist from '../../../models/Artist';
import User from '../../../models/User';
import { viewState } from '../../../atoms/viewState';

const snappingModuliXY = [0.0109375, 0.21875, 0.4375];

const Editor = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const setView = useSetRecoilState(viewState);
  const { levelId, versionId } = useParams();
  const lastLevelIdAndVersionId = useRef<string>('null');

  const settings = useRecoilValue(settingsState);
  const RecoilBridge = useRecoilBridgeAcrossReactRoots_UNSTABLE();

  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  const [playing, setPlaying] = useState<boolean>(false);
  const tSince0 = useRef<number>(0);
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
  const scrollSideBarTop = useRef<number>(0);
  // When snapping is activated, level objects will only be moved once a certain threshold of movement was crossed. Especially when this threshold is not crossed in a single event, the distance needs to be buffered for subsequent events regarding the same set of events. Otherwise the level objects would never move.
  // todo: Reset snapBuffers, when user changes the selection?
  // const [importedFile, setFile] = useState<File>();

  const collectibles = useRef<EditorCollectiblesRefAttributes>(null);
  const collectiblesCb = useCallback((node) => {
    if (node) {
      collectibles.current = node;
      loadLevel();
    }
  }, []);
  const obstacles = useRef<EditorObstaclesRefAttributes>(null);
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
    const temporaryLevel = LevelService.getTemporaryLevel();
    if (!levelId || !versionId) {
      if (temporaryLevel) {
        // no level in db, but temporary level
        setTitle(temporaryLevel.title);
        setBpm(temporaryLevel.bpm);
        collectibles.current.remove(
          Array.from({ length: collectibles.current.getLastIndex() }, (e, i) => i)
        );
        obstacles.current.remove(
          Array.from({ length: obstacles.current.getLastIndex() }, (e, i) => i)
        );
        temporaryLevel.versions['1'].objects.forEach((f: Collectible | Obstacle) => {
          if (f.type === 'Collectible') {
            collectibles.current.addCollectible(f);
          } else if (f.type === 'Obstacle') {
            obstacles.current.addObstacle(f);
          }
        });
        if (temporaryLevel.audioLinks.length > 0) setAudioPath(temporaryLevel.audioLinks[0]);
        renderAtTime(0);
      }
    } else {
      lastLevelIdAndVersionId.current = `${levelId}:${versionId}`;
      LevelService.get(levelId, versionId).then((levelData) => {
        if (levelData.id) setId(levelData.id);
        if (levelData.title) setTitle((temporaryLevel || levelData).title);
        if (levelData.bpm) setBpm((temporaryLevel || levelData).bpm);
        collectibles.current.remove(
          Array.from({ length: collectibles.current.getLastIndex() }, (e, i) => i)
        );
        obstacles.current.remove(
          Array.from({ length: obstacles.current.getLastIndex() }, (e, i) => i)
        );
        (temporaryLevel || levelData).versions[temporaryLevel ? '1' : versionId].objects.forEach(
          (f: Collectible | Obstacle) => {
            if (f.type === 'Collectible') {
              collectibles.current.addCollectible(f);
            } else if (f.type === 'Obstacle') {
              obstacles.current.addObstacle(f);
            }
          }
        );
        if ((temporaryLevel || levelData).audioLinks.length > 0)
          setAudioPath((temporaryLevel || levelData).audioLinks[0]);
        renderAtTime(0);
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

  // todo
  const save = async () => {
    console.log('todo');
  };

  const switchToGameplay = () => {
    const objects = [collectibles.current.export(), obstacles.current.export()]
      .flat()
      .sort((a, b) => a.position.z - b.position.z);
    const level = {
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
    LevelService.setTemporaryLevel(level);
    setView((old) => {
      return {
        ...old,
        returnView: `/annotate-difficulty/${levelId}/${versionId}`
      };
    });
    navigate('/gameplay/preview/1');
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

  return (
    <div className="DifficultyAnnotator" data-testid="DifficultyAnnotator">
      <Canvas>
        <RecoilBridge>
          <color attach="background" args={['#158ed4']} />
          <PerspectiveCamera makeDefault position={[0, 0, 3]} rotation={[0, 0, 0]} ref={camera} />
          <directionalLight position={[5, 20, 35]} />
          <Ground ref={groundCallback} bpm={bpm} timeScaleFactor={settings.editorTimeScaleFactor} />
          {/* todo */}
          <EditorCollectibles
            ref={collectiblesCb}
            onClick={selectLevelObject}
            selected={selected.collectibles}
            snappingModulusXY={1}
          />
          {/* todo */}
          <EditorObstacles
            ref={obstaclesCb}
            triggerSelectLevelObject={selectLevelObject}
            obstaclesResizeFlag={null}
            selected={selected.obstacles}
          />
        </RecoilBridge>
      </Canvas>
      <div className="UI">
        <div className="top-bar">
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
