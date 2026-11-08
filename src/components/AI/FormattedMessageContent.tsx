import React from 'react';
import { CheckCircle2 } from 'lucide-react';

interface FormattedMessageContentProps {
  content: string;
}

export const FormattedMessageContent: React.FC<FormattedMessageContentProps> = ({ content }) => {
  if (!content) return null;

  // Split lines into structured blocks
  const lines = content.split('\n');
  const blocks: React.ReactNode[] = [];
  let currentTableRows: string[] = [];
  let currentListItems: string[] = [];
  let blockKey = 0;

  const flushTable = () => {
    if (currentTableRows.length === 0) return;
    const headerRow = currentTableRows[0];
    const dataRows = currentTableRows.slice(2); // Skip separator row (e.g. |:---|:---|)

    const parseCells = (row: string) =>
      row
        .split('|')
        .slice(1, -1)
        .map((cell) => cell.trim());

    const headers = parseCells(headerRow);

    blocks.push(
      <div key={`table-${blockKey++}`} className="my-3 overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-2xs">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-700 font-bold">
              {headers.map((h, idx) => (
                <th key={idx} className="py-2 px-3 tracking-wider text-[11px] font-bold uppercase">
                  {renderFormattedInline(h)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {dataRows.map((row, rIdx) => {
              const cells = parseCells(row);
              return (
                <tr key={rIdx} className="hover:bg-slate-50/80 transition-colors">
                  {cells.map((cell, cIdx) => (
                    <td key={cIdx} className="py-2 px-3 text-slate-800 font-medium">
                      {renderFormattedInline(cell)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
    currentTableRows = [];
  };

  const flushList = () => {
    if (currentListItems.length === 0) return;
    blocks.push(
      <ul key={`list-${blockKey++}`} className="my-2 space-y-1.5 pl-1">
        {currentListItems.map((item, idx) => (
          <li key={idx} className="flex items-start gap-2 text-xs text-slate-700 leading-relaxed">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 flex-shrink-0" />
            <span className="flex-1">{renderFormattedInline(item)}</span>
          </li>
        ))}
      </ul>
    );
    currentListItems = [];
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    // Table Row detection
    if (line.startsWith('|') && line.endsWith('|')) {
      flushList();
      currentTableRows.push(line);
      continue;
    } else if (currentTableRows.length > 0) {
      flushTable();
    }

    // List Item detection (- or * or •)
    if (/^[-*•]\s+/.test(line)) {
      const itemText = line.replace(/^[-*•]\s+/, '');
      currentListItems.push(itemText);
      continue;
    } else if (currentListItems.length > 0) {
      flushList();
    }

    // Empty lines
    if (!line) {
      continue;
    }

    // Section Headers
    if (line.startsWith('### ')) {
      const title = line.replace('### ', '');
      blocks.push(
        <div key={`h3-${blockKey++}`} className="mt-4 mb-2 pb-1 border-b border-slate-200">
          <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <span className="w-2 h-3.5 bg-blue-600 rounded-sm" />
            {renderFormattedInline(title)}
          </h3>
        </div>
      );
      continue;
    }

    if (line.startsWith('#### ')) {
      const title = line.replace('#### ', '');
      blocks.push(
        <h4 key={`h4-${blockKey++}`} className="mt-3 mb-1 text-xs font-bold text-slate-800">
          {renderFormattedInline(title)}
        </h4>
      );
      continue;
    }

    // Executive Verdict / Recommendation Box
    if (line.includes('Verdict') || line.includes('Recommendation') || line.includes('Takeaway')) {
      blocks.push(
        <div
          key={`verdict-${blockKey++}`}
          className="my-3 p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/90 rounded-xl shadow-2xs"
        >
          <div className="flex items-center gap-1.5 text-blue-900 font-bold text-[11px] uppercase tracking-wider mb-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600 flex-shrink-0" />
            <span>Consultant Verdict</span>
          </div>
          <div className="text-xs text-slate-800 leading-relaxed font-medium">
            {renderFormattedInline(line)}
          </div>
        </div>
      );
      continue;
    }

    // Regular Paragraph
    blocks.push(
      <p key={`p-${blockKey++}`} className="my-1.5 text-xs text-slate-700 leading-relaxed">
        {renderFormattedInline(line)}
      </p>
    );
  }

  flushTable();
  flushList();

  return <div className="space-y-1">{blocks}</div>;
};

/**
 * Parses bold, currency figures, and key highlights
 */
function renderFormattedInline(text: string): React.ReactNode {
  if (!text) return null;

  // Split bold **bold text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      // Check if it's a currency or percentage rate
      if (/₹|%|Cr|Lakh|sq\.ft|BHK/i.test(inner)) {
        return (
          <span
            key={idx}
            className="font-bold text-slate-900 bg-slate-100/90 px-1.5 py-0.5 rounded text-[11px] border border-slate-200/60 inline-block mx-0.5"
          >
            {inner}
          </span>
        );
      }
      return (
        <strong key={idx} className="font-bold text-slate-900">
          {inner}
        </strong>
      );
    }
    return part;
  });
}

export default FormattedMessageContent;
