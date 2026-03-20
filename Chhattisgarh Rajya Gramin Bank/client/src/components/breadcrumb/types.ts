export interface CrumbItem {
  label: string
  to: string
  from?: string
}

export type Crumb =
  | { type: 'link'; item: CrumbItem }
  | { type: 'label'; label: string }
  | {
      type: 'dropdown'
      label: string
      items: CrumbItem[]
      selectedIndex?: number
    }

export type CurrentPage =
  | { type: 'label'; label: string }
  | { type: 'dropdown'; items: CrumbItem[]; selectedIndex: number }
