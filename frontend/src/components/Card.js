/**
 * Reusable Card component
 */

import React from 'react';

function Card({ title, children, className = '', style = {} }) {
  return (
    <div className={`card ${className}`} style={style}>
      {title && <h2>{title}</h2>}
      {children}
    </div>
  );
}

export default Card;
