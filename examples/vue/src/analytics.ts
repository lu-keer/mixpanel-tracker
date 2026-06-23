export type ExampleEventMap = {
  'CTA Clicked': {
    button_name: string
    page_name: string
  }
  'Project Created': {
    project_id: string
    source: 'blank' | 'template'
  }
}