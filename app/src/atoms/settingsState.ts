import { atom } from "recoil";

export const settingsState = atom({
  key: "settings",
  default: {
    mediaPipeResolution: 512,
    gamePlaytimeScaleFactor: 7,
    editorTimeScaleFactor: 2,
    hologramScale: 0.8,
  } as {
    mediaPipeResolution: number;
    gamePlaytimeScaleFactor: number;
    editorTimeScaleFactor: number;
    hologramScale: 0.8;
  },
});
