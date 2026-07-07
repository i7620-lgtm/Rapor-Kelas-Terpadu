import React, { useState } from "react";

export const OcrImagePreviewAndCropper = ({
  imageSrc,
  cropRole,
  setCropRole,
  isAnalyzingCrop,
  onCropComplete,
  imageRef,
  showToast,
}) => {
  const [zoomLevel, setZoomLevel] = useState(100);
  const [dragStart, setDragStart] = useState(null);
  const [dragEnd, setDragEnd] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  // Dragging event handlers for relative image crop
  const handleMouseDown = (e) => {
    if (cropRole === "none") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    setDragStart({ x, y });
    setDragEnd({ x, y });
    setIsDragging(true);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    setDragEnd({ x, y });
  };

  const handleMouseUp = () => {
    if (!isDragging || !dragStart || !dragEnd) return;
    setIsDragging(false);
    
    const x1 = dragStart.x;
    const y1 = dragStart.y;
    const x2 = dragEnd.x;
    const y2 = dragEnd.y;
    
    onCropComplete(x1, y1, x2, y2, cropRole);
  };

  const handleTouchStart = (e) => {
    if (cropRole === "none") return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = (touch.clientX - rect.left) / rect.width;
    const y = (touch.clientY - rect.top) / rect.height;
    setDragStart({ x, y });
    setDragEnd({ x, y });
    setIsDragging(true);
  };

  const handleTouchMove = (e) => {
    if (!isDragging || !dragStart) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(1, (touch.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (touch.clientY - rect.top) / rect.height));
    setDragEnd({ x, y });
  };

  const handleTouchEnd = () => {
    handleMouseUp();
  };

  return React.createElement(
    "div",
    { className: "lg:col-span-5 flex flex-col gap-3 min-h-0" },
    React.createElement(
      "div",
      { className: "flex items-center justify-between" },
      React.createElement(
        "span",
        { className: "text-xs font-semibold text-slate-300 uppercase tracking-wider" },
        "🖼️ GAMBAR ACUAN UNGGAHAN"
      ),
      React.createElement(
        "div",
        { className: "flex gap-1" },
        React.createElement(
          "button",
          {
            onClick: () => setZoomLevel(prev => Math.max(50, prev - 25)),
            className: "px-2 py-0.5 text-[10px] bg-slate-800 rounded hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer",
          },
          "Zoom Out"
        ),
        React.createElement(
          "span",
          { className: "text-[10px] font-mono select-none px-1.5 py-0.5 text-slate-400 bg-slate-950 rounded" },
          `${zoomLevel}%`
        ),
        React.createElement(
          "button",
          {
            onClick: () => setZoomLevel(prev => Math.min(250, prev + 25)),
            className: "px-2 py-0.5 text-[10px] bg-slate-800 rounded hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer",
          },
          "Zoom In"
        )
      )
    ),
    React.createElement(
      "div",
      { className: "bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex flex-col gap-2" },
      React.createElement(
        "div",
        { className: "flex items-center justify-between" },
        React.createElement("span", { className: "text-[11px] font-bold text-slate-300" }, "Mode Alat Sorot Manual:"),
        cropRole !== "none" && React.createElement(
          "button",
          {
            onClick: () => setCropRole("none"),
            className: "text-[10px] text-red-400 hover:underline cursor-pointer"
          },
          "Matikan Sorot [×]"
        )
      ),
      React.createElement(
        "div",
        { className: "grid grid-cols-3 gap-1.5" },
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => setCropRole("none"),
            className: `px-2 py-1.5 text-[11px] font-medium rounded transition-all border cursor-pointer ${
              cropRole === "none"
                ? "bg-slate-800 text-white border-slate-600 font-bold"
                : "bg-slate-900 text-slate-400 border-transparent hover:text-slate-200"
            }`
          },
          "🖐️ Geser/Zoom"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setCropRole("bab");
              showToast("Mode Sorot Bab Aktif! Seret kotak di area judul bab.", "info");
            },
            className: `px-2 py-1.5 text-[11px] font-semibold rounded transition-all border cursor-pointer ${
              cropRole === "bab"
                ? "bg-indigo-600 text-white border-indigo-400 font-bold"
                : "bg-slate-900 text-slate-400 border-transparent hover:text-indigo-300 hover:bg-slate-800"
            }`
          },
          "🏷️ Sorot Bab"
        ),
        React.createElement(
          "button",
          {
            type: "button",
            onClick: () => {
              setCropRole("tp");
              showToast("Mode Sorot TP Aktif! Seret kotak di area tujuan pembelajaran.", "info");
            },
            className: `px-2 py-1.5 text-[11px] font-semibold rounded transition-all border cursor-pointer ${
              cropRole === "tp"
                ? "bg-emerald-600 text-white border-emerald-400 font-bold"
                : "bg-slate-900 text-slate-400 border-transparent hover:text-emerald-300 hover:bg-slate-800"
            }`
          },
          "🎯 Sorot TP"
        )
      ),
      React.createElement(
        "p",
        { className: "text-[10px] text-slate-400" },
        cropRole === "none"
          ? "Mode geser & perbesar acuan gambar secara bebas tanpa mencoret."
          : cropRole === "bab"
          ? "💡 Tarik kotak/drag di atas teks Bab pada gambar di bawah untuk otomatis mengidentifikasi Judul Bab."
          : "💡 Tarik kotak/drag di atas teks TP pada gambar di bawah untuk otomatis memperbanyak list TP."
      )
    ),
    React.createElement(
      "div",
      {
        className: "flex-grow border border-slate-800 rounded-lg bg-slate-950 overflow-auto flex items-start justify-center p-3 relative min-h-[220px] sm:min-h-[300px] lg:min-h-0 max-h-[40vh] lg:max-h-[54vh] select-none",
      },
      isAnalyzingCrop && React.createElement(
        "div",
        { className: "absolute inset-0 bg-slate-950/80 z-20 flex flex-col items-center justify-center gap-2" },
        React.createElement("div", { className: "w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" }),
        React.createElement("span", { className: "text-xs text-indigo-400 font-semibold" }, "Membaca area sorotan...")
      ),
      React.createElement(
        "div",
        {
          className: "relative inline-block select-none",
          style: { width: `${zoomLevel}%`, maxWidth: "none" }
        },
        React.createElement("img", {
          ref: imageRef,
          src: imageSrc,
          alt: "Uploaded reference",
          referrerPolicy: "no-referrer",
          className: "w-full h-auto object-contain select-none pointer-events-none transition-all duration-150",
        }),
        cropRole !== "none" && React.createElement(
          "div",
          {
            className: "absolute inset-0 cursor-crosshair bg-indigo-500/5 select-none z-10",
            onMouseDown: handleMouseDown,
            onMouseMove: handleMouseMove,
            onMouseUp: handleMouseUp,
            onTouchStart: handleTouchStart,
            onTouchMove: handleTouchMove,
            onTouchEnd: handleTouchEnd,
          },
          isDragging && dragStart && dragEnd && React.createElement(
            "div",
            {
              className: `absolute border-2 border-dashed ${
                cropRole === "bab" ? "border-indigo-500 bg-indigo-500/15" : "border-emerald-500 bg-emerald-500/15"
              } pointer-events-none z-20`,
              style: {
                left: `${Math.min(dragStart.x, dragEnd.x) * 100}%`,
                top: `${Math.min(dragStart.y, dragEnd.y) * 100}%`,
                width: `${Math.abs(dragStart.x - dragEnd.x) * 100}%`,
                height: `${Math.abs(dragStart.y - dragEnd.y) * 100}%`,
              }
            },
            React.createElement(
              "span",
              {
                className: `absolute text-[10px] font-bold text-white px-1.5 py-0.5 rounded shadow whitespace-nowrap ${
                  cropRole === "bab" ? "bg-indigo-600 border border-indigo-400" : "bg-emerald-600 border border-emerald-400"
                }`,
                style: {
                  bottom: '100%',
                  left: '-2px',
                  marginBottom: '4px'
                }
              },
              cropRole === "bab" ? "🏷️ Sorot Area Bab" : "🎯 Sorot Area TP"
            )
          )
        )
      )
    )
  );
};
