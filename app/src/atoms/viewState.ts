/* eslint-disable prettier/prettier */
import { atom } from "recoil";
import Level from "../models/Level";
import LevelPartial from "../models/LevelPartial";

export const viewState = atom({
  key: "view",
  default: {
    view: "browse",
  } as
    | {
      view:
      | "about"
      | "profile"
      | "level-editor"
      | "options"
      | "credits"
    } | {
      view: "gameplay" | "game-over";
      level: Level;
      version: string;
    }
    | {
      view: "level-completed";
      score: number;
      level: Level;
      version: string;
    }
    | {
      view:
      | "home"
      | "browse"
      | "my-levels";
      level?: LevelPartial | Level;
      version?: string;
      showPlaylists: boolean;
      searchCriteria: {
        minDifficulty: number;
        maxDifficulty: number;
        minLength: number;
        maxLength: number;
        minPersonalBest: number;
        maxPersonalBest: number;
        minRating: number;
        maxRating: number;
      }
    },
});
