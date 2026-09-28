import rubric from '@/data/rubric-v1.json'

export function assertRubricV18(): typeof rubric {
  if (rubric.schema_version !== '1.8') {
    throw new Error(
      `N10 requires rubric schema_version "1.8", got "${String(rubric.schema_version)}"`
    )
  }
  return rubric
}

export const RUBRIC = assertRubricV18()
