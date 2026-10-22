export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function appendSources(container, sources, onSource) {
  for (const source of sources) {
    const button = element('button', 'text-button', `View source ${source.id} in notes ↗`);
    button.type = 'button';
    button.addEventListener('click', () => onSource(source));
    container.append(element('blockquote', 'evidence-quote', source.text), button);
  }
}
