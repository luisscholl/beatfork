/* eslint-disable */
import { ComponentMeta, ComponentStory } from '@storybook/react';
import ProgressIndicator from './ProgressIndicator';

export default {
  title: "ProgressIndicator",
  component: ProgressIndicator,
  argTypes: {
    max: { control: 'number' }
  },
  parameters: {
    backgrounds: {
      default: 'sky',
      values: [
        {
          name: 'sky',
          value: '#158ed4'
        }
      ]
    }
  }
} as ComponentMeta<typeof ProgressIndicator>;

const Template: ComponentStory<typeof ProgressIndicator> = (args) => <ProgressIndicator {...args} />;

export const Default = Template.bind({});

Default.args = {
  max: 100
};
