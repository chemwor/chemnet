// Field schemas that drive the generic owner editor (OwnerManager). Each key
// matches a repo resource. `title` is the field used to label a row in the
// list. Field types: text | textarea | number | bool | select | csv | date.
export const RESOURCE_SCHEMAS = {
  posts: {
    title: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'filename', label: 'Filename', type: 'text' },
      { key: 'content', label: 'Content', type: 'textarea' },
      { key: 'raw', label: 'Raw draft', type: 'textarea' },
      { key: 'note', label: 'Note', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['general', 'tech', 'culture', 'personal'] },
      { key: 'mood', label: 'Mood (optional)', type: 'text' },
      { key: 'now_playing', label: 'Now playing (optional)', type: 'text' },
      { key: 'tags', label: 'Tags (comma-sep)', type: 'csv' },
      { key: 'published', label: 'Published', type: 'bool', def: true },
    ],
  },
  photos: {
    title: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'url', label: 'Image URL', type: 'text' },
      { key: 'caption', label: 'Caption', type: 'textarea' },
    ],
  },
  videos: {
    title: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'url', label: 'Video URL (any provider)', type: 'text', hint: 'YouTube, Vimeo, Google Drive (shared “anyone with the link” — note Drive has daily view limits), or a direct .mp4 link.' },
      { key: 'description', label: 'Description', type: 'textarea' },
      { key: 'folder', label: 'Folder', type: 'select', options: ['my-videos', 'watching'] },
    ],
  },
  reviews: {
    title: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'category', label: 'Type', type: 'select', options: ['movies', 'tv'] },
      { key: 'status', label: 'Status', type: 'select', options: ['watched', 'watchlist'] },
      { key: 'year', label: 'Year', type: 'number' },
      { key: 'rating', label: 'Rating /10', type: 'number' },
      { key: 'poster', label: 'Poster (emoji/URL)', type: 'text' },
      { key: 'review', label: 'Quick take', type: 'textarea' },
      { key: 'analysis', label: 'Full analysis', type: 'textarea' },
      { key: 'tags', label: 'Tags (comma-sep)', type: 'csv' },
    ],
  },
  foodItems: {
    title: 'name',
    fields: [
      { key: 'name', label: 'Name', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['been', 'want', 'cook'] },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'cuisine', label: 'Cuisine', type: 'text' },
      { key: 'rating', label: 'Rating /10', type: 'number' },
      { key: 'icon', label: 'Icon (emoji)', type: 'text' },
      { key: 'review', label: 'Review', type: 'textarea' },
      { key: 'favorite', label: 'Order this', type: 'text' },
      { key: 'vibe', label: 'Vibe', type: 'text' },
      { key: 'why', label: 'Why (want list)', type: 'textarea' },
    ],
  },
  digest: {
    title: 'title',
    fields: [
      { key: 'title', label: 'Title', type: 'text' },
      { key: 'url', label: 'Link URL', type: 'text' },
      { key: 'video_url', label: 'YouTube URL', type: 'text' },
      { key: 'note', label: 'Note', type: 'textarea' },
      { key: 'source', label: 'Source', type: 'text' },
      { key: 'published_date', label: 'Date', type: 'date' },
    ],
  },
  wishlist: {
    title: 'name',
    fields: [
      { key: 'name', label: 'Item', type: 'text' },
      { key: 'category', label: 'Category', type: 'select', options: ['fashion', 'tech', 'home', 'other'] },
      { key: 'price', label: 'Price', type: 'number' },
      { key: 'priority', label: 'Priority', type: 'select', options: ['high', 'medium', 'low'] },
      { key: 'link', label: 'Link', type: 'text' },
      { key: 'image', label: 'Image URL', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  travelLog: {
    title: 'destination',
    fields: [
      { key: 'destination', label: 'Destination', type: 'text' },
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'completed'] },
      { key: 'dates', label: 'Dates', type: 'text' },
      { key: 'icon', label: 'Icon (flag emoji)', type: 'text' },
      { key: 'summary', label: 'Summary', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
    ],
  },
  carMods: {
    title: 'name',
    fields: [
      { key: 'name', label: 'Mod', type: 'text' },
      { key: 'phase', label: 'Phase', type: 'select', options: ['repairs', 'phase1', 'phase2', 'phase3', 'interior', 'exterior'] },
      { key: 'status', label: 'Status', type: 'select', options: ['planned', 'in-progress', 'done', 'researching', 'ordered'] },
      { key: 'cost', label: 'Cost', type: 'text' },
      { key: 'priority', label: 'Priority', type: 'text' },
      { key: 'notes', label: 'Notes', type: 'textarea' },
      { key: 'link', label: 'Link', type: 'text' },
    ],
  },
}

// Coerce a form value to what the DB column expects.
export function coerce(type, value) {
  if (type === 'number') return value === '' || value == null ? null : Number(value)
  if (type === 'bool') return !!value
  if (type === 'csv') return String(value || '').split(',').map(s => s.trim()).filter(Boolean)
  const t = typeof value === 'string' ? value.trim() : value
  return t === '' ? null : t
}

// Build an empty form object for a schema (defaults applied).
export function emptyForm(schema) {
  const f = {}
  for (const field of schema.fields) {
    if (field.type === 'bool') f[field.key] = field.def ?? false
    else if (field.type === 'csv') f[field.key] = ''
    else f[field.key] = field.def ?? ''
  }
  return f
}

// Turn a DB row into editable form values (arrays → csv string).
export function rowToForm(schema, row) {
  const f = {}
  for (const field of schema.fields) {
    const v = row[field.key]
    if (field.type === 'csv') f[field.key] = Array.isArray(v) ? v.join(', ') : (v || '')
    else if (field.type === 'bool') f[field.key] = !!v
    else f[field.key] = v ?? ''
  }
  return f
}
