import React, { useState, cloneElement, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export default function Tooltip({ children }) {
  const [tooltip, setTooltip] = useState({ content: null, visible: false, x: 0, y: 0, opacity: 0 });
  const tooltipRef = useRef(null);

  const handleMouseEnter = (event, content) => {
    setTooltip({
      content,
      visible: true,
      x: event.clientX,
      y: event.clientY + 10,
      opacity: 0,
    });

    setTimeout(() => {
      setTooltip((prev) => ({ ...prev, opacity: 1 }));
    }, 50); // Плавное появление
  };

  const handleMouseMove = (event) => {
    if (!tooltip.visible) return;

    const tooltipWidth = tooltipRef.current ? tooltipRef.current.offsetWidth : 0;
    const tooltipHeight = tooltipRef.current ? tooltipRef.current.offsetHeight : 0;

    let x = event.clientX;
    let y = event.clientY + 10;

    if (x + tooltipWidth > window.innerWidth) {
      x = event.clientX - tooltipWidth - 10;
    } else if (x - tooltipWidth < 0) {
      x = event.clientX + 10;
    }

    if (y + tooltipHeight > window.innerHeight) {
      y = event.clientY - tooltipHeight - 10;
    }

    setTooltip((prev) => ({
      ...prev,
      x,
      y,
    }));
  };

  const handleMouseLeave = () => {
    setTooltip((prev) => ({ ...prev, opacity: 0 }));
    setTimeout(() => {
      setTooltip({ content: null, visible: false, x: 0, y: 0, opacity: 0 });
    }, 200); // Плавное исчезновение
  };

  useEffect(() => {
    if (tooltip.visible && tooltipRef.current) {
      const { width, height } = tooltipRef.current.getBoundingClientRect();
      setTooltip((prev) => ({
        ...prev,
        width,
        height,
      }));
    }
  }, [tooltip.visible]);

  return (
    <>
      {React.Children.map(children, (child) =>
        child.props.tooltip
          ? cloneElement(child, {
              onMouseEnter: (e) => handleMouseEnter(e, child.props.tooltip),
              onMouseMove: handleMouseMove,
              onMouseLeave: handleMouseLeave,
            })
          : child
      )}

      {tooltip.visible &&
        createPortal(
          <div
            ref={tooltipRef}
            className="tooltip"
            style={{
              position: "fixed",
              left: `${tooltip.x}px`,
              top: `${tooltip.y}px`,
              transform: "translateX(-50%)",
              pointerEvents: "none",
              background: "black",
              color: "white",
              padding: "5px",
              borderRadius: "5px",
              zIndex: 99999,
              opacity: tooltip.opacity,
              transition: "opacity 0.2s ease-in-out",
            }}
          >
            {tooltip.content}
          </div>,
          document.body
        )}
    </>
  );
}
