import * as fs from 'fs';

const pagePath = 'src/components/JurnalFormatifPage.tsx';
let content = fs.readFileSync(pagePath, 'utf8');

// NoteEditorModal bounds
const noteStart = content.indexOf('interface NoteEditorModalProps {');
const noteEnd = content.indexOf('interface StudentJournalModalProps {');

const noteContent = content.slice(noteStart, noteEnd);

const noteFile = `import React, { useState, useEffect } from 'react';
import { FORMATIVE_ASSESSMENT_TYPES } from '../../constants';

${noteContent}`;
fs.writeFileSync('src/components/JurnalFormatif/NoteEditorModal.tsx', noteFile);

// StudentJournalModal bounds
const journalStart = content.indexOf('interface StudentJournalModalProps {');
const journalEnd = content.indexOf('const JurnalFormatifPage: React.FC<JurnalFormatifPageProps> = ({');

const journalContent = content.slice(journalStart, journalEnd);

const journalFile = `import React, { useState } from 'react';
import { NoteEditorModal } from './NoteEditorModal';
import { EmptyState } from '../EmptyState';

${journalContent}`;
fs.writeFileSync('src/components/JurnalFormatif/StudentJournalModal.tsx', journalFile);

// Update Page
const pageLines = content.split('\n');
const importLine = `import { StudentJournalModal } from './JurnalFormatif/StudentJournalModal';`;

const finalPage = [
  ...pageLines.slice(0, 4),
  importLine,
  ...pageLines.slice(4, noteStart - 1).filter(l => l.trim() !== ''),
  ...pageLines.slice(content.substring(0, journalEnd).split('\\n').length - 1)
];

fs.writeFileSync(pagePath, finalPage.join('\n'));
