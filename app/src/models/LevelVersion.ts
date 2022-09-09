import Collectible from './Collectible';
import Obstacle from './Obstacle';

export default interface LevelVersion {
  id: string;
  difficulty: number;
  objects: Array<Collectible | Obstacle>;
}

export interface UploadLevelVersion {
  id: number;
  difficulty: number;
  objects: Array<Collectible | Obstacle>;
}
