import GameObject from "./GameObject";

export default interface Collectible extends GameObject {
  collectibleType: CollectibleType;
  type: "Collectible";
}

export enum CollectibleType {
  All = 1,
  Hands = 2,
  Feet = 3,
  Left = 4,
  Right = 5,
  LeftHand = 6,
  RightHand = 7,
  LeftFoot = 8,
  RightFoot = 9,
}
