import { describe, it } from 'vitest'
import { renderTest } from './render-app'
import { fireEvent } from '@testing-library/dom'

describe('app', () => {
  it('page index', async () => {
    const { findByText } = await renderTest()
    await findByText(0)
    fireEvent.click(await findByText('click'))
    await findByText(1)
  })
})
