import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React, { useState } from 'react';
import { useRecoilState, useRecoilValue } from 'recoil';
import { Link } from 'react-router-dom';
import { faBan, faEdit, faList, faPlay, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'react-oidc-context';
import { viewState } from '../../atoms/viewState';
import './LevelActions.scss';
import { LevelService } from '../../services/LevelService';

const LevelActions = () => {
  const auth = useAuth();

  const view = useRecoilValue(viewState);

  const [showConfirmDeletion, setShowConfirmDeletion] = useState<boolean>(false);

  const deleteLevel = () => {
    LevelService.remove(view.level.id).then(() => {
      window.location.reload();
    });
  };

  const deleteLevelVersion = () => {
    LevelService.remove(view.level.id, view.version).then(() => {
      window.location.reload();
    });
  };

  if (!(view as any).level) return null;

  return (
    <div className="LevelActions" data-testid="LevelActions">
      <div className="columns">
        <button type="button">
          <FontAwesomeIcon icon={faList} />
          Add to playlist
        </button>
        {view.level.author.id === auth.user?.profile.sub ? (
          <Link to={`/edit/${view.level.id}/${view.version}`}>
            <FontAwesomeIcon icon={faEdit} />
            Edit
          </Link>
        ) : (
          <Link to={`/edit/${view.level.id}/${view.version}`}>
            <FontAwesomeIcon icon={faEdit} />
            Remix
          </Link>
        )}
        {view.level.author.id === auth.user?.profile.sub && (
          <button type="button" className="delete" onClick={() => setShowConfirmDeletion(true)}>
            <FontAwesomeIcon icon={faTrash} />
            Delete
          </button>
        )}
      </div>
      <Link to={`/gameplay/${view.level.id}/${view.version}`} className="play">
        <FontAwesomeIcon icon={faPlay} />
        Play
      </Link>
      {showConfirmDeletion && (
        <div className="confirm-deletion">
          <div className="content">
            <p>Are you sure?</p>
            <div className="columns">
              <button type="button" onClick={() => setShowConfirmDeletion(false)}>
                <FontAwesomeIcon icon={faBan} />
                Cancel
              </button>
              <button className="delete" type="button" onClick={deleteLevelVersion}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Version
              </button>
              <button className="delete" type="button" onClick={deleteLevel}>
                <FontAwesomeIcon icon={faTrash} />
                Delete Level
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LevelActions;
