import { expect } from 'storybook/test'
import NavigationBar from './NavigationBar'

const meta = {
  component: NavigationBar,
  tags: ['ai-generated'],
  args: { activePage: 'dashboard' },
}

export default meta

export const DashboardActive = {
  play: async ({ canvas }) => {
    const dashboardLink = canvas.getByRole('link', { name: /dashboard/i })
    await expect(dashboardLink).toHaveAttribute('aria-current', 'page')
  },
}

export const RunsActive = { args: { activePage: 'runs' } }

export const CssCheck = {
  play: async ({ canvas }) => {
    const activeLink = canvas.getByRole('link', { name: /dashboard/i })
    await expect(getComputedStyle(activeLink).backgroundColor).toBe('rgb(244, 119, 0)')
  },
}
