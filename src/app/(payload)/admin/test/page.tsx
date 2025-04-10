'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function TestPage() {
  const router = useRouter()
  const [response, setResponse] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [imageUrl, setImageUrl] = useState('')

  useEffect(() => {
    // Check authentication status
    const checkAuth = async () => {
      try {
        const response = await fetch('/api/users/me')
        if (response.ok) {
          const data = await response.json()
          if (data.user) {
            setIsAuthenticated(true)
          } else {
            router.push('/admin/login')
          }
        } else {
          router.push('/admin/login')
        }
      } catch (err) {
        router.push('/admin/login')
      }
    }
    checkAuth()
  }, [router])

  if (!isAuthenticated) {
    return <div>Loading...</div>
  }

  async function sendRequest() {
    setIsLoading(true)
    setResponse('Sending request...\n')
    setError('')

    try {
      const result = await fetch('/api/ambros-ai', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'text/event-stream',
        },
        body: JSON.stringify({
          userMessage: 'Create a healthy recipe',
          ingredients: [
            { name: 'chicken breast', quantity: 2, unit: 'pieces' },
            { name: 'spinach', quantity: 1, unit: 'cup' },
          ],
        }),
      })

      if (!result.ok) {
        throw new Error(`HTTP error! status: ${result.status}`)
      }

      const reader = result.body?.getReader()
      if (!reader) {
        throw new Error('Failed to get response reader')
      }

      const decoder = new TextDecoder()
      let responseText = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data !== '[DONE]') {
              try {
                const parsed = JSON.parse(data)
                if (parsed?.content) {
                  responseText += parsed.content

                  setResponse(responseText)
                }
                if (parsed?.recipe) {
                  setImageUrl(parsed.recipe.imageUrl)
                }
              } catch (e) {
                responseText += data
                setResponse(responseText)
              }
            }
          }
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred'
      setError(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container">
      <h1>Ambros AI Test</h1>
      <button onClick={sendRequest} disabled={isLoading} className="button">
        Send Request
      </button>
      <div id="response" className={isLoading ? 'loading' : error ? 'error' : ''}>
        {response}
      </div>
      {imageUrl && (
        <div className="image-container">
          <img src={imageUrl} alt="Generated recipe image" />
        </div>
      )}

      <style jsx>{`
        .container {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 20px auto;
          padding: 0 20px;
        }
        #response {
          white-space: pre-wrap;
          border: 1px solid #ccc;
          padding: 15px;
          margin: 15px 0;
          min-height: 200px;
          background-color: #f9f9f9;
          border-radius: 4px;
        }
        .button {
          background-color: #4caf50;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        }
        .button:hover:not(:disabled) {
          background-color: #45a049;
        }
        .button:disabled {
          background-color: #cccccc;
          cursor: not-allowed;
        }
        .error {
          color: #ff0000;
          margin: 10px 0;
          padding: 10px;
          background-color: #ffe6e6;
          border-radius: 4px;
        }
        .loading {
          color: #666;
          font-style: italic;
        }
      `}</style>
    </div>
  )
}
