import { render, screen } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import App from './App'

describe('foundation shell', () => {
  it('renders the application shell', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <App />
      </QueryClientProvider>,
    )

    expect(screen.getByRole('heading', { name: /make every school day feel lighter/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /student records/i })).toBeInTheDocument()
  })
})
