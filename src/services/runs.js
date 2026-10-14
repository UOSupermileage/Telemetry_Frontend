const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

async function request(path, options = {}) {
const response = await fetch(`${API_BASE_URL}${path}`, options);

if (!response.ok) {
let message = `Request failed (${response.status})`;

```
try {
  const error = await response.json();
  message = error.detail || message;
} catch {
  // Use the default error message.
}

throw new Error(message);
```

}

return response.json();
}

export async function getRecentRuns() {
return request('/runs?limit=6');
}

export async function getRun(runId) {
return request(`/runs/${runId}`);
}

export async function createRun(run) {
return request('/runs', {
method: 'POST',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(run),
});
}

export async function updateRun(runId, updates) {
return request(`/runs/${runId}`, {
method: 'PATCH',
headers: {
'Content-Type': 'application/json',
},
body: JSON.stringify(updates),
});
}

export async function deleteRun(runId) {
return request(`/runs/${runId}`, {
method: 'DELETE',
});
}
