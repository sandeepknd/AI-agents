import React from "react";

const TypingDots = () => {
  return (
      <div className="inline-flex gap-1">
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse [animation-delay:-0.3s]"></span>
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
        <span className="w-2 h-2 bg-gray-600 rounded-full animate-pulse"></span>
      </div>
  );
};

export default TypingDots;


