import { expect } from 'storybook/test'
import RunsTable from './RunsTable'

const runs = [
  { run_id: 101, name: 'Baseline test', car_id: 2, driver_id: 3, location_id: 1, started_at: '2026-09-20T14:00:00', ended_at: '2026-09-20T14:15:00', notes: 'Baseline test', date_created: '2026-09-20T15:00:00' },
  { run_id: 102, name: 'New setup test', car_id: 1, driver_id: 4, location_id: 2, started_at: '2026-09-21T10:30:00', ended_at: '2026-09-21T10:48:00', notes: 'New setup', date_created: '2026-09-21T11:00:00' },
]

const meta = {
  component: RunsTable,
  tags: ['ai-generated'],
  args: { runs },
  parameters: { layout: 'padded' },
}

export default meta

export const RecentRuns = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByPlaceholderText('Search runs...'), 'Baseline')
    await expect(canvas.getByText('Showing 1 of 2 runs')).toBeVisible()
    await expect(canvas.getByText('Baseline test')).toBeVisible()
  },
}

export const Empty = { args: { runs: [] } }
