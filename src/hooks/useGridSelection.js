import React, { useState, useEffect, useCallback, useRef } from "react";

const scrollCellIntoView = (el, containerClass) => {
    if (!el) return;
    el.scrollIntoView({ behavior: 'auto', block: 'nearest', inline: 'nearest' });
    
    // Adjust scroll due to sticky headers/columns
    setTimeout(() => {
        const container = el.closest(`.${containerClass}`) || el.closest('.overflow-auto') || el.closest('.overflow-y-auto') || el.closest('div[style*="overflow"]');
        if (!container) return;
        
        const containerRect = container.getBoundingClientRect();
        const elRect = el.getBoundingClientRect();
        
        let maxStickyTop = 0;
        let maxStickyLeft = 0;

        const elStyle = window.getComputedStyle(el);
        const isElStickyTop = el.classList.contains('sticky') && (elStyle.top !== 'auto' || el.classList.contains('top-0'));
        const isElStickyLeft = el.classList.contains('sticky') && (elStyle.left !== 'auto' || el.classList.contains('left-0'));
        
        // Find sticky siblings/parents
        const stickies = container.querySelectorAll('.sticky');
        stickies.forEach(sticky => {
            if (sticky === el) return; // Ignore itself when determining obstacle boundaries

            const style = window.getComputedStyle(sticky);
            const rect = sticky.getBoundingClientRect();
            
            // Estimate if it's a top header
            if ((style.top !== 'auto' || sticky.classList.contains('top-0')) && rect.top <= containerRect.top + 100) {
                maxStickyTop = Math.max(maxStickyTop, rect.bottom - containerRect.top);
            }
            // Estimate if it's a left col
            if ((style.left !== 'auto' || sticky.classList.contains('left-0')) && (rect.left - containerRect.left) < containerRect.width / 2) {
                maxStickyLeft = Math.max(maxStickyLeft, rect.right - containerRect.left);
            }
        });
        
        // Add a bit of padding to the offsets, but only if the target element isn't itself a sticky element of that type
        const topOffset = (!isElStickyTop && maxStickyTop > 0) ? maxStickyTop + 10 : 0;
        const leftOffset = (!isElStickyLeft && maxStickyLeft > 0) ? maxStickyLeft + 10 : 0;
        const bottomOffset = 20;
        const rightOffset = 20;

        if (topOffset > 0 && elRect.top < containerRect.top + topOffset) {
            container.scrollTop -= (containerRect.top + topOffset - elRect.top);
        } else if (elRect.bottom > containerRect.bottom - bottomOffset) {
            container.scrollTop += (elRect.bottom - (containerRect.bottom - bottomOffset));
        }

        if (leftOffset > 0 && elRect.left < containerRect.left + leftOffset) {
            container.scrollLeft -= (containerRect.left + leftOffset - elRect.left);
        } else if (elRect.right > containerRect.right - rightOffset) {
            container.scrollLeft += (elRect.right - (containerRect.right - rightOffset));
        }
    }, 10);
};

export function useGridSelection({ rowsCount, colsCount, minColIndex = 0, containerClass = "grid-table-container", onDeleteSelection }) {
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
          setSelectionStart({ r: -1, c: minColIndex });
          setSelectionEnd({
            r: rowsCount - 1,
            c: colsCount - 1,
          });
        }
      } else if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        const isGridActive =
          document.activeElement?.tagName === "BODY" ||
          document.querySelector(`.${containerClass}`)?.contains(document.activeElement);
          
        if (isGridActive) {
          // If we have an active input, only allow up/down to navigate native cells to avoid breaking text caret left/right,
          // UNLESS they are holding shift (which means they want to select).
          const isInputActive = document.activeElement?.tagName === "INPUT" || document.activeElement?.tagName === "TEXTAREA";
          if (!e.shiftKey && isInputActive && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
              const input = document.activeElement;
              // Allow cell navigation if text is fully selected, or caret is at the very edge.
              const isFullySelected = input.selectionStart === 0 && input.selectionEnd === input.value.length;
              const isAtStart = input.selectionStart === 0 && input.selectionEnd === 0;
              const isAtEnd = input.selectionStart === input.value.length && input.selectionEnd === input.value.length;
              
              if (!isFullySelected) {
                  if (e.key === "ArrowLeft" && !isAtStart) return;
                  if (e.key === "ArrowRight" && !isAtEnd) return;
              }
          }

          e.preventDefault();
          
          setSelectionEnd((prevEnd) => {
             if (!prevEnd) return prevEnd;
             let newR = prevEnd.r;
             let newC = prevEnd.c;
             if (e.key === "ArrowUp") newR = Math.max(0, newR - 1);
             if (e.key === "ArrowDown") newR = Math.min(rowsCount - 1, newR + 1);
             if (e.key === "ArrowLeft") newC = Math.max(minColIndex, newC - 1);
             if (e.key === "ArrowRight") newC = Math.min(colsCount - 1, newC + 1);
             
             if (!e.shiftKey) {
                 // Without shift, we move the whole selection to the new cell
                 setSelectionStart({ r: newR, c: newC });
                 setTimeout(() => {
                     const input = document.getElementById(`cell-${newR}-${newC}`) || document.querySelector(`.${containerClass} [id$="cell-${newR}-${newC}"]`);
                     if (input) {
                         isProgrammaticFocus.current = true;
                         input.focus();
                         if (typeof input.select === 'function') {
                             input.select();
                         }
                         scrollCellIntoView(input, containerClass);
                         setTimeout(() => (isProgrammaticFocus.current = false), 10);
                     } else {
                         const el = document.querySelector(`.${containerClass} [id$="cell-${newR}-${newC}"]`);
                         if (el) {
                             scrollCellIntoView(el, containerClass);
                         }
                     }
                 }, 0);
             } else {
                 setTimeout(() => {
                     const el = document.querySelector(`.${containerClass} [id$="cell-${newR}-${newC}"]`);
                     if (el) {
                         scrollCellIntoView(el, containerClass);
                     }
                 }, 10);
             }
             return { r: newR, c: newC };
          });
        }
      } else if (e.key === "Backspace" || e.key === "Delete") {
        if (!onDeleteSelection) return;
        
        const isGridActive =
          document.activeElement?.tagName === "BODY" ||
          document.querySelector(`.${containerClass}`)?.contains(document.activeElement);
          
        const bounds = getSelectionBounds();
        if (isGridActive && bounds) {
            let isMultiSelect = bounds && (bounds.maxR > bounds.minR || bounds.maxC > bounds.minC);
            if (isMultiSelect) {
                e.preventDefault();
                onDeleteSelection(bounds);
            }
        }
      }
    };
    window.addEventListener("mouseup", handleMouseUpGlobal);
    window.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      window.removeEventListener("mouseup", handleMouseUpGlobal);
      window.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, [rowsCount, colsCount, minColIndex, containerClass, getSelectionBounds, onDeleteSelection]);

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
    const isAlreadyActive = document.activeElement?.id === `${inputIdPrefix}-${rowIndex}-${colIndex}`;
    
    if (!isAlreadyActive) {
      e.preventDefault();
    }
    
    if (e.shiftKey && selectionStart) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    } else {
      setIsSelecting(true);
      setSelectionStart({ r: rowIndex, c: colIndex });
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }

    if (!isAlreadyActive) {
      setTimeout(() => {
        const input = document.getElementById(`${inputIdPrefix}-${rowIndex}-${colIndex}`);
        if (input) {
          isProgrammaticFocus.current = true;
          input.focus();
          if (typeof input.select === 'function') {
            input.select();
          }
          setTimeout(() => (isProgrammaticFocus.current = false), 10);
        }
      }, 0);
    }
  }, [selectionStart]);

  const handleMouseEnterCell = (rowIndex, colIndex) => {
    if (isSelecting) {
      setSelectionEnd({ r: rowIndex, c: colIndex });
    }
  };

  const handleFocusCell = useCallback((rowIndex, colIndex) => {
    if (isProgrammaticFocus.current) return;
    if (isSelecting) return;
    setSelectionStart((prevStart) => {
      if (prevStart?.r === rowIndex && prevStart?.c === colIndex) return prevStart;
      return { r: rowIndex, c: colIndex };
    });
    setSelectionEnd((prevEnd) => {
      if (prevEnd?.r === rowIndex && prevEnd?.c === colIndex) return prevEnd;
      return { r: rowIndex, c: colIndex };
    });
  }, [isSelecting]);

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
    handleFocusCell
  };
}
