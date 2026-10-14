const API_BASE_URL = import.meta.env.VITE_API_BASE_URL

export async function getCars() {
const response = await fetch(`${API_BASE_URL}/cars`)

if (!response.ok) {
throw new Error(`Could not load cars (${response.status})`)
}

return response.json()
}
