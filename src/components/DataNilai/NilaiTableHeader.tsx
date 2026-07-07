import React from "react";
import { NilaiTableMainHeaderRow } from "./NilaiTableMainHeaderRow";
import { NilaiTableTpHeaderRow } from "./NilaiTableTpHeaderRow";
import { NilaiTableWeightingHeaderRow } from "./NilaiTableWeightingHeaderRow";

interface NilaiTableHeaderProps {
  headerRowSpan: number;
  getSelectionStyle: (row: number, col: number) => { selectionStyle?: React.CSSProperties };
  handleMouseDownCell: (e: React.MouseEvent, row: number, col: number, type: string) => void;
  handleMouseEnterCell: (row: number, col: number) => void;
  slmHeaders: any[];
  tpHeaders: any[];
  isWeighting: boolean;
  settings: any;
  weights: any;
  handleWeightChange: (type: any, value: any, slmId?: any, tpIndex?: any) => void;
  handleAutoRegression: (slmId: string, tpIndex: number) => void;
  handleAutoRegressionNonTP: (type: any) => void;
  showTooltip: (e: React.MouseEvent, content: string) => void;
  hideTooltip: () => void;
  slmTextRefs: React.RefObject<any>;
  isCapaianPinned: boolean;
  handleToggleCapaianPinned: (checked: boolean) => void;
  handleBulkGenerateDescriptions: () => void;
  gradeNumber: number;
}

export const NilaiTableHeader: React.FC<NilaiTableHeaderProps> = ({
  headerRowSpan,
  getSelectionStyle,
  handleMouseDownCell,
  handleMouseEnterCell,
  slmHeaders,
  tpHeaders,
  isWeighting,
  settings,
  weights,
  handleWeightChange,
  handleAutoRegression,
  handleAutoRegressionNonTP,
  showTooltip,
  hideTooltip,
  slmTextRefs,
  isCapaianPinned,
  handleToggleCapaianPinned,
  handleBulkGenerateDescriptions,
  gradeNumber,
}) => {
  return (
    <>
      <NilaiTableMainHeaderRow
        headerRowSpan={headerRowSpan}
        getSelectionStyle={getSelectionStyle}
        handleMouseDownCell={handleMouseDownCell}
        handleMouseEnterCell={handleMouseEnterCell}
        slmHeaders={slmHeaders}
        tpHeaders={tpHeaders}
        settings={settings}
        handleAutoRegressionNonTP={handleAutoRegressionNonTP}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
        slmTextRefs={slmTextRefs}
        isCapaianPinned={isCapaianPinned}
        handleToggleCapaianPinned={handleToggleCapaianPinned}
        handleBulkGenerateDescriptions={handleBulkGenerateDescriptions}
        gradeNumber={gradeNumber}
      />

      <NilaiTableTpHeaderRow
        tpHeaders={tpHeaders}
        getSelectionStyle={getSelectionStyle}
        handleMouseDownCell={handleMouseDownCell}
        handleMouseEnterCell={handleMouseEnterCell}
        showTooltip={showTooltip}
        hideTooltip={hideTooltip}
        settings={settings}
        handleAutoRegression={handleAutoRegression}
      />

      {isWeighting && (
        <NilaiTableWeightingHeaderRow
          tpHeaders={tpHeaders}
          weights={weights}
          handleWeightChange={handleWeightChange}
          settings={settings}
        />
      )}
    </>
  );
};
