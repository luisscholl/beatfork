/* eslint-disable react/no-unused-prop-types */
import React from 'react';
import './SettingsRow.scss';

const SettingsRow = (props: {
  title: string;
  value: any;
  setter: (value: any) => void;
  type: 'text' | 'number';
}) => {
  const handleInput = (e: any) => {
    props.setter(e.target.value);
  };
  return (
    <div className="SettingsRow" data-testid="SettingsRow">
      <p>{props.title}</p>
      <input type={props.type} value={props.value} onInput={handleInput} />
    </div>
  );
};

export default SettingsRow;
