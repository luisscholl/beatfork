/* eslint-disable */
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { useState } from 'react';
import Level from '../../models/Level';
import Gameplay from './Gameplay';

export default {
  title: "Gameplay",
  component: Gameplay,
  argTypes: {
    level: { 
      control: {
        type: null
      }
    },
    debug: {
      control: {
        type: "boolean"
      }
    }
  }
} as ComponentMeta<typeof Gameplay>;

import testLevel from '../../../public/levels/Ryan Andersen - One and Only/One and Only.json';

const Template: ComponentStory<typeof Gameplay> = (args) => <Gameplay {...args} />;

export const Default = Template.bind({});
Default.args = {
  level: testLevel as unknown as Level,
  debug: false
};

export const Debug = Template.bind({});
Debug.args = {
  level: testLevel as unknown as Level,
  debug: true
};