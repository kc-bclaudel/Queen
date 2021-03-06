import React, { useCallback } from 'react';
import PropTypes from 'prop-types';
import D from 'i18n';
import insee from 'img/insee.png';
import Navigation from '../navigation';
import CloseIcon from './quit.icon';
import BreadcrumbQueen from '../breadcrumb';
import { StyleWrapper } from './header.style.js';

const Header = ({
  standalone,
  title,
  quit,
  sequence,
  subsequence,
  components,
  bindings,
  setPage,
}) => {
  const setToFirstPage = useCallback(() => setPage(1), [setPage]);

  return (
    <StyleWrapper className={`${standalone ? 'standalone' : ''}`}>
      <Navigation title={title} components={components} bindings={bindings} setPage={setPage} />
      <div className="header-item">
        <button
          type="button"
          className="insee-icon"
          title={D.backToBeginning}
          onClick={setToFirstPage}
        >
          <img id="logo" src={insee} alt="Insee-logo" className="header-logo" />
        </button>
      </div>
      <div className="header-item header-title">
        <span id="header-title">{title}</span>
        {sequence && <BreadcrumbQueen sequence={sequence} subsequence={subsequence} />}
      </div>
      {!standalone && (
        <div className="header-item header-close">
          <button type="button" className="close-icon" onClick={quit}>
            <CloseIcon width={40} />
          </button>
        </div>
      )}
    </StyleWrapper>
  );
};

Header.propTypes = {
  title: PropTypes.string.isRequired,
};

export default Header;
