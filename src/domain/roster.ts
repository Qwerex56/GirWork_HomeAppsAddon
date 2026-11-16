import type { Colleague } from '../api/types'

// The API sometimes omits names for these people, so they are filled in by id.
const SHIFT_MANAGERS: Record<number, string> = {
  2568: 'Jakub Tomaszewski',
  2569: 'Daria Czyż',
  2301: 'Izabela Borowik',
  2287: 'Sandra Proń',
  2300: 'Monika Jędryka',
}

function normalize(value: string): string {
  return value.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
}

const MANAGER_NAMES = new Set(Object.values(SHIFT_MANAGERS).map(normalize))

export function colleagueName(person: Colleague): string {
  const fromApi = [person.Name, person.Surname].map((part) => part?.trim()).filter(Boolean).join(' ')
  if (person.Name?.trim() && person.Surname?.trim()) return fromApi
  return SHIFT_MANAGERS[person.Id] ?? (fromApi || 'Pracownik')
}

/** A colleague is predicted to be the shift manager only when their name is on the manager list. */
export function isShiftManager(person: Colleague): boolean {
  return MANAGER_NAMES.has(normalize(colleagueName(person)))
}

export function initials(person: Colleague): string {
  const parts = colleagueName(person).split(' ')
  return parts.slice(0, 2).map((part) => part[0] ?? '').join('').toUpperCase()
}

/** Managers first, then alphabetical. */
export function sortColleagues(colleagues: Colleague[]): Colleague[] {
  return [...colleagues].sort((a, b) => {
    const byRole = Number(isShiftManager(b)) - Number(isShiftManager(a))
    return byRole || colleagueName(a).localeCompare(colleagueName(b), 'pl')
  })
}
