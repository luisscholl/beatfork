import React, { FC, useState } from "react";
import ReactMarkdown from "react-markdown";
import "./LazyMarkdown.scss";
import remarkGfm from "remark-gfm";

interface LazyMarkdownProps {
  url: string;
}

const LazyMarkdown: FC<LazyMarkdownProps> = ({ url }) => {
  const [content, setContent] = useState("Loading...");
  fetch(url)
    .then((response) => response.text())
    .then((response) => setContent(response));

  return <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>;
};

export default LazyMarkdown;
