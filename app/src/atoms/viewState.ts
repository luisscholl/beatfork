/* eslint-disable prettier/prettier */
import { atom } from "recoil";
import Level from "../models/Level";

export const viewState = atom({
  key: "view",
  default: {
    view: "main-menu",
  } as
    | {
      view:
      | "main-menu"
      | "level-select"
      | "level-editor"
      | "options"
      | "credits"
    } | {
      view: "gameplay" | "game-over";
      level: Level;
    }
    | {
      view: "level-completed";
      score: number;
      level: Level;
    },
});
