/* eslint-disable */
import { useRef } from 'react';
import Ground from './Ground';

export default {
  title: "Ground",
};

const ref = useRef();
export const Default = () => <Ground ref={ref} bpm={120} timeScaleFactor={3} />;

Default.story = {
  name: 'default',
};
