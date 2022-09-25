/* eslint-disable */
import GameplayObstacle from './GameplayObstacle';

export default {
  title: "GameplayObstacle",
};

export const Default = () => <GameplayObstacle position={{x: 0, y: 0, z: 0}} dimensions={{x: 0.5, y: 0.5, z: 0.5}} />;

Default.story = {
  name: 'default',
};
