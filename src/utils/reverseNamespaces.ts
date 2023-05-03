import type { Namespaces } from '../types.js'

export default function reverseNamespaces(namespaces: Namespaces) {
  return Object.fromEntries(
    Object.entries(namespaces).map(([uri, prefix]) => [prefix, uri])
  )
}
