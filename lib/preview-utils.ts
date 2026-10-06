export function escapeForInlineScript(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/<\\/script/gi, '<\\\\/script')
    .replace(/<!--/g, '<\\\\!--')
}
