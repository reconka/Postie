import { formatDateToTime } from '../../utilities/formatters'

describe('formatDateToTime', () => {
  it('formats a Date object to a time string in HH:mm format', () => {
    // Mock a specific date and time
    const mockDate = new Date('2023-01-01T13:45:00Z')
    const expectedTime = '13:45:00'

    const result = formatDateToTime(mockDate)

    expect(result).toBe(expectedTime)
  })

  it('pads single digit hours and minutes with leading zeros', () => {
    // Mock a specific date and time with single digit hour and minute
    const mockDate = new Date('2023-01-01T03:05:00Z')
    const expectedTime = '03:05:00'

    const result = formatDateToTime(mockDate)

    expect(result).toBe(expectedTime)
  })
})
