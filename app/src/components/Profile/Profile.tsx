import React, { FC } from "react";
import { useAuth } from "react-oidc-context";
import NavBar from "../NavBar/NavBar";
import "./Profile.scss";

interface ProfileProps {}

const Profile: FC<ProfileProps> = () => {
  const auth = useAuth();
  return (
    <div className="Profile" data-testid="Profile">
      <button type="button" onClick={() => auth.removeUser()}>
        Log out
      </button>
    </div>
  );
};

export default Profile;
