/* eslint-disable */
import { MeshProps } from '@react-three/fiber';
import { useRef } from 'react';
import { Mesh } from 'three';
import PlayerHologram from './PlayerHologram';

export default {
  title: "PlayerHologram",
};

export const Default = () => {
  const myRef = useRef<Mesh>();
return <PlayerHologram threeRef={useRef} icon = "" />;
}

Default.story = {
  name: 'default',
};
