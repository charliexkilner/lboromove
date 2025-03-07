import { Property } from '@prisma/client';

export function generatePropertySlug(property: Property): string {
  const title = property.title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-');

  return `${title}-${property.id}-lboro-student-house`;
}

export function getPropertyIdFromSlug(slug: string): string {
  const match = slug.match(/-(\d+)-lboro-student-house$/);
  return match ? match[1] : slug;
}
