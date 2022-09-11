import React from 'react';
import { useRecoilState } from 'recoil';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCaretLeft, faPlus } from '@fortawesome/free-solid-svg-icons';
import { useAuth } from 'react-oidc-context';
import { useNavigate } from 'react-router-dom';
import { viewState } from '../../atoms/viewState';
import LevelVersionPartial from '../../models/LevelVersionPartial';
import './LevelDifficulty.scss';
import Level from '../../models/Level';
import LevelPartial from '../../models/LevelPartial';
import { LevelService } from '../../services/LevelService';

const LevelDifficulty = () => {
  const auth = useAuth();
  const navigate = useNavigate();
  const [view, setView] = useRecoilState(viewState);

  const addVersion = () => {
    LevelService.addVersion(
      view.level.id,
      view.level.title,
      view.level.bpm,
      view.level.audioLinks[0]
    ).then((versionId) => {
      navigate(`/edit/${view.level.id}/${versionId}`);
    });
  };

  if (!(view as any).level) return null;
  if (!(view as any).version)
    setView((old) => {
      return {
        ...old,
        version: Object.values(((view as any).level as LevelPartial | Level).versions)[0].id
      };
    });

  let _versions = Object.values(
    JSON.parse(JSON.stringify((view as any).level.versions)) as {
      [key: string]: LevelVersionPartial;
    }
  );
  _versions = _versions.sort((a, b) => a.difficulty - b.difficulty);

  return (
    <div className="LevelDifficulty" data-testid="LevelDifficulty">
      {_versions.map((version) => (
        <div
          key={version.id}
          className={`row-wrapper ${(view as any).version === version.id ? 'active' : ''}`}>
          <button
            type="button"
            onClick={() => setView({ ...view, version: version.id } as any)}
            className={`number difficulty${version.difficulty}`}>
            {version.difficulty}
          </button>
          <button
            type="button"
            onClick={() => setView({ ...view, version: version.id } as any)}
            className="boxes">
            {Array.from({ length: 20 }, (v, k) => (
              <span
                className={k < version.difficulty ? `difficulty${version.difficulty}` : 'grey'}
              />
            ))}
          </button>
          <div className="icon-wrapper">
            <FontAwesomeIcon icon={faCaretLeft} />
          </div>
        </div>
      ))}
      {view.level.author.id === auth.user?.profile.sub && (
        <button type="button" className="add-version" onClick={addVersion}>
          <FontAwesomeIcon icon={faPlus} />
          New Version
        </button>
      )}
    </div>
  );
};

export default LevelDifficulty;
