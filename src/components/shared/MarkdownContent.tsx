function renderInline(value: string) {
	const parts = value.split(/(`[^`]+`|\$\$[^$]+\$\$|\$[^$]+\$)/g)
	return parts.map((part, index) => {
		if (part.startsWith('`') && part.endsWith('`')) return <code key={index}>{part.slice(1, -1)}</code>
		if (part.startsWith('$')) return <span className="math-inline" key={index}>{part.replace(/^\$+|\$+$/g, '')}</span>
		return <span key={index}>{part}</span>
	})
}

export function MarkdownContent({ content }: { content: string }) {
	const lines = content.split(/\r?\n/)
	return <div className="markdown-content">{lines.map((line, index) => {
		if (!line.trim()) return <br key={index} />
		if (line.startsWith('### ')) return <h3 key={index}>{renderInline(line.slice(4))}</h3>
		if (line.startsWith('## ')) return <h2 key={index}>{renderInline(line.slice(3))}</h2>
		if (line.startsWith('# ')) return <h1 key={index}>{renderInline(line.slice(2))}</h1>
		if (line.startsWith('> ')) return <blockquote key={index}>{renderInline(line.slice(2))}</blockquote>
		if (line.startsWith('- ')) return <li key={index}>{renderInline(line.slice(2))}</li>
		return <p key={index}>{renderInline(line)}</p>
	})}</div>
}
