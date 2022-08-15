import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import React from 'react';
import { useAuth } from 'react-oidc-context';
import { useRecoilState } from 'recoil';
import { faUser } from '@fortawesome/free-solid-svg-icons';
import { NavLink, useNavigate } from 'react-router-dom';
import { viewState } from '../../atoms/viewState';
import './NavBar.scss';

const links = [
  { name: 'About', link: '/about' },
  { name: 'Home', link: '/home' },
  { name: 'Browse', link: '/browse' },
  { name: 'My Levels', link: '/my-levels' },
  { name: 'Legal', link: '/legal' }
];

const NavBar = () => {
  const auth = useAuth();

  return (
    <div className="NavBar" data-testid="NavBar">
      {links.map((link) => (
        <NavLink to={link.link}>{link.name}</NavLink>
      ))}
      {auth.activeNavigator === 'signinSilent' && <div>Signing you in...</div>}
      {auth.activeNavigator === 'signoutRedirect' && <div>Signing you out...</div>}
      {auth.isLoading && <div>Loading...</div>}
      {auth.error && <div>Oops... {auth.error.message}</div>}
      {auth.isAuthenticated && (
        <NavLink to="/profile">
          {auth.user?.profile.preferred_username} <FontAwesomeIcon icon={faUser} />
        </NavLink>
      )}
      {auth.activeNavigator !== 'signinSilent' &&
        auth.activeNavigator !== 'signinRedirect' &&
        !auth.isLoading &&
        !auth.error &&
        !auth.isAuthenticated && (
          <button type="button" onClick={() => auth.signinRedirect()}>
            Log in
          </button>
        )}
    </div>
  );
};

export default NavBar;
