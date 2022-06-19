/* eslint-disable prettier/prettier */
import { atom } from "recoil";
import Level from "../models/Level";
import LevelPartial from "../models/LevelPartial";

export const searchCriteriaState = atom({
  key: "search-criteria",
  default: {
    showPlaylists: false,
    minDifficulty: 1,
    maxDifficulty: 20,
    minLength: 0,
    maxLength: 300,
    minPersonalBest: 0,
    maxPersonalBest: 100,
    minRating: 0,
    orderBy: "rating",
    direction: "ascending",
    title: "",
    author: "",
    artist: ""
  } as {
    showPlaylists: boolean;
    minDifficulty: number;
    maxDifficulty: number;
    minLength: number;
    maxLength: number;
    minPersonalBest: number;
    maxPersonalBest: number;
    minRating: number;
    orderBy: "rating" | "difficulty" | "length" | "title" | "personalBest";
    direction: "ascending" | "descending";
    title: string;
    author: string;
    artist: string;
  }
});