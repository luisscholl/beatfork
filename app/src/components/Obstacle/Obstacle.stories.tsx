/* eslint-disable */
import Obstacle from './Obstacle';

export default {
  title: "Obstacle",
};

export const Default = () => <Obstacle position={{x: 0, y: 0, z: 0}} dimensions={{x: 0.5, y: 0.5, z: 0.5}}/>;

Default.story = {
  name: 'default',
};
