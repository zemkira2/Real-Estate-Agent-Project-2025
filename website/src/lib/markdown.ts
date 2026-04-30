export function renderMarkdown(text: string): string {
  const lines = text.split("\n");
  const out: string[] = [];
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i]
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    // Inline formatting
    line = line.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
    line = line.replace(/\*(.+?)\*/g, "<em>$1</em>");
    // Inline code
    line = line.replace(/`(.+?)`/g, "<code>$1</code>");

    if (/^### (.+)$/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h3>${line.replace(/^### /, "")}</h3>`);
    } else if (/^## (.+)$/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h2>${line.replace(/^## /, "")}</h2>`);
    } else if (/^# (.+)$/.test(line)) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<h1>${line.replace(/^# /, "")}</h1>`);
    } else if (/^---+$/.test(line.trim())) {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push("<hr>");
    } else if (/^- (.+)$/.test(line)) {
      if (!inList) { out.push("<ul>"); inList = true; }
      out.push(`<li>${line.replace(/^- /, "")}</li>`);
    } else if (line.trim() === "") {
      if (inList) { out.push("</ul>"); inList = false; }
    } else {
      if (inList) { out.push("</ul>"); inList = false; }
      out.push(`<p>${line}</p>`);
    }
  }

  if (inList) out.push("</ul>");
  return out.join("\n");
}
