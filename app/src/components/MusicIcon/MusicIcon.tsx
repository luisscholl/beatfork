import React from 'react';
import './MusicIcon.scss';

const MusicIcon = (props: {
  type:
    | 'quarter-note'
    | 'eight-note'
    | 'sixteenth-note'
    | 'thirty-second-note'
    | 'triplet'
    | 'free-placement';
}) => {
  return (
    <div className="MusicIcon" data-testid="MusicIcon">
      {props.type === 'quarter-note' && <p>&#xE1D5;</p>}
      {props.type === 'eight-note' && <p>&#xE1D7;</p>}
      {props.type === 'sixteenth-note' && <p>&#xE1D9;</p>}
      {props.type === 'thirty-second-note' && <p>&#xE1DB;</p>}
      {props.type === 'triplet' && (
        <p style={{ transform: 'translateY(0.6em)' }}>&#xE201;&#xE202;&#xE203;</p>
      )}
      {props.type === 'free-placement' && (
        <p style={{ transform: 'translateY(-0.4em)' }}>&#xE0A9;</p>
      )}
    </div>
  );
};

export default MusicIcon;
