import rubric from '@/data/rubric-v1.json'

export function assertRubricV15(): typeof rubric {
  if (rubric.schema_version !== '1.5') {
    throw new Error(
      `N10 requires rubric schema_version "1.5", got "${String(rubric.schema_version)}"`
    )
  }
  return rubric
}

export const RUBRIC = assertRubricV15()
