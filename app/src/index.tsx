import React from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import { RecoilRoot } from "recoil";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import App from "./components/App/App";
import * as serviceWorkerRegistration from "./serviceWorkerRegistration";
import reportWebVitals from "./reportWebVitals";
import Credits from "./components/Credits/Credits";
import CalibrationScene from "./components/CalibrationScene/CalibrationScene";

ReactDOM.render(
  <React.StrictMode>
    <RecoilRoot>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/credits" element={<Credits />} />
          <Route path="/calibration" element={<CalibrationScene />} />
        </Routes>
      </Router>
    </RecoilRoot>
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
