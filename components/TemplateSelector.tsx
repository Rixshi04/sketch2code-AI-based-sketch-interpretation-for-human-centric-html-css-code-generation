'use client'

type Template = { html: string; css: string; name: string }
type Props = { onSelect: (template: Template) => void; showPreview?: boolean }

const templates: Template[] = [
  { name: 'Landing', html: '<main><section><h1>Welcome</h1><p>Build something great.</p><button>Get started</button></section></main>', css: 'main{min-height:100vh;display:grid;place-items:center;background:#f8fafc}section{padding:40px;text-align:center}' },
  { name: 'Login', html: '<main><form><h1>Sign in</h1><input placeholder="Email"><input placeholder="Password"><button>Sign in</button></form></main>', css: 'main{min-height:100vh;display:grid;place-items:center;background:#f8fafc}form{display:grid;gap:12px;width:min(360px,90vw);padding:32px;background:white;border-radius:20px}' },
  { name: 'Dashboard', html: '<main><header><h1>Dashboard</h1></header><section><article>Metric</article><article>Metric</article><article>Metric</article></section></main>', css: 'main{min-height:100vh;background:#f8fafc;padding:32px}section{display:grid;grid-template-columns:repeat(3,1fr);gap:16px}article{padding:24px;background:white;border-radius:16px}' },
]

export default function TemplateSelector({ onSelect, showPreview = true }: Props) {
  return <div className="grid gap-4 md:grid-cols-3">
    {templates.map((template) => (
      <button key={template.name} type="button" onClick={() => onSelect(template)} className="rounded-xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
        <div className="font-semibold text-gray-900">{template.name}</div>
        {showPreview && <div className="mt-3 rounded-lg bg-gray-50 p-4 text-xs text-gray-500">Template preview</div>}
      </button>
    ))}
  </div>
}
