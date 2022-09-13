/* eslint-disable */
import { RecoilRoot, useSetRecoilState } from 'recoil';
import { withRouter } from 'storybook-addon-react-router-v6';
import { viewState } from '../../atoms/viewState';
import LevelCompleted from './LevelCompleted';

export default {
  title: "LevelCompleted",
  component: LevelCompleted,
  decorators: [withRouter]
};

export const Default = () => (
  <RecoilRoot>
    <DefaultHelper />
  </RecoilRoot>
);

const DefaultHelper = () => {
  const setView = useSetRecoilState(viewState);
  setView({
    returnView: '/edit/123/456',
    score: 123456
  });

  return <LevelCompleted />;
};

Default.story = {
  name: 'default',
  parameters: {
    reactRouter: {
      routerPath: '/level-completed/:levelId/:versionId',
      routeParams: {
        levelId: '123',
        versionId: '456'
      }
    }
  }
};
