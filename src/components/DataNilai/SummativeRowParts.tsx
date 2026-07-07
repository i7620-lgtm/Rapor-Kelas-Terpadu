import React from 'react';
import { QUALITATIVE_DESCRIPTORS } from '../../constants';
import { getNumericValue, getQualitativeCode } from '../../utils/nilaiHelpers';

export const SummativeRowScoreCells = ({
  isSLM,
  item,
  student,
  index,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  handleFocusCell,
  handlePaste,
  handleLocalGradeChange,
  settings,
  studentGrade,
  activeInput,
  qualitativeGradingMap,
  type
}: any) => {
  return isSLM ? (
    (item && studentGrade.slm ? Array.from({ length: studentGrade.slm.find((s: any) => s.id === item.id)?.scores?.length || 0 }) : []).map((_, i) => {
      const key = `${student.id}_slm_${item.id}_tp_${i}`;
      const slmData = studentGrade.slm?.find((s: any) => s.id === item.id);
      const value = slmData?.scores?.[i] ?? null;
      const active = activeInput[key] || (typeof value === "string" && QUALITATIVE_DESCRIPTORS[value] ? "ql" : "qnt");
      const numericValue = getNumericValue(value, qualitativeGradingMap) ?? "";
      const qualitativeValue = getQualitativeCode(value, settings.predikats);
      const colSelectIdxQnt = i * 2;
      const colSelectIdxQl = i * 2 + 1;
      const { selectionStyle: styleQnt, showTransparentInput: showTransQnt } = getSelectionStyle(index, colSelectIdxQnt);
      const { selectionStyle: styleQl, showTransparentInput: showTransQl } = getSelectionStyle(index, colSelectIdxQl);

      return (
        <React.Fragment key={key}>
          <td
            className="px-2 py-1 text-center relative cursor-default select-none"
            style={styleQnt}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
              if (e.button !== 0) return;
              handleMouseDownCell(e, index, colSelectIdxQnt);
            }}
            onMouseEnter={() => handleMouseEnterCell(index, colSelectIdxQnt)}
          >
            <input
              id={`cell-${index}-${colSelectIdxQnt}`}
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={numericValue}
              onChange={(e) => {
                const val = e.target.value;
                const hasSeparators = /[\n\r\t;]/.test(val) || (/\s+/.test(val.trim()) && val.trim().split(/\s+/).length > 1);
                if (hasSeparators) {
                  handlePaste(
                    { preventDefault: () => {}, clipboardData: { getData: () => val } },
                    student.id,
                    i
                  );
                  return;
                }
                if (val === "" || /^\d*$/.test(val)) {
                  handleLocalGradeChange(student.id, val, "qnt", i);
                }
              }}
              onPaste={(e) => handlePaste(e, student.id, i)}
              onFocus={() => handleFocusCell(index, colSelectIdxQnt)}
              onMouseDown={(e) => {
                if (e.button !== 0) return;
                handleMouseDownCell(e, index, colSelectIdxQnt);
              }}
              readOnly={active === "ql"}
              className={`w-full p-2 text-center border rounded-md relative z-10 transition-all ${
                showTransQnt
                  ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                  : active === "qnt"
                  ? numericValue !== ""
                    ? settings.predikats?.c !== undefined && parseFloat(numericValue) < settings.predikats.c
                      ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                      : "border-green-500 ring-1 ring-green-500"
                    : "border-red-500 ring-1 ring-red-500"
                  : "border-slate-300 bg-slate-50"
              }`}
            />
          </td>
          <td
            className="px-2 py-1 text-center relative cursor-default select-none"
            style={styleQl}
            onMouseDown={(e) => {
              const target = e.target as HTMLElement;
              if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
              if (e.button !== 0) return;
              handleMouseDownCell(e, index, colSelectIdxQl);
            }}
            onMouseEnter={() => handleMouseEnterCell(index, colSelectIdxQl)}
          >
            <select
              id={`cell-${index}-${colSelectIdxQl}`}
              value={qualitativeValue}
              onChange={(e) => handleLocalGradeChange(student.id, e.target.value, "ql", i)}
              onFocus={() => handleFocusCell(index, colSelectIdxQl)}
              onMouseDown={(e) => {
                if (e.shiftKey) {
                  e.preventDefault();
                  handleMouseDownCell(e, index, colSelectIdxQl);
                }
              }}
              className={`w-full p-2 text-xs border rounded-md relative z-10 transition-all ${
                showTransQl
                  ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                  : active === "ql"
                  ? qualitativeValue !== ""
                    ? qualitativeValue === "BB"
                      ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                      : "border-green-500 ring-1 ring-green-500"
                    : "border-red-500 ring-1 ring-red-500"
                  : "border-slate-300 bg-slate-50"
              }`}
            >
              <option value="">...</option>
              {Object.keys(QUALITATIVE_DESCRIPTORS).map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </td>
        </React.Fragment>
      );
    })
  ) : (() => {
    const value = studentGrade[type] ?? null;
    const active = activeInput[`${student.id}_${type}`] || (typeof value === "string" && QUALITATIVE_DESCRIPTORS[value] ? "ql" : "qnt");
    const numericValue = getNumericValue(value, qualitativeGradingMap) ?? "";
    const qualitativeValue = getQualitativeCode(value, settings.predikats);
    const colSelectIdxQnt = 0;
    const colSelectIdxQl = 1;
    const { selectionStyle: styleQnt, showTransparentInput: showTransQnt } = getSelectionStyle(index, colSelectIdxQnt);
    const { selectionStyle: styleQl, showTransparentInput: showTransQl } = getSelectionStyle(index, colSelectIdxQl);

    return (
      <React.Fragment>
        <td
          className="px-2 py-1 text-center relative cursor-default select-none"
          style={styleQnt}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
            if (e.button !== 0) return;
            handleMouseDownCell(e, index, colSelectIdxQnt);
          }}
          onMouseEnter={() => handleMouseEnterCell(index, colSelectIdxQnt)}
        >
          <input
            id={`cell-${index}-${colSelectIdxQnt}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={numericValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val === "" || /^\d*$/.test(val)) {
                handleLocalGradeChange(student.id, val, "qnt", type);
              }
            }}
            onFocus={() => handleFocusCell(index, colSelectIdxQnt)}
            onMouseDown={(e) => {
              if (e.button !== 0) return;
              handleMouseDownCell(e, index, colSelectIdxQnt);
            }}
            readOnly={active === "ql"}
            className={`w-full p-2 text-center border rounded-md relative z-10 transition-all ${
              showTransQnt
                ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                : active === "qnt"
                ? numericValue !== ""
                  ? settings.predikats?.c !== undefined && parseFloat(numericValue) < settings.predikats.c
                    ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                    : "border-green-500 ring-1 ring-green-500"
                  : "border-red-500 ring-1 ring-red-500"
                : "border-slate-300 bg-slate-50"
            }`}
          />
        </td>
        <td
          className="px-2 py-1 text-center relative cursor-default select-none"
          style={styleQl}
          onMouseDown={(e) => {
            const target = e.target as HTMLElement;
            if (target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA") return;
            if (e.button !== 0) return;
            handleMouseDownCell(e, index, colSelectIdxQl);
          }}
          onMouseEnter={() => handleMouseEnterCell(index, colSelectIdxQl)}
        >
          <select
            id={`cell-${index}-${colSelectIdxQl}`}
            value={qualitativeValue}
            onChange={(e) => handleLocalGradeChange(student.id, e.target.value, "ql", type)}
            onFocus={() => handleFocusCell(index, colSelectIdxQl)}
            onMouseDown={(e) => {
              if (e.shiftKey) {
                e.preventDefault();
                handleMouseDownCell(e, index, colSelectIdxQl);
              }
            }}
            className={`w-full p-2 text-xs border rounded-md relative z-10 transition-all ${
              showTransQl
                ? "bg-transparent border-transparent shadow-none outline-none focus:outline-none focus:ring-0"
                : active === "ql"
                ? qualitativeValue !== ""
                  ? qualitativeValue === "BB"
                    ? "border-red-500 ring-1 ring-red-500 text-red-600 bg-rose-50"
                    : "border-green-500 ring-1 ring-green-500"
                  : "border-red-500 ring-1 ring-red-500"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <option value="">...</option>
            {Object.keys(QUALITATIVE_DESCRIPTORS).map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </select>
        </td>
      </React.Fragment>
    );
  })();
};
