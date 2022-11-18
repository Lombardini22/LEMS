import { AddListMemberBody } from '@mailchimp/mailchimp_marketing'

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

interface MailchimpMember extends Omit<AddListMemberBody, 'merge_fields'> {
  merge_fields: {
    FNAME: string
    LNAME: string
  }
}

export type MailchimpDatabaseListMember = MailchimpMember & {
  merge_fields: MailchimpMember['merge_fields'] & {
    MMERGE6?: string // accountManager
    MMERGE7?: string // companyName
  }
}

export interface MailchimpListMembersResult<M> {
  members: M[]
  total_items: number
}

export type MailchimpDatabaseListMembersResult =
  MailchimpListMembersResult<MailchimpDatabaseListMember>
