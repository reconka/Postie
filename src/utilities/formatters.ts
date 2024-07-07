import { AddressObject } from 'mailparser'
import { format } from 'date-fns'

export function formatDateToTime(date: Date): string {
  return format(date, 'HH:mm:ss')
}

export function formatAddresses(
  addresses: AddressObject | AddressObject[] | undefined
): string {
  if (!addresses) {
    return ''
  }
  const addressList = Array.isArray(addresses) ? addresses : [addresses]
  return addressList.map((addr) => addr.text).join(', ')
}
