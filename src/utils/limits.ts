/** Field length caps shared between the API routes that write a column and
 *  the forms that edit it. Two surfaces editing one column with different
 *  caps silently truncates the user's data, so both read from here. */
export const FIELD_LIMITS = {
  /** users.name */
  name: 80,
  /** users.bio — edited from both the Studio header and the Settings form. */
  bio: 300,
  /** users.slug */
  slug: 40,
  /** venues.name */
  venueName: 120,
  /** tables.label */
  tableLabel: 40,
  /** shows.title */
  showTitle: 100,
  /** shows.description */
  showDescription: 600,
} as const;
