import {
  MemberErrorResponse,
  MembersSuccessResponse,
} from '@mailchimp/mailchimp_marketing'

export function isMailchimpMembersSuccessResponse(
  response: MembersSuccessResponse | MemberErrorResponse,
): response is MembersSuccessResponse {
  return typeof response.status === 'string'
}
