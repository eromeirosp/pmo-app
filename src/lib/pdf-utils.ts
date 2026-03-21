import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// Standard colors
const HEADER_FILL: [number, number, number] = [201, 163, 85];
const HEADER_TEXT: [number, number, number] = [255, 255, 255];
const ALT_ROW_FILL: [number, number, number] = [248, 250, 252];
const META_COLOR = 100;
const FOOTER_COLOR = 150;

/**
 * Creates a new jsPDF document with standardized header.
 * Returns the doc and the Y position to start content.
 */
export function createPdfDoc(options: {
  title: string;
  projectName?: string;
  projectId?: string;
  subtitle?: string;
  meta?: string[];
}): { doc: jsPDF; startY: number } {
  const doc = new jsPDF();
  const { title, projectName, projectId, subtitle, meta = [] } = options;

  // Title
  doc.setFontSize(18);
  doc.setTextColor(40);
  doc.text(title, 14, 22);

  // Subtitle (optional)
  let y = 30;
  if (subtitle) {
    doc.setFontSize(12);
    doc.setTextColor(80);
    doc.text(subtitle, 14, y);
    y += 6;
  }

  // Meta info
  doc.setFontSize(10);
  doc.setTextColor(META_COLOR);

  if (projectName) {
    doc.text(`Projeto: ${projectName}`, 14, y);
    y += 5;
  }
  if (projectId) {
    doc.text(`ID: ${projectId}`, 14, y);
    y += 5;
  }
  doc.text(`Data: ${new Date().toLocaleDateString("pt-BR")}`, 14, y);
  y += 5;

  for (const line of meta) {
    doc.text(line, 14, y);
    y += 5;
  }

  return { doc, startY: y + 5 };
}

/**
 * Standard autoTable styles for consistency.
 */
export const TABLE_STYLES = {
  headStyles: { fillColor: HEADER_FILL, textColor: HEADER_TEXT, fontStyle: "bold" as const },
  alternateRowStyles: { fillColor: ALT_ROW_FILL },
  styles: { cellPadding: 3, fontSize: 9 },
  margin: { top: 45 },
};

/**
 * Add a table to the doc and return the new Y position.
 */
export function addTable(
  doc: jsPDF,
  startY: number,
  head: string[][],
  body: string[][],
  extraStyles?: Record<string, unknown>
): number {
  autoTable(doc, {
    startY,
    head,
    body: body.length > 0 ? body : [["Nenhum item cadastrado"]],
    ...TABLE_STYLES,
    ...extraStyles,
  });
  return getLastTableY(doc) + 10;
}

/**
 * Add a section header and table.
 */
export function addSection(
  doc: jsPDF,
  startY: number,
  sectionTitle: string,
  body: string[][]
): number {
  return addTable(doc, startY, [[sectionTitle]], body);
}

/**
 * Get the Y position after the last autoTable.
 */
export function getLastTableY(doc: jsPDF): number {
  return (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY;
}

/**
 * Add a standardized footer to all pages.
 */
export function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    const pageWidth = doc.internal.pageSize.width;

    // Divider line
    doc.setDrawColor(220);
    doc.line(14, pageHeight - 18, pageWidth - 14, pageHeight - 18);

    // Footer text
    doc.setFontSize(8);
    doc.setTextColor(FOOTER_COLOR);
    doc.text("Gerado por Projects AI/R Documents", 14, pageHeight - 12);
    doc.text(`Página ${i} de ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: "right" });
  }
}

/**
 * Save the PDF with cross-browser support.
 */
export async function savePdf(doc: jsPDF, filename: string) {
  addFooter(doc);

  const pdfData = doc.output("arraybuffer");
  const blob = new Blob([pdfData], { type: "application/pdf" });

  if ("showSaveFilePicker" in window) {
    const handle = await (
      window as unknown as {
        showSaveFilePicker: (opts: unknown) => Promise<FileSystemFileHandle>;
      }
    ).showSaveFilePicker({
      suggestedName: filename,
      types: [{ description: "PDF", accept: { "application/pdf": [".pdf"] } }],
    });
    const writable = await handle.createWritable();
    await writable.write(blob);
    await writable.close();
  } else {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setTimeout(() => URL.revokeObjectURL(url), 10000);
  }
}

/**
 * Add narrative text (multi-line, with page break support).
 */
export function addNarrativeSection(
  doc: jsPDF,
  startY: number,
  title: string,
  text: string
): number {
  const pageHeight = doc.internal.pageSize.height;
  const maxWidth = 180;

  // Check if we need a new page
  if (startY > pageHeight - 50) {
    doc.addPage();
    startY = 20;
  }

  // Section title
  doc.setFontSize(12);
  doc.setTextColor(40);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, startY);
  startY += 7;

  // Section text
  doc.setFontSize(10);
  doc.setTextColor(60);
  doc.setFont("helvetica", "normal");
  const lines = doc.splitTextToSize(text || "—", maxWidth);

  for (const line of lines) {
    if (startY > pageHeight - 25) {
      doc.addPage();
      startY = 20;
    }
    doc.text(line, 14, startY);
    startY += 5;
  }

  return startY + 8;
}
