import { WithId } from 'mongodb'
import { Guest } from './models/Guest'

// The socket server always sends "update" as an event name
export type WebSocketEventName = 'update'

/*
  `type` and `subject` describe what kind of event happened (e.g.: guest update => type is "Update" and subject is "Guest")
*/
export type WebSocketEventType = 'Insertion' | 'Update' | 'Deletion'
export type WebSocketEventSubject = 'Guest'

export interface WebSocketEvent<
  Type extends WebSocketEventType,
  Subject extends WebSocketEventSubject,
  T,
> {
  type: Type
  subject: Subject
  data: WithId<T>[]
}

export type GuestInsertionEvent = WebSocketEvent<'Insertion', 'Guest', Guest>
export type GuestUpdateEvent = WebSocketEvent<'Update', 'Guest', Guest>
export type GuestDeletionEvent = WebSocketEvent<'Deletion', 'Guest', Guest>
