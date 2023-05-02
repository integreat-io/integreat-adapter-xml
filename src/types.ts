export type Namespaces = Record<string, string>

export type ElementValue = Element | Element[] | null

export interface ObjectElement<T = ElementValue> {
  [key: string]: T | string
}

export interface TextElement extends ObjectElement {
  $value: string
}

export type Element = ObjectElement | TextElement
