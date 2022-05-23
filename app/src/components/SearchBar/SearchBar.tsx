import React from "react";
import "./SearchBar.scss";

const SearchBar = () => (
  <div className="SearchBar" data-testid="SearchBar">
    <input type="text" placeholder="Search..." />
  </div>
);

export default SearchBar;
