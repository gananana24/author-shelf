import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({
  component: Index,
})

function Index() {
  const checkApi = async () => {
    const response = await fetch('/api/health')
    window.alert(await response.text())
  }

  return (
    <div className="p-2">
      <h3>Welcome Home!</h3>
      <button type="button" onClick={checkApi}>
        APIを確認
      </button>
    </div>
  )
}
