import { AddressObject } from 'mailparser'
import { format } from 'date-fns'
import sanitizeHtml from 'sanitize-html'

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
  return addressList.map((addr) => sanatize(addr.text)).join(', ')
}

export function sanatize(element: string): string {
  return sanitizeHtml(element)
}
