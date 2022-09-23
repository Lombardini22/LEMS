export interface MailchimpTagsSearchResponse {
  total_items: number
  tags: Array<{
    id: number
    name: string
  }>
}

export interface MailchimpBatchListMembersResponse {
  total_created: number
  total_updated: number
  error_count: number
  errors: Array<{
    email_address: 'string'
    error: 'string'
    error_code: 'ERROR_CONTACT_EXISTS'
    field: 'string'
    field_message: 'string'
  }>
}
