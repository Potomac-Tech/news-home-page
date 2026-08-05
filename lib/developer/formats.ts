export function toCsv(rows: Record<string, unknown>[]) {
    const headers = [...new Set(rows.flatMap((row) => Object.keys(row)))];
    const escape = (value: unknown) => {
        const text = value == null ? "" : typeof value === "object" ? JSON.stringify(value) : String(value);
        return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
    };
    return [headers.map(escape).join(","), ...rows.map((row) => headers.map((header) => escape(row[header])).join(","))].join("\r\n");
}

function pdfEscape(value: string) {
    return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}

export function toPdf(title: string, rows: Record<string, unknown>[]) {
    const lines = [title, `Generated ${new Date().toISOString()}`, "", ...rows.slice(0, 500).map((row) => JSON.stringify(row))];
    const pages: string[][] = [];
    for (let index = 0; index < lines.length; index += 45) pages.push(lines.slice(index, index + 45));
    const objects: string[] = [];
    const pageIds: number[] = [];
    objects.push("<< /Type /Catalog /Pages 2 0 R >>", "");
    objects.push("<< /Type /Font /Subtype /Type1 /BaseFont /Courier >>");
    for (const page of pages) {
        const pageId = objects.length + 1;
        const contentId = pageId + 1;
        pageIds.push(pageId);
        objects.push(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R >> >> /Contents ${contentId} 0 R >>`);
        const stream = `BT /F1 8 Tf 36 756 Td 11 TL ${page.map((line, i) => `${i ? "T* " : ""}(${pdfEscape(line.slice(0, 115))}) Tj`).join(" ")} ET`;
        objects.push(`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`);
    }
    objects[1] = `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`;
    let pdf = "%PDF-1.4\n";
    const offsets = [0];
    objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = pdf.length;
    pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\n`;
    pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    return new TextEncoder().encode(pdf);
}
