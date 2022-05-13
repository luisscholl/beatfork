import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { RecoilRoot } from "recoil";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "react-oidc-context";
import App from "./components/App/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import Credits from "./components/Credits/Credits";
import CalibrationScene from "./components/CalibrationScene/CalibrationScene";
import "@fontsource/ubuntu";
import oidcConfig from "./config/config.json";

ReactDOM.render(
  <React.StrictMode>
    {/* eslint-disable-next-line react/jsx-props-no-spreading */}
    <AuthProvider {...(oidcConfig as any)}>
      <RecoilRoot>
        <Router>
          <Routes>
            <Route path="/" element={<App />} />
            <Route path="/credits" element={<Credits />} />
            <Route path="/calibration" element={<CalibrationScene />} />
          </Routes>
        </Router>
      </RecoilRoot>
    </AuthProvider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://cra.link/PWA
serviceWorkerRegistration.unregister();

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
