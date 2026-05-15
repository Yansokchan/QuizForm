import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';

const HeroButton = ({ to, children = 'Apply Now' }) => {
  const inner = (
    <span className="button-inner">
      {children}
      <svg fill="currentColor" viewBox="0 0 24 24" className="icon" aria-hidden="true">
        <path clipRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z" fillRule="evenodd" />
      </svg>
    </span>
  );

  return (
    <StyledWrapper>
      {to ? (
        <Link to={to} className="button">
          {inner}
        </Link>
      ) : (
        <button type="button" className="button">
          {inner}
        </button>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .button {
    position: relative;
    isolation: isolate;
    transition: transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
    padding-block: 0.5rem;
    padding-inline: 1.25rem;
    background: linear-gradient(180deg, #a855f7 0%, #7c3aed 46%, #5b21b6 100%);
    border-radius: 9999px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    color: #fff;
    text-decoration: none;
    font-weight: 400;
    border: none;
    outline: none;
    overflow: hidden;
    font-size: 15px;
    -webkit-tap-highlight-color: transparent;
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.33),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(91, 33, 182, 0.65),
      0 0 0 2px rgba(255, 255, 255, 0.14),
      0 10px 26px -6px rgba(76, 29, 149, 0.55);
  }

  .button-inner {
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
  }

  .icon {
    width: 24px;
    height: 24px;
    transition: all 0.3s ease-in-out;
  }

  .button:hover {
    transform: scale(1.05);
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.4),
      inset 0 -1px 0 rgba(0, 0, 0, 0.16),
      0 0 0 1px rgba(91, 33, 182, 0.55),
      0 0 0 2px rgba(255, 255, 255, 0.2),
      0 14px 32px -6px rgba(76, 29, 149, 0.58);
  }

  .button:focus-visible {
    box-shadow:
      inset 0 1px 0 rgba(255, 255, 255, 0.33),
      inset 0 -1px 0 rgba(0, 0, 0, 0.2),
      0 0 0 1px rgba(91, 33, 182, 0.65),
      0 0 0 2px rgba(255, 255, 255, 0.14),
      0 10px 26px -6px rgba(76, 29, 149, 0.55),
      0 0 0 3px rgba(196, 181, 253, 0.75);
  }

  .button:hover .icon {
    transform: translate(4px);
  }

  .button:hover::before {
    animation: shine 1.5s ease-out infinite;
  }

  .button::before {
    content: "";
    position: absolute;
    z-index: 0;
    pointer-events: none;
    width: 100px;
    height: 100%;
    border-radius: inherit;
    background-image: linear-gradient(
      120deg,
      rgba(255, 255, 255, 0) 28%,
      rgba(255, 255, 255, 0.45),
      rgba(255, 255, 255, 0) 72%
    );
    top: 0;
    left: -100px;
    opacity: 0.45;
  }

  @keyframes shine {
    0% {
      left: -100px;
    }

    60% {
      left: 100%;
    }

    to {
      left: 100%;
    }
  }`;

export default HeroButton;
