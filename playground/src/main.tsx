import React from 'react'
import ReactDOM from 'react-dom'
import App from './App'
import './styles.css'

type ReactDOMClientModule = {
  createRoot?: (container: Element | DocumentFragment) => {
    render(node: React.ReactNode): void
  }
}

async function mountApp() {
  const container = document.getElementById('root')
  if (!container) {
    throw new Error('playground root container not found')
  }

  try {
    // Keep the playground runnable on React 16/17 while enabling React 18's createRoot when available.
    const loadReactDOMClient = new Function('specifier', 'return import(specifier)') as (
      specifier: string,
    ) => Promise<ReactDOMClientModule>
    const reactDOMClient = await loadReactDOMClient('react-dom/client')
    if (typeof reactDOMClient.createRoot === 'function') {
      reactDOMClient.createRoot(container).render(<App />)
      return
    }
  } catch (_error) {
    // Fall back to the legacy client API when react-dom/client is unavailable.
  }

  ReactDOM.render(<App />, container)
}

void mountApp()
