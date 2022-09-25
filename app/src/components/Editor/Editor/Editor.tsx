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
import EditorSideBarCollectible from '../EditorSideBarCollectible/EditorSideBarCollectible';
import MusicIcon from '../MusicIcon/MusicIcon';
import './Editor.scss';
import Vector3D from '../../../models/Vector3D';
import Ground from '../../Others/Ground/Ground';
import Obstacle from '../../../models/Obstacle';
import { settingsState } from '../../../atoms/settingsState';
import EditorCollectibles, {
  EditorCollectiblesRefAttributes
} from '../EditorCollectibles/EditorCollectibles';
import editorObstacleFragmentShader from '../../../shaders/editorObstacleFragmentShader.glsl';
import editorCollectibleFragmentShader from '../../../shaders/editorCollectibleFragmentShader.glsl';
import editorObstacleVertexShader from '../../../shaders/editorObstacleVertexShader.glsl';
import editorCollectibleVertexShader from '../../../shaders/editorCollectibleVertexShader.glsl';
import EditorSideBarObstacle from '../EditorSideBarObstacle/EditorSideBarObstacle';
import EditorObstacles, { EditorObstaclesRefAttributes } from '../EditorObstacles/EditorObstacles';
import SettingsRow from '../SettingsRow/SettingsRow';
import { LevelService } from '../../../services/LevelService';
import Artist from '../../../models/Artist';
import User from '../../../models/User';
import { viewState } from '../../../atoms/viewState';

const snappingModuliXY = [0.0109375, 0.21875, 0.4375];

const Editor = () => {
  const shaderData = useMemo(
    () => ({
      fragmentShader: editorObstacleFragmentShader,
      vertexShader: editorObstacleVertexShader,
      uniforms: {
        obstacleTexture: {
          value: new THREE.TextureLoader().load('/assets/obstacles.png')
        }
      }
    }),
    []
  );

  const shaderData2 = useMemo(
    () => ({
      fragmentShader: editorCollectibleFragmentShader,
      vertexShader: editorCollectibleVertexShader,
      uniforms: {
        collectibleTexture: {
          value: new THREE.TextureLoader().load('/assets/collectibles.png')
        }
      }
    }),
    []
  );

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
  const obstaclesResizeFlag = useRef<
    null | 'do-not-resize' | 'upper-left' | 'upper-right' | 'lower-left' | 'lower-right'
  >(undefined);
  const scrollSideBarTop = useRef<number>(0);
  // When snapping is activated, level objects will only be moved once a certain threshold of movement was crossed. Especially when this threshold is not crossed in a single event, the distance needs to be buffered for subsequent events regarding the same set of events. Otherwise the level objects would never move.
  // todo: Reset snapBuffers, when user changes the selection?
  // const [importedFile, setFile] = useState<File>();
  const [snappingDivider, setSnappingDivider] = useState<4 | 8 | 16 | 32>();
  const [tripletSnappingDivider, setTripletSnappingDivider] = useState<1 | 1.5>(1);
  const [snapMenuActive, setSnapMenuActive] = useState<boolean>(false);

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

  const [snappingModulusXY, setSnappingModulusXY] = useState<0.0109375 | 0.21875 | 0.4375>(0.21875);
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
  const itemRenders = useRef(JSON.parse(localStorage.getItem('itemRenders')) || []);

  const sideBarCanvasRef = useRef(Array(10).fill(0));

  const dummyTemplateRef = useRef<HTMLCanvasElement>();
  const [dummyTemplate, setDummyTemplate] = useState<Array<Collectible | Obstacle>>([]);

  const [renderMap, setRenderMap] = useState(
    new Map<string, string>(JSON.parse(localStorage.getItem('renderMap')))
  );

  useEffect(() => {
    if (dummyTemplate.length !== 0) {
      console.log(dummyTemplate);
      for (let v = 0; v < dummyTemplate.length; v += 1) {
        console.log(dummyTemplate[v]);
      }
      saveTemplateRender(dummyTemplate);
    }
  }, [dummyTemplate]);

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
          if (!event.nativeEvent.shiftKey) {
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
            if (event.nativeEvent.shiftKey) {
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
    collectibles.current.snap([-1]);
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

  const setSnappingXY = (snapTo: 0.0109375 | 0.21875 | 0.4375) => {
    setSnappingModulusXY(snapTo);
    collectibles.current.setSnappingXY(snapTo);
    collectibles.current.snap(selected.collectibles.current);
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
      LevelService.updateVersion(
        levelId,
        {
          id: versionId,
          difficulty,
          objects
        },
        title,
        bpm,
        audioPath
      );
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
        returnView: levelId && versionId ? `/edit/${levelId}/${versionId}` : '/edit'
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

  const deleteSelected = () => {
    for (const t of ['collectibles', 'obstacles'] as Array<'collectibles' | 'obstacles'>) {
      levelObjectRefs[t].current.remove(selected[t].current);
      selected[t].current = [];
    }
  };

  const templateToggleSwitch = () => {
    saveSidebarRender();

    setTemplateToggle(!templateToggle);

    setSideBarItems(!templateToggle ? templateTypes : itemTypes);
  };

  const deleteTemplate = (type: Array<Collectible | Obstacle>) => {
    for (let f = 0; f < templateTypes.length; f += 1) {
      if (templateTypes[f] === type) {
        const templateHash = hash.sha1(type);
        const tempTypes = templateTypes;

        tempTypes.splice(f, 1);

        setRenderMap(new Map(renderMap.set(templateHash, '')));
        renderMap.delete(templateHash);

        localStorage.setItem('renderMap', JSON.stringify(Array.from(renderMap.entries())));

        setTemplateType(tempTypes);
        setSideBarItems(tempTypes);

        localStorage.setItem('templates', JSON.stringify(tempTypes));
      }
    }
    return 1;
  };

  const mapSidebarItem = (type: number | Array<Collectible | Obstacle>, index: number) => {
    if (typeof type === 'number' && itemRenders.current[type]) {
      if (type === 0) {
        return (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center'
              }}>
              <button
                style={{ marginRight: '0px', marginBottom: '0px' }}
                type="button"
                onMouseDown={(event) => onSidebarObstacleMouseDown(event)}>
                <img src={itemRenders.current[type]} alt="object" />
                <p>Obstacle</p>
              </button>
            </div>
          </div>
        );
      }

      return (
        <div>
          <button
            type="button"
            onMouseDown={(event) => onSidebarCollectibleMouseDown(event, type as CollectibleType)}>
            <img src={itemRenders.current[type]} alt="object" />
            {type === CollectibleType.All && <p>Basic Collectible</p>}
            {type === CollectibleType.Hands && <p>Hands Collectible</p>}
            {type === CollectibleType.Feet && <p>Feet Collectible</p>}
            {type === CollectibleType.Left && <p>Left Side Collectible</p>}
            {type === CollectibleType.Right && <p>Right Side Collectible</p>}
            {type === CollectibleType.LeftHand && <p>Left Hand Collectible</p>}
            {type === CollectibleType.RightHand && <p>Right Hand Collectible</p>}
            {type === CollectibleType.LeftFoot && <p>Left Foot Collectible</p>}
            {type === CollectibleType.RightFoot && <p>Right Foot Collectible</p>}
          </button>
        </div>
      );
    }
    if (typeof type === 'number') {
      const a = renderSidebarItem(type);
      return a;
    }

    if (Array.isArray(type)) {
      console.log('Rendering Template');
      const templateHash = hash.sha1(type);
      return (
        <div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <button type="button" onMouseDown={(event) => onSidebarTemplateMouseDown(event, type)}>
              <img src={renderMap.get(templateHash)} alt="object" />
            </button>
            <button
              style={{ marginRight: '40px' }}
              type="button"
              onClick={() => deleteTemplate(type)}>
              <FontAwesomeIcon icon={faTimes} />
            </button>
          </div>
          <hr
            style={{
              height: '3px'
            }}
          />
        </div>
      );
    }

    return 1;
  };

  const mapTemplatePart = (template: Collectible | Obstacle) => {
    // const x = template.position.x;
    // const y = template.position.y;
    // const z = template.position.z;

    const { x, y, z } = template.position;
    const xScaled = x / 10;
    const yScaled = y / 10;
    const zScaled = z / 10;
    const boxSize = 0.05;

    if (template.type === 'Obstacle') {
      return [
        <mesh position={[xScaled, yScaled, zScaled]}>
          <boxBufferGeometry args={[boxSize, boxSize, boxSize]} attach="geometry" />
          {/* eslint-disable-next-line react/jsx-props-no-spreading */}
          <shaderMaterial attach="material" {...shaderData} />
        </mesh>,
        <PerspectiveCamera makeDefault position={[0, 0, 0.55]} rotation={[0, 0, 0]} />
      ];
    }

    return [
      <mesh position={[xScaled, yScaled, zScaled]}>
        <boxBufferGeometry args={[boxSize, boxSize, boxSize]} attach="geometry">
          <instancedBufferAttribute
            attachObject={['attributes', 'collectibleType']}
            args={[Float32Array.from([template.collectibleType]), 1]}
          />
        </boxBufferGeometry>
        {/* eslint-disable-next-line react/jsx-props-no-spreading */}
        <shaderMaterial attach="material" {...shaderData2} />
      </mesh>,
      <PerspectiveCamera makeDefault position={[0, 0, 0.55]} rotation={[0, 0, 0]} />
    ];
  };

  const renderSidebarItem = (template: number) => {
    if (typeof template === 'number') {
      if (template === 0) {
        return (
          <div className="EditorSideBarObstacle" data-testid="EditorSideBarObstacle">
            <button type="button" onMouseDown={(event) => onSidebarObstacleMouseDown(event)}>
              <Canvas
                gl={{ preserveDrawingBuffer: true }}
                ref={(element) => {
                  sideBarCanvasRef.current[template] = element;
                }}>
                <mesh position={[0, 0, 0]}>
                  <boxBufferGeometry args={[0.25, 0.25, 0.25]} attach="geometry" />
                  {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                  <shaderMaterial attach="material" {...shaderData} />
                </mesh>
                <PerspectiveCamera makeDefault position={[0, 0, 0.55]} rotation={[0, 0, 0]} />
                <directionalLight position={[-5, 20, -35]} />
              </Canvas>
              <p>Obstacle</p>
            </button>
          </div>
        );
      }
      return (
        <div className="EditorSideBarCollectible" data-testid="EditorSideBarCollectible">
          <button
            key={template}
            type="button"
            onMouseDown={(event) =>
              onSidebarCollectibleMouseDown(event, template as CollectibleType)
            }>
            <Canvas
              gl={{ preserveDrawingBuffer: true }}
              ref={(element) => {
                sideBarCanvasRef.current[template] = element;
              }}>
              <mesh position={[0, 0, 0]}>
                <boxBufferGeometry args={[0.25, 0.25, 0.25]} attach="geometry">
                  <instancedBufferAttribute
                    attachObject={['attributes', 'collectibleType']}
                    args={[Float32Array.from([template]), 1]}
                  />
                </boxBufferGeometry>
                {/* eslint-disable-next-line react/jsx-props-no-spreading */}
                <shaderMaterial attach="material" {...shaderData2} />
              </mesh>
              <PerspectiveCamera makeDefault position={[0, 0, 0.55]} rotation={[0, 0, 0]} />
              <directionalLight position={[-5, 20, -35]} />
            </Canvas>
            {template === CollectibleType.All && <p>Basic Collectible</p>}
            {template === CollectibleType.Hands && <p>Hands Collectible</p>}
            {template === CollectibleType.Feet && <p>Feet Collectible</p>}
            {template === CollectibleType.Left && <p>Left Side Collectible</p>}
            {template === CollectibleType.Right && <p>Right Side Collectible</p>}
            {template === CollectibleType.LeftHand && <p>Left Hand Collectible</p>}
            {template === CollectibleType.RightHand && <p>Right Hand Collectible</p>}
            {template === CollectibleType.LeftFoot && <p>Left Foot Collectible</p>}
            {template === CollectibleType.RightFoot && <p>Right Foot Collectible</p>}
          </button>
        </div>
      );
    }
    return 1;
  };

  const saveSidebarRender = () => {
    sideBarCanvasRef.current = sideBarCanvasRef.current.filter((n) => n && n !== 0);
    const itemDataURLs = sideBarCanvasRef.current.map((x) => x.toDataURL());

    if (itemDataURLs.length !== 0) {
      localStorage.setItem('itemRenders', JSON.stringify(itemDataURLs));
      itemRenders.current = itemDataURLs;
    }

    return 1;
  };

  const saveTemplate = () => {
    const obstTemplate = levelObjectRefs.obstacles.current.copy(selected.obstacles.current, false);

    const collTemplate = levelObjectRefs.collectibles.current.copy(
      selected.collectibles.current,
      false
    );

    const template = [...collTemplate, ...obstTemplate];

    templateTypes.push(template);

    const templates = JSON.parse(localStorage.getItem('templates')) || [];
    localStorage.setItem('templates', JSON.stringify([...templates, template]));

    setDummyTemplate(template);
  };

  const saveTemplateRender = (template: Array<Obstacle | Collectible>) => {
    const newTemplateURL = dummyTemplateRef.current.toDataURL();

    const templateHash = hash.sha1(template);

    setRenderMap(new Map(renderMap.set(templateHash, newTemplateURL)));

    localStorage.setItem('renderMap', JSON.stringify(Array.from(renderMap.entries())));
  };

  const renderAtTime = (t: number) => {
    tSince0.current = t;
    ground.current?.animate(t);
    camera.current?.position.setZ(-settings.editorTimeScaleFactor * t + 2.6);
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

  const snapMenuOnWheel = (event: React.WheelEvent) => {
    event.stopPropagation();
    if (event.deltaY < 0) {
      switch (snappingModulusXY) {
        case snappingModuliXY[1]:
          setSnappingXY(snappingModuliXY[0] as any);
          break;
        case snappingModuliXY[2]:
          setSnappingXY(snappingModuliXY[1] as any);
          break;
        default:
          break;
      }
    } else {
      switch (snappingModulusXY) {
        case snappingModuliXY[0]:
          setSnappingXY(snappingModuliXY[1] as any);
          break;
        case snappingModuliXY[1]:
          setSnappingXY(snappingModuliXY[2] as any);
          break;
        default:
          break;
      }
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
          <PerspectiveCamera makeDefault position={[0, 0, 3]} rotation={[0, 0, 0]} ref={camera} />
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
            snappingModulusXY={snappingModulusXY}
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
            <div
              className={`xy-snap-menu ${snapMenuActive ? 'active' : ''}`}
              onClick={(e) => setSnapMenuActive((old) => !old)}
              onWheel={(e) => snapMenuOnWheel(e)}>
              <button type="button">
                {snappingModulusXY === snappingModuliXY[0] && (
                  <img src="/assets/grid-icon-1.svg" alt="grid size 1" />
                )}
                {snappingModulusXY === snappingModuliXY[1] && (
                  <img src="/assets/grid-icon-2.svg" alt="grid size 1" />
                )}
                {snappingModulusXY === snappingModuliXY[2] && (
                  <img src="/assets/grid-icon-3.svg" alt="grid size 1" />
                )}
              </button>
              <div className="dropdown">
                <button
                  className={snappingModulusXY === snappingModuliXY[0] ? 'active' : ''}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnappingXY(snappingModuliXY[0] as any);
                  }}>
                  <img src="/assets/grid-icon-1.svg" alt="grid size 1" />
                </button>
                <button
                  className={snappingModulusXY === snappingModuliXY[1] ? 'active' : ''}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnappingXY(snappingModuliXY[1] as any);
                  }}>
                  <img src="/assets/grid-icon-2.svg" alt="grid size 2" />
                </button>
                <button
                  className={snappingModulusXY === snappingModuliXY[2] ? 'active' : ''}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSnappingXY(snappingModuliXY[2] as any);
                  }}>
                  <img src="/assets/grid-icon-3.svg" alt="grid size 3" />
                </button>
              </div>
            </div>
            <button type="button" onClick={() => copy()}>
              <FontAwesomeIcon icon={faCopy} />
            </button>
            {/* <button type="button" onClick={() => console.log('todo: implement pasting')}>
              <FontAwesomeIcon icon={faPaste} />
            </button> */}
            <button className="" type="button" onClick={saveTemplate} style={{ fontSize: '150%' }}>
              <FontAwesomeIcon style={{ width: '50%' }} icon={faSave} />
              <FontAwesomeIcon style={{ width: '20%' }} icon={faThLarge} />
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
      <button
        key={1}
        type="button"
        style={{ fontSize: '150%' }}
        onMouseDown={(event) => onSidebarTemplateMouseDown(event, dummyTemplate)}>
        <Canvas gl={{ preserveDrawingBuffer: true }} ref={dummyTemplateRef}>
          {dummyTemplate.map(mapTemplatePart)}
        </Canvas>
      </button>
    </div>
  );
};

export default Editor;
