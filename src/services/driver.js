const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

export async function getDrivers() {
const response = await fetch(`${API_BASE_URL}/drivers`);

if (!response.ok) {
throw new Error(`Could not load drivers (${response.status})`);
}

return response.json();
}
