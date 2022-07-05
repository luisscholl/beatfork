import React, { FC } from "react";
import { Outlet } from "react-router-dom";
import "./Legal.scss";

interface LegalProps {}

const Legal: FC<LegalProps> = () => (
  <div className="Legal" data-testid="Legal">
    <div className="menu">
      <a href="/legal/credits">Credits & Licenses</a>
      <a href="/legal/tos">Terms of Service</a>
      <a href="/legal/privacy">Privacy Policy</a>
      <a href="/legal/user-guidelines">User Guidelines</a>
      <a href="/legal/cookies">Cookie Policy</a>
      <a href="/legal/legal-guidelines">Legal Guidelines</a>
      <a href="/legal/dmca">DMCA Takedown Notice</a>
    </div>
    <div className="content">
      <Outlet />
    </div>
  </div>
);

export default Legal;
