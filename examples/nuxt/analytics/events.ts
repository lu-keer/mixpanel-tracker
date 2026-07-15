export type MixpanelEventMap = {
  'Page Viewed': {
    page_path: string
    page_name: string
    referrer_path: string
  }
  'Button Clicked': {
    button_name: string
    page_name: string
  }
  'Invite Sent': {
    invite_role: 'admin' | 'member'
    source: string
  }
}
