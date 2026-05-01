import * as React from 'react';

const Search = ({ color = 'currentColor', style, ...props }) => (
    <svg
    width="100%"
    height="100%"
    viewBox="0 0 512 512"
    xmlns="http://www.w3.org/2000/svg"
    xmlnsXlink="http://www.w3.org/1999/xlink"
    xmlSpace="preserve"
    xmlns:serif="http://www.serif.com/"
    style={{
      fillRule: "evenodd",
      clipRule: "evenodd",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      strokeMiterlimit: 1.5,
      color,
      ...style,
    }}
    {...props}
  >
    <g transform="matrix(-0.861814,0.507225,-0.507225,-0.861814,571.439136,282.486847)">
      <path
        d="M299.077,96.355C288.477,93.862 277.625,92.603 266.737,92.603C188.777,92.603 125.484,155.896 125.484,233.856C125.484,311.815 188.777,375.109 266.737,375.109C344.696,375.109 407.99,311.815 407.99,233.856C407.99,196.393 393.108,160.465 366.617,133.975C393.108,160.465 407.99,196.393 407.99,233.856C407.99,311.815 344.696,375.109 266.737,375.109C188.777,375.109 125.484,311.815 125.484,233.856C125.484,155.896 188.777,92.603 266.737,92.603C277.625,92.603 288.477,93.862 299.077,96.355Z"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "32.5px",
        }}
      />
    </g>
    <g transform="matrix(0.786265,0,0,0.786265,114.26342,113.064153)">
      <path
        d="M256,266.05L401.99,412.04"
        style={{
          fill: "none",
          stroke: "currentColor",
          strokeWidth: "41.33px",
        }}
      />
    </g>
  </svg>
);
export default Search;