import { User } from 'oidc-client-ts';
import Level, { UploadLevel } from '../models/Level';
import LevelPartial from '../models/LevelPartial';
import LevelVersion from '../models/LevelVersion';
import LevelVersionPartial from '../models/LevelVersionPartial';
import oidcConfig from '../config/config.json';

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
  orderBy?: 'averageRating' | 'difficulty' | 'length' | 'personalBest' | 'title';
  direction?: 'ascending' | 'descending';
};

function getAuthToken() {
  const oidcStorage = sessionStorage.getItem(
    `oidc.user:${oidcConfig.authority}:${oidcConfig.client_id}`
  );
  if (!oidcStorage) {
    return null;
  }

  return `Bearer ${User.fromStorageString(oidcStorage)?.access_token}`;
}

// If version is specified, the returned level is only guaranteed to contain the specified full version. Other values of the version dictionary can be LevelVersionPartials.
function get(id: string, version?: string): Promise<Level> {
  // If level is cached -> Dandy!
  if (levels.get(id))
    return new Promise((resolve) => {
      resolve(levels.get(id));
    });
  const token = getAuthToken();
  const headers = token ? { Authorization: token } : {};

  // If no level partial cached, we need to get the whole level.
  if (typeof version !== 'undefined' && levelPartials.get(id)) {
    // If version is cached -> Dandy!
    if ((levelPartials.get(id).versions[version] as any).objects) {
      return new Promise((resolve) => {
        resolve(<Level>levelPartials.get(id));
      });
    }
    // Get, cache and return version.
    return fetch(`${process.env.REACT_APP_API_URL}/levels/${id}/${version}`, {
      headers
    })
      .then((result) => result.json())
      .then((result) => {
        const levelPartial = JSON.parse(JSON.stringify(levelPartials.get(id)));
        levelPartial.versions[version] = result;
        levelPartials.set(id, levelPartial);
        return levelPartial as Level;
      });
  }
  // Get, cache and return full level.
  return fetch(`${process.env.REACT_APP_API_URL}/levels/${id}`, {
    headers
  })
    .then((result) => result.json())
    .then((result) => {
      const versions: { [key: string]: LevelVersion } = {};
      for (const v of result.versions) {
        versions[v.id] = v;
      }
      result.versions = versions;
      levels.set(id, result);
      return result;
    });
}

function search(options: SearchOptions, page: number): Promise<LevelPartial[]> {
  const token = getAuthToken();
  const headers = token ? { Authorization: token } : {};
  let url = `${process.env.REACT_APP_API_URL}/levels?currentPage=${page}`;
  for (const [key, value] of Object.entries(options)) {
    if (['minPersonalBest', 'maxPersonalBest'].includes(key) && !token) continue;
    if (['title', 'author', 'artist'].includes(key) && !value) continue;
    url += `&${encodeURIComponent(key)}=${encodeURIComponent(value)}`;
  }
  return fetch(url, {
    headers
  })
    .then((response) => response.json())
    .then((result) => {
      result.levels = result.levels.map((levelPartial: any) => {
        if (levelPartials.get(levelPartial.id)) return levelPartials.get(levelPartial.id);
        const versions: { [key: string]: LevelVersionPartial } = {};
        for (const v of (levelPartial as any).versions) {
          versions[v.id] = v;
        }
        (levelPartial as any).versions = versions;
        levelPartials.set(levelPartial.id, levelPartial as LevelPartial);
        return levelPartial;
      });
      return result.levels;
    });
}

function upsertVersion(levelId: string, version: LevelVersion) {
  console.log('todo');
}

function upload(level: UploadLevel) {
  const token = getAuthToken();
  const options: any = {};
  options.headers = token ? { Authorization: token } : {};
  options.headers['Content-Type'] = 'application/json';
  options.method = 'POST';
  options.body = JSON.stringify(level);
  return fetch(`${process.env.REACT_APP_API_URL}/levels`, options);
}

function isAuthor(levelId: string) {
  console.log('todo');
}

function remove(levelId: string) {
  const url = `${process.env.REACT_APP_API_URL}/levels/${levelId}`;
  const token = getAuthToken();
  const options: any = {};
  options.headers = token ? { Authorization: token } : {};
  options.method = 'DELETE';
  return fetch(url, options);
}

const LevelService = {
  get,
  search,
  upsertVersion,
  upload,
  isAuthor,
  remove
};

export { LevelService };
