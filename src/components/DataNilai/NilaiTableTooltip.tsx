import React from "react";

interface NilaiTableTooltipProps {
  visible: boolean;
  content: string;
  x: number;
  y: number;
}

export const NilaiTableTooltip: React.FC<NilaiTableTooltipProps> = ({
  visible,
  content,
  x,
  y,
}) => {
  if (!visible) return null;

  return (
    <div
      className="tp-tooltip absolute -translate-x-1/2"
      style={{ top: `${y}px`, left: `${x}px` }}
    >
      {content}
    </div>
  );
};
