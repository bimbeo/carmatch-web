function withDirectAnswerClass(attributes = '') {
  if (/\bclass\s*=\s*(["'])/i.test(attributes)) {
    return attributes.replace(/\bclass\s*=\s*(["'])([^"']*)\1/i, (_match, quote, value) => {
      const classes = new Set(String(value).split(/\s+/).filter(Boolean));
      classes.add('direct-answer');
      return `class=${quote}${Array.from(classes).join(' ')}${quote}`;
    });
  }
  return `${attributes} class="direct-answer"`;
}

export function deTemplateDirectAnswer(html = '') {
  return String(html).replace(
    /<p([^>]*)>\s*(?:<strong>\s*Câu trả lời ngắn:\s*<\/strong>|Câu trả lời ngắn:)\s*/gi,
    (_match, attributes) => `<p${withDirectAnswerClass(attributes)}>`
  );
}
