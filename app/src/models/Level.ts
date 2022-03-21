import Collectible from "./Collectible";
import Obstacle from "./Obstacle";

export default interface Level {
  id: string;
  title: string;
  bpm: number; // bpm is insufficient
  // This array is sorted by first appearance of the object in a level
  // x and y coordinates are within [-1, 1] and represent the horizontal and vertical placement of the lower left edge of a GameObject in the level.
  // The z coordinate specifies the time relative to the beginning of the audio file at which a GameObject's front edge is placed.
  objects: Array<Collectible | Obstacle>;
  audio: string; // URL
  // todo: styling?
  // todo: difficulty
}
