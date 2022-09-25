/* eslint-disable */
import LazyMarkdown from './LazyMarkdown';

export default {
  title: "LazyMarkdown",
};

export const Default = () => <LazyMarkdown url="/legal/Cookie-Policy.md" />;

Default.story = {
  name: 'default',
};
