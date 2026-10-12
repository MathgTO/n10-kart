import rubric from '@/data/rubric-v1.json'

export function assertRubricV111(): typeof rubric {
  if (rubric.schema_version !== '1.11') {
    throw new Error(
      `N10 requires rubric schema_version "1.11", got "${String(rubric.schema_version)}"`
    )
  }
  return rubric
}

export const RUBRIC = assertRubricV111()
