/* eslint-disable */
import { ComponentMeta, ComponentStory } from '@storybook/react';
import HealthBar from './HealthBar';

export default {
  title: "HealthBar",
  component: HealthBar,
  argTypes: {
    current: { control: 'number' },
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
} as ComponentMeta<typeof HealthBar>;

const Template: ComponentStory<typeof HealthBar> = (args) => <HealthBar {...args} />;

export const Default = Template.bind({});

Default.args = {
  current: 85,
  max: 100
};
