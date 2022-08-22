import { PerspectiveCamera } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faCogs,
  faStop,
  faSave,
  faPlay,
  faPause,
  faTrash,
  faCaretUp,
  faCaretDown,
  faBorderAll,
  faCopy,
  faToggleOn,
  faToggleOff,
  faThLarge
} from '@fortawesome/free-solid-svg-icons';
import * as THREE from 'three';
import { useParams } from 'react-router-dom';
import { DoubleSide, Mesh, Raycaster, Vector2 } from 'three';
import { generateUUID } from 'three/src/math/MathUtils';
import { useAuth } from 'react-oidc-context';
import {
  // eslint-disable-next-line camelcase
  useRecoilBridgeAcrossReactRoots_UNSTABLE,
  useRecoilValue
} from 'recoil';
import { Howl } from 'howler';
import Collectible, { CollectibleType } from '../../models/Collectible';
import EditorSideBarCollectible from '../EditorSideBarCollectible/EditorSideBarCollectible';
import MusicIcon from '../MusicIcon/MusicIcon';
import './Editor.scss';
import Vector3D from '../../models/Vector3D';
import Ground from '../Ground/Ground';
import Obstacle from '../../models/Obstacle';
import { settingsState } from '../../atoms/settingsState';
import EditorCollectibles, {
  EditorCollectiblesRefAttributes
} from '../EditorCollectibles/EditorCollectibles';
import EditorSideBarObstacle from '../EditorSideBarObstacle/EditorSideBarObstacle';
import EditorObstacles, { EditorObstaclesRefAttributes } from '../EditorObstacles/EditorObstacles';
import SettingsRow from '../SettingsRow/SettingsRow';
import { LevelService } from '../../services/LevelService';
import Artist from '../../models/Artist';

const Editor = () => {
  const auth = useAuth();
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
  const obstaclesResizeFlag = useRef<
    null | 'do-not-resize' | 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right'
  >(undefined);
  const scrollSideBarTop = useRef<number>(0);
  // When snapping is activated, level objects will only be moved once a certain threshold of movement was crossed. Especially when this threshold is not crossed in a single event, the distance needs to be buffered for subsequent events regarding the same set of events. Otherwise the level objects would never move.
  // todo: Reset snapBuffers, when user changes the selection?
  // const [importedFile, setFile] = useState<File>();
  const [snappingDivider, setSnappingDivider] = useState<4 | 8 | 16 | 32>();
  const [tripletSnappingDivider, setTripletSnappingDivider] = useState<1 | 1.5>(1);

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

  const [snappingModulusXY, setSnappingModulusXY] = useState<0.1 | 0.3 | 0.5>(0.3);
  const snapBufferX = useRef<number>(0);
  const snapBufferY = useRef<number>(0);

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
  const placementPlane = useRef<Mesh>();
  const last3DMousePosition = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0
  });
  const current3DMousePosition = useRef<{ x: number; y: number; z: number }>({
    x: 0,
    y: 0,
    z: 0
  });
  const tLastMouseDown = useRef<number>(0);
  const fileInput = useRef<HTMLInputElement>();
  const animationFrameRequest = useRef<number>(null);

  const itemTypes = Array.from({ length: 10 }, (e, i) => i);

  const [templateTypes, setTemplateType] = useState<Array<Array<Collectible | Obstacle>>>(
    JSON.parse(localStorage.getItem('templates')) || []
  );
  const [templateToggle, setTemplateToggle] = useState<false | true>(false);
  const [sideBarItems, setSideBarItems] = useState<
    Array<number> | Array<Array<Collectible | Obstacle>>
  >(templateToggle ? templateTypes : itemTypes);

  const templateIndex = useRef<number>(0);

  const [isOpen, setOpen] = useState(JSON.parse(localStorage.getItem('templates')) || false);

  const loadLevel = () => {
    if (
      !levelId ||
      !versionId ||
      `${levelId}:${versionId}` === lastLevelIdAndVersionId.current ||
      !collectibles.current ||
      !obstacles.current
    )
      return;
    lastLevelIdAndVersionId.current = `${levelId}:${versionId}`;
    LevelService.get(levelId, versionId).then((levelData) => {
      if (levelData.id) setId(levelData.id);
      if (levelData.title) setTitle(levelData.title);
      if (levelData.bpm) setBpm(levelData.bpm);
      collectibles.current.remove(
        Array.from({ length: collectibles.current.getLastIndex() }, (e, i) => i)
      );
      obstacles.current.remove(
        Array.from({ length: obstacles.current.getLastIndex() }, (e, i) => i)
      );
      levelData.versions[versionId].objects.forEach((f: Collectible | Obstacle) => {
        if (f.type === 'Collectible') {
          collectibles.current.addCollectible(f);
        } else if (f.type === 'Obstacle') {
          obstacles.current.addObstacle(f);
        }
      });
      if (levelData.audioLinks.length > 0) setAudioPath(levelData.audioLinks[0]);
      renderAtTime(0);
    });
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

  const onMouseDown = (event: React.MouseEvent) => {
    tLastMouseDown.current = performance.now();
  };

  // todo: extract actions into separate functions?
  const onMouseMove = (event: React.MouseEvent) => {
    // Get position of mouse in 3D space with placement plane as depth
    // https://threejs.org/docs/#api/en/core/Raycaster

    if (!camera.current) return;

    const mouse = new Vector2(
      (event.clientX / window.innerWidth) * 2 - 1,
      (-event.clientY / window.innerHeight) * 2 + 1
    );
    raycaster.current.setFromCamera(mouse, camera.current as any); // todo
    const intersection = raycaster.current.intersectObject(placementPlane.current);
    if (intersection.length === 0) {
      console.warn('No intersection found.');
      return;
    }
    current3DMousePosition.current = {
      x: intersection[0].point.x,
      y: intersection[0].point.y,
      z: intersection[0].point.z
    };

    switch (event.buttons) {
      // Only left button
      case 1:
        if (selected.collectibles.current.length > 0 || selected.obstacles.current.length > 0) {
          if (!event.shiftKey) {
            const movementX = current3DMousePosition.current.x - last3DMousePosition.current.x;
            const movementY = current3DMousePosition.current.y - last3DMousePosition.current.y;
            if (obstaclesResizeFlag.current && obstaclesResizeFlag.current !== 'do-not-resize') {
              resizeSelectedObstacles({ x: movementX, y: movementY }, obstaclesResizeFlag.current);
            } else {
              moveSelectedLevelObjects({ x: movementX, y: movementY });
            }
          }
        }
        break;
      // Only right button
      case 2:
        if (selected.collectibles.current.length > 0 || selected.obstacles.current.length > 0) {
          const distance = -(event.movementY / window.innerHeight) * 20;
          if (obstaclesResizeFlag.current && obstaclesResizeFlag.current !== 'do-not-resize') {
            if (event.shiftKey) {
              resizeSelectedObstacles({ z: distance }, obstaclesResizeFlag.current, true);
            } else {
              resizeSelectedObstacles({ z: distance }, obstaclesResizeFlag.current);
            }
          } else if (typeof obstaclesResizeFlag.current !== 'undefined') {
            moveSelectedLevelObjects({ z: distance });
          }
        } else {
          renderAtTime(tSince0.current - (event.movementY / window.innerHeight) * 20);
        }
        break;
      default:
        break;
    }
    last3DMousePosition.current = current3DMousePosition.current;
  };

  // Chrome cannot scroll the sidebar by itself. I don't know why.
  const onSideBarWheel = useCallback((e) => {
    e.stopPropagation();
    e.preventDefault();
    sideBarRef.current.scrollBy({ top: e.deltaY });
  }, []);

  useEffect(() => {
    sideBarRef.current?.addEventListener('wheel', onSideBarWheel, {
      passive: false
    });
    const ref = sideBarRef.current;
    return () => {
      ref?.removeEventListener('wheel', onSideBarWheel);
    };
  }, [onSideBarWheel]);

  useEffect(() => {
    const interval = setInterval(() => {
      sideBarRef.current?.scrollBy({ top: scrollSideBarTop.current });
    }, 1 / 60);
    return () => {
      clearInterval(interval);
    };
  }, []);

  const onWheel = (event: React.WheelEvent) => {
    renderAtTime(tSince0.current + -event.deltaY / 100);
  };

  const onMouseUp = () => {
    obstaclesResizeFlag.current = null;
  };

  const onSidebarCollectibleMouseDown = (event: React.MouseEvent, type: CollectibleType) => {
    const position = current3DMousePosition.current;
    position.z /= -settings.editorTimeScaleFactor;
    collectibles.current.addCollectible({
      type: 'Collectible',
      collectibleType: type,
      position,
      measure: 0, // todo
      beat: 0 // todo
    });
    collectibles.current.deselect(selected.collectibles.current);
    obstacles.current.deselect(selected.obstacles.current);
    collectibles.current.select([-1]);
    if (snappingDivider) {
      collectibles.current.snap([-1]);
    }
  };

  const onSidebarTemplateMouseDown = (
    event: React.MouseEvent,
    template: Array<Collectible | Obstacle>
  ) => {
    collectibles.current.deselect(selected.collectibles.current);
    obstacles.current.deselect(selected.obstacles.current);
    // localStorage.clear();

    for (const elem of template) {
      const pos = {
        x: elem.position.x,
        y: elem.position.y,
        z: elem.position.z
      };
      pos.z /= -settings.editorTimeScaleFactor;
      if (elem.type === 'Collectible') {
        collectibles.current.addCollectible({
          type: 'Collectible',
          collectibleType: elem.collectibleType,
          position: pos,
          measure: 0, // todo
          beat: 0 // todo
        });
        collectibles.current.select([-1]);
      }
      if (elem.type === 'Obstacle') {
        obstacles.current.addObstacle({
          type: 'Obstacle',
          position: pos,
          dimensions: {
            x: 0.5,
            y: 0.75,
            z: 0.25
          },
          measure: 0, // todo
          beat: 0 // todo
        });
        obstacles.current.select([-1]);
      }

      // collectibles.current.deselect(selected.collectibles.current);
      // obstacles.current.deselect(selected.obstacles.current);
      // collectibles.current.select([-1]);
      if (snappingDivider) {
        collectibles.current.snap([-1]);
      }
    }
  };

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
          if (snappingDivider) {
            collectibles.current.snap([i]);
          }
        }
      } else {
        levelObjectRefs.collectibles.current.deselect(selected.collectibles.current);
        levelObjectRefs.obstacles.current.deselect(selected.obstacles.current);
        if (!selected.collectibles.current.includes(i) && !selected.obstacles.current.includes(i)) {
          levelObjectRefs[type].current.select([i]);
        }
        if (snappingDivider) {
          collectibles.current.snap([i]);
        }
      }
    }
  };

  const moveSelectedLevelObjects = (distance: { x?: number; y?: number; z?: number }) => {
    const d: Vector3D = { x: 0, y: 0, z: 0, ...distance };
    levelObjectRefs.collectibles.current.moveBy(selected.collectibles.current, d);
    levelObjectRefs.obstacles.current.moveBy(selected.obstacles.current, d);
  };

  const resizeSelectedObstacles = (
    distance: {
      x?: number;
      y?: number;
      z?: number;
    },
    corner: 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right',
    reverseZ = false
  ) => {
    distance.x += snapBufferX.current;
    distance.y += snapBufferY.current;
    const distanceRemainderx = distance.x % snappingModulusXY;
    const distanceRemaindery = distance.y % snappingModulusXY;
    distance.x -= distanceRemainderx;
    distance.y -= distanceRemaindery;
    snapBufferX.current = distanceRemainderx;
    snapBufferY.current = distanceRemaindery;
    const d: Vector3D = { x: 0, y: 0, z: 0, ...distance };
    levelObjectRefs.obstacles.current.resizeBy(selected.obstacles.current, d, corner, reverseZ);
  };

  const setSnapping = (snapTo: 4 | 8 | 16 | 32) => {
    if (snappingDivider === snapTo) {
      setSnappingDivider(null);
      setTripletSnappingDivider(1);
      collectibles.current.configureSnap(false);
    } else {
      setSnappingDivider(snapTo);
      collectibles.current.configureSnap(bpm, snapTo, tripletSnappingDivider);
      collectibles.current.snap(selected.collectibles.current);
      obstacles.current.configureSnap(bpm, snapTo, tripletSnappingDivider);
      obstacles.current.snap(selected.obstacles.current);
    }
  };

  const setSnappingxy = (snapTo: 0.1 | 0.3 | 0.5) => {
    setSnappingModulusXY(snapTo);
    collectibles.current.setSnappingxy(snapTo);
  };

  const copy = () => {
    levelObjectRefs.collectibles.current.copy(selected.collectibles.current, true);
    levelObjectRefs.obstacles.current.copy(selected.obstacles.current, true);
  };

  const toggleTripletSnapping = () => {
    let snapTo = snappingDivider;
    if (!snappingDivider) {
      setSnappingDivider(4);
      snapTo = 4;
    }
    if (tripletSnappingDivider === 1) {
      setTripletSnappingDivider(1.5);
      collectibles.current.configureSnap(bpm, snapTo, 1.5);
      obstacles.current.configureSnap(bpm, snapTo, 1.5);
    } else {
      setTripletSnappingDivider(1);
      collectibles.current.configureSnap(bpm, snapTo, 1);
      obstacles.current.configureSnap(bpm, snapTo, 1);
    }
    collectibles.current.snap(selected.collectibles.current);
    obstacles.current.snap(selected.obstacles.current);
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
    const objects = [collectibles.current.export(), obstacles.current.export()]
      .flat()
      .sort((a, b) => a.position.z - b.position.z);
    if (!auth.isAuthenticated) {
      // todo: Warn user that level upload is only possible while logged in.
      return;
    }
    const isAuthor = levelId && (await LevelService.isAuthor(levelId));
    if (levelId && isAuthor && versionId) {
      LevelService.updateVersion(levelId, {
        id: versionId,
        difficulty,
        objects
      });
    } else {
      const level = {
        title,
        bpm,
        published: false,
        artistIds: [] as string[],
        versions: [
          {
            id: 1,
            difficulty,
            objects
          }
        ],
        audioLinks: [audioPath],
        length: audio.current.duration()
      };
      LevelService.upload(level).then((result) => {
        if (result.ok) {
          result.json().then((levelInfo) => {
            window.history.pushState('', '', `/edit/${levelInfo.id}/1`);
            window.history.forward();
            window.location.reload();
          });
        }
      });
    }
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

  const deleteSelected = () => {
    for (const t of ['collectibles', 'obstacles'] as Array<'collectibles' | 'obstacles'>) {
      levelObjectRefs[t].current.remove(selected[t].current);
      selected[t].current = [];
    }
  };

  const templateToggleSwitch = () => {
    setTemplateToggle(!templateToggle);

    setSideBarItems(!templateToggle ? templateTypes : itemTypes);
  };

  const mapSidebarItem = (type: number | Array<Collectible | Obstacle>) => {
    if (typeof type === 'number') {
      if (type === 0) {
        return (
          <button type="button" onMouseDown={(event) => onSidebarObstacleMouseDown(event)}>
            <EditorSideBarObstacle />
          </button>
        );
      }
      return (
        <button
          key={type}
          type="button"
          onMouseDown={(event) => onSidebarCollectibleMouseDown(event, type as CollectibleType)}>
          <EditorSideBarCollectible type={type as CollectibleType} />
        </button>
      );
    }
    return mapSidebarTemplate(type);
  };

  const mapSidebarTemplate = (type: Array<Collectible | Obstacle>) => {
    templateIndex.current += 1;

    return (
      <button
        key={1}
        type="button"
        style={{ fontSize: '150%' }}
        onMouseDown={(event) => onSidebarTemplateMouseDown(event, type)}>
        {templateIndex.current}
      </button>
    );
  };

  const saveTemplate = () => {
    const collTemplate = levelObjectRefs.collectibles.current.copy(
      selected.collectibles.current,
      false
    );
    const obstTemplate = levelObjectRefs.obstacles.current.copy(selected.obstacles.current, false);

    const template = [...collTemplate, ...obstTemplate];

    templateTypes.push(template);
    const templates = JSON.parse(localStorage.getItem('templates'));
    if (templates === null) {
      localStorage.setItem('templates', JSON.stringify([template]));
      setTemplateType([template]);
    } else {
      localStorage.setItem('templates', JSON.stringify([...templates, template]));
      setTemplateType([...templates, template]);
    }

    // localStorage.setItem("templates", JSON.stringify());
  };

  const renderAtTime = (t: number) => {
    tSince0.current = t;
    ground.current?.animate(t);
    camera.current?.position.setZ(-settings.editorTimeScaleFactor * t + 2);
    placementPlane.current?.position.setZ(-settings.editorTimeScaleFactor * t);
  };

  const onSidebarObstacleMouseDown = (event: React.MouseEvent) => {
    const position = current3DMousePosition.current;
    position.z /= -settings.editorTimeScaleFactor;
    obstacles.current.addObstacle({
      type: 'Obstacle',
      position,
      dimensions: {
        x: 0.5,
        y: 0.75,
        z: 0.25
      },
      measure: 0, // todo
      beat: 0 // todo
    });
    collectibles.current.deselect(selected.collectibles.current);
    obstacles.current.deselect(selected.obstacles.current);
    obstacles.current.select([-1]);
    if (snappingDivider) {
      obstacles.current.snap([-1]);
    }
  };

  return (
    <div
      className="Editor"
      data-testid="Editor"
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onWheel={onWheel}
      onMouseUp={onMouseUp}>
      <Canvas>
        <RecoilBridge>
          <color attach="background" args={['#158ed4']} />
          <PerspectiveCamera makeDefault position={[0, 0, 2]} rotation={[0, 0, 0]} ref={camera} />
          <directionalLight position={[5, 20, 35]} />
          <mesh position={[0, 0, 0]} rotation={[0, 0, 0]} scale={[10, 10, 1]} ref={placementPlane}>
            <planeBufferGeometry />
            <meshBasicMaterial visible={false} side={DoubleSide} />
          </mesh>
          <Ground ref={groundCallback} bpm={bpm} timeScaleFactor={settings.editorTimeScaleFactor} />
          <EditorCollectibles
            ref={collectiblesCb}
            onClick={selectLevelObject}
            selected={selected.collectibles}
            snappingModulusxy={snappingModulusXY}
          />
          <EditorObstacles
            ref={obstaclesCb}
            triggerSelectLevelObject={selectLevelObject}
            obstaclesResizeFlag={obstaclesResizeFlag}
            selected={selected.obstacles}
          />
        </RecoilBridge>
      </Canvas>
      <div className="UI">
        <div className="side-bar">
          <button type="button">
            <FontAwesomeIcon
              icon={templateToggle ? faToggleOn : faToggleOff}
              onClick={templateToggleSwitch}
            />
          </button>
          <button
            type="button"
            onMouseEnter={() => {
              scrollSideBarTop.current = -2;
            }}
            onMouseLeave={() => {
              scrollSideBarTop.current = 0;
            }}>
            <FontAwesomeIcon icon={faCaretUp} />
          </button>
          <div className="content" onWheel={onSideBarWheel} ref={sideBarRef}>
            {/*            <button
              type="button"
              onMouseDown={(event) => onSidebarObstacleMouseDown(event)}
            >
              <EditorSideBarObstacle />
            </button>
            {/* todo: Depends on implementation of CollectibleType. Is there a better solution? */}
            {sideBarItems.map(mapSidebarItem)}
          </div>
          <button
            type="button"
            onMouseEnter={() => {
              scrollSideBarTop.current = 2;
            }}
            onMouseLeave={() => {
              scrollSideBarTop.current = 0;
            }}>
            <FontAwesomeIcon icon={faCaretDown} />
          </button>
        </div>
        <div className="top-bar">
          <div className="snapping">
            <button
              className={snappingDivider === 4 ? 'active' : ''}
              type="button"
              onClick={() => setSnapping(4)}>
              <MusicIcon type="quarter-note" />
            </button>
            <button
              className={snappingDivider === 8 ? 'active' : ''}
              type="button"
              onClick={() => setSnapping(8)}>
              <MusicIcon type="eight-note" />
            </button>
            <button
              className={snappingDivider === 16 ? 'active' : ''}
              type="button"
              onClick={() => setSnapping(16)}>
              <MusicIcon type="sixteenth-note" />
            </button>
            <button
              className={snappingDivider === 32 ? 'active' : ''}
              type="button"
              onClick={() => setSnapping(32)}>
              <MusicIcon type="thirty-second-note" />
            </button>
            <button
              className={tripletSnappingDivider === 3 / 2 ? 'active' : ''}
              type="button"
              onClick={() => toggleTripletSnapping()}>
              <MusicIcon type="triplet" />
            </button>
            <button
              className={snappingModulusXY === 0.1 ? 'active' : ''}
              type="button"
              style={{ fontSize: '150%' }}
              onClick={() => setSnappingxy(0.1)}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faBorderAll} />1
            </button>
            <button
              className={snappingModulusXY === 0.3 ? 'active' : ''}
              type="button"
              style={{ fontSize: '150%' }}
              onClick={() => setSnappingxy(0.3)}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faBorderAll} />2
            </button>
            <button
              className={snappingModulusXY === 0.5 ? 'active' : ''}
              type="button"
              style={{ fontSize: '150%' }}
              onClick={() => setSnappingxy(0.5)}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faBorderAll} />3
            </button>
            <button className="" type="button" style={{ fontSize: '150%' }} onClick={() => copy()}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faCopy} />
            </button>
            <button className="" type="button" onClick={saveTemplate} style={{ fontSize: '150%' }}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faSave} />
              <FontAwesomeIcon style={{ width: '20%' }} icon={faThLarge} />
            </button>
          </div>
          <div className="others">
            <button type="button" onClick={() => toggleSettings()}>
              <FontAwesomeIcon icon={faCogs} />
            </button>
            <button type="button" onClick={() => stop()}>
              <FontAwesomeIcon icon={faStop} />
            </button>
            <button type="button" onClick={() => save()}>
              <FontAwesomeIcon icon={faSave} />
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
        <div className="trash">
          <button type="button" onClick={() => deleteSelected()}>
            <FontAwesomeIcon icon={faTrash} />
          </button>
        </div>
        <div className="top-view" />
        <div className="timeline" />
        {settingsOpen && (
          <div className="settings-wrapper" onClick={toggleSettings}>
            <div className="settings" onClick={(e) => e.stopPropagation()}>
              <SettingsRow title="Title" value={title} setter={setTitle} type="text" />
              <SettingsRow title="BPM" value={bpm} setter={setBpm} type="number" />
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
