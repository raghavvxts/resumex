/* eslint-disable @typescript-eslint/no-explicit-any */
const escape = (value: unknown) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
export const browserResumeDocument = (resume: Record<string, any>): string => {
  const info = resume.personal_info || {};
  const paragraph = (text: unknown) => `<p>${escape(text)}</p>`;
  const sections = ["experience", "projects", "education"]
    .map((section) => {
      const entries = resume[section] || [];
      if (!entries.length) return "";
      return `<section><h2>${section}</h2>${entries
        .map(
          (entry: Record<string, any>) =>
            `<article>${paragraph(
              Object.entries(entry)
                .filter(([key, value]) => key !== "bullets" && value)
                .map(([, value]) => value)
                .join(" | "),
            )}${entry.bullets?.length ? `<ul>${entry.bullets.map((bullet: string) => `<li>${escape(bullet)}</li>`).join("")}</ul>` : ""}</article>`,
        )
        .join("")}</section>`;
    })
    .join("");
  const skills = Object.entries(resume.skills || {})
    .filter(([, value]) => value)
    .map(([key, value]) =>
      paragraph(`${key}: ${Array.isArray(value) ? value.join(", ") : value}`),
    )
    .join("");
  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><title>Resume</title><style>
    @page { size: A4; margin: 16mm; } * { box-sizing: border-box; }
    body { margin: 0; color: #111; background: white; font: 11pt/1.45 Arial, sans-serif; overflow-wrap: anywhere; }
    h1 { font-size: 23pt; margin: 0 0 6pt; } h2 { font-size: 12pt; text-transform: uppercase; border-bottom: 1px solid #555; margin: 14pt 0 6pt; break-after: avoid; }
    p { margin: 4pt 0; white-space: pre-wrap; orphans: 2; widows: 2; } ul { margin: 5pt 0; padding-left: 17pt; } li { white-space: pre-wrap; orphans: 2; widows: 2; }
    article { margin-bottom: 10pt; } header { text-align: center; }
  </style></head><body><header><h1>${escape(info.name)}</h1>${paragraph(
    Object.entries(info)
      .filter(([key, value]) => key !== "name" && value)
      .map(([, value]) => value)
      .join(" | "),
  )}</header>${resume.summary ? `<section><h2>Summary</h2>${paragraph(resume.summary)}</section>` : ""}${sections}${skills ? `<section><h2>Skills</h2>${skills}</section>` : ""}</body></html>`;
};

export const printResume = (resume: Record<string, any>) => {
  const frame = document.createElement("iframe");
  frame.title = "Local resume PDF";
  frame.setAttribute("aria-hidden", "true");
  frame.style.cssText = "position:fixed;width:0;height:0;border:0;";
  const cleanup = () => frame.remove();
  frame.onload = () => {
    const target = frame.contentWindow;
    if (!target) return cleanup();
    target.addEventListener("afterprint", cleanup, { once: true });
    void (target.document.fonts?.ready || Promise.resolve())
      .then(() => {
        if (!frame.isConnected) return;
        target.focus();
        target.print();
      })
      .catch(cleanup);
  };
  frame.srcdoc = browserResumeDocument(resume);
  document.body.appendChild(frame);
  // Safari can return from print() before the dialog closes.
  setTimeout(cleanup, 300000);
};
