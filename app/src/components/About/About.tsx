import React, { FC } from "react";
import LazyMarkdown from "../LazyMarkdown/LazyMarkdown";
import NavBar from "../NavBar/NavBar";
import "./About.scss";

interface AboutProps {}

const About: FC<AboutProps> = () => (
  <div className="About" data-testid="About">
    <div className="content">
      <LazyMarkdown url="/about.md" />
    </div>
  </div>
);

export default About;
