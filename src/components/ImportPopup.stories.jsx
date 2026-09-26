import { expect, fn } from 'storybook/test'
import ImportPopup from './ImportPopup'

const meta = {
  component: ImportPopup,
  tags: ['ai-generated'],
  args: { onClose: fn() },
  parameters: { layout: 'fullscreen' },
}

export default meta

export const Open = {
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.getByRole('dialog', { name: /import telemetry/i })).toBeVisible()
    await userEvent.click(canvas.getByRole('button', { name: /close/i }))
    await expect(args.onClose).toHaveBeenCalledOnce()
  },
}
