/* eslint-disable react/display-name */
import React, { forwardRef, useImperativeHandle, useRef } from 'react';
import './ProgressIndicator.scss';

const ProgressIndicator = forwardRef((props: { max: number }, ref) => {
  const { max } = props;

  const progressRef = useRef<HTMLProgressElement>();

  useImperativeHandle(ref, () => ({
    animate(t: number) {
      if (progressRef.current) {
        progressRef.current.value = t;
      }
    }
  }));

  return (
    <div className="ProgressIndicator" data-testid="ProgressIndicator">
      <progress ref={progressRef} max={max} />
    </div>
  );
});

export default ProgressIndicator;
