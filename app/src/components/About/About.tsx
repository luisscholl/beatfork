import React, { FC } from "react";
import NavBar from "../NavBar/NavBar";
import "./About.scss";

interface AboutProps {}

const About: FC<AboutProps> = () => (
  <div className="About" data-testid="About">
    About component
  </div>
);

export default About;
