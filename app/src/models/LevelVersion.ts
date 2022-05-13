import Collectible from "./Collectible";
import Obstacle from "./Obstacle";

export default interface LevelVersion {
  self: string;
  id: number;
  difficulty: number;
  objects: Array<Collectible | Obstacle>;
}
