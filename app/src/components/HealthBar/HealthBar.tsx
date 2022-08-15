import React from 'react';
import './HealthBar.scss';

const HealthBar = (props: any) => {
  const { current, max } = props;

  return (
    <div className="HealthBar" data-testid="HealthBar">
      <progress value={current} max={max} />
    </div>
  );
};

export default HealthBar;
