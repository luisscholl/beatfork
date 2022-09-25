/* eslint-disable */
import { CollectibleType } from '../../../models/Collectible';
import EditorSideBarCollectible from './EditorSideBarCollectible';

export default {
  title: "EditorSideBarCollectible",
};

export const Default = () => <EditorSideBarCollectible type={CollectibleType.All} />;

Default.story = {
  name: 'default',
};
