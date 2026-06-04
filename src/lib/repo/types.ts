// ════════════════════════════════════════════════════════════════════════
// Repo — the single data interface every ChemNet app reads/writes through.
// ════════════════════════════════════════════════════════════════════════
// Two implementations satisfy this interface:
//   flagshipRepo      → Eric's public.* tables (+ local data files)   [ / ]
//   memberRepo(userId) → members.* filtered by user_id                [ /u/:handle ]
//
// Apps never import `supabase` or a data file directly — they call
// `const repo = useRepo()` and go through the resolved implementation.
//
// Reads work on both nodes. WRITES (create/update/remove) are member-side:
// memberRepo stamps user_id and RLS enforces own-rows; flagshipRepo's writes
// are no-ops (Eric edits his hub through the Admin app, not in place).
//
// NOTE: this project has no `tsc` step (Vite/esbuild strip types, ESLint only
// globs *.{js,jsx}). This file is the human + tooling contract, not a compile
// gate. Rows are typed loosely as records to avoid drift with the DB.
// ════════════════════════════════════════════════════════════════════════

import type { SocialApi } from './social'
import type { StorageApi } from './storage'

export type Row = Record<string, any>

// Mixed into every list-backed content resource for owner editing.
export interface Writable {
  create(row: Row): Promise<Row | null>
  update(id: string | number, patch: Row): Promise<Row | null>
  remove(id: string | number): Promise<boolean>
}

export interface PostsRepo extends Writable {
  list(): Promise<Row[]>
  incrementViews(id: string | number): Promise<void>
}

export interface PhotosRepo extends Writable {
  list(): Promise<Row[]>
}

export interface ReviewsRepo extends Writable {
  list(): Promise<Row[]>
}

export interface FoodItemsRepo extends Writable {
  list(): Promise<Row[]>
}

export interface GuestbookRepo {
  list(): Promise<Row[]>
  // entry: { name, location, message } on flagship; mapped to body on members
  sign(entry: { name?: string; location?: string; message: string }): Promise<Row | null>
  remove(id: string | number): Promise<boolean>
}

export interface BoardThread extends Row {
  posts: Row[]
}
export interface BoardRepo {
  // returns threads, each with its posts attached, newest thread first
  load(): Promise<BoardThread[]>
  reply(input: { threadId: string | number; author: string; email?: string | null; body: string }): Promise<Row | null>
  createThread(input: { subject: string; author: string; email?: string | null; body: string }): Promise<{ thread: Row; post: Row | null } | null>
  removeThread(id: string | number): Promise<boolean>
}

export interface DigestRepo extends Writable {
  list(): Promise<Row[]>
}

export interface WishlistRepo extends Writable {
  list(): Promise<Row[]>
}

export interface TravelLogRepo extends Writable {
  list(): Promise<Row[]>
  get(id: string | number): Promise<Row | null>
  addPhoto(id: string | number, url: string): Promise<Row | null>
  setPlanItems(id: string | number, items: Row[]): Promise<Row | null>
}

export interface CarModsRepo extends Writable {
  list(): Promise<Row[]>
}

export interface ProjectsRepo extends Writable {
  list(): Promise<Row[]>
}

export interface MusicRepo extends Writable {
  list(): Promise<Row[]>
}

export interface VideosRepo extends Writable {
  list(): Promise<Row[]>
}

export interface MessagesRepo {
  listInbox(): Promise<Row[]>
  send(input: { recipientId?: string; subject?: string; body?: string }): Promise<Row | null>
  markRead(id: string | number): Promise<void>
}

export interface DesktopConfigRepo {
  get(): Promise<Row | null>
  upsert(config: Row): Promise<Row | null>
}

export interface Repo {
  posts: PostsRepo
  photos: PhotosRepo
  reviews: ReviewsRepo
  foodItems: FoodItemsRepo
  guestbook: GuestbookRepo
  board: BoardRepo
  digest: DigestRepo
  wishlist: WishlistRepo
  travelLog: TravelLogRepo
  carMods: CarModsRepo
  projects: ProjectsRepo
  music: MusicRepo
  videos: VideosRepo
  messages: MessagesRepo
  desktopConfig: DesktopConfigRepo
  // Platform-wide social graph (same on every node — keyed by the current user)
  social: SocialApi
  // Fail-closed upload pipeline (user-global)
  storage: StorageApi
}
