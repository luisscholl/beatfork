import React from 'react';
import { useRecoilState } from 'recoil';
import { searchCriteriaState } from '../../atoms/searchCriteriaState';
import './SearchBar.scss';

const SearchBar = () => {
  const [searchCriteria, setSearchCriteria] = useRecoilState(searchCriteriaState);
  return (
    <div className="SearchBar" data-testid="SearchBar">
      <input
        type="text"
        placeholder="Search..."
        onChange={(e) => {
          let title = e.target.value;
          let artist = '';
          title = title.replace(/(.*)artist:"(.+?)".*/, (match, prefix, artistLocal, suffix) => {
            artist = artistLocal;
            return prefix + suffix;
          });
          title = title.replace(/(.*)artist:"(.+?)$/, (match, prefix, artistLocal) => {
            artist = artistLocal;
            return prefix;
          });
          let author = '';
          title = title.replace(/(.*)author:"(.+?)".*/, (match, prefix, authorLocal, suffix) => {
            author = authorLocal;
            return prefix + suffix;
          });
          title = title.replace(/(.*)author:"(.+?)$/, (match, prefix, authorLocal) => {
            author = authorLocal;
            return prefix;
          });
          setSearchCriteria((old) => {
            return {
              ...old,
              title,
              artist,
              author
            };
          });
        }}
      />
    </div>
  );
};

export default SearchBar;
