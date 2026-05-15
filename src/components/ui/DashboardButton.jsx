import React from "react";
import { Link } from "react-router-dom";
import styled from "styled-components";

const DashboardButton = ({ to, children = "Get started", className, compact = false, ...props }) => {
  const inner = (
    <>
      {children}
      <div className="icon">
        <svg height={24} width={24} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M0 0h24v24H0z" fill="none" />
          <path d="M16.172 11l-5.364-5.364 1.414-1.414L20 12l-7.778 7.778-1.414-1.414L16.172 13H4v-2z" fill="currentColor" />
        </svg>
      </div>
    </>
  );

  return (
    <StyledWrapper className={className} $compact={compact}>
      {to ? (
        <Link to={to} className="cssbuttons-io-button" {...props}>
          {inner}
        </Link>
      ) : (
        <button type="button" className="cssbuttons-io-button" {...props}>
          {inner}
        </button>
      )}
    </StyledWrapper>
  );
};

const StyledWrapper = styled.div`
  .cssbuttons-io-button {
    background: #a370f0;
    color: white;
    font-family: inherit;
    padding: 0.35em;
    padding-left: 1.2em;
    font-size: 17px;
    font-weight: 500;
    border-radius: 0.9em;
    border: none;
    letter-spacing: 0.05em;
    display: flex;
    align-items: center;
    box-shadow: inset 0 0 1.6em -0.6em #714da6;
    overflow: hidden;
    position: relative;
    height: 2.8em;
    padding-right: 3.3em;
    cursor: pointer;
    text-decoration: none;
    box-sizing: border-box;
  }

  .cssbuttons-io-button .icon {
    background: white;
    margin-left: 1em;
    position: absolute;
    display: flex;
    align-items: center;
    justify-content: center;
    height: 2.2em;
    width: 2.2em;
    border-radius: 0.7em;
    box-shadow: 0.1em 0.1em 0.6em 0.2em #7b52b9;
    right: 0.3em;
    transition: all 0.3s;
  }

  .cssbuttons-io-button:hover .icon {
    width: calc(100% - 0.6em);
  }

  .cssbuttons-io-button .icon svg {
    width: 1.1em;
    transition: transform 0.3s;
    color: #7b52b9;
  }

  .cssbuttons-io-button:hover .icon svg {
    transform: translateX(0.1em);
  }

  .cssbuttons-io-button:active .icon {
    transform: scale(0.95);
  }

  ${(p) =>
    p.$compact &&
    `
    .cssbuttons-io-button {
      font-size: 0.78rem;
      height: 32px;
      padding: 0.5em;
      padding-left: 0.9em;
      padding-right: 2.35em;
      letter-spacing: 0.02em;
      border-radius: 9999px;
    }

    .cssbuttons-io-button .icon {
      height: 24px;
      width: 24px;
      margin-left: 0.55em;
      right: 0.22em;
      border-radius: 9999px;
    }

    .cssbuttons-io-button .icon svg {
      width: 0.85em;
    }
  `}
`;

export default DashboardButton;
