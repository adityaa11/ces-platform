export function createPdf(pageTexts: readonly string[]): Uint8Array {
  const pageObjectNumbers = pageTexts.map((_text, index) => 3 + index * 2);
  const fontObjectNumber = 3 + pageTexts.length * 2;
  const objects = new Map<number, string>();
  objects.set(1, "<< /Type /Catalog /Pages 2 0 R >>");
  objects.set(2, `<< /Type /Pages /Kids [${pageObjectNumbers.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageTexts.length} >>`);
  pageTexts.forEach((text, index) => {
    const pageObject = pageObjectNumbers[index]!;
    const contentObject = pageObject + 1;
    const escaped = text.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
    const stream = text.length > 0
      ? `BT /F1 12 Tf 72 720 Td (${escaped}) Tj ET`
      : "";
    objects.set(pageObject, `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 ${fontObjectNumber} 0 R >> >> /Contents ${contentObject} 0 R >>`);
    objects.set(contentObject, `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
  });
  objects.set(fontObjectNumber, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  let body = "%PDF-1.7\n";
  const offsets = [0];
  for (let objectNumber = 1; objectNumber <= fontObjectNumber; objectNumber += 1) {
    offsets[objectNumber] = new TextEncoder().encode(body).byteLength;
    body += `${objectNumber} 0 obj\n${objects.get(objectNumber)}\nendobj\n`;
  }
  const xrefOffset = new TextEncoder().encode(body).byteLength;
  body += `xref\n0 ${fontObjectNumber + 1}\n`;
  body += "0000000000 65535 f \n";
  for (let objectNumber = 1; objectNumber <= fontObjectNumber; objectNumber += 1) {
    body += `${String(offsets[objectNumber]).padStart(10, "0")} 00000 n \n`;
  }
  body += `trailer\n<< /Size ${fontObjectNumber + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF\n`;
  return new TextEncoder().encode(body);
}
