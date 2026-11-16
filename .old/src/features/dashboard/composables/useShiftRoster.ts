const knownShiftManagers = {
  2568: 'Jakub Tomaszewski',
  2569: 'Daria Czyż',
  2301: 'Izabela Borowik',
  2287: 'Sandra Proń',
  2300: 'Monika Jędryka',
} as const

export type ShiftRosterPerson = {
  Id?: number
  Name?: string | null
  Surname?: string | null
  ShiftStart?: string | null
  ShiftEnd?: string | null
  Image?: string | null
}

function normalizeName(value?: string | null): string {
  return (value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export function resolvePersonNameFromRoster(
  person: ShiftRosterPerson,
  roster: ShiftRosterPerson[],
): { Name?: string | null; Surname?: string | null } {
  const currentName = (person.Name ?? '').trim()
  const currentSurname = (person.Surname ?? '').trim()

  if (currentName && currentSurname) {
    return person
  }

  if (person.Id && knownShiftManagers[person.Id as keyof typeof knownShiftManagers]) {
    const managerName = knownShiftManagers[person.Id as keyof typeof knownShiftManagers]
    const [firstName, ...surnameParts] = managerName.split(' ')
    return { Name: firstName, Surname: surnameParts.join(' ') }
  }

  const sameIdMatch = roster.find((entry) => entry.Id === person.Id && Boolean(entry.Name || entry.Surname))
  if (sameIdMatch) {
    return {
      Name: sameIdMatch.Name ?? currentName,
      Surname: sameIdMatch.Surname ?? currentSurname,
    }
  }

  const managerNameMatch = Object.values(knownShiftManagers).find((manager) => {
    const normalizedManager = normalizeName(manager)
    const normalizedCandidate = normalizeName(`${currentName} ${currentSurname}`.trim())
    const normalizedFirstName = normalizeName(currentName)

    return normalizedCandidate === normalizedManager || normalizedFirstName === normalizeName(manager.split(' ')[0] ?? '')
  })

  if (managerNameMatch) {
    const [firstName, ...surnameParts] = managerNameMatch.split(' ')
    return { Name: firstName, Surname: surnameParts.join(' ') }
  }

  return person
}

export function enrichShiftDetailsWithResolvedNames<T extends { Colleagues?: ShiftRosterPerson[] }>(result: T[]): T[] {
  const roster = result.flatMap((day) => day.Colleagues ?? [])

  return result.map((day) => ({
    ...day,
    Colleagues: (day.Colleagues ?? []).map((person) => {
      const resolved = resolvePersonNameFromRoster(person, roster)
      return {
        ...person,
        Name: resolved.Name ?? person.Name,
        Surname: resolved.Surname ?? person.Surname,
      }
    }),
  }))
}

export function colleagueFullName(person: ShiftRosterPerson): string {
  return [person.Name, person.Surname].filter((value): value is string => Boolean(value?.trim())).join(' ').trim()
}

export function displayRosterName(person: ShiftRosterPerson): string {
  const resolved = resolvePersonNameFromRoster(person, [])
  const fullName = colleagueFullName({ ...person, ...resolved })
  if (fullName) return fullName
  return colleagueFullName(person) || 'Pracownik'
}

export function parseShiftMinutes(value?: string | null): number | null {
  if (!value) return null

  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null

  return parsed.getHours() * 60 + parsed.getMinutes()
}

export function inferManagerStatus(person: ShiftRosterPerson): { isManager: boolean; label: string } {
  const directManagerById = person.Id !== undefined && person.Id !== null
    ? knownShiftManagers[person.Id as keyof typeof knownShiftManagers]
    : undefined

  if (!directManagerById) {
    return { isManager: false, label: 'Pracownik' }
  }

  const shiftStart = parseShiftMinutes(person.ShiftStart)
  const shiftEnd = parseShiftMinutes(person.ShiftEnd)

  if (shiftStart === null || shiftEnd === null) {
    return { isManager: false, label: 'Pracownik' }
  }

  const isMorningManagerShift = shiftStart >= 8 * 60 && shiftEnd <= 15 * 60 + 30
  const isAfternoonManagerShift = shiftStart >= 15 * 60 && shiftEnd <= 23 * 60
  const isManager = isMorningManagerShift || isAfternoonManagerShift

  return {
    isManager,
    label: isManager ? 'Kierownik zmiany (prognoza)' : 'Pracownik',
  }
}

export function displayInitials(person: ShiftRosterPerson): string {
  const full = displayRosterName(person)
  if (!full || full === 'Pracownik') return 'P'

  const parts = full.split(' ').filter(Boolean)
  return (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '')
}
