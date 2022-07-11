import { User } from "oidc-client-ts";
import Level from "../models/Level";
import LevelPartial from "../models/LevelPartial";

const levels: Map<string, Level> = new Map();
const levelPartials: Map<string, LevelPartial> = new Map();

export type SearchOptions = {
  currentPage?: number;
  pageSize?: number;
  title?: string;
  author?: string;
  artist?: string;
  minDifficulty?: number;
  maxDifficulty?: number;
  minLength?: number;
  maxLength?: number;
  minPersonalBest?: number;
  maxPersonalBest?: number;
  minRating?: number;
  orderBy?: "rating" | "difficulty" | "length" | "personalBest" | "title";
  direction?: "ascending" | "descending";
};

function getAuthToken() {
  const oidcStorage = localStorage.getItem(
    `oidc.user:<your authority>:<your client id>`
  );
  if (!oidcStorage) {
    return null;
  }

  return User.fromStorageString(oidcStorage)?.access_token;
}

// If version is specified, the returned level is only guaranteed to contain the specified full version. Other values of the version dictionary can be LevelVersionPartials.
function getLevel(id: string, version?: string): Promise<Level> {
  // If level is cached -> Dandy!
  if (levels.get(id)) return new Promise((resolve) => resolve(levels.get(id)));
  const token = getAuthToken();
  const headers = token ? { Authorization: token } : {};

  // If no level partial cached, we need to get the whole level.
  if (typeof version !== "undefined" && levelPartials.get(id)) {
    // If version is cached -> Dandy!
    if (levelPartials.get(id).versions[version]) {
      return new Promise((resolve) => resolve(<Level>levelPartials.get(id)));
    }
    // Get, cache and return version.
    return fetch(`${process.env.REACT_APP_API_URL}/levels/${id}/${version}`, {
      headers,
    })
      .then((result) => result.json())
      .then((result) => {
        const levelPartial = levelPartials.get(version);
        levelPartial.versions[version] = result;
        levelPartials.set(id, levelPartial);
        return levelPartial as Level;
      });
  }
  // Get, cache and return full level.
  return fetch(`${process.env.REACT_APP_API_URL}/levels/${id}`, {
    headers,
  })
    .then((result) => result.json())
    .then((result) => {
      levels.set(id, result);
      return result;
    });
}

function searchLevel(
  options: SearchOptions,
  page: number
): Promise<LevelPartial[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: token } : {};
  let url = `${process.env.REACT_APP_API_URL}/levels?currentPage=${page}`;
  for (const [key, value] of Object.entries(options)) {
    if (["minPersonalBest", "maxPersonalBest"].includes(key) && !token)
      continue;
    if (["title", "author", "artist"].includes(key) && !value) continue;
    url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
  return fetch(url, {
    headers,
  })
    .then((response) => response.json())
    .then((results) => {
      for (const [key, levelPartial] of Object.entries(results.levels)) {
        levelPartials.set(key, levelPartial as LevelPartial);
      }
      return results.levels;
    });
}

export { getLevel, searchLevel };
