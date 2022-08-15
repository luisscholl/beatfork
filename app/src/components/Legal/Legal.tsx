import React, { FC } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import './Legal.scss';

interface LegalProps {}

const Legal: FC<LegalProps> = () => (
  <div className="Legal" data-testid="Legal">
    <div className="menu">
      <NavLink to="/legal/credits">
        <span>Credits & Licenses</span>
      </NavLink>
      <NavLink to="/legal/tos">
        <span>Terms of Service</span>
      </NavLink>
      <NavLink to="/legal/privacy">
        <span>Privacy Policy</span>
      </NavLink>
      <NavLink to="/legal/user-guidelines">
        <span>User Guidelines</span>
      </NavLink>
      <NavLink to="/legal/cookies">
        <span>Cookie Policy</span>
      </NavLink>
      <NavLink to="/legal/legal-guidelines">
        <span>Legal Guidelines</span>
      </NavLink>
      <NavLink to="/legal/dmca">
        <span>DMCA Takedown Notice</span>
      </NavLink>
    </div>
    <div className="content-wrapper">
      <div className="content">
        <Outlet />
      </div>
    </div>
  </div>
);

export default Legal;
