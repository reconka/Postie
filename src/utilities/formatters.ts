import { AddressObject } from 'mailparser'
import { CompatibilityResult } from '../types/Email'
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
  return addressList.map((addr) => sanitize(addr.text)).join(', ')
}

export function sanitize(element: string): string {
  return sanitizeHtml(element)
}

export function formatStringToBase64DataUrl(
  content: string,
  mimeType: string = 'text/html'
): string {
  const base64Content = Buffer.from(content).toString('base64')
  return `data:${mimeType};base64,${base64Content}`
}

export function formatCompatibilityResults(
  items: string[] | null,
  categoryName: string
): CompatibilityResult[] {
  return (
    items?.map((item) => ({
      ReportType: categoryName,
      Result: item.replace(/'/g, ''),
      Client: getClientName(item),
    })) || []
  )
}

function getClientName(client: string): string {
  const regex = /\b[\w-]+\.[\w-]+\b/g
  return client.match(regex)?.toString().replace('.', ' ') ?? 'Unknown'
}
