import React from 'react';
import ReactDOM from 'react-dom';
import './index.scss';
import { RecoilRoot } from 'recoil';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from 'react-oidc-context';
import ReactMarkdown from 'react-markdown';
import App from './components/App/App';
import * as serviceWorkerRegistration from './serviceWorkerRegistration';
import reportWebVitals from './reportWebVitals';
import Credits from './components/Credits/Credits';
import CalibrationScene from './components/CalibrationScene/CalibrationScene';
import '@fontsource/ubuntu';
import oidcConfig from './config/config.json';
import CloseAccount from './components/CloseAccount/CloseAccount';
import About from './components/About/About';
import Browse from './components/Browse/Browse';
import Profile from './components/Profile/Profile';
import Gameplay from './components/Gameplay/Gameplay';
import Legal from './components/Legal/Legal';
import LazyMarkdown from './components/LazyMarkdown/LazyMarkdown';
import Editor from './components/Editor/Editor';
import GameOver from './components/GameOver/GameOver';
import LevelCompleted from './components/LevelCompleted/LevelCompleted';

ReactDOM.render(
  <React.StrictMode>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <AuthProvider {...(oidcConfig as any)}>
      <RecoilRoot>
        <Router>
          <Routes>
            <Route path="/" element={<App />}>
              <Route path="/close-account" element={<CloseAccount />} />
              <Route index element={<Navigate to={`/about${window.location.search}`} />} />
              <Route path="/about" element={<About />} />
              <Route path="/home" element={<Browse />} />
              <Route path="/browse" element={<Browse />} />
              <Route path="/my-levels" element={<Browse />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/legal" element={<Legal />}>
                <Route index element={<Navigate to="/legal/credits" />} />
                <Route path="/legal/credits" element={<Credits />} />
                <Route
                  path="/legal/tos"
                  element={<LazyMarkdown url="/legal/Terms-of-Service.md" />}
                />
                <Route
                  path="/legal/privacy"
                  element={<LazyMarkdown url="/legal/Privacy-Policy.md" />}
                />
                <Route
                  path="/legal/user-guidelines"
                  element={<LazyMarkdown url="/legal/User Guidelines.md" />}
                />
                <Route
                  path="/legal/cookies"
                  element={<LazyMarkdown url="/legal/Cookie-Policy.md" />}
                />
                <Route
                  path="/legal/legal-guidelines"
                  element={<LazyMarkdown url="/legal/Legal-Guidelines.md" />}
                />
                <Route
                  path="/legal/dmca"
                  element={<LazyMarkdown url="/legal/DMCA Takedown Notice.md" />}
                />
                <Route path="/legal/treat" element={<LazyMarkdown url="/legal/treat.md" />} />
              </Route>
              <Route path="/game-over" element={<GameOver />} />
              <Route path="/level-completed" element={<LevelCompleted />} />
            </Route>
            <Route
              path="/gameplay/:levelId/:versionId"
              element={<Gameplay debug={!!process.env.REACT_APP_DEBUG} />}
            />
            <Route path="/edit" element={<Editor />} />
            <Route path="/calibration" element={<CalibrationScene />} />
          </Routes>
        </Router>
      </RecoilRoot>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById('root')
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
