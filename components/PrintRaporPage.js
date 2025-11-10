import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { transliterate, generatePemdaText, expandAndCapitalizeSchoolName, generateInitialLayout, loadFonts } from './TransliterationUtil.js';
import { getGradeNumber } from './DataNilaiPage.js';

// Define fixed heights and margins for layout consistency in CM
const HEADER_HEIGHT_CM = 5.2;
const PAGE_TOP_MARGIN_CM = 1.5;
const PAGE_LEFT_RIGHT_MARGIN_CM = 1.5;
const PAGE_BOTTOM_MARGIN_CM = 1.5;
const PAGE_NUMBER_FOOTER_HEIGHT_CM = 1.0;
const REPORT_CONTENT_BOTTOM_OFFSET_CM = PAGE_BOTTOM_MARGIN_CM + PAGE_NUMBER_FOOTER_HEIGHT_CM + 0.5;

// Default Tut Wuri Handayani Logo (Base64)
const TUT_WURI_HANDAYANI_LOGO = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAlgAAAKACAIAAAD32F9GAAAAA3NCSVQICAjb4U/gAAAgAElEQVR4nOzdZ5Ql11nY+e/MO9XTVXV1d/fM9ExPhkHAgAyCiIiCIqAIogAFvYCK9x7RBRQFDwIRBfEgIAgBBRGQQSQMwsy0d/dUVVXV3TOz+33vV7+qunpmpntmdnd3pY+Zrq7u7jLzz/8v/s7/T//5/+W+ECAkQkAIASGEhBAQAkJACCEhBASEgBACCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgBASCQkhIASEgB-AAAAAAAAAAAAA';

const ReportHeader = ({ settings, cmToPx }) => {
    const layout = settings.kop_layout && settings.kop_layout.length > 0
        ? settings.kop_layout
        : generateInitialLayout(settings);

    return React.createElement('div', {
        className: "absolute top-0 left-0 right-0",
        style: {
            height: `${HEADER_HEIGHT_CM * cmToPx}px`,
            padding: `${1 * cmToPx}px ${1.5 * cmToPx}px 0 ${1.5 * cmToPx}px`
        }
    },
        React.createElement('div', { className: "relative w-full h-full" },
            React.createElement('svg', { width: "100%", height: "100%", viewBox: "0 0 800 180", preserveAspectRatio: "xMidYMin meet" },
                layout.map(el => {
                    if (el.type === 'text') {
                        let textAnchor = "start";
                        let xPos = el.x;
                        if (el.textAlign === 'center') {
                            textAnchor = "middle";
                            xPos = el.x + (el.width ?? 0) / 2;
                        } else if (el.textAlign === 'right') {
                            textAnchor = "end";
                            xPos = el.x + (el.width ?? 0);
                        }
                        return (
                            React.createElement('text', {
                                key: el.id,
                                x: xPos,
                                y: el.y + (el.fontSize ?? 14),
                                fontSize: el.fontSize,
                                fontWeight: el.fontWeight,
                                textAnchor: textAnchor,
                                fontFamily: el.fontFamily === 'Noto Sans Balinese' ? 'Noto Sans Balinese' : 'Tinos, system-ui'
                            }, el.content)
                        );
                    }
                    if (el.type === 'image') {
                        const imageUrl = String(settings[el.content] || '');
                        if (!imageUrl) return null;
                        return (
                            React.createElement('image', {
                                key: el.id,
                                href: imageUrl,
                                x: el.x,
                                y: el.y,
                                width: el.width,
                                height: el.height
                            })
                        );
                    }
                    if (el.type === 'line') {
                        return (
                            React.createElement('rect', {
                                key: el.id,
                                x: el.x,
                                y: el.y,
                                width: el.width,
                                height: el.height,
                                fill: "black"
                            })
                        );
                    }
                    return null;
                })
            )
        )
    );
};


const formatDate = (dateString) => {
    if (!dateString || dateString instanceof Date && isNaN(dateString)) return '-';
    try {
        const date = new Date(dateString);
        const userTimezoneOffset = date.getTimezoneOffset() * 60000;
        const adjustedDate = new Date(date.getTime() + userTimezoneOffset);
        
        if (isNaN(adjustedDate.getTime())) {
            return String(dateString);
        }

        return adjustedDate.toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        });
    } catch (e) {
        return String(dateString);
    }
};

const capitalize = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toUpperCase() + trimmed.slice(1).toLowerCase();
};

const lowercaseFirst = (s) => {
    if (typeof s !== 'string' || !s) return '';
    const trimmed = s.trim().replace(/[.,;]$/, '');
    return trimmed.charAt(0).toLowerCase() + trimmed.slice(1);
};


const generateDescription = (student, subject, gradeData, learningObjectives, settings) => {
    const studentNameRaw = student.namaPanggilan || (student.namaLengkap || '').split(' ')[0];
    const studentName = capitalize(studentNameRaw);

    const cleanTpText = (text) => {
        if (!text) return '';
        let cleanedText = text;
        cleanedText = cleanedText.replace(new RegExp(`^ananda\\s+${studentNameRaw}\\s`, 'i'), '');
        cleanedText = cleanedText.replace(/^ananda\s+/i, '');
        return cleanedText.trim();
    };

    const currentGradeNumber = getGradeNumber(settings.nama_kelas);
    if (currentGradeNumber === null) {
        return { highest: `${studentName} menunjukkan perkembangan yang baik.`, lowest: "" };
    }
    
    let objectivesForCurrentClass = null;
    for (const key in learningObjectives) {
        if (getGradeNumber(key) === currentGradeNumber) {
            objectivesForCurrentClass = learningObjectives[key];
            break;
        }
    }

    const objectivesForSubject = objectivesForCurrentClass?.[subject.fullName] || [];
    if (!objectivesForSubject || objectivesForSubject.length === 0) {
        return { highest: `${studentName} menunjukkan penguasaan pada tujuan pembelajaran yang belum diisi.`, lowest: "" };
    }

    const detailedGrade = gradeData?.detailedGrades?.[subject.id];
    const gradedTps = objectivesForSubject
        .map((text, index) => ({ text: cleanTpText(text), score: detailedGrade?.tp?.[index] }))
        .filter(tp => typeof tp.score === 'number' && tp.score !== null);
    
    if (gradedTps.length === 0) {
        return { highest: `${studentName} menunjukkan penguasaan yang belum terukur.`, lowest: "" };
    }
    
    if (gradedTps.length === 1) {
        return { highest: `${studentName} menunjukkan penguasaan yang baik dalam ${lowercaseFirst(gradedTps[0].text)}.`, lowest: '' };
    }

    const scores = gradedTps.map(tp => tp.score);
    const allScoresEqual = scores.every(s => s === scores[0]);

    if (allScoresEqual) {
        return { 
            highest: `${studentName} menunjukkan penguasaan yang merata pada semua tujuan pembelajaran.`,
            lowest: `Terus pertahankan prestasi dan semangat belajar.` 
        };
    } else {
        let maxScore = -1;
        let minScore = 101;
        scores.forEach(s => {
            if (s > maxScore) maxScore = s;
            if (s < minScore) minScore = s;
        });
        
        const highestTp = gradedTps.find(tp => tp.score === maxScore);
        const lowestTp = gradedTps.find(tp => tp.score === minScore);
        
        if (highestTp && lowestTp) {
            return { 
                highest: `${studentName} menunjukkan penguasaan yang sangat baik dalam ${lowercaseFirst(highestTp.text)}.`,
                lowest: `${studentName} perlu bimbingan dalam ${lowercaseFirst(lowestTp.text)}.`
            };
        }
    }

    return { highest: `${studentName} menunjukkan perkembangan yang baik.`, lowest: "" };
};

const CoverPage = ({ student, settings, cmToPx }) => {
    const year = useMemo(() => {
        if (settings.tahun_ajaran) {
            return settings.tahun_ajaran;
        }

        const currentYear = new Date().getFullYear();
        const currentMonth = new Date().getMonth();
        if (currentMonth < 6) {
             return `${currentYear - 1}/${currentYear}`;
        }
        return `${currentYear}/${currentYear + 1}`;
    }, [settings.tahun_ajaran]);

    const coverLogo = settings.logo_cover || TUT_WURI_HANDAYANI_LOGO;

    return React.createElement('div', {
        className: 'flex flex-col items-center text-center p-8 box-border font-times',
        style: {
            position: 'absolute',
            top: `${PAGE_TOP_MARGIN_CM * cmToPx}px`,
            left: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`,
            right: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`,
            bottom: `${PAGE_BOTTOM_MARGIN_CM * cmToPx}px`,
            border: '6px double #000'
        }
    },
        React.createElement('div', { className: 'w-full pt-16' },
            React.createElement('div', { className: 'flex justify-center mb-10' },
                React.createElement('img', {
                    src: coverLogo,
                    alt: "Logo Cover Rapor",
                    className: 'h-48 w-48 object-contain'
                })
            ),
            React.createElement('h1', { className: 'text-2xl font-bold tracking-widest' }, 'RAPOR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'MURID'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, 'SEKOLAH DASAR'),
            React.createElement('h2', { className: 'text-2xl font-bold tracking-widest' }, '(SD)'),

            React.createElement('div', { className: 'mt-24 w-full px-8' },
                React.createElement('p', { className: 'text-sm' }, 'Nama Murid:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-3' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, (student.namaLengkap || 'NAMA MURID').toUpperCase())
                ),
                React.createElement('p', { className: 'text-sm mt-4' }, 'NISN/NIS:'),
                React.createElement('div', { className: 'border-2 border-black rounded-lg p-2 mt-3' },
                    React.createElement('p', { className: 'text-2xl font-bold tracking-wider' }, `${student.nisn || '-'} / ${student.nis || '-'}`)
                )
            )
        ),
        React.createElement('div', { className: 'flex-grow' }),
        React.createElement('div', { className: 'mb-8 space-y-2' },
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'KEMENTERIAN PENDIDIKAN DASAR DAN MENENGAH'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, 'REPUBLIK INDONESIA'),
            React.createElement('p', { className: 'text-xl font-bold tracking-wider' }, year)
        )
    );
};

const SchoolIdentityPage = ({ settings, cmToPx }) => {
    const identitasSekolah = [
        { label: "Nama Sekolah", value: settings.nama_sekolah },
        { label: "NPSN", value: settings.npsn },
        { label: "NIS/NSS/NDS", value: '-'},
        { label: "Alamat Sekolah", value: settings.alamat_sekolah },
        { label: 'Kelurahan/Desa', value: settings.desa_kelurahan },
        { label: 'Kecamatan', value: settings.kecamatan },
        { label: 'Kabupaten/Kota', value: settings.kota_kabupaten },
        { label: 'Provinsi', value: settings.provinsi },
        { label: 'Website', value: settings.website_sekolah },
        { label: 'E-mail', value: settings.email_sekolah },
        { label: 'Kode Pos', value: settings.kode_pos },
        { label: 'Telepon', value: settings.telepon_sekolah },
    ];

    return(
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS SEKOLAH'),
             React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSekolah.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, `${index + 1}.`),
                            React.createElement('td', { className: 'w-[30%] py-[2px]' }, item.label),
                            React.createElement('td', { className: 'w-[5%] py-[2px]' }, ':'),
                            React.createElement('td', { className: 'w-[60%] py-[2px]' }, item.value || '-')
                        )
                    ))
                )
            )
        )
    );
};

const StudentIdentityPage = ({ student, settings, cmToPx }) => {
    const identitasSiswa = [
        { no: '1.', label: 'Nama Murid', value: (student.namaLengkap || '').toUpperCase() },
        { no: '2.', label: 'NISN/NIS', value: `${student.nisn || '-'} / ${student.nis || '-'}` },
        { no: '3.', label: 'Tempat, Tanggal Lahir', value: `${student.tempatLahir || ''}, ${formatDate(student.tanggalLahir)}` },
        { no: '4.', label: 'Jenis Kelamin', value: student.jenisKelamin },
        { no: '5.', label: 'Agama', value: student.agama },
        { no: '6.', label: 'Pendidikan Sebelumnya', value: student.asalTk },
        { no: '7.', 'label': 'Alamat Murid', value: student.alamatSiswa },
        { no: '8.', label: 'Nama Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.namaAyah },
        { sub: true, label: 'b. Ibu', value: student.namaIbu },
        { no: '9.', label: 'Pekerjaan Orang Tua' },
        { sub: true, label: 'a. Ayah', value: student.pekerjaanAyah },
        { sub: true, label: 'b. Ibu', value: student.pekerjaanIbu },
        { no: '10.', label: 'Alamat Orang Tua', value: student.alamatOrangTua },
        { no: '11.', label: 'Wali Murid' },
        { sub: true, label: 'a. Nama', value: student.namaWali },
        { sub: true, label: 'b. Pekerjaan', value: student.pekerjaanWali },
        { sub: true, label: 'c. Alamat', value: student.alamatWali },
    ];
    
    return (
        React.createElement('div', { className: 'font-times', style: { fontSize: '12pt' } },
            React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'IDENTITAS MURID'),
            React.createElement('table', { className: 'w-full', style: { tableLayout: 'fixed' } },
                React.createElement('tbody', null,
                    identitasSiswa.map((item, index) => (
                        React.createElement('tr', { key: index, className: 'align-top' },
                            React.createElement('td', { className: 'w-[5%] py-[1.5px]' }, item.no || ''),
                            React.createElement('td', { className: `w-[35%] py-[1.5px] ${item.sub ? 'pl-4' : ''}` }, item.label),
                            React.createElement('td', { className: 'w-[3%] py-[1.5px] text-center' }, item.label ? ':' : ''),
                            React.createElement('td', { className: 'w-[57%] py-[1.5px]' }, item.value || (item.sub ? '-' : ''))
                        )
                    ))
                )
            ),
            React.createElement('div', { className: 'flex justify-between items-end pt-10' },
                React.createElement('div', { className: 'w-32 h-40 border-2 flex items-center justify-center text-slate-400' }, 'Pas Foto 3x4'),
                React.createElement('div', { className: 'text-center' },
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`),
                    React.createElement('div', { className: 'mt-1' }, 'Kepala Sekolah,'),
                    React.createElement('div', { className: 'h-20' }),
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'),
                    React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)
                )
            )
        )
    );
};

const ReportStudentInfo = React.forwardRef(({ student, settings }, ref) => (
    React.createElement('div', { ref: ref },
        React.createElement('h2', { className: 'text-center font-bold mb-4', style: { fontSize: '12pt' } }, 'LAPORAN HASIL BELAJAR'),
        React.createElement('table', { className: 'w-full mb-4', style: { fontSize: '10.5pt' } },
            React.createElement('tbody', null,
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'w-[20%] py-[2px] px-2' }, 'Nama Murid'), React.createElement('td', { className: 'w-[45%] py-[2px] px-2' }, `: ${(student.namaLengkap || '').toUpperCase()}`),
                    React.createElement('td', { className: 'w-[15%] py-[2px] px-2' }, 'Kelas'), React.createElement('td', { className: 'w-[20%] py-[2px] px-2' }, `: ${settings.nama_kelas || ''}`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-[2px] px-2' }, 'NISN/NIS'), React.createElement('td', { className: 'py-[2px] px-2' }, `: ${student.nisn || '-'} / ${student.nis || '-'}`),
                    React.createElement('td', { className: 'py-[2px] px-2' }, 'Fase'), React.createElement('td', { className: 'py-[2px] px-2' }, `: C`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-[2px] px-2' }, 'Nama Sekolah'), React.createElement('td', { className: 'py-[2px] px-2' }, `: ${settings.nama_sekolah || ''}`),
                    React.createElement('td', { className: 'py-[2px] px-2' }, 'Semester'), React.createElement('td', { className: 'py-[2px] px-2' }, `: ${settings.semester ? (settings.semester.toLowerCase().includes('ganjil') ? '1 (Ganjil)' : '2 (Genap)') : '2'}`)
                ),
                React.createElement('tr', { className: 'align-top' },
                    React.createElement('td', { className: 'py-[2px] px-2' }, 'Alamat Sekolah'), React.createElement('td', { className: 'py-[2px] px-2' }, `: ${settings.alamat_sekolah || ''}`),
                    React.createElement('td', { className: 'whitespace-nowrap py-[2px] px-2' }, 'Tahun Pelajaran'), React.createElement('td', { className: 'py-[2px] px-2' }, `: ${settings.tahun_ajaran || ''}`)
                )
            )
        )
    )
));

const AcademicTable = React.forwardRef(({ subjectsToRender, startingIndex = 1, headerRef }, ref) => (
    React.createElement('table', { className: 'w-full border-collapse border-2 border-black mt-2', style: { fontSize: '10.5pt' } },
        React.createElement('thead', { ref: headerRef, className: "report-header-group" },
            React.createElement('tr', { className: 'font-bold text-center' },
                React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[5%]' }, 'No.'),
                React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[20%]' }, 'Mata Pelajaran'),
                React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[8%] whitespace-nowrap' }, 'Nilai Akhir'),
                React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[67%]' }, 'Capaian Kompetensi')
            )
        ),
        React.createElement('tbody', { ref: ref },
            subjectsToRender.map((item, index) => (
                React.createElement('tr', { key: item.id },
                    React.createElement('td', { className: 'border border-black px-2 py-[2px] text-center align-top' }, startingIndex + index),
                    React.createElement('td', { className: 'border border-black px-2 py-[2px] align-top' }, item.name),
                    React.createElement('td', { className: 'border border-black px-2 py-[2px] text-center align-top' }, item.grade ?? ''),
                    React.createElement('td', { className: 'border border-black px-2 py-[2px] align-top text-justify' },
                        React.createElement('p', {className: 'mb-1'}, item.description.highest),
                        item.description.lowest && React.createElement(React.Fragment, null,
                            React.createElement('hr', { className: 'border-t border-slate-400 my-1' }),
                            React.createElement('p', null, item.description.lowest)
                        )
                    )
                )
            ))
        )
    )
));

const ReportFooterContent = React.forwardRef((props, ref) => {
    const { 
        student, settings, attendance, notes, studentExtracurriculars, extracurriculars,
        showExtra, showNotes, showAttendance, showParentTeacherSignature, showHeadmasterSignature 
    } = props;
    const { extraRef, notesRef, attendanceRef, signaturesRef, headmasterRef } = ref || {};

    const attendanceData = attendance.find(a => a.studentId === student.id) || { sakit: null, izin: null, alpa: null };
    const sakitCount = attendanceData.sakit ?? 0;
    const izinCount = attendanceData.izin ?? 0;
    const alpaCount = attendanceData.alpa ?? 0;

    const studentExtraData = studentExtracurriculars.find(se => se.studentId === student.id);
    const studentNote = notes[student.id] || '';
    
    const extraActivities = (studentExtraData?.assignedActivities || [])
        .map(activityId => {
            if (!activityId) return null;
            const activity = extracurriculars.find(e => e.id === activityId);
            const description = studentExtraData.descriptions?.[activityId] || 'Mengikuti kegiatan dengan baik.';
            return { name: activity?.name, description };
        }).filter(Boolean);

    const renderDecision = () => {
        const isSemesterGenap = settings.semester?.toLowerCase().includes('genap');
        if (!isSemesterGenap) return null;

        const gradeLevel = getGradeNumber(settings.nama_kelas);
        if (gradeLevel === null) return null;

        let passText, passTo;

        if (gradeLevel >= 6) { // Handle for grade 6 and potentially higher if misconfigured
            passText = 'LULUS';
        } else {
            passText = 'Naik ke Kelas';
            const nextGrade = gradeLevel + 1;
            const nextGradeRomanMap = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V', 6: 'VI' };
            passTo = `${nextGrade} (${nextGradeRomanMap[nextGrade] || ''})`;
        }
        
        return React.createElement('div', { className: 'border-2 border-black p-2 mt-2' },
            React.createElement('div', { className: 'font-bold' }, 'Keputusan: '),
            React.createElement('div', null, 'Berdasarkan pencapaian seluruh kompetensi, murid dinyatakan:'),
            React.createElement('div', { className: 'font-bold mt-1 border-y-2 border-black text-center py-1' }, 
                `${passText} ${passTo || ''}`.trim()
            )
        );
    };

    return (
        React.createElement('div', { className: 'mt-2' },
            showExtra && React.createElement('div', { ref: extraRef, className: 'mt-2' },
                React.createElement('table', { className: 'w-full border-collapse border-2 border-black', style: { fontSize: '10.5pt' } },
                    React.createElement('thead', null, React.createElement('tr', { className: 'font-bold text-center' }, React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[5%]' }, 'No.'), React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[25%]' }, 'Ekstrakurikuler'), React.createElement('td', { className: 'border-2 border-black px-2 py-1 w-[70%]' }, 'Keterangan'))),
                    React.createElement('tbody', null, extraActivities.length > 0 ? extraActivities.map((item, index) => (React.createElement('tr', { key: index, className: 'align-top' }, React.createElement('td', { className: 'border border-black px-2 py-[2px] text-center' }, index + 1), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, item.name), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, item.description)))) : React.createElement('tr', null, React.createElement('td', { colSpan: 3, className: 'border border-black p-2 text-center h-8' }, '-')))
                )
            ),
            showNotes && React.createElement('div', { ref: notesRef, className: 'border-2 border-black p-2 mt-2', style: { fontSize: '10.5pt' } },
                React.createElement('div', { className: 'font-bold mb-1' }, 'Catatan Wali Kelas'),
                React.createElement('div', { className: 'min-h-[3rem]' }, studentNote || 'Tidak ada catatan.')
            ),
            showAttendance && React.createElement('div', { ref: attendanceRef, className: 'grid grid-cols-2 gap-4 mt-2' },
                React.createElement('table', { className: 'border-collapse border-2 border-black', style: { fontSize: '10.5pt' } },
                    React.createElement('thead', null, React.createElement('tr', { className: 'font-bold' }, React.createElement('td', { colSpan: 2, className: 'border-2 border-black px-2 py-1' }, 'Ketidakhadiran'))),
                    React.createElement('tbody', null,
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-[2px] w-2/3 pl-4' }, 'Sakit'), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, `: ${sakitCount} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-[2px] pl-4' }, 'Izin'), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, `: ${izinCount} hari`)),
                        React.createElement('tr', null, React.createElement('td', { className: 'border border-black px-2 py-[2px] pl-4' }, 'Tanpa Keterangan'), React.createElement('td', { className: 'border border-black px-2 py-[2px]' }, `: ${alpaCount} hari`))
                    )
                ),
                React.createElement('div', null, renderDecision())
            ),
            showParentTeacherSignature && React.createElement('div', { ref: signaturesRef, className: 'mt-2 flex justify-between', style: { fontSize: '12pt' } },
                React.createElement('div', { className: 'text-center' }, React.createElement('div', null, 'Mengetahui:'), React.createElement('div', null, 'Orang Tua/Wali,'), React.createElement('div', { className: 'h-14' }), React.createElement('div', null, '.........................')),
                React.createElement('div', { className: 'text-center' }, 
                    React.createElement('div', null, settings.tanggal_rapor || `${settings.kota_kabupaten || 'Tempat'}, ____-__-____`), 
                    React.createElement('div', null, 'Wali Kelas,'), 
                    React.createElement('div', { className: 'h-14' }), 
                    React.createElement('div', { className: 'font-bold underline' }, settings.nama_wali_kelas || '_________________'), 
                    React.createElement('div', null, `NIP. ${settings.nip_wali_kelas || '-'}`)
                )
            ),
            showHeadmasterSignature && React.createElement('div', { ref: headmasterRef, className: 'mt-2 flex justify-center text-center', style: { fontSize: '12pt' } }, React.createElement('div', null, React.createElement('div', null, 'Mengetahui,'), React.createElement('div', null, 'Kepala Sekolah,'), React.createElement('div', { className: 'h-14' }), React.createElement('div', { className: 'font-bold underline' }, settings.nama_kepala_sekolah || '_________________'), React.createElement('div', null, `NIP. ${settings.nip_kepala_sekolah || '-'}`)))
        )
    );
});


const PageFooter = ({ student, settings, currentPage, cmToPx }) => {
    const className = settings.nama_kelas || '';
    const studentName = student.namaLengkap || '';
    const nisn = student.nisn || '-';

    return (
        React.createElement('div', { 
            className: "absolute font-times", 
            style: { 
                left: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`,
                right: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`,
                bottom: `${PAGE_BOTTOM_MARGIN_CM * cmToPx}px`,
                fontSize: '10pt',
                height: `${PAGE_NUMBER_FOOTER_HEIGHT_CM * cmToPx}px`,
            }
        },
            React.createElement('div', { className: "border-t border-slate-400 mb-2" }),
            React.createElement('div', { className: "flex justify-between items-center" },
                React.createElement('div', null,
                    `${className} | ${studentName} | ${nisn}`
                ),
                React.createElement('div', null,
                    `Halaman ${currentPage}`
                )
            )
        )
    );
};


const ReportPagesForStudent = ({ student, settings, pageStyle, selectedPages, paperSize, cmToPx, ...restProps }) => {
    const { grades, subjects, learningObjectives, attendance, notes, extracurriculars, studentExtracurriculars } = restProps;
    const gradeData = grades.find(g => g.studentId === student.id);
    const [academicPageChunks, setAcademicPageChunks] = useState(null);

    const studentInfoRef = useRef(null);
    const tableHeaderRef = useRef(null);
    const tableBodyRef = useRef(null);
    const extraRef = useRef(null);
    const notesRef = useRef(null);
    const attendanceRef = useRef(null);
    const signaturesRef = useRef(null);
    const headmasterRef = useRef(null);

    const reportSubjects = useMemo(() => {
        const result = [];
        const processedGroups = new Set();
        const allActiveSubjects = subjects.filter(s => s.active);
        
        const groupConfigs = {
            'Pendidikan Agama dan Budi Pekerti': (groupSubjects) => {
                const studentReligion = student.agama?.trim().toLowerCase();
                const representative = groupSubjects.find(s => {
                    const match = s.fullName.match(/\(([^)]+)\)/);
                    return match && match[1].trim().toLowerCase() === studentReligion;
                });
                return representative ? { subject: representative, name: 'Pendidikan Agama dan Budi Pekerti' } : null;
            },
            'Seni Budaya': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects.find(s => s.fullName.includes("Seni Rupa")) || groupSubjects[0];
                return chosen ? { subject: chosen, name: 'Seni Budaya' } : null;
            },
            'Muatan Lokal': (groupSubjects) => {
                const chosen = groupSubjects.find(s => gradeData?.finalGrades?.[s.id] != null) || groupSubjects[0];
                if (chosen) {
                    const match = chosen.fullName.match(/\(([^)]+)\)/);
                    return { subject: chosen, name: match ? match[1] : 'Muatan Lokal' };
                }
                return null;
            }
        };

        Object.keys(groupConfigs).forEach(groupName => {
            if (processedGroups.has(groupName)) return;
            const groupSubjects = allActiveSubjects.filter(s => s.fullName.startsWith(groupName));
            if (groupSubjects.length > 0) {
                const config = groupConfigs[groupName](groupSubjects);
                if (config && config.subject) {
                     const grade = gradeData?.finalGrades?.[config.subject.id];
                     const description = generateDescription(student, config.subject, gradeData, learningObjectives, settings);
                     result.push({ id: config.subject.id, name: config.name, grade: grade, description: description });
                }
                processedGroups.add(groupName);
            }
        });
        
        allActiveSubjects.forEach(subject => {
            const isGrouped = Object.keys(groupConfigs).some(groupName => subject.fullName.startsWith(groupName));
            if (!isGrouped) {
                const grade = gradeData?.finalGrades?.[subject.id];
                const description = generateDescription(student, subject, gradeData, learningObjectives, settings);
                result.push({ id: subject.id, name: subject.fullName, grade: grade, description: description });
            }
        });
        
        const sortOrder = [
            'Pendidikan Agama dan Budi Pekerti', 'Pendidikan Pancasila', 'Bahasa Indonesia', 'Matematika', 
            'Ilmu Pengetahuan Alam dan Sosial', 'Seni Budaya', 'Pendidikan Jasmani, Olahraga, dan Kesehatan', 
            'Bahasa Inggris', 'Muatan Lokal'
        ];
        
        const findOriginalFullName = (subjectId) => subjects.find(s => s.id === subjectId)?.fullName || '';

        result.sort((a, b) => {
            const getSortKey = (item) => {
                const originalFullName = findOriginalFullName(item.id);
                if (originalFullName.startsWith('Pendidikan Agama')) return 'Pendidikan Agama dan Budi Pekerti';
                if (originalFullName.startsWith('Seni Budaya')) return 'Seni Budaya';
                if (originalFullName.startsWith('Muatan Lokal')) return 'Muatan Lokal';
                return item.name;
            };
            const aSortKey = getSortKey(a);
            const bSortKey = getSortKey(b);
            const aIndex = sortOrder.findIndex(key => aSortKey.startsWith(key));
            const bIndex = sortOrder.findIndex(key => bSortKey.startsWith(key));
            return (aIndex === -1 ? 99 : aIndex) - (bIndex === -1 ? 99 : bIndex);
        });
        return result;
    }, [student, subjects, gradeData, learningObjectives, settings]);

    useEffect(() => {
        if (!selectedPages.academic || cmToPx === 0) {
            setAcademicPageChunks([]);
            return;
        }
        setAcademicPageChunks(null); 

        const calculateChunks = () => {
            const refs = [studentInfoRef, tableHeaderRef, tableBodyRef, extraRef, notesRef, attendanceRef, signaturesRef, headmasterRef];
            if (refs.some(ref => !ref.current)) {
                setTimeout(calculateChunks, 50);
                return;
            }

            const pageHeightPx = parseFloat(PAPER_SIZES[paperSize].height) * cmToPx;
            const firstPageAvailableHeight = pageHeightPx - (HEADER_HEIGHT_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx);
            const subsequentPageAvailableHeight = pageHeightPx - (PAGE_TOP_MARGIN_CM * cmToPx) - (REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx);

            const allItems = [];
            
            const rowHeights = Array.from(tableBodyRef.current.children).map(row => row.getBoundingClientRect().height);
            reportSubjects.forEach((subject, index) => {
                allItems.push({ type: 'academic', content: subject, height: rowHeights[index] || 0 });
            });

            const footerItems = [
                { type: 'extra', ref: extraRef },
                { type: 'notes', ref: notesRef },
                { type: 'attendance', ref: attendanceRef },
                { type: 'signatures', ref: signaturesRef },
                { type: 'headmaster', ref: headmasterRef }
            ];

            footerItems.forEach(item => {
                const element = item.ref.current;
                if (element) {
                    const height = element.getBoundingClientRect().height;
                    const style = window.getComputedStyle(element);
                    const marginTop = parseFloat(style.marginTop);
                    const marginBottom = parseFloat(style.marginBottom);
                    if (height > 0) {
                         allItems.push({ type: item.type, height: height + marginTop + marginBottom });
                    }
                }
            });

            const allChunks = [];
            if (allItems.length === 0) {
                setAcademicPageChunks([[]]);
                return;
            }

            let currentItemIndex = 0;
            let isFirstPage = true;

            while (currentItemIndex < allItems.length) {
                let currentChunk = [];
                const availableHeight = isFirstPage ? firstPageAvailableHeight : subsequentPageAvailableHeight;
                let heightUsed = isFirstPage ? studentInfoRef.current.getBoundingClientRect().height : 0;
                
                const hasAcademicItemsRemaining = allItems.slice(currentItemIndex).some(item => item.type === 'academic');
                if (hasAcademicItemsRemaining) {
                    heightUsed += tableHeaderRef.current.getBoundingClientRect().height;
                }

                for (let i = currentItemIndex; i < allItems.length; i++) {
                    const item = allItems[i];
                    if (heightUsed + item.height <= availableHeight) {
                        currentChunk.push(item);
                        heightUsed += item.height;
                    } else {
                        break;
                    }
                }

                if (currentChunk.length === 0 && currentItemIndex < allItems.length) {
                    currentChunk.push(allItems[currentItemIndex]);
                }

                currentItemIndex += currentChunk.length;
                allChunks.push(currentChunk);
                isFirstPage = false;
            }
             setAcademicPageChunks(allChunks);
        };
        
        const timer = setTimeout(calculateChunks, 100);
        return () => clearTimeout(timer);

    }, [reportSubjects, paperSize, selectedPages.academic, student.id, cmToPx]);


    if (academicPageChunks === null && selectedPages.academic) {
        // Render the measurement layout
        return React.createElement('div', { 
                className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 
                style: { ...pageStyle, visibility: 'hidden', position: 'absolute', left: '-9999px', top: '-9999px' } 
            },
                 React.createElement('div', { className: 'absolute flex flex-col', style: {
                    top: `${HEADER_HEIGHT_CM * cmToPx}px`, left: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`, right: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`, bottom: `${REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx}px`, fontSize: '10.5pt'
                } },
                    React.createElement(ReportStudentInfo, { student, settings, ref: studentInfoRef }),
                    React.createElement(AcademicTable, { subjectsToRender: reportSubjects, ref: tableBodyRef, headerRef: tableHeaderRef }),
                    React.createElement(ReportFooterContent, { 
                        student, settings, attendance, notes, studentExtracurriculars, extracurriculars,
                        showExtra: true, showNotes: true, showAttendance: true, 
                        showParentTeacherSignature: true, showHeadmasterSignature: true,
                        ref: { extraRef, notesRef, attendanceRef, signaturesRef, headmasterRef }
                    })
                )
            );
    }
    
    let academicPageCounter = 0;

    const fullPagePadding = {
        padding: `${PAGE_TOP_MARGIN_CM * cmToPx}px ${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px ${PAGE_BOTTOM_MARGIN_CM * cmToPx}px ${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`,
        paddingTop: `${HEADER_HEIGHT_CM * cmToPx}px`
    };

    return (
        React.createElement(React.Fragment, null,
            selectedPages.cover && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'cover', style: pageStyle },
                React.createElement(CoverPage, { student: student, settings: settings, cmToPx: cmToPx })
            ),
            selectedPages.schoolIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'schoolIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings, cmToPx: cmToPx }),
                React.createElement('div', { style: fullPagePadding }, React.createElement(SchoolIdentityPage, { settings: settings, cmToPx: cmToPx }))
            ),
            selectedPages.studentIdentity && React.createElement('div', { className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'studentIdentity', style: pageStyle },
                React.createElement(ReportHeader, { settings: settings, cmToPx: cmToPx }),
                React.createElement('div', { style: fullPagePadding }, React.createElement(StudentIdentityPage, { student: student, settings: settings, cmToPx: cmToPx }))
            ),
            selectedPages.academic && academicPageChunks?.map((chunk, pageIndex) => {
                if (chunk.length === 0 && pageIndex > 0) return null; // Avoid empty pages unless it's the only one

                academicPageCounter++;
                const isFirstAcademicPage = pageIndex === 0;
                const contentTopPx = isFirstAcademicPage ? HEADER_HEIGHT_CM * cmToPx : PAGE_TOP_MARGIN_CM * cmToPx;
                
                const academicItemsInChunk = chunk.filter(item => item.type === 'academic').map(item => item.content);
                const hasAcademicItems = academicItemsInChunk.length > 0;
                
                let startingIndex = 1;
                for (let i = 0; i < pageIndex; i++) {
                    startingIndex += academicPageChunks[i].filter(item => item.type === 'academic').length;
                }

                const chunkItemTypes = new Set(chunk.map(item => item.type));

                return React.createElement('div', { key: `academic-${student.id}-${pageIndex}`, className: 'report-page bg-white shadow-lg mx-auto my-8 border box-border relative font-times', 'data-student-id': String(student.id), 'data-page-type': 'academic', style: pageStyle },
                    isFirstAcademicPage && React.createElement(ReportHeader, { settings: settings, cmToPx: cmToPx }),
                    
                    React.createElement('div', { className: 'absolute flex flex-col', style: {
                        top: `${contentTopPx}px`, 
                        left: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`, 
                        right: `${PAGE_LEFT_RIGHT_MARGIN_CM * cmToPx}px`, 
                        bottom: `${REPORT_CONTENT_BOTTOM_OFFSET_CM * cmToPx}px`, 
                        fontSize: '10.5pt',
                    }},
                        isFirstAcademicPage && React.createElement(ReportStudentInfo, { student, settings }),
                        hasAcademicItems && React.createElement(AcademicTable, { subjectsToRender: academicItemsInChunk, startingIndex: startingIndex }),
                        React.createElement(ReportFooterContent, { 
                            student, settings, attendance, notes, studentExtracurriculars, extracurriculars,
                            showExtra: chunkItemTypes.has('extra'),
                            showNotes: chunkItemTypes.has('notes'),
                            showAttendance: chunkItemTypes.has('attendance'),
                            showParentTeacherSignature: chunkItemTypes.has('signatures'),
                            showHeadmasterSignature: chunkItemTypes.has('headmaster'),
                        })
                    ),
                    
                    React.createElement(PageFooter, { student: student, settings: settings, currentPage: academicPageCounter, cmToPx: cmToPx })
                );
            })
        )
    );
};


const PAPER_SIZES = {
    A4: { width: '21cm', height: '29.7cm' },
    F4: { width: '21.5cm', height: '33cm' },
    Letter: { width: '21.59cm', height: '27.94cm' },
    Legal: { width: '21.59cm', height: '35.56cm' },
};

const jsPDFPaperSizes = {
    A4: { width: 210, height: 297 },
    F4: { width: 215, height: 330 },
    Letter: { width: 215.9, height: 279.4 },
    Legal: { width: 215.9, height: 355.6 },
};

const PrintRaporPage = ({ students, settings, showToast, ...restProps }) => {
    const [paperSize, setPaperSize] = useState('A4');
    const [selectedStudentId, setSelectedStudentId] = useState('all');
    const [selectedPages, setSelectedPages] = useState({
        cover: true,
        schoolIdentity: true,
        studentIdentity: true,
        academic: true,
    });
    const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
    const cmRef = useRef(null);
    const [cmToPx, setCmToPx] = useState(0);

    useEffect(() => {
        const measure = () => {
            if (cmRef.current) {
                setCmToPx(cmRef.current.offsetHeight);
            }
        };
        // Initial measure might be 0, so we retry
        const interval = setInterval(() => {
            if(cmRef.current && cmRef.current.offsetHeight > 0) {
                setCmToPx(cmRef.current.offsetHeight);
                clearInterval(interval);
            }
        }, 50);

        window.addEventListener('resize', measure);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', measure);
        };
    }, []);

    const handlePageSelectionChange = useCallback((e) => {
        const { name, checked } = e.target;
        setSelectedPages(prev => {
            if (name === 'all') {
                return {
                    cover: checked,
                    schoolIdentity: checked,
                    studentIdentity: checked,
                    academic: checked,
                };
            }
            return {
                ...prev,
                [name]: checked,
            };
        });
    }, []);
    
    const handleGeneratePdf = async () => {
        setIsGeneratingPdf(true);
        showToast('Memuat aset font...', 'success');
        try {
            // Use the new programmatic font loader for maximum reliability
            await loadFonts();
            showToast('Membuat PDF, ini mungkin memakan waktu...', 'success');

            const { jsPDF } = window.jspdf;
            const doc = new jsPDF('p', 'mm', [jsPDFPaperSizes[paperSize].width, jsPDFPaperSizes[paperSize].height]);
            
            const reportElements = document.querySelectorAll('#print-area .report-page');
    
            for (let i = 0; i < reportElements.length; i++) {
                const element = reportElements[i];
                
                const canvas = await html2canvas(element, { 
                    scale: 2,
                    useCORS: true,
                    logging: false,
                    allowTaint: true
                });
    
                const imgData = canvas.toDataURL('image/jpeg', 1.0);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = doc.internal.pageSize.getHeight();
                
                if (i > 0) doc.addPage();
                
                doc.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight);
            }
            
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');
            
            showToast('PDF rapor berhasil dibuat dan dibuka di tab baru!', 'success');
    
        } catch (error) {
            console.error("Gagal membuat PDF:", error);
            showToast(`Gagal membuat PDF: ${error.message || 'Error tidak diketahui'}`, 'error');
        } finally {
            setIsGeneratingPdf(false);
        }
    };

    const studentsToRender = useMemo(() => {
        if (selectedStudentId === 'all') {
            return students;
        }
        return students.filter(s => String(s.id) === selectedStudentId);
    }, [students, selectedStudentId]);
    
    const pageStyle = useMemo(() => {
        if (cmToPx === 0) return { visibility: 'hidden' };
        return {
            width: `${parseFloat(PAPER_SIZES[paperSize].width) * cmToPx}px`,
            height: `${parseFloat(PAPER_SIZES[paperSize].height) * cmToPx}px`,
        };
    }, [paperSize, cmToPx]);

    const pageCheckboxes = [
        { key: 'cover', label: 'Sampul' },
        { key: 'schoolIdentity', label: 'Identitas Sekolah' },
        { key: 'studentIdentity', label: 'Identitas Murid' },
        { key: 'academic', label: 'Laporan Hasil Belajar' },
    ];

    return (
        React.createElement(React.Fragment, null,
            React.createElement('div', { ref: cmRef, style: { height: '1cm', position: 'fixed', left: '-9999px', top: '-9999px' } }),
            React.createElement('div', { className: "bg-white p-4 rounded-xl shadow-md border border-slate-200 mb-6 print-hidden space-y-4" },
                 React.createElement('div', { className: "flex flex-col md:flex-row items-start md:items-center justify-between" },
                    React.createElement('div', null,
                        React.createElement('h2', { className: "text-xl font-bold text-slate-800" }, "Cetak Rapor"),
                        React.createElement('p', { className: "mt-1 text-sm text-slate-600" }, "Pilih murid, halaman, dan ukuran kertas, lalu klik tombol untuk membuat file PDF.")
                    ),
                    React.createElement('div', { className: "flex flex-col sm:flex-row sm:items-end gap-4 mt-4 md:mt-0" },
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'studentSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Pilih Murid'),
                            React.createElement('select', { 
                                id: "studentSelector",
                                value: selectedStudentId,
                                onChange: (e) => setSelectedStudentId(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500" },
                                React.createElement('option', { value: "all" }, "Cetak Semua Murid"),
                                students.map(s => React.createElement('option', { key: s.id, value: String(s.id) }, s.namaLengkap))
                            )
                        ),
                        React.createElement('div', null,
                            React.createElement('label', { htmlFor: 'paperSizeSelector', className: 'block text-sm font-medium text-slate-700 mb-1' }, 'Ukuran Kertas'),
                            React.createElement('select', {
                                id: "paperSizeSelector", value: paperSize, onChange: (e) => setPaperSize(e.target.value),
                                className: "w-full sm:w-48 p-2 text-sm bg-white border border-slate-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500"
                            }, Object.keys(PAPER_SIZES).map(key => React.createElement('option', { key: key, value: key }, `${key} (${PAPER_SIZES[key].width} x ${PAPER_SIZES[key].height})`)))
                        ),
                        React.createElement('button', { 
                            onClick: handleGeneratePdf,
                            disabled: isGeneratingPdf || cmToPx === 0,
                            className: "px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-lg shadow-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed" 
                        }, isGeneratingPdf ? 'Membangun PDF...' : (cmToPx === 0 ? 'Menyiapkan...' : 'Generate PDF Rapor'))
                    )
                ),
                React.createElement('div', { className: "border-t pt-4" },
                    React.createElement('p', { className: "text-sm font-medium text-slate-700 mb-2" }, "Pilih Halaman untuk Dicetak:"),
                    React.createElement('div', { className: "flex flex-wrap gap-x-6 gap-y-2" },
                        React.createElement('label', { className: "flex items-center space-x-2" }, React.createElement('input', { type: "checkbox", name: "all", checked: Object.values(selectedPages).every(Boolean), onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }), React.createElement('span', { className: "text-sm font-bold" }, "Pilih Semua")),
                        ...pageCheckboxes.map(page => (
                            React.createElement('label', { key: page.key, className: "flex items-center space-x-2" },
                                React.createElement('input', { type: "checkbox", name: page.key, checked: selectedPages[page.key] || false, onChange: handlePageSelectionChange, className: "h-4 w-4 text-indigo-600 border-gray-300 rounded" }),
                                React.createElement('span', { className: "text-sm" }, page.label)
                            )
                        ))
                    )
                )
            ),
            
            React.createElement('div', { id: "print-area", className: "space-y-8" },
                cmToPx > 0 && studentsToRender.map(student => {
                    return React.createElement(ReportPagesForStudent, { 
                        key: student.id, 
                        student: student, 
                        settings: settings,
                        pageStyle: pageStyle,
                        selectedPages: selectedPages,
                        paperSize: paperSize,
                        cmToPx: cmToPx,
                        ...restProps
                    })
                })
            )
        )
    );
};

export default PrintRaporPage;
