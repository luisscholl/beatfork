/* eslint-disable */
import SettingsRow from './SettingsRow';

export default {
  title: "SettingsRow",
};

export const Default = () => <SettingsRow title="Title" value="My Title" setter={(e: any)=>{}} type="text" />;

Default.story = {
  name: 'default',
};
