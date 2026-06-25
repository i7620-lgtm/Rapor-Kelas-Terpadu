import React from "react";
import { AutoSizingTextarea } from "./AutoSizingTextarea";
import {
  getNumericValue,
  getQualitativeCode,
  generateSubjectDescription
} from "../../utils/nilaiHelpers";
import { QUALITATIVE_DESCRIPTORS } from "../../constants";

export const SummativeTableRow = React.memo(({
  student,
  index,
  studentGrade,
  currentObjectives,
  settings,
  subject,
  isSLM,
  item,
  type,
  qualitativeGradingMap,
  activeInput,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleFocusCell,
  handlePaste,
  handleLocalGradeChange,
  handleLocalDescriptionChange,
}) => {
  let descriptions = studentGrade.descriptions;
  if (!descriptions) {
    const generated = generateSubjectDescription(
      student,
      studentGrade,
      currentObjectives,
      settings,
      settings.slmVisibility?.[subject.id]
    );
    descriptions = {
      highest: generated.highest,
      lowest: generated.lowest,
    };
  }

  let average = null;
  if (isSLM) {
    const slmData = studentGrade.slm?.find((s) => s.id === item.id);
    const scores = slmData?.scores || [];
    const numericScores = scores
      .map((s) => getNumericValue(s, qualitativeGradingMap))
      .filter((s) => s !== null);
    if (numericScores.length > 0) {
      average = (
        numericScores.reduce((a, b) => a + b, 0) /
        numericScores.length
      ).toFixed(1);
    }
  }

  return React.createElement(
    "tr",
    {
      key: student.id,
      className: "border-b hover:bg-slate-50",
    },
    React.createElement(
      "td",
      {
        id: `cell-${index}--2`,
        tabIndex: -1,
        className:
          "p-2 text-center sticky z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top border-r box-border select-none cursor-default",
        style: {
          left: 0,
          width: "50px",
          minWidth: "50px",
          maxWidth: "50px",
          ...getSelectionStyle(index, -2).selectionStyle,
        },
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, index, -2);
        },
        onMouseEnter: () => handleMouseEnterCell(index, -2),
      },
      index + 1
    ),
    React.createElement(
      "td",
      {
        id: `cell-${index}--1`,
        tabIndex: -1,
        className:
          "p-2 font-medium sticky z-10 bg-white shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)] align-top border-r box-border select-none cursor-default",
        style: {
          left: "50px",
          ...getSelectionStyle(index, -1).selectionStyle,
        },
        onMouseDown: (e) => {
          if (e.button !== 0) return;
          if (e.shiftKey) e.preventDefault();
          handleMouseDownCell(e, index, -1);
        },
        onMouseEnter: () => handleMouseEnterCell(index, -1),
      },
      student.namaLengkap
    ),
    isSLM
      ? (item && studentGrade.slm ? Array.from({ length: studentGrade.slm.find(s => s.id === item.id)?.scores?.length || 0 }) : []).map((_, i) => {
          const key = `${student.id}_slm_${item.id}_tp_${i}`;
          const slmData = studentGrade.slm?.find((s) => s.id === item.id);
          const value = slmData?.scores?.[i] ?? null;

          const active =
            activeInput[key] ||
            (typeof value === "string" && QUALITATIVE_DESCRIPTORS[value]
              ? "ql"
              : "qnt");

          const numericValue =
            getNumericValue(value, qualitativeGradingMap) ?? "";
          const qualitativeValue = getQualitativeCode(
            value,
            settings.predikats
          );

          const colSelectIdxQnt = i * 2;
          const colSelectIdxQl = i * 2 + 1;

          const { selectionStyle: styleQnt, showTransparentInput: showTransQnt } =
            getSelectionStyle(index, colSelectIdxQnt);
          const { selectionStyle: styleQl, showTransparentInput: showTransQl } =
            getSelectionStyle(index, colSelectIdxQl);

          return React.createElement(
            React.Fragment,
            { key: i },
            React.createElement(
              "td",
              {
                className:
                  "px-2 py-1 text-center border-l relative cursor-default select-none",
                style: styleQnt,
                onMouseDown: (e) => {
                  const target = e.target;
                  if (
                    target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.tagName === "TEXTAREA"
                  )
                    return;
                  if (e.button !== 0) return;
                  handleMouseDownCell(e, index, colSelectIdxQnt);
                },
                onMouseEnter: () => handleMouseEnterCell(index, colSelectIdxQnt),
              },
              React.createElement("input", {
                id: `cell-${index}-${colSelectIdxQnt}`,
                type: "text",
                inputMode: "numeric",
                pattern: "[0-9]*",
                value: numericValue,
                onChange: (e) => {
                  const val = e.target.value;
                  const hasSeparators =
                    /[\n\r\t;]/.test(val) ||
                    (/\s+/.test(val.trim()) &&
                      val.trim().split(/\s+/).length > 1);
                  if (hasSeparators) {
                    handlePaste(
                      {
                        preventDefault: () => {},
                        clipboardData: {
                          getData: () => val,
                        },
                      },
                      student.id,
                      i
                    );
                    return;
                  }
                  if (val === "" || /^\d*$/.test(val)) {
                    handleLocalGradeChange(student.id, val, "qnt", i);
                  }
                },
                onPaste: (e) => handlePaste(e, student.id, i),
                onFocus: () => handleFocusCell(index, colSelectIdxQnt),
                onMouseDown: (e) => {
                  if (e.button !== 0) return;
                  handleMouseDownCell(e, index, colSelectIdxQnt);
                },
                readOnly: active === "ql",
                className: `w-full p-2 text-center border rounded-md relative z-10 transition-all ${
                  showTransQnt
                    ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                    : active === "qnt"
                      ? numericValue !== ""
                        ? settings.predikats?.c !== undefined &&
                          parseFloat(numericValue) < settings.predikats.c
                          ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                          : "border-green-500 ring-1 ring-green-500"
                        : "border-red-500 ring-1 ring-red-500"
                      : "border-slate-300 bg-slate-50"
                }`,
              })
            ),
            React.createElement(
              "td",
              {
                className:
                  "px-2 py-1 text-center relative cursor-default select-none",
                style: styleQl,
                onMouseDown: (e) => {
                  const target = e.target;
                  if (
                    target.tagName === "INPUT" ||
                    target.tagName === "SELECT" ||
                    target.tagName === "TEXTAREA"
                  )
                    return;
                  if (e.button !== 0) return;
                  handleMouseDownCell(e, index, colSelectIdxQl);
                },
                onMouseEnter: () => handleMouseEnterCell(index, colSelectIdxQl),
              },
              React.createElement(
                "select",
                {
                  id: `cell-${index}-${colSelectIdxQl}`,
                  value: qualitativeValue,
                  onChange: (e) =>
                    handleLocalGradeChange(student.id, e.target.value, "ql", i),
                  onFocus: () => handleFocusCell(index, colSelectIdxQl),
                  onMouseDown: (e) => {
                    if (e.shiftKey) {
                      e.preventDefault();
                      handleMouseDownCell(e, index, colSelectIdxQl);
                    }
                  },
                  className: `w-full p-2 text-xs border rounded-md relative z-10 transition-all ${
                    showTransQl
                      ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                      : active === "ql"
                        ? qualitativeValue !== ""
                          ? qualitativeValue === "BB"
                            ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                            : "border-green-500 ring-1 ring-green-500"
                          : "border-red-500 ring-1 ring-red-500"
                        : "border-slate-300 bg-slate-50"
                  }`,
                },
                React.createElement("option", { value: "" }, "..."),
                Object.keys(QUALITATIVE_DESCRIPTORS).map((code) =>
                  React.createElement("option", { key: code, value: code }, code)
                )
              )
            )
          );
        })
      : React.createElement(
          "td",
          {
            className:
              "px-2 py-1 text-center relative cursor-default select-none",
            style: getSelectionStyle(index, 0).selectionStyle,
            onMouseDown: (e) => {
              const target = e.target;
              if (
                target.tagName === "INPUT" ||
                target.tagName === "SELECT" ||
                target.tagName === "TEXTAREA"
              )
                return;
              if (e.button !== 0) return;
              handleMouseDownCell(e, index, 0);
            },
            onMouseEnter: () => handleMouseEnterCell(index, 0),
          },
          React.createElement("input", {
            id: `cell-${index}-0`,
            type: "text",
            inputMode: "numeric",
            pattern: "[0-9]*",
            value:
              getNumericValue(studentGrade[type], qualitativeGradingMap) ?? "",
            onChange: (e) => {
              const val = e.target.value;
              const hasSeparators =
                /[\n\r\t;]/.test(val) ||
                (/\s+/.test(val.trim()) &&
                  val.trim().split(/\s+/).length > 1);
              if (hasSeparators) {
                handlePaste(
                  {
                    preventDefault: () => {},
                    clipboardData: {
                      getData: () => val,
                    },
                  },
                  student.id
                );
                return;
              }
              if (val === "" || /^\d*$/.test(val)) {
                handleLocalGradeChange(student.id, val, "qnt");
              }
            },
            onPaste: (e) => handlePaste(e, student.id),
            onFocus: () => handleFocusCell(index, 0),
            onMouseDown: (e) => {
              if (e.button !== 0) return;
              handleMouseDownCell(e, index, 0);
            },
            className: `w-20 p-2 text-center border rounded-md relative z-10 transition-all ${
              getSelectionStyle(index, 0).showTransparentInput
                ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                : getNumericValue(studentGrade[type], qualitativeGradingMap) !==
                    null &&
                  getNumericValue(studentGrade[type], qualitativeGradingMap) !==
                    ""
                  ? settings.predikats?.c !== undefined &&
                    parseFloat(
                      getNumericValue(
                        studentGrade[type],
                        qualitativeGradingMap
                      )
                    ) < settings.predikats.c
                    ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                    : "border-green-500 ring-1 ring-green-500"
                  : "border-red-500 ring-1 ring-red-500"
            }`,
          })
        ),
    isSLM &&
      React.createElement(
        "td",
        {
          className:
            "px-4 py-2 text-center font-bold bg-slate-100 border-l align-top pt-3",
        },
        average ?? "-"
      ),
    React.createElement(
      "td",
      { className: "px-2 py-2 border-l" },
      React.createElement(
        "div",
        { className: "flex flex-row gap-2" },
        React.createElement(AutoSizingTextarea, {
          value: descriptions.highest,
          onChange: (e) =>
            handleLocalDescriptionChange(student.id, "highest", e.target.value),
          placeholder: "Deskripsi Tinggi",
          className: `w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-green-500 ${descriptions.highest && descriptions.highest.trim() !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
          rows: 2,
        }),
        React.createElement(AutoSizingTextarea, {
          value: descriptions.lowest,
          onChange: (e) =>
            handleLocalDescriptionChange(student.id, "lowest", e.target.value),
          placeholder: "Deskripsi Rendah",
          className: `w-1/2 p-2 text-xs border rounded resize-none focus:ring-1 focus:ring-yellow-500 ${descriptions.lowest && descriptions.lowest.trim() !== "" ? "border-green-500 ring-1 ring-green-500" : "border-red-500 ring-1 ring-red-500"}`,
          rows: 2,
        })
      )
    )
  );
}, (prev, next) => {
  if (prev.student.id !== next.student.id) return false;
  if (prev.index !== next.index) return false;
  if (prev.subject?.id !== next.subject?.id) return false;
  if (prev.isSLM !== next.isSLM) return false;
  if (prev.item?.id !== next.item?.id) return false;
  if (prev.type !== next.type) return false;
  if (prev.currentObjectives !== next.currentObjectives) return false;
  if (prev.settings !== next.settings) return false;

  if (JSON.stringify(prev.studentGrade) !== JSON.stringify(next.studentGrade)) return false;

  const activeKeys = Object.keys(prev.activeInput);
  const nextActiveKeys = Object.keys(next.activeInput);
  if (activeKeys.length !== nextActiveKeys.length) return false;
  if (activeKeys.some(key => prev.activeInput[key] !== next.activeInput[key])) return false;

  // We had maxCols relying on prev.studentGrade previously, let's just make it a safe fixed number for now or guess it.
  // Actually, item is fixed for the row, item.scores usually has the length needed.
  const maxCols = prev.isSLM ? (prev.item?.scores?.length || 0) * 2 + 2 : 3;
  for (let c = -2; c < maxCols; c++) {
    const prevStyle = prev.getSelectionStyle(prev.index, c);
    const nextStyle = next.getSelectionStyle(next.index, c);
    if (
        prevStyle.isCellSelected !== nextStyle.isCellSelected ||
        prevStyle.showTransparentInput !== nextStyle.showTransparentInput ||
        prevStyle.selectionStyle?.backgroundColor !== nextStyle.selectionStyle?.backgroundColor ||
        prevStyle.selectionStyle?.boxShadow !== nextStyle.selectionStyle?.boxShadow
    ) {
        return false;
    }
  }

  return true;
});
