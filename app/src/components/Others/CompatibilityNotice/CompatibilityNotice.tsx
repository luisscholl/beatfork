import { faWindowClose } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { detect } from 'detect-browser';
import React, { FC, useState } from 'react';
import './CompatibilityNotice.scss';

const chromiumBrowsers = ['chrome', 'edge-chromium'];

interface CompatibilityNoticeProps {}

const CompatibilityNotice: FC<CompatibilityNoticeProps> = () => {
  const [hide, setHide] = useState<boolean>(!!localStorage.getItem('hideCompatibilityNotice'));
  const browser = detect();

  if (hide) return null;
  if (chromiumBrowsers.includes(browser.name)) return null;

  return (
    <div className="CompatibilityNotice" data-testid="CompatibilityNotice">
      <p>
        BeatFork works best using a recent version of a Chromium-based browser, e.g. Google Chrome.
        <br />
        This is, because of the pose detection solution we use.
        <br />
        Gameplay performance is much worse on non-Chromium-based browsers.
      </p>
      <button
        type="button"
        onClick={() => {
          localStorage.setItem('hideCompatibilityNotice', 'true');
          setHide(true);
        }}>
        <FontAwesomeIcon icon={faWindowClose} />
      </button>
    </div>
  );
};

export default CompatibilityNotice;
