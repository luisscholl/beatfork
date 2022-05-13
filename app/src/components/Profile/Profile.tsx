import React, { FC } from "react";
import NavBar from "../NavBar/NavBar";
import "./Profile.scss";

interface ProfileProps {}

const Profile: FC<ProfileProps> = () => (
  <div className="Profile" data-testid="Profile">
    Profile component
  </div>
);

export default Profile;
