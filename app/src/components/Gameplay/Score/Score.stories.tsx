/* eslint-disable */
import { ComponentMeta, ComponentStory } from '@storybook/react';
import Score from './Score';

export default {
  title: "Score",
  component: Score,
  argTypes: {
    score: { control: 'number' },
    multiplier: { control: 'number' }
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
} as ComponentMeta<typeof Score>;

const Template: ComponentStory<typeof Score> = (args) => <Score {...args} />;

export const Default = Template.bind({});
Default.args = {
  score: 1234567890,
  multiplier: 2.31111111111111111111
};