import { z } from 'zod'

const isoPattern =
  /^[1-2]\d{3}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d.\d{3}(?:Z|(?:[+-]\d{2}:\d{2}))/

export const NonEmptyString = z.string().min(1).brand<'NonEmptyString'>()
export const Email = z.string().trim().email().brand<'Email'>()
export const ISODate = z
  .string()
  .refine(s => isoPattern.test(s), 'Invalid ISO date')
