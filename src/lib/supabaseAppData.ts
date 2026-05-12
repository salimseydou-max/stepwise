import { supabase } from './supabase'

export type RemoteSearchEntry = {
  id: string
  query: string
  timestamp: number
}

export type RemoteChatMessage = {
  id: string
  role: 'user' | 'assistant'
  text: string
  timestamp: number
}

export type RemoteCompletionEntry = {
  id: string
  completionKey: string
  question: string
  completedAt: number
  dayKey: string
  points: number
  sourceLabel: string
}

export type RemoteChallengeState = Record<string, { interacted: boolean; completed: boolean }>

export type RemoteSettings = {
  username: string
  theme: 'dark' | 'light'
  language: 'en' | 'es' | 'fr'
  notificationsEnabled: boolean
  aiSuggestionsEnabled: boolean
  soundEnabled: boolean
}

export type RemoteSnapshot = RemoteSettings & {
  recentSearches: RemoteSearchEntry[]
  chatHistory: RemoteChatMessage[]
  completionEntries: RemoteCompletionEntry[]
  challengeState: RemoteChallengeState
}

const DEFAULT_SETTINGS: RemoteSettings = {
  username: '',
  theme: 'dark',
  language: 'en',
  notificationsEnabled: true,
  aiSuggestionsEnabled: true,
  soundEnabled: true,
}

const DEFAULT_CHALLENGES = ['daily-math', 'science-quiz', 'quick-practice'] as const

type SearchRow = {
  id: string
  query: string
  created_at: string
}

type ChatRow = {
  id: string
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

type CompletionRow = {
  id: string
  completion_key: string
  question: string
  completed_at: string
  day_key: string
  points: number
  source_label: string
}

type ChallengeRow = {
  challenge_id: string
  interacted: boolean
  completed: boolean
}

type SearchIdRow = {
  id: string
}

export async function loadRemoteSnapshot(profileId: string): Promise<RemoteSnapshot> {
  if (!supabase) {
    return buildEmptyRemoteSnapshot()
  }

  await upsertRemoteProfile(profileId, DEFAULT_SETTINGS)
  await seedChallengeRows(profileId)

  const [profileResult, searchResult, messageResult, completionResult, challengeResult] = await Promise.all([
    supabase
      .from('student_profiles')
      .select('username, theme, language, notifications_enabled, ai_suggestions_enabled, sound_enabled')
      .eq('id', profileId)
      .single(),
    supabase
      .from('recent_searches')
      .select('id, query, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: false })
      .limit(10),
    supabase
      .from('chat_messages')
      .select('id, role, content, created_at')
      .eq('profile_id', profileId)
      .order('created_at', { ascending: true }),
    supabase
      .from('completion_entries')
      .select('id, completion_key, question, completed_at, day_key, points, source_label')
      .eq('profile_id', profileId)
      .order('completed_at', { ascending: false }),
    supabase
      .from('challenge_progress')
      .select('challenge_id, interacted, completed')
      .eq('profile_id', profileId),
  ])

  const profile = profileResult.data

  return {
    username: profile?.username ?? DEFAULT_SETTINGS.username,
    theme: (profile?.theme as 'dark' | 'light' | undefined) ?? DEFAULT_SETTINGS.theme,
    language: (profile?.language as 'en' | 'es' | 'fr' | undefined) ?? DEFAULT_SETTINGS.language,
    notificationsEnabled: profile?.notifications_enabled ?? DEFAULT_SETTINGS.notificationsEnabled,
    aiSuggestionsEnabled: profile?.ai_suggestions_enabled ?? DEFAULT_SETTINGS.aiSuggestionsEnabled,
    soundEnabled: profile?.sound_enabled ?? DEFAULT_SETTINGS.soundEnabled,
    recentSearches:
      searchResult.data?.map((entry: SearchRow) => ({
        id: entry.id,
        query: entry.query,
        timestamp: new Date(entry.created_at).getTime(),
      })) ?? [],
    chatHistory:
      messageResult.data?.map((entry: ChatRow) => ({
        id: entry.id,
        role: entry.role as 'user' | 'assistant',
        text: entry.content,
        timestamp: new Date(entry.created_at).getTime(),
      })) ?? [],
    completionEntries:
      completionResult.data?.map((entry: CompletionRow) => ({
        id: entry.id,
        completionKey: entry.completion_key,
        question: entry.question,
        completedAt: new Date(entry.completed_at).getTime(),
        dayKey: new Date(entry.day_key).toISOString(),
        points: entry.points,
        sourceLabel: entry.source_label,
      })) ?? [],
    challengeState: Object.fromEntries(
      (challengeResult.data ?? []).map((entry: ChallengeRow) => [
        entry.challenge_id,
        { interacted: entry.interacted, completed: entry.completed },
      ]),
    ),
  }
}

export async function replaceRemoteSnapshot(profileId: string, snapshot: RemoteSnapshot): Promise<void> {
  if (!supabase) {
    return
  }

  await upsertRemoteProfile(profileId, snapshot)
  await Promise.all([
    supabase.from('recent_searches').delete().eq('profile_id', profileId),
    supabase.from('chat_messages').delete().eq('profile_id', profileId),
    supabase.from('completion_entries').delete().eq('profile_id', profileId),
    supabase.from('challenge_progress').delete().eq('profile_id', profileId),
  ])

  await seedChallengeRows(profileId)

  if (snapshot.recentSearches.length > 0) {
    await supabase.from('recent_searches').insert(
      snapshot.recentSearches.map((entry) => ({
        id: entry.id,
        profile_id: profileId,
        query: entry.query,
        created_at: new Date(entry.timestamp).toISOString(),
      })),
    )
  }

  if (snapshot.chatHistory.length > 0) {
    await supabase.from('chat_messages').insert(
      snapshot.chatHistory.map((entry) => ({
        id: entry.id,
        profile_id: profileId,
        role: entry.role,
        content: entry.text,
        created_at: new Date(entry.timestamp).toISOString(),
      })),
    )
  }

  if (snapshot.completionEntries.length > 0) {
    await supabase.from('completion_entries').insert(
      snapshot.completionEntries.map((entry) => ({
        id: entry.id,
        profile_id: profileId,
        completion_key: entry.completionKey,
        question: entry.question,
        completed_at: new Date(entry.completedAt).toISOString(),
        day_key: new Date(entry.dayKey).toISOString().slice(0, 10),
        points: entry.points,
        source_label: entry.sourceLabel,
      })),
    )
  }

  for (const [challengeId, state] of Object.entries(snapshot.challengeState)) {
    await upsertRemoteChallenge(profileId, challengeId, state)
  }
}

export async function upsertRemoteProfile(profileId: string, settings: Partial<RemoteSettings>): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('student_profiles').upsert(
    {
      id: profileId,
      username: settings.username,
      theme: settings.theme,
      language: settings.language,
      notifications_enabled: settings.notificationsEnabled,
      ai_suggestions_enabled: settings.aiSuggestionsEnabled,
      sound_enabled: settings.soundEnabled,
    },
    { onConflict: 'id' },
  )
}

export async function saveRemoteSearch(profileId: string, entry: RemoteSearchEntry, limit: number): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('recent_searches').insert({
    id: entry.id,
    profile_id: profileId,
    query: entry.query,
    created_at: new Date(entry.timestamp).toISOString(),
  })

  const extraRows = await supabase
    .from('recent_searches')
    .select('id')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
    .range(limit, limit + 100)

  const idsToDelete = extraRows.data?.map((row: SearchIdRow) => row.id) ?? []
  if (idsToDelete.length > 0) {
    await supabase.from('recent_searches').delete().in('id', idsToDelete)
  }
}

export async function appendRemoteMessages(profileId: string, messages: RemoteChatMessage[]): Promise<void> {
  if (!supabase || messages.length === 0) {
    return
  }

  await supabase.from('chat_messages').insert(
    messages.map((message) => ({
      id: message.id,
      profile_id: profileId,
      role: message.role,
      content: message.text,
      created_at: new Date(message.timestamp).toISOString(),
    })),
  )
}

export async function saveRemoteCompletion(profileId: string, entry: RemoteCompletionEntry): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('completion_entries').upsert(
    {
      id: entry.id,
      profile_id: profileId,
      completion_key: entry.completionKey,
      question: entry.question,
      completed_at: new Date(entry.completedAt).toISOString(),
      day_key: new Date(entry.dayKey).toISOString().slice(0, 10),
      points: entry.points,
      source_label: entry.sourceLabel,
    },
    { onConflict: 'profile_id,completion_key' },
  )
}

export async function upsertRemoteChallenge(
  profileId: string,
  challengeId: string,
  state: { interacted: boolean; completed: boolean },
): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('challenge_progress').upsert(
    {
      profile_id: profileId,
      challenge_id: challengeId,
      interacted: state.interacted,
      completed: state.completed,
    },
    { onConflict: 'profile_id,challenge_id' },
  )
}

export async function clearRemoteSearches(profileId: string): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('recent_searches').delete().eq('profile_id', profileId)
}

export async function resetRemoteSnapshot(profileId: string): Promise<void> {
  if (!supabase) {
    return
  }

  await Promise.all([
    upsertRemoteProfile(profileId, DEFAULT_SETTINGS),
    supabase.from('recent_searches').delete().eq('profile_id', profileId),
    supabase.from('chat_messages').delete().eq('profile_id', profileId),
    supabase.from('completion_entries').delete().eq('profile_id', profileId),
  ])

  await Promise.all(
    DEFAULT_CHALLENGES.map((challengeId) =>
      upsertRemoteChallenge(profileId, challengeId, { interacted: false, completed: false }),
    ),
  )
}

function buildEmptyRemoteSnapshot(): RemoteSnapshot {
  return {
    ...DEFAULT_SETTINGS,
    recentSearches: [],
    chatHistory: [],
    completionEntries: [],
    challengeState: {},
  }
}

async function seedChallengeRows(profileId: string): Promise<void> {
  if (!supabase) {
    return
  }

  await supabase.from('challenge_progress').upsert(
    DEFAULT_CHALLENGES.map((challengeId) => ({
      profile_id: profileId,
      challenge_id: challengeId,
      interacted: false,
      completed: false,
    })),
    { onConflict: 'profile_id,challenge_id' },
  )
}
