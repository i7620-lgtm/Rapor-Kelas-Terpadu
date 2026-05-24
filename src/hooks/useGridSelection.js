import React, { useState, useEffect, useCallback, useRef } from "react";

export function useGridSelection({ rowsCount, colsCount, containerClass = "grid-table-container" }) {
  const [selectionStart, setSelectionStart] = useState(null);
  const [selectionEnd, setSelectionEnd] = useState(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const isProgrammaticFocus = useRef(false);

  const getSelectionBounds = useCallback(() => {
    if (!selectionStart || !selectionEnd) return null;
    return {
      minR: Math.min(selectionStart.r, selectionEnd.r),
      maxR: Math.max(selectionStart.r, selectionEnd.r),
      minC: Math.min(selectionStart.c, selectionEnd.c),
      maxC: Math.max(selectionStart.c, selectionEnd.c),
    };
  }, [selectionStart, selectionEnd]);

  useEffect(() => {
    const handleMouseUpGlobal = () => setIsSelecting(false);
    const handleKeyDownGlobal = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "a") {
        const isGridActive =
          document.activeElement?.tagName === "BODY" ||
          document.querySelector(`.${containerClass}`)?.contains(document.activeElement);
        
        if (isGridActive && rowsCount > 0) {
          e.preventDefault();
          const sel = window.getSelection();
          if (sel) sel.removeAllRanges();
          setSelectionStart({ r: -1, c: -2 });
          setSelectionEnd({
            r: rowsCount - 1,
            c: colsCount - 1,
          });
        }
      }
    };
    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [rowsCount, colsCount, containerClass]);

  const getSelectionStyle = useCallback(
    (r, c) => {
      let isCellSelected = false;
      let selectionStyle = {};
      let boxShadows = [];
      let isLeftmost = false;
      let isRightmost = false;
      let isTopmost = false;
      let isBottommost = false;

      const bounds = getSelectionBounds();

      if (bounds) {
        isCellSelected =
          r >= bounds.minR &&
          r <= bounds.maxR &&
          c >= bounds.minC &&
          c <= bounds.maxC;

        if (isCellSelected) {
          selectionStyle.backgroundColor = "rgba(79, 70, 229, 0.12)"; // indigo transparent
          if (r === bounds.minR) {
            boxShadows.push("inset 0 2px 0 0 #4f46e5");
            isTopmost = true;
          }
          if (r === bounds.maxR) {
            boxShadows.push("inset 0 -2px 0 0 #4f46e5");
            isBottommost = true;
          }
          if (c === bounds.minC) {
            boxShadows.push("inset 2px 0 0 0 #4f46e5");
            isLeftmost = true;
          }
          if (c === bounds.maxC) {
            boxShadows.push("inset -2px 0 0 0 #4f46e5");
            isRightmost = true;
          }
        }
      }
      if (boxShadows.length > 0) {
        selectionStyle.boxShadow = boxShadows.join(", ");
      }

      let isSelectionStartCell =
        selectionStart && r === selectionStart.r && c === selectionStart.c;
      let isMultiSelect =
        bounds && (bounds.maxR > bounds.minR || bounds.maxC > bounds.minC);
      let showTransparentInput =
        isCellSelected && isMultiSelect && !isSelectionStartCell;

      return {
        isCellSelected,
        selectionStyle,
        isLeftmost,
        isRightmost,
        isTopmost,
        isBottommost,
        boxShadows,
        showTransparentInput,
      };
    },
    [getSelectionBounds, selectionStart],
  );

  const handleMouseDownCell = useCallback((e, rowIndex, colIndex, inputIdPrefix = "cell") => {
    e.preventDefault();
    if (e.shiftKey && selectionStart) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    } else {
      setIsSelecting(true);
      setSelectionStart({ r: rowIndex, c: colIndex });
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }

    setTimeout(() => {
      const input = document.getElementById(`${inputIdPrefix}-${rowIndex}-${colIndex}`);
      if (input) {
        isProgrammaticFocus.current = true;
        input.focus();
        input.select();
        setTimeout(() => (isProgrammaticFocus.current = false), 10);
      }
    }, 0);
  }, [selectionStart]);

  const handleMouseEnterCell = (rowIndex, colIndex) => {
    if (isSelecting) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }
  };

  return {
    selectionStart,
    setSelectionStart,
    selectionEnd,
    setSelectionEnd,
    isSelecting,
    setIsSelecting,
    isProgrammaticFocus,
    getSelectionBounds,
    getSelectionStyle,
    handleMouseDownCell,
    handleMouseEnterCell,
  };
}
