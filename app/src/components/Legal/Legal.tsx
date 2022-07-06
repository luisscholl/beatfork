import React, { FC } from "react";
import { Link, Outlet } from "react-router-dom";
import "./Legal.scss";

interface LegalProps {}

const Legal: FC<LegalProps> = () => (
  <div className="Legal" data-testid="Legal">
    <div className="menu">
      <Link to="/legal/credits">Credits & Licenses</Link>
      <Link to="/legal/tos">Terms of Service</Link>
      <Link to="/legal/privacy">Privacy Policy</Link>
      <Link to="/legal/user-guidelines">User Guidelines</Link>
      <Link to="/legal/cookies">Cookie Policy</Link>
      <Link to="/legal/legal-guidelines">Legal Guidelines</Link>
      <Link to="/legal/dmca">DMCA Takedown Notice</Link>
    </div>
    <div className="content-wrapper">
      <div className="content">
        <Outlet />
      </div>
    </div>
  </div>
);

export default Legal;
