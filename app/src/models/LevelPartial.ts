import Artist from "./Artist";
import LevelVersionPartial from "./LevelVersionPartial";
import User from "./User";

export default interface LevelPartial {
  id: string;
  title: string;
  bpm: number; // bpm is insufficient
  // This array is sorted by first appearance of the object in a level
  // x and y coordinates are within [-1, 1] and represent the horizontal and vertical placement of the lower left edge of a GameObject in the level.
  // The z coordinate specifies the time relative to the beginning of the audio file at which a GameObject's front edge is placed.
  published: boolean;
  rating?: number;
  artists: Artist[];
  author: User;
  versions: {
    [key: string]: LevelVersionPartial;
  };
  audioLinks: string[]; // URL
  length: number;
  // todo: styling?
  // todo: difficulty
}
