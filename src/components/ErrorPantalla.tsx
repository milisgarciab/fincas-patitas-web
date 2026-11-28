import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface Estado {
  error: Error | null
}

export default class ErrorPantalla extends Component<Props, Estado> {
  state: Estado = { error: null }

  static getDerivedStateFromError(error: Error): Estado {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Error en la pantalla:', error, info.componentStack)
  }

  render() {
    if (!this.state.error) return this.props.children
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <div className="bg-white rounded-xl shadow p-5 space-y-2">
          <h1 className="text-lg font-bold text-red-600">La aplicación tuvo un error</h1>
          <p className="text-sm text-gray-700 break-words">{this.state.error.message}</p>
          <pre className="text-xs text-gray-500 whitespace-pre-wrap max-h-60 overflow-auto">
            {this.state.error.stack}
          </pre>
        </div>
      </div>
    )
  }
}