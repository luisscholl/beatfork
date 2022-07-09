/* eslint-disable prettier/prettier */
import { atom } from "recoil";
import Level from "../models/Level";
import LevelPartial from "../models/LevelPartial";

export const viewState = atom({
  key: "view",
  default: {
    returnView: "/browse"
  } as
    | {
      level?: LevelPartial | Level;
      version?: string;
      score?: number;
      returnView: string;
    },
});
