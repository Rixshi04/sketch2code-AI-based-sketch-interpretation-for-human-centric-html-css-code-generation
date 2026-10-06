export type LocalGenerationInput = {
  platform: 'react' | 'vue' | 'html'
  layout: string
  description?: string
  theme?: 'light' | 'dark'
}

const esc = (value: string) =>
  value.replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char] || char))

function htmlTemplate(layout: string, description: string, dark = false) {
  const title = esc(layout.replace(/[-_]/g, ' '))
  const text = esc(description || 'Generated from your sketch.')
  const bg = dark ? '#0f172a' : '#f8fafc'
  const fg = dark ? '#f8fafc' : '#0f172a'
  return `<!doctype html>
<html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title>
<style>
body{margin:0;min-height:100vh;font-family:Inter,system-ui,sans-serif;background:${bg};color:${fg};display:grid;place-items:center}
.card{width:min(720px,90vw);padding:40px;border-radius:24px;background:rgba(255,255,255,.9);box-shadow:0 20px 60px rgba(15,23,42,.15)}
button{padding:12px 18px;border:0;border-radius:12px;background:#6366f1;color:white;font-weight:700;cursor:pointer}
</style></head><body><main class="card"><h1>${title}</h1><p>${text}</p><button>Primary Action</button></main></body></html>`
}

export const LocalCodeGenerator = {
  generate(input: LocalGenerationInput): string {
    const description = input.description || ''
    const html = htmlTemplate(input.layout, description, input.theme === 'dark')

    if (input.platform === 'html') return html

    if (input.platform === 'vue') {
      return `<template>
  <main class="generated-page">
    <section class="card">
      <h1>${esc(input.layout.replace(/[-_]/g, ' '))}</h1>
      <p>${esc(description || 'Generated from your sketch.')}</p>
      <button @click="count++">Primary Action ({{ count }})</button>
    </section>
  </main>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const count = ref(0)
</script>

<style scoped>
.generated-page{min-height:100vh;display:grid;place-items:center;background:#f8fafc;padding:24px}
.card{width:min(720px,90vw);padding:40px;border-radius:24px;background:white;box-shadow:0 20px 60px rgba(15,23,42,.15)}
button{padding:12px 18px;border:0;border-radius:12px;background:#6366f1;color:white;font-weight:700;cursor:pointer}
</style>`
    }

    return `import React, { useState } from 'react'

export default function GeneratedComponent() {
  const [count, setCount] = useState(0)
  return (
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f8fafc',padding:24}}>
      <section style={{width:'min(720px,90vw)',padding:40,borderRadius:24,background:'#fff',boxShadow:'0 20px 60px rgba(15,23,42,.15)'}}>
        <h1>${esc(input.layout.replace(/[-_]/g, ' '))}</h1>
        <p>${esc(description || 'Generated from your sketch.')}</p>
        <button type="button" onClick={() => setCount((value) => value + 1)}>Primary Action ({count})</button>
      </section>
    </main>
  )
}`
  },
}
