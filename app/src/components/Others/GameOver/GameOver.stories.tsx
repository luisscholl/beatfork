/* eslint-disable */
import { RecoilRoot } from 'recoil';
import { withRouter } from 'storybook-addon-react-router-v6';
import GameOver from './GameOver';

export default {
  title: "GameOver",
  component: GameOver,
  decorators: [withRouter]
};

export const Default = () => (
  <RecoilRoot>
    <GameOver />
  </RecoilRoot>
);

Default.story = {
  name: 'default',
  parameters: {
    reactRouter: {
      routerPath: '/game-over/:levelId/:versionId',
      routeParams: {
        levelId: '123',
        versionId: '456'
      }
    }
  }
};
