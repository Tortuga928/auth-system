/**
 * Reusable Button component
 */

import React from 'react';

function Button({ type = 'button', variant = 'primary', children, onClick, disabled, className = '', style = {} }) {
  const buttonClass = `btn btn-${variant} ${className}`;

  return (
    <button
      type={type}
      className={buttonClass}
      onClick={onClick}
      disabled={disabled}
      style={style}
    >
      {children}
    </button>
  );
}

export default Button;
