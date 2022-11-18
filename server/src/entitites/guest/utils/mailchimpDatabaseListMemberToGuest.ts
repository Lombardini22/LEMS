import { MembersSuccessResponse } from '@mailchimp/mailchimp_marketing'
import { Guest } from '../../../../../shared/models/Guest'
import { NoTimestamps } from '../../../database/Collection'

export function mailchimpDatabaseListMemberToGuest(
  emailHash: string,
): (member: MembersSuccessResponse) => NoTimestamps<Guest> {
  return member => ({
    ...{
      firstName: member.merge_fields['FNAME'],
      lastName: member.merge_fields['LNAME'],
      email: member.email_address,
      emailHash,
      companyName: null,
      source: 'RSVP',
      status: 'RSVP',
      accountManager: null,
    },
    ...(member.merge_fields['REFERENTE']
      ? {
          accountManager: member.merge_fields['REFERENTE'],
        }
      : {}),
    ...(member.merge_fields['AZIENDA']
      ? {
          companyName: member.merge_fields['AZIENDA'],
        }
      : {}),
  })
}
