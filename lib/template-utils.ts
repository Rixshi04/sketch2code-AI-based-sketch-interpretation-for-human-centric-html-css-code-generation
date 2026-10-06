export type MergeMode = 'replace' | 'merge' | 'insert'

export function mergeGeneratedCodeWithTemplate(
  generatedCode: string,
  templateHtml: string,
  templateCss: string,
  options: { mode?: MergeMode } = {},
) {
  const mode = options.mode || 'replace'
  const generated = generatedCode || ''
  const template = templateHtml || ''
  const css = templateCss || ''

  if (mode === 'replace') {
    return { html: generated || template, css }
  }

  if (mode === 'insert') {
    const bodyClose = template.search(/<\/body>/i)
    const html = bodyClose >= 0
      ? template.slice(0, bodyClose) + generated + template.slice(bodyClose)
      : template + generated
    return { html, css }
  }

  const separator = template.trim() && generated.trim() ? '\n\n' : ''
  return { html: template + separator + generated, css }
}
