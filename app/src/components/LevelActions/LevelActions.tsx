import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useRecoilState } from 'recoil';
import { Link, useNavigate } from 'react-router-dom';
import { faEdit, faList, faPlay } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'react-oidc-context';
import { viewState } from '../../atoms/viewState';
import './LevelActions.scss';

const LevelActions = () => {
  const auth = useAuth();
  const navigate = useNavigate();

  const [view, setView] = useRecoilState(viewState);

  if (!(view as any).level) return null;

  return (
    <div className="LevelActions" data-testid="LevelActions">
      <div className="columns">
        <button type="button">
          <FontAwesomeIcon icon={faList} />
          Add to playlist
        </button>
        <Link to={`/edit/${view.level.id}/${view.version}`}>
          <FontAwesomeIcon icon={faEdit} />
          Edit
        </Link>
      </div>
      <Link to={`/gameplay/${view.level.id}/${view.version}`} className="play">
        <FontAwesomeIcon icon={faPlay} />
        Play
      </Link>
    </div>
  );
};

export default LevelActions;
