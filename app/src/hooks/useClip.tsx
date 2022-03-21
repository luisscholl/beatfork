import { useRef, useEffect } from "react";
import Collectible from "../models/Collectible";
import GameObject from "../models/GameObject";
import Obstacle from "../models/Obstacle";

function useClip(
  orderedGameObjects: Array<Obstacle | Collectible>,
  clipStart: number,
  clipEnd: number
) {
  const index = useRef<number>(1);
  const clippedObjects =
    useRef<Array<Obstacle | Collectible>>(orderedGameObjects);

  useEffect(() => {
    index.current = 1;
    clippedObjects.current = [];
  }, [orderedGameObjects]);
}
