import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenText,
  ChartNoAxesColumn,
  ChevronRight,
  Home,
  Menu,
  MoonStar,
  Search,
  SunMedium,
  Trophy,
  UserRound,
  X,
} from 'lucide-react'
import './App.css'
import { loadRemoteSnapshot, replaceRemoteSnapshot, resetRemoteSnapshot, type RemoteSnapshot } from './lib/supabaseAppData'

type Screen = 'home' | 'homework' | 'challenges' | 'progress' | 'profile'
type Theme = 'dark' | 'light'
type Language = 'en' | 'es' | 'fr'
type MessageRole = 'user' | 'assistant'
type ChallengeId = 'daily-math' | 'science-quiz' | 'quick-practice'
type SubjectId = 'math' | 'science' | 'english' | 'history' | 'physics' | 'chemistry'

type SearchEntry = {
  id: string
  query: string
  timestamp: number
}

type ChatMessage = {
  id: string
  role: MessageRole
  text: string
  timestamp: number
}

type CompletionEntry = {
  id: string
  completionKey: string
  question: string
  completedAt: number
  dayKey: string
  points: number
  sourceLabel: string
}

type ChallengeState = Record<ChallengeId, { interacted: boolean; completed: boolean }>

type LaunchContext = {
  prompt: string
  source: 'search' | 'challenge' | 'subject' | 'quick-action'
  rewardPoints?: number
  completionKey?: string
  challengeId?: ChallengeId
  sourceLabel?: string
}

type ChallengeDefinition = {
  id: ChallengeId
  title: string
  description: string
  difficulty: string
  points: number
  icon: string
  tone: 'orange' | 'pink' | 'green'
  startsNew: boolean
  prompt: string
  showChevron?: boolean
}

type SubjectDefinition = {
  id: SubjectId
  title: string
  icon: string
  tone: SubjectId
  prompt: string
}

type AppState = {
  username: string
  progress: {
    today: number
    total: number
  }
  streak: number
  points: number
  recentSearches: SearchEntry[]
  chatHistory: ChatMessage[]
  theme: Theme
  language: Language
  notificationsEnabled: boolean
  aiSuggestionsEnabled: boolean
  soundEnabled: boolean
  completionEntries: CompletionEntry[]
  challengeState: ChallengeState
}

type TranslationKey = keyof typeof translations.en
type Translate = (key: TranslationKey, variables?: Record<string, string | number>) => string

const APP_STATE_KEY = 'stepwise.appState.v4'
const PROFILE_ID_KEY = 'stepwise.profileId.v1'
const DAILY_GOAL = 5
const DEFAULT_USERNAME = 'User'
const MAX_RECENT_SEARCHES = 10
const MAX_CHAT_CONTEXT = 12
const OPENROUTER_BASE_URL =
  (import.meta.env.VITE_OPENROUTER_BASE_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined)?.trim() ||
  'https://openrouter.ai/api/v1'
const OPENROUTER_API_KEY =
  (import.meta.env.VITE_OPENROUTER_API_KEY as string | undefined)?.trim() ||
  (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() ||
  ''
const OPENROUTER_MODEL =
  (import.meta.env.VITE_OPENROUTER_MODEL as string | undefined)?.trim() ||
  (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() ||
  'openai/gpt-4o-mini'
const OPENROUTER_APP_URL =
  (import.meta.env.VITE_OPENROUTER_APP_URL as string | undefined)?.trim() ||
  (import.meta.env.VITE_APP_URL as string | undefined)?.trim() ||
  'https://stepwise.local'
const OPENROUTER_APP_NAME =
  (import.meta.env.VITE_OPENROUTER_APP_NAME as string | undefined)?.trim() ||
  (import.meta.env.VITE_APP_NAME as string | undefined)?.trim() ||
  'StepWise'

const initialChallengeState: ChallengeState = {
  'daily-math': { interacted: false, completed: false },
  'science-quiz': { interacted: false, completed: false },
  'quick-practice': { interacted: false, completed: false },
}

const translations = {
  en: {
    brand: 'StepWise',
    tagline: 'Learn & Have Fun! ✨',
    navHome: 'Home',
    navHomework: 'Homework',
    navChallenges: 'Challenges',
    navProgress: 'Progress',
    navProfile: 'Profile',
    greeting: 'Hey {name}! 👋',
    subtitle: 'Get step-by-step explanations',
    searchPlaceholder: 'Type your question...',
    searchValidation: 'Please type a homework question first.',
    howItWorks: 'How StepWise Works',
    howItWorksSub: 'Step-by-step guidance to help you understand concepts',
    stepAsk: 'Ask',
    stepLearn: 'Learn',
    stepSolve: 'Solve',
    tryNow: 'Try It Now',
    progressTitle: 'Your Progress',
    streak: 'Streak',
    today: 'Today',
    total: 'Total',
    dailyGoal: 'Daily Goal: {count} Problems',
    challenges: 'Challenges',
    newCount: '{count} New',
    dailyMath: 'Daily Math Challenge',
    dailyMathDesc: 'Solve 5 math problems today!',
    scienceQuiz: 'Science Quiz',
    scienceQuizDesc: 'Complete 3 science questions',
    quickPractice: 'Quick Practice',
    quickPracticeDesc: 'Practice 10 problems in any subject',
    easy: 'EASY',
    medium: 'MEDIUM',
    hard: 'HARD',
    leaderboard: 'Leaderboard',
    viewAll: 'View All',
    you: '(You)',
    points: 'pts',
    subjects: 'Subjects',
    subjectMath: 'Math',
    subjectScience: 'Science',
    subjectEnglish: 'English',
    subjectHistory: 'History',
    subjectPhysics: 'Physics',
    subjectChemistry: 'Chemistry',
    homeworkTitle: 'Homework Solver',
    homeworkSubtitle: 'Ask a homework question and get a structured explanation with clear steps.',
    homeworkPlaceholder: 'Ask StepWise a homework question...',
    send: 'Send',
    solverEmpty: 'Your homework conversation will appear here.',
    solverLoading: 'StepWise is working on your question...',
    solverLongWarning: 'Your question is too long. Please shorten it before sending.',
    apiError: 'The AI service is unavailable right now. Please try again in a moment.',
    apiRateLimit:
      'OpenRouter is rate limited right now. StepWise is using local tutor mode. Check your OpenRouter usage or wait and try again.',
    challengesTitle: 'Practice from your active challenges.',
    challengesSubtitle: 'Open any challenge to continue and earn points.',
    progressPageTitle: 'Track every completed problem in one place.',
    progressEmpty: 'No progress yet',
    completedOn: 'Completed on',
    profileTitle: 'Profile & Preferences',
    profileSubtitle: 'Update your name, language, theme, and saved data.',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter username',
    saveProfile: 'Save',
    languageLabel: 'Language',
    themeLabel: 'Theme',
    light: 'Light',
    dark: 'Dark',
    english: 'English',
    spanish: 'Spanish',
    french: 'French',
    clearProgress: 'Clear progress',
    clearSearches: 'Clear searches',
    resetAllData: 'Reset All Data',
    notifications: 'Notifications',
    aiSuggestions: 'AI Suggestions',
    sound: 'Sound',
    recentSearches: 'Recent Searches',
    noRecentSearches: 'No recent activity',
    poweredBy: 'Powered by AI ✨',
    problemsSolved: '{count} problems!',
    welcomeHomework: 'Homework',
    welcomeChallenges: 'Challenges',
    welcomeProgress: 'Progress',
    welcomeProfile: 'Profile',
    chatExplanation: 'Explanation',
    chatSteps: 'Steps',
    chatFinal: 'Final Answer',
    mathFallbackExplanation:
      'The AI service is unavailable, but this looks like a simple arithmetic question so I solved it locally.',
    mathFallbackStepOne: 'Identify the arithmetic expression.',
    mathFallbackStepTwo: 'Evaluate it carefully using the standard order of operations.',
  },
  es: {
    brand: 'StepWise',
    tagline: 'Aprende y diviértete ✨',
    navHome: 'Inicio',
    navHomework: 'Tarea',
    navChallenges: 'Retos',
    navProgress: 'Progreso',
    navProfile: 'Perfil',
    greeting: 'Hola {name}! 👋',
    subtitle: 'Obtén explicaciones paso a paso',
    searchPlaceholder: 'Escribe tu pregunta...',
    searchValidation: 'Primero escribe una pregunta de tarea.',
    howItWorks: 'Cómo funciona StepWise',
    howItWorksSub: 'Guía paso a paso para ayudarte a entender conceptos',
    stepAsk: 'Preguntar',
    stepLearn: 'Aprender',
    stepSolve: 'Resolver',
    tryNow: 'Probar ahora',
    progressTitle: 'Tu progreso',
    streak: 'Racha',
    today: 'Hoy',
    total: 'Total',
    dailyGoal: 'Meta diaria: {count} problemas',
    challenges: 'Retos',
    newCount: '{count} nuevos',
    dailyMath: 'Reto diario de matemáticas',
    dailyMathDesc: 'Resuelve 5 problemas de matemáticas hoy',
    scienceQuiz: 'Cuestionario de ciencia',
    scienceQuizDesc: 'Completa 3 preguntas de ciencia',
    quickPractice: 'Práctica rápida',
    quickPracticeDesc: 'Practica 10 problemas de cualquier materia',
    easy: 'FÁCIL',
    medium: 'MEDIO',
    hard: 'DIFÍCIL',
    leaderboard: 'Clasificación',
    viewAll: 'Ver todo',
    you: '(Tú)',
    points: 'pts',
    subjects: 'Materias',
    subjectMath: 'Matemáticas',
    subjectScience: 'Ciencia',
    subjectEnglish: 'Inglés',
    subjectHistory: 'Historia',
    subjectPhysics: 'Física',
    subjectChemistry: 'Química',
    homeworkTitle: 'Solucionador de tareas',
    homeworkSubtitle: 'Haz una pregunta y recibe una explicación estructurada con pasos claros.',
    homeworkPlaceholder: 'Pregunta a StepWise sobre tu tarea...',
    send: 'Enviar',
    solverEmpty: 'Tu conversación de tarea aparecerá aquí.',
    solverLoading: 'StepWise está trabajando en tu pregunta...',
    solverLongWarning: 'Tu pregunta es demasiado larga. Acórtala antes de enviarla.',
    apiError: 'El servicio de IA no está disponible ahora mismo. Inténtalo de nuevo en un momento.',
    apiRateLimit:
      'OpenRouter está limitado en este momento. StepWise está usando el modo tutor local. Revisa tu uso de OpenRouter o espera e inténtalo de nuevo.',
    challengesTitle: 'Practica desde tus retos activos.',
    challengesSubtitle: 'Abre cualquier reto para continuar y ganar puntos.',
    progressPageTitle: 'Sigue cada problema completado en un solo lugar.',
    progressEmpty: 'Todavía no hay progreso',
    completedOn: 'Completado el',
    profileTitle: 'Perfil y preferencias',
    profileSubtitle: 'Actualiza tu nombre, idioma, tema y datos guardados.',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'Escribe tu nombre',
    saveProfile: 'Guardar',
    languageLabel: 'Idioma',
    themeLabel: 'Tema',
    light: 'Claro',
    dark: 'Oscuro',
    english: 'Inglés',
    spanish: 'Español',
    french: 'Francés',
    clearProgress: 'Borrar progreso',
    clearSearches: 'Borrar búsquedas',
    resetAllData: 'Restablecer todos los datos',
    notifications: 'Notificaciones',
    aiSuggestions: 'Sugerencias de IA',
    sound: 'Sonido',
    recentSearches: 'Búsquedas recientes',
    noRecentSearches: 'No hay actividad reciente',
    poweredBy: 'Impulsado por IA ✨',
    problemsSolved: '{count} problemas!',
    welcomeHomework: 'Tarea',
    welcomeChallenges: 'Retos',
    welcomeProgress: 'Progreso',
    welcomeProfile: 'Perfil',
    chatExplanation: 'Explicación',
    chatSteps: 'Pasos',
    chatFinal: 'Respuesta final',
    mathFallbackExplanation:
      'El servicio de IA no está disponible, pero esto parece una operación aritmética simple y la resolví localmente.',
    mathFallbackStepOne: 'Identifica la expresión aritmética.',
    mathFallbackStepTwo: 'Evalúala con cuidado usando el orden estándar de operaciones.',
  },
  fr: {
    brand: 'StepWise',
    tagline: 'Apprendre et s’amuser ✨',
    navHome: 'Accueil',
    navHomework: 'Devoirs',
    navChallenges: 'Défis',
    navProgress: 'Progrès',
    navProfile: 'Profil',
    greeting: 'Salut {name}! 👋',
    subtitle: 'Obtenez des explications étape par étape',
    searchPlaceholder: 'Tapez votre question...',
    searchValidation: 'Veuillez d’abord saisir une question de devoir.',
    howItWorks: 'Comment StepWise fonctionne',
    howItWorksSub: 'Une aide étape par étape pour comprendre les concepts',
    stepAsk: 'Demander',
    stepLearn: 'Comprendre',
    stepSolve: 'Résoudre',
    tryNow: 'Essayer',
    progressTitle: 'Votre progression',
    streak: 'Série',
    today: 'Aujourd’hui',
    total: 'Total',
    dailyGoal: 'Objectif du jour : {count} problèmes',
    challenges: 'Défis',
    newCount: '{count} nouveaux',
    dailyMath: 'Défi math du jour',
    dailyMathDesc: 'Résous 5 problèmes de maths aujourd’hui',
    scienceQuiz: 'Quiz de sciences',
    scienceQuizDesc: 'Complète 3 questions de sciences',
    quickPractice: 'Pratique rapide',
    quickPracticeDesc: 'Pratique 10 problèmes dans n’importe quelle matière',
    easy: 'FACILE',
    medium: 'MOYEN',
    hard: 'DIFFICILE',
    leaderboard: 'Classement',
    viewAll: 'Voir tout',
    you: '(Vous)',
    points: 'pts',
    subjects: 'Matières',
    subjectMath: 'Maths',
    subjectScience: 'Science',
    subjectEnglish: 'Anglais',
    subjectHistory: 'Histoire',
    subjectPhysics: 'Physique',
    subjectChemistry: 'Chimie',
    homeworkTitle: 'Assistant devoirs',
    homeworkSubtitle: 'Posez une question et obtenez une explication structurée avec des étapes claires.',
    homeworkPlaceholder: 'Posez une question à StepWise...',
    send: 'Envoyer',
    solverEmpty: 'Votre conversation de devoirs apparaîtra ici.',
    solverLoading: 'StepWise travaille sur votre question...',
    solverLongWarning: 'Votre question est trop longue. Veuillez la raccourcir.',
    apiError: 'Le service IA est indisponible pour le moment. Réessayez dans un instant.',
    apiRateLimit:
      'OpenRouter est limité pour le moment. StepWise utilise le mode tuteur local. Vérifiez votre usage OpenRouter ou attendez avant de réessayer.',
    challengesTitle: 'Travaillez depuis vos défis actifs.',
    challengesSubtitle: 'Ouvrez un défi pour continuer et gagner des points.',
    progressPageTitle: 'Suivez chaque problème terminé au même endroit.',
    progressEmpty: 'Aucun progrès pour le moment',
    completedOn: 'Terminé le',
    profileTitle: 'Profil et préférences',
    profileSubtitle: 'Mettez à jour votre nom, langue, thème et données enregistrées.',
    usernameLabel: 'Nom d’utilisateur',
    usernamePlaceholder: 'Entrez votre nom',
    saveProfile: 'Enregistrer',
    languageLabel: 'Langue',
    themeLabel: 'Thème',
    light: 'Clair',
    dark: 'Sombre',
    english: 'Anglais',
    spanish: 'Espagnol',
    french: 'Français',
    clearProgress: 'Effacer les progrès',
    clearSearches: 'Effacer les recherches',
    resetAllData: 'Réinitialiser toutes les données',
    notifications: 'Notifications',
    aiSuggestions: 'Suggestions IA',
    sound: 'Son',
    recentSearches: 'Recherches récentes',
    noRecentSearches: 'Aucune activité récente',
    poweredBy: 'Propulsé par l’IA ✨',
    problemsSolved: '{count} problèmes!',
    welcomeHomework: 'Devoirs',
    welcomeChallenges: 'Défis',
    welcomeProgress: 'Progrès',
    welcomeProfile: 'Profil',
    chatExplanation: 'Explication',
    chatSteps: 'Étapes',
    chatFinal: 'Réponse finale',
    mathFallbackExplanation:
      'Le service IA est indisponible, mais cela ressemble à une opération arithmétique simple et je l’ai résolue localement.',
    mathFallbackStepOne: 'Identifiez l’expression arithmétique.',
    mathFallbackStepTwo: 'Évaluez-la soigneusement en respectant l’ordre habituel des opérations.',
  },
} as const

function buildDefaultAppState(): AppState {
  return {
    username: '',
    progress: { today: 0, total: 0 },
    streak: 0,
    points: 0,
    recentSearches: [],
    chatHistory: [],
    theme: 'dark',
    language: 'en',
    notificationsEnabled: true,
    aiSuggestionsEnabled: true,
    soundEnabled: true,
    completionEntries: [],
    challengeState: initialChallengeState,
  }
}

function syncAppState(state: AppState): AppState {
  const completionEntries = [...(state.completionEntries ?? [])].sort((left, right) => right.completedAt - left.completedAt)
  const today = completionEntries.filter((entry) => entry.dayKey === dayKey(Date.now())).length
  const total = completionEntries.length
  const points = completionEntries.reduce((sum, entry) => sum + entry.points, 0)

  return {
    ...buildDefaultAppState(),
    ...state,
    progress: { today, total },
    streak: calculateStreak(completionEntries),
    points,
    recentSearches: (state.recentSearches ?? []).slice(0, MAX_RECENT_SEARCHES),
    chatHistory: state.chatHistory ?? [],
    completionEntries,
    challengeState: {
      ...initialChallengeState,
      ...(state.challengeState ?? {}),
    },
  }
}

function getChallenges(t: Translate): ChallengeDefinition[] {
  return [
    {
      id: 'daily-math',
      title: t('dailyMath'),
      description: t('dailyMathDesc'),
      difficulty: t('medium'),
      points: 100,
      icon: '🏆',
      tone: 'orange',
      startsNew: true,
      prompt: 'Give me 5 medium math problems and guide me through each one step by step.',
    },
    {
      id: 'science-quiz',
      title: t('scienceQuiz'),
      description: t('scienceQuizDesc'),
      difficulty: t('hard'),
      points: 150,
      icon: '⭐',
      tone: 'pink',
      startsNew: false,
      prompt: 'Start a 3-question science quiz and explain every answer step by step.',
      showChevron: true,
    },
    {
      id: 'quick-practice',
      title: t('quickPractice'),
      description: t('quickPracticeDesc'),
      difficulty: t('easy'),
      points: 75,
      icon: '✨',
      tone: 'green',
      startsNew: true,
      prompt: 'Give me 10 mixed practice questions across subjects and explain each solution clearly.',
    },
  ]
}

function getSubjects(t: Translate): SubjectDefinition[] {
  return [
    { id: 'math', title: t('subjectMath'), icon: '⌗', tone: 'math', prompt: 'Help me with a math problem and explain each step clearly.' },
    { id: 'science', title: t('subjectScience'), icon: '◫', tone: 'science', prompt: 'Teach me a science concept and then quiz me with a short question.' },
    { id: 'english', title: t('subjectEnglish'), icon: '◍', tone: 'english', prompt: 'Help me understand an English homework task with a clear explanation and model answer.' },
    { id: 'history', title: t('subjectHistory'), icon: '⌘', tone: 'history', prompt: 'Help me review a history topic and explain the key events clearly.' },
    { id: 'physics', title: t('subjectPhysics'), icon: '⚡', tone: 'physics', prompt: 'Give me a physics practice problem and solve it step by step.' },
    { id: 'chemistry', title: t('subjectChemistry'), icon: '✣', tone: 'chemistry', prompt: 'Help me practice a chemistry question and explain the concept simply.' },
  ]
}

function App() {
  const [screen, setScreen] = useState<Screen>(() => readScreenFromHash())
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [profileId] = useState(() => readOrCreateProfileId())
  const [appState, setAppState] = useState<AppState>(() => readInitialAppState())
  const [isRemoteHydrated, setIsRemoteHydrated] = useState(false)
  const [searchInput, setSearchInput] = useState('')
  const [homeNotice, setHomeNotice] = useState('')
  const [homeworkInput, setHomeworkInput] = useState('')
  const [homeworkNotice, setHomeworkNotice] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [queuedLaunch, setQueuedLaunch] = useState<LaunchContext | null>(null)
  const [profileName, setProfileName] = useState('')
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const state = useMemo(() => syncAppState(appState), [appState])
  const t = useTranslator(state.language)
  const displayName = state.username.trim() || DEFAULT_USERNAME
  const challenges = useMemo(() => getChallenges(t), [state.language])
  const subjects = useMemo(() => getSubjects(t), [state.language])
  const unseenCount = challenges.filter((challenge) => challenge.startsNew && !state.challengeState[challenge.id].interacted).length
  const progressPercent = Math.min(100, (state.progress.today / DAILY_GOAL) * 100)
  const navigation = useMemo(
    () => [
      { id: 'home' as const, label: t('navHome'), icon: Home },
      { id: 'homework' as const, label: t('navHomework'), icon: BookOpenText },
      { id: 'challenges' as const, label: t('navChallenges'), icon: Trophy },
      { id: 'progress' as const, label: t('navProgress'), icon: ChartNoAxesColumn },
      { id: 'profile' as const, label: t('navProfile'), icon: UserRound },
    ],
    [state.language],
  )

  useEffect(() => {
    if (!isSameState(appState, state)) {
      setAppState(state)
    }
  }, [appState, state])

  useEffect(() => {
    document.documentElement.dataset.theme = state.theme
  }, [state.theme])

  useEffect(() => {
    setProfileName(state.username)
  }, [state.username])

  useEffect(() => {
    let cancelled = false

    async function hydrateFromSupabase() {
      try {
        const remoteSnapshot = await loadRemoteSnapshot(profileId)
        if (cancelled) {
          return
        }

        let mergedState: AppState = state
        setAppState((current) => {
          mergedState = syncAppState(
            mergeAppStates(current, appStateFromRemoteSnapshot(remoteSnapshot)),
          )
          return mergedState
        })
      } catch (error) {
        console.error('Failed to hydrate from Supabase.', error)
      } finally {
        if (!cancelled) {
          setIsRemoteHydrated(true)
        }
      }
    }

    void hydrateFromSupabase()

    return () => {
      cancelled = true
    }
  }, [profileId])

  useEffect(() => {
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    if (!isRemoteHydrated) {
      return
    }

    const timeout = window.setTimeout(() => {
      void replaceRemoteSnapshot(profileId, toRemoteSnapshot(state))
    }, 250)

    return () => {
      window.clearTimeout(timeout)
    }
  }, [state, profileId, isRemoteHydrated])

  useEffect(() => {
    const nextHash = `#${screen}`
    if (window.location.hash !== nextHash) {
      window.history.replaceState(null, '', nextHash)
    }
  }, [screen])

  useEffect(() => {
    const handleHashChange = () => {
      setScreen(readScreenFromHash())
      setSidebarOpen(false)
    }

    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [state.chatHistory, isLoading])

  useEffect(() => {
    if (screen !== 'homework' || queuedLaunch === null || isLoading) {
      return
    }

    const launch = queuedLaunch
    setQueuedLaunch(null)
    void sendHomeworkMessage(launch.prompt, launch)
  }, [screen, queuedLaunch, isLoading])

  function updateAppState(updater: (current: AppState) => AppState) {
    setAppState((current) => syncAppState(updater(syncAppState(current))))
  }

  function openScreen(next: Screen) {
    setScreen(next)
    setSidebarOpen(false)
    setHomeNotice('')
    setHomeworkNotice('')
  }

  function storeRecentSearch(query: string) {
    updateAppState((current) => ({
      ...current,
      recentSearches: [
        { id: createId(), query, timestamp: Date.now() },
        ...current.recentSearches.filter((item) => item.query.toLowerCase() !== query.toLowerCase()),
      ].slice(0, MAX_RECENT_SEARCHES),
    }))
  }

  function launchHomework(prompt: string, partial?: Partial<LaunchContext>) {
    const cleaned = prompt.trim()

    if (!cleaned) {
      setHomeNotice(t('searchValidation'))
      return
    }

    if (partial?.source === 'search') {
      storeRecentSearch(cleaned)
    }

    setHomeNotice('')
    setHomeworkNotice('')
    setHomeworkInput(cleaned)
    setQueuedLaunch({
      prompt: cleaned,
      source: partial?.source ?? 'quick-action',
      rewardPoints: partial?.rewardPoints,
      completionKey: partial?.completionKey,
      challengeId: partial?.challengeId,
      sourceLabel: partial?.sourceLabel,
    })
    openScreen('homework')
  }

  function handleHomeSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    launchHomework(searchInput, {
      source: 'search',
      rewardPoints: 10,
      sourceLabel: searchInput.trim() || t('navHomework'),
    })
    setSearchInput('')
  }

  function handleChallengeClick(challenge: ChallengeDefinition) {
    updateAppState((current) => ({
      ...current,
      challengeState: {
        ...current.challengeState,
        [challenge.id]: { ...current.challengeState[challenge.id], interacted: true },
      },
    }))

    launchHomework(challenge.prompt, {
      source: 'challenge',
      challengeId: challenge.id,
      rewardPoints: challenge.points,
      completionKey: `challenge:${challenge.id}`,
      sourceLabel: challenge.title,
    })
  }

  function handleSubjectClick(subject: SubjectDefinition) {
    launchHomework(subject.prompt, {
      source: 'subject',
      rewardPoints: 10,
      sourceLabel: subject.title,
    })
  }

  async function sendHomeworkMessage(rawInput: string, launch?: LaunchContext) {
    const cleaned = rawInput.trim()

    if (!cleaned || isLoading) {
      return
    }

    if (cleaned.length > 600) {
      setHomeworkNotice(t('solverLongWarning'))
      return
    }

    const userMessage: ChatMessage = {
      id: createId(),
      role: 'user',
      text: cleaned,
      timestamp: Date.now(),
    }

    const historySnapshot = [...state.chatHistory, userMessage]
    updateAppState((current) => ({
      ...current,
      chatHistory: [...current.chatHistory, userMessage],
    }))

    setHomeworkInput('')
    setHomeworkNotice('')
    setIsLoading(true)

    try {
      const assistantText = await requestTutorAnswer({
        history: historySnapshot,
        labels: getSectionLabels(state.language, t),
        language: state.language,
      })

      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: assistantText,
        timestamp: Date.now(),
      }

      updateAppState((current) => ({
        ...current,
        chatHistory: [...current.chatHistory, assistantMessage],
      }))

      registerSolvedQuestion(userMessage.id, cleaned, launch)
    } catch {
      const fallbackText = buildLocalFallback(cleaned, state.language, t, historySnapshot)
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: fallbackText,
        timestamp: Date.now(),
      }

      updateAppState((current) => ({
        ...current,
        chatHistory: [...current.chatHistory, assistantMessage],
      }))

      registerSolvedQuestion(userMessage.id, cleaned, launch)
    } finally {
      setIsLoading(false)
    }
  }

  function registerSolvedQuestion(messageId: string, question: string, launch?: LaunchContext) {
    const completionKey = launch?.completionKey ?? `message:${messageId}`

    updateAppState((current) => {
      if (current.completionEntries.some((entry) => entry.completionKey === completionKey)) {
        return current
      }

      return {
        ...current,
        completionEntries: [
          {
            id: createId(),
            completionKey,
            question,
            completedAt: Date.now(),
            dayKey: dayKey(Date.now()),
            points: launch?.rewardPoints ?? 10,
            sourceLabel: launch?.sourceLabel ?? question,
          },
          ...current.completionEntries,
        ],
        challengeState:
          launch?.source === 'challenge' && launch.challengeId
            ? {
                ...current.challengeState,
                [launch.challengeId]: {
                  interacted: true,
                  completed: true,
                },
              }
            : current.challengeState,
      }
    })
  }

  function saveProfile() {
    updateAppState((current) => ({
      ...current,
      username: profileName.trim(),
    }))
  }

  function clearSearches() {
    updateAppState((current) => ({
      ...current,
      recentSearches: [],
    }))
  }

  function resetAllData() {
    const resetState = buildDefaultAppState()
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem(APP_STATE_KEY)
    }

    setAppState(resetState)
    setProfileName(resetState.username)
    setSearchInput('')
    setHomeworkInput('')
    setHomeNotice('')
    setHomeworkNotice('')
    setQueuedLaunch(null)
    setHomeworkNotice('')
    setHomeNotice('')
    void resetRemoteSnapshot(profileId)
  }

  return (
    <div className="stepwise-shell">
      <button
        type="button"
        className={`stepwise-overlay ${sidebarOpen ? 'stepwise-overlay--visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="stepwise-frame">
        <aside className={`stepwise-sidebar ${sidebarOpen ? 'stepwise-sidebar--open' : ''}`}>
          <div className="brand-panel">
            <div className="brand-mark">✨</div>
            <div>
              <strong>{t('brand')}</strong>
              <p>{t('tagline')}</p>
            </div>
            <button type="button" className="sidebar-close" onClick={() => setSidebarOpen(false)}>
              <X size={16} />
            </button>
          </div>

          <div className="user-panel">
            <div className="avatar-pill">{displayName.slice(0, 1).toUpperCase()}</div>
            <div className="user-panel__info">
              <strong>{displayName}</strong>
              <p>⭐ {interpolate(t('problemsSolved'), { count: state.progress.total })}</p>
            </div>
            <span className="user-notice">{unseenCount}</span>
          </div>

          <nav className="stepwise-nav" aria-label="Sidebar navigation">
            {navigation.map((item) => (
              <SidebarButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={screen === item.id}
                onClick={() => openScreen(item.id)}
              />
            ))}
          </nav>

          <div className="sidebar-footer">
            <p>StepWise v2.1.0</p>
            <strong>{t('poweredBy')}</strong>
          </div>
        </aside>

        <main className="stepwise-main">
          <button type="button" className="mobile-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={18} />
          </button>

          {screen === 'home' && (
            <section className="home-screen">
              <header className="home-hero">
                <h1>{interpolate(t('greeting'), { name: displayName })}</h1>
                <p className={`home-hero__subtitle ${homeNotice ? 'home-hero__subtitle--error' : ''}`}>
                  {homeNotice || t('subtitle')}
                </p>
                <form className="search-bar" onSubmit={handleHomeSearchSubmit}>
                  <Search size={18} />
                  <input
                    value={searchInput}
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder={t('searchPlaceholder')}
                    aria-label={t('searchPlaceholder')}
                  />
                  <button type="submit" className="visually-hidden">{t('send')}</button>
                </form>
              </header>

              <section className="step-card panel-card">
                <div className="panel-heading panel-heading--start">
                  <span className="panel-dot">✨</span>
                  <div>
                    <h2>{t('howItWorks')}</h2>
                    <p>{t('howItWorksSub')}</p>
                  </div>
                </div>
                <div className="step-grid">
                  <StepCard emoji="💬" number="1" label={t('stepAsk')} />
                  <StepCard emoji="🧠" number="2" label={t('stepLearn')} />
                  <StepCard emoji="✨" number="3" label={t('stepSolve')} />
                </div>
                <button
                  type="button"
                  className="try-button"
                  onClick={() =>
                    launchHomework('Help me solve a homework problem step by step.', {
                      source: 'quick-action',
                      rewardPoints: 10,
                      sourceLabel: t('tryNow'),
                    })
                  }
                >
                  <span>⊕</span> {t('tryNow')}
                </button>
              </section>

              <section className="progress-card panel-card">
                <div className="panel-heading panel-heading--center">📊 {t('progressTitle')}</div>
                <div className="progress-stats-grid">
                  <StatTile value={String(state.streak)} label={`${t('streak')} 🔥`} tone="purple" />
                  <StatTile value={String(state.progress.today)} label={`${t('today')} 🛰`} tone="blue" />
                  <StatTile value={String(state.progress.total)} label={`${t('total')} ⭐`} tone="green" />
                </div>
                <div className="goal-row">
                  <span>{interpolate(t('dailyGoal'), { count: DAILY_GOAL })}</span>
                  <strong>{Math.min(state.progress.today, DAILY_GOAL)}/{DAILY_GOAL}</strong>
                </div>
                <div className="goal-track">
                  <div className="goal-track__fill" style={{ width: `${progressPercent}%` }} />
                </div>
              </section>

              <div className="section-heading">
                <h2>🎯 {t('challenges')}</h2>
                {unseenCount > 0 ? <span className="count-pill">{interpolate(t('newCount'), { count: unseenCount })}</span> : null}
              </div>

              <div className="challenge-list">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    showNew={challenge.startsNew && !state.challengeState[challenge.id].interacted}
                    onClick={() => handleChallengeClick(challenge)}
                  />
                ))}
              </div>

              <div className="section-heading section-heading--compact">
                <h2>🏆 {t('leaderboard')}</h2>
                <button type="button" className="link-button">{t('viewAll')} ›</button>
              </div>

              <div className="leaderboard-card">
                <div className="leaderboard-user">
                  <span className="leaderboard-avatar">{displayName.slice(0, 1).toUpperCase()}</span>
                  <div>
                    <strong>{displayName} {t('you')}</strong>
                    <p>{state.points} {t('points')}</p>
                  </div>
                </div>
                <span className="leaderboard-rank">#1</span>
              </div>

              <div className="section-heading section-heading--compact">
                <h2>🎨 {t('subjects')}</h2>
              </div>

              <div className="subjects-grid">
                {subjects.map((subject) => (
                  <SubjectCard key={subject.id} subject={subject} onClick={() => handleSubjectClick(subject)} />
                ))}
              </div>
            </section>
          )}

          {screen === 'homework' && (
            <section className="subpage-screen">
              <header className="subpage-header panel-card">
                <div>
                  <p>{t('welcomeHomework')}</p>
                  <h1>{t('homeworkTitle')}</h1>
                  <span>{t('homeworkSubtitle')}</span>
                </div>
              </header>

              <section className="homework-chat panel-card">
                <div className="chat-stream">
                  {state.chatHistory.length === 0 && !isLoading ? <div className="chat-empty">{t('solverEmpty')}</div> : null}
                  {state.chatHistory.map((message) => (
                    <article key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
                      <div className="chat-bubble__meta">
                        <strong>{message.role === 'user' ? displayName : t('brand')}</strong>
                        <span>{formatShortTime(message.timestamp, state.language)}</span>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  ))}
                  {isLoading ? (
                    <article className="chat-bubble chat-bubble--assistant chat-bubble--loading">
                      <div className="loading-dots"><span /><span /><span /></div>
                      <p>{t('solverLoading')}</p>
                    </article>
                  ) : null}
                  <div ref={messagesEndRef} />
                </div>

                <form
                  className="homework-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    void sendHomeworkMessage(homeworkInput)
                  }}
                >
                  <textarea
                    value={homeworkInput}
                    onChange={(event) => setHomeworkInput(event.target.value)}
                    placeholder={t('homeworkPlaceholder')}
                    rows={4}
                    aria-label={t('homeworkPlaceholder')}
                  />
                  <div className="homework-form__footer">
                    <p className={`homework-form__notice ${homeworkNotice ? 'homework-form__notice--error' : ''}`}>{homeworkNotice}</p>
                    <button type="submit" className="solid-button">{t('send')}</button>
                  </div>
                </form>
              </section>
            </section>
          )}

          {screen === 'challenges' && (
            <section className="subpage-screen">
              <header className="subpage-header panel-card">
                <div>
                  <p>{t('welcomeChallenges')}</p>
                  <h1>{t('challenges')}</h1>
                  <span>{t('challengesSubtitle')}</span>
                </div>
              </header>
              <section className="challenge-list">
                {challenges.map((challenge) => (
                  <ChallengeCard
                    key={challenge.id}
                    challenge={challenge}
                    showNew={challenge.startsNew && !state.challengeState[challenge.id].interacted}
                    onClick={() => handleChallengeClick(challenge)}
                  />
                ))}
              </section>
            </section>
          )}

          {screen === 'progress' && (
            <section className="subpage-screen">
              <header className="subpage-header panel-card">
                <div>
                  <p>{t('welcomeProgress')}</p>
                  <h1>{t('progressTitle')}</h1>
                  <span>{t('progressPageTitle')}</span>
                </div>
              </header>

              <div className="progress-summary-grid">
                <StatTile value={String(state.streak)} label={`${t('streak')} 🔥`} tone="purple" />
                <StatTile value={String(state.progress.today)} label={`${t('today')} 🛰`} tone="blue" />
                <StatTile value={String(state.progress.total)} label={`${t('total')} ⭐`} tone="green" />
              </div>

              <section className="panel-card history-panel">
                {state.completionEntries.length === 0 ? (
                  <div className="empty-history">{t('progressEmpty')}</div>
                ) : (
                  state.completionEntries.map((item) => (
                    <article key={item.id} className="history-item">
                      <div>
                        <strong>{item.sourceLabel}</strong>
                        <p>{item.question}</p>
                      </div>
                      <span>{t('completedOn')} {formatDateTime(item.completedAt, state.language)}</span>
                    </article>
                  ))
                )}
              </section>
            </section>
          )}

          {screen === 'profile' && (
            <section className="subpage-screen">
              <header className="subpage-header panel-card">
                <div>
                  <p>{t('welcomeProfile')}</p>
                  <h1>{t('profileTitle')}</h1>
                  <span>{t('profileSubtitle')}</span>
                </div>
              </header>

              <div className="profile-grid">
                <section className="panel-card settings-panel">
                  <label>
                    <span>{t('usernameLabel')}</span>
                    <input
                      value={profileName}
                      onChange={(event) => setProfileName(event.target.value)}
                      placeholder={t('usernamePlaceholder')}
                    />
                  </label>
                  <button type="button" className="solid-button" onClick={saveProfile}>{t('saveProfile')}</button>
                </section>

                <section className="panel-card settings-panel">
                  <label>
                    <span>{t('languageLabel')}</span>
                    <select
                      value={state.language}
                      onChange={(event) =>
                        updateAppState((current) => ({ ...current, language: event.target.value as Language }))
                      }
                    >
                      <option value="en">{t('english')}</option>
                      <option value="es">{t('spanish')}</option>
                      <option value="fr">{t('french')}</option>
                    </select>
                  </label>
                  <div className="theme-toggle-row">
                    <button
                      type="button"
                      className={`theme-toggle ${state.theme === 'dark' ? 'theme-toggle--active' : ''}`}
                      onClick={() => updateAppState((current) => ({ ...current, theme: 'dark' }))}
                    >
                      <MoonStar size={16} /> {t('dark')}
                    </button>
                    <button
                      type="button"
                      className={`theme-toggle ${state.theme === 'light' ? 'theme-toggle--active' : ''}`}
                      onClick={() => updateAppState((current) => ({ ...current, theme: 'light' }))}
                    >
                      <SunMedium size={16} /> {t('light')}
                    </button>
                  </div>
                  <SettingToggleRow
                    label={t('notifications')}
                    enabled={state.notificationsEnabled}
                    onToggle={() =>
                      updateAppState((current) => ({
                        ...current,
                        notificationsEnabled: !current.notificationsEnabled,
                      }))
                    }
                  />
                  <SettingToggleRow
                    label={t('aiSuggestions')}
                    enabled={state.aiSuggestionsEnabled}
                    onToggle={() =>
                      updateAppState((current) => ({
                        ...current,
                        aiSuggestionsEnabled: !current.aiSuggestionsEnabled,
                      }))
                    }
                  />
                  <SettingToggleRow
                    label={t('sound')}
                    enabled={state.soundEnabled}
                    onToggle={() =>
                      updateAppState((current) => ({
                        ...current,
                        soundEnabled: !current.soundEnabled,
                      }))
                    }
                  />
                </section>

                <section className="panel-card settings-panel settings-panel--wide">
                  <div className="profile-actions">
                    <button type="button" className="ghost-button" onClick={clearSearches}>{t('clearSearches')}</button>
                    <button type="button" className="ghost-button" onClick={resetAllData}>{t('resetAllData')}</button>
                  </div>
                  <div>
                    <h2>{t('recentSearches')}</h2>
                    {state.recentSearches.length === 0 ? (
                      <p className="recent-empty">{t('noRecentSearches')}</p>
                    ) : (
                      <div className="recent-search-list">
                        {state.recentSearches.map((entry) => (
                          <button
                            key={entry.id}
                            type="button"
                            className="recent-search-item"
                            onClick={() =>
                              launchHomework(entry.query, {
                                source: 'search',
                                rewardPoints: 10,
                                sourceLabel: entry.query,
                              })
                            }
                          >
                            <span>{entry.query}</span>
                            <strong>{formatShortTime(entry.timestamp, state.language)}</strong>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  )
}

function SidebarButton({
  icon: Icon,
  label,
  active,
  onClick,
}: {
  icon: LucideIcon
  label: string
  active: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className={`sidebar-button ${active ? 'sidebar-button--active' : ''}`} onClick={onClick}>
      <span className="sidebar-button__icon"><Icon size={16} /></span>
      <span>{label}</span>
      {active ? <span className="sidebar-button__dot" /> : null}
    </button>
  )
}

function StepCard({ emoji, number, label }: { emoji: string; number: string; label: string }) {
  return (
    <div className="mini-step-card">
      <div className="mini-step-card__emoji">{emoji}</div>
      <strong>{number}</strong>
      <span>{label}</span>
    </div>
  )
}

function StatTile({ value, label, tone }: { value: string; label: string; tone: 'purple' | 'blue' | 'green' }) {
  return (
    <article className={`stat-tile stat-tile--${tone}`}>
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  )
}

function SettingToggleRow({
  label,
  enabled,
  onToggle,
}: {
  label: string
  enabled: boolean
  onToggle: () => void
}) {
  return (
    <div className="theme-toggle-row">
      <span>{label}</span>
      <button
        type="button"
        className={`theme-toggle ${enabled ? 'theme-toggle--active' : ''}`}
        onClick={onToggle}
      >
        {enabled ? 'On' : 'Off'}
      </button>
    </div>
  )
}

function ChallengeCard({
  challenge,
  showNew,
  onClick,
}: {
  challenge: ChallengeDefinition
  showNew: boolean
  onClick: () => void
}) {
  return (
    <button type="button" className="challenge-card" onClick={onClick}>
      <span className={`challenge-card__icon challenge-card__icon--${challenge.tone}`}>{challenge.icon}</span>
      <div className="challenge-card__body">
        <div className="challenge-card__topline">
          <strong>{challenge.title}</strong>
          <div className="challenge-card__side">
            {showNew ? <span className="new-badge">NEW</span> : null}
            {challenge.showChevron ? <ChevronRight size={16} className="challenge-arrow" /> : null}
          </div>
        </div>
        <p>{challenge.description}</p>
        <div className="challenge-tags">
          <span className={`difficulty-badge difficulty-badge--${challenge.tone}`}>{challenge.difficulty}</span>
          <span className="points-badge">+{challenge.points}</span>
        </div>
      </div>
    </button>
  )
}

function SubjectCard({ subject, onClick }: { subject: SubjectDefinition; onClick: () => void }) {
  return (
    <button type="button" className={`subject-card subject-card--${subject.tone}`} onClick={onClick}>
      <span>{subject.icon}</span>
      <strong>{subject.title}</strong>
    </button>
  )
}

function readInitialAppState(): AppState {
  if (typeof window === 'undefined') {
    return buildDefaultAppState()
  }

  try {
    const raw = window.localStorage.getItem(APP_STATE_KEY)
    return raw ? syncAppState(JSON.parse(raw) as AppState) : buildDefaultAppState()
  } catch {
    return buildDefaultAppState()
  }
}

function useTranslator(language: Language): Translate {
  return (key, variables = {}) => {
    const template = translations[language][key] ?? translations.en[key] ?? key
    return interpolate(String(template), variables)
  }
}

function interpolate(template: string, variables: Record<string, string | number>) {
  return Object.entries(variables).reduce(
    (current, [key, value]) => current.split(`{${key}}`).join(String(value)),
    template,
  )
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function wait(milliseconds: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, milliseconds)
  })
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function calculateStreak(entries: CompletionEntry[]) {
  const days = new Set(entries.map((entry) => entry.dayKey))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  let streak = 0

  while (days.has(cursor.toISOString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function readScreenFromHash(): Screen {
  const value = window.location.hash.replace('#', '')
  if (value === 'homework' || value === 'challenges' || value === 'progress' || value === 'profile') {
    return value
  }
  return 'home'
}

function isSameState(left: AppState, right: AppState) {
  return JSON.stringify(left) === JSON.stringify(right)
}

function formatShortTime(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    hour: 'numeric',
    minute: '2-digit',
  }).format(timestamp)
}

function formatDateTime(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(timestamp)
}

function readOrCreateProfileId() {
  const storageKey = 'stepwise.profileId'

  if (typeof window === 'undefined') {
    return crypto.randomUUID()
  }

  const existing = window.localStorage.getItem(storageKey)
  if (existing) {
    return existing
  }

  const generated = crypto.randomUUID()
  window.localStorage.setItem(storageKey, generated)
  return generated
}

function appStateFromRemoteSnapshot(snapshot: RemoteSnapshot): AppState {
  return syncAppState({
    ...buildDefaultAppState(),
    username: snapshot.username,
    theme: snapshot.theme,
    language: snapshot.language,
    notificationsEnabled: snapshot.notificationsEnabled,
    aiSuggestionsEnabled: snapshot.aiSuggestionsEnabled,
    soundEnabled: snapshot.soundEnabled,
    recentSearches: snapshot.recentSearches.map((entry) => ({
      id: entry.id,
      query: entry.query,
      timestamp: entry.timestamp,
    })),
    chatHistory: snapshot.chatHistory.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: message.timestamp,
    })),
    completionEntries: snapshot.completionEntries.map((entry) => ({
      id: entry.id,
      completionKey: entry.completionKey,
      question: entry.question,
      completedAt: entry.completedAt,
      dayKey: entry.dayKey,
      points: entry.points,
      sourceLabel: entry.sourceLabel,
    })),
    challengeState: {
      ...initialChallengeState,
      ...Object.fromEntries(
        Object.entries(snapshot.challengeState).map(([challengeId, state]) => [
          challengeId,
          { interacted: state.interacted, completed: state.completed },
        ]),
      ),
    },
  })
}

function toRemoteSnapshot(state: AppState): RemoteSnapshot {
  return {
    username: state.username,
    theme: state.theme,
    language: state.language,
    notificationsEnabled: state.notificationsEnabled,
    aiSuggestionsEnabled: state.aiSuggestionsEnabled,
    soundEnabled: state.soundEnabled,
    recentSearches: state.recentSearches.map((entry) => ({
      id: entry.id,
      query: entry.query,
      timestamp: entry.timestamp,
    })),
    chatHistory: state.chatHistory.map((message) => ({
      id: message.id,
      role: message.role,
      text: message.text,
      timestamp: message.timestamp,
    })),
    completionEntries: state.completionEntries.map((entry) => ({
      id: entry.id,
      completionKey: entry.completionKey,
      question: entry.question,
      completedAt: entry.completedAt,
      dayKey: entry.dayKey,
      points: entry.points,
      sourceLabel: entry.sourceLabel,
    })),
    challengeState: state.challengeState,
  }
}

function mergeAppStates(localState: AppState, remoteState: AppState): AppState {
  if (
    localState.recentSearches.length === 0 &&
    localState.chatHistory.length === 0 &&
    localState.completionEntries.length === 0 &&
    localState.username.trim() === ''
  ) {
    return remoteState
  }

  const mergedSearches = dedupeById([...localState.recentSearches, ...remoteState.recentSearches]).sort(
    (left, right) => right.timestamp - left.timestamp,
  )

  const mergedMessages = dedupeById([...localState.chatHistory, ...remoteState.chatHistory]).sort(
    (left, right) => left.timestamp - right.timestamp,
  )

  const mergedCompletions = dedupeByCompletionKey([
    ...localState.completionEntries,
    ...remoteState.completionEntries,
  ]).sort((left, right) => right.completedAt - left.completedAt)

  return syncAppState({
    ...remoteState,
    username: localState.username.trim() || remoteState.username,
    theme: localState.theme ?? remoteState.theme,
    language: localState.language ?? remoteState.language,
    notificationsEnabled: localState.notificationsEnabled,
    aiSuggestionsEnabled: localState.aiSuggestionsEnabled,
    soundEnabled: localState.soundEnabled,
    recentSearches: mergedSearches,
    chatHistory: mergedMessages,
    completionEntries: mergedCompletions,
    challengeState: {
      ...remoteState.challengeState,
      ...localState.challengeState,
    },
  })
}

function dedupeById<T extends { id: string }>(items: T[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.id)) {
      return false
    }
    seen.add(item.id)
    return true
  })
}

function dedupeByCompletionKey(items: CompletionEntry[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.completionKey)) {
      return false
    }
    seen.add(item.completionKey)
    return true
  })
}

function localeForLanguage(language: Language) {
  if (language === 'es') return 'es-ES'
  if (language === 'fr') return 'fr-FR'
  return 'en-US'
}

function detectInputLanguage(input: string, fallback: Language): Language {
  const normalized = input.toLowerCase()
  if (/[¿¡]|\b(tarea|resolver|ecuacion|fraccion|calcula|pregunta)\b/i.test(normalized)) return 'es'
  if (/[àâçéèêëîïôûùüÿœ]|\b(devoir|question|equation|fraction|calcule)\b/i.test(normalized)) return 'fr'
  return fallback
}

function getSectionLabels(language: Language, t: Translate) {
  return {
    explanation: t('chatExplanation'),
    steps: t('chatSteps'),
    final: t('chatFinal'),
    languageName: language === 'es' ? 'Spanish' : language === 'fr' ? 'French' : 'English',
  }
}

const OPENAI_MISSING_KEY_MESSAGE = 'OpenRouter API key is missing. Please set it in .env.local'
const OPENAI_REQUEST_FAILED_MESSAGE = 'OpenRouter request failed. Using fallback tutor mode.'
const OPENAI_UNAVAILABLE_MESSAGE = 'OpenRouter is unavailable right now. Using fallback tutor mode.'
const OPENAI_RATE_LIMIT_MESSAGE = 'OpenRouter is rate limited right now. StepWise is using local tutor mode. Check your OpenRouter usage or wait and try again.'

async function callOpenAI(history: ChatMessage[], languageName: string, preferDirectAnswer: boolean) {
  if (!OPENROUTER_API_KEY) {
    return OPENAI_MISSING_KEY_MESSAGE
  }

  const contextMessages = history
    .filter((message) => message.role === 'user' || message.role === 'assistant')
    .slice(-MAX_CHAT_CONTEXT)
    .map((message) => ({
      role: message.role,
      content: message.text,
    }))

  const SYSTEM_PROMPT = `
You are StepWise, an advanced AI homework tutor.

Your job is to teach clearly, not just give answers.

RULES:
- If the latest question is very simple, such as basic arithmetic, a short definition, or a request for only the answer, respond with only the direct answer.
- For all other homework questions, respond in a structured format:
  1. Simple Explanation
  2. Step-by-Step Breakdown
  3. Final Answer
  4. Quick Tip (optional)

- Be clear, direct, and easy to understand.
- Never be vague or overly general.
- For non-math questions, still break down the reasoning step-by-step.
- If something is missing, make a reasonable assumption and clearly state it.
- Do NOT refuse normal school questions.
- Keep explanations student-friendly.
- Respond in ${languageName} unless the student's question clearly asks for another language.
- The current response mode is ${preferDirectAnswer ? 'direct answer only' : 'full explanation'}.
`

  const requestBody = JSON.stringify({
    model: OPENROUTER_MODEL,
    messages: [
      {
        role: 'system',
        content: SYSTEM_PROMPT,
      },
      ...contextMessages,
    ],
    temperature: 0.7,
  })

  try {
    const makeRequest = async () =>
      fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          'HTTP-Referer': OPENROUTER_APP_URL,
          'X-Title': OPENROUTER_APP_NAME,
        },
        body: requestBody,
      })

    let response = await makeRequest()

    if (response.status === 429) {
      await wait(1200)
      response = await makeRequest()
      if (response.status === 429) {
        return OPENAI_RATE_LIMIT_MESSAGE
      }
    }

    if (!response.ok) {
      try {
        const errorData = (await response.json()) as {
          error?: { message?: string }
          message?: string
        }
        console.error('OpenRouter request failed', response.status, errorData?.error?.message || errorData?.message || '')
      } catch {
        console.error('OpenRouter request failed', response.status)
      }
      return OPENAI_REQUEST_FAILED_MESSAGE
    }

    const data = (await response.json()) as {
      choices?: Array<{
        message?: {
          content?: string
        }
      }>
    }

    return data?.choices?.[0]?.message?.content || 'No response received.'
  } catch (error) {
    console.error(error)
    return OPENAI_UNAVAILABLE_MESSAGE
  }
}

async function requestTutorAnswer({
  history,
  labels,
  language,
}: {
  history: ChatMessage[]
  labels: { explanation: string; steps: string; final: string; languageName: string }
  language: Language
}) {
  const userInput = [...history].reverse().find((message) => message.role === 'user')?.text?.trim() ?? ''
  const previousUserMessage = [...history]
    .reverse()
    .find((message) => message.role === 'user' && message.text.trim() !== userInput)

  if (!userInput) {
    throw new Error('Missing user input')
  }

  const directAnswerPreference = getDirectAnswerPreference(userInput, previousUserMessage?.text, language)

  if (directAnswerPreference.localDirectAnswer) {
    return directAnswerPreference.localDirectAnswer
  }

  const scopedHistory =
    directAnswerPreference.preferDirectAnswer &&
    !directAnswerPreference.usePreviousQuestion
      ? history.filter((message) => message.role === 'user' && message.text.trim() === userInput).slice(-1)
      : history

  const text = (await callOpenAI(scopedHistory, labels.languageName, directAnswerPreference.preferDirectAnswer)).trim()

  if (
    text === OPENAI_MISSING_KEY_MESSAGE ||
    text === OPENAI_RATE_LIMIT_MESSAGE ||
    text === OPENAI_REQUEST_FAILED_MESSAGE ||
    text === OPENAI_UNAVAILABLE_MESSAGE
  ) {
    throw new Error(text)
  }

  if (!text) {
    throw new Error('Missing assistant content')
  }

  if (directAnswerPreference.preferDirectAnswer) {
    return extractDirectAnswer(text, labels)
  }

  if (text.includes(labels.explanation) && text.includes(labels.steps) && text.includes(labels.final)) {
    return text
  }

  return [
    `${labels.explanation}:`,
    text,
    '',
    `${labels.steps}:`,
    '1. Review the explanation above.',
    '2. Apply it directly to the question.',
    '',
    `${labels.final}:`,
    text,
  ].join('\n')
}

function buildLocalFallback(
  question: string,
  language: Language,
  t: Translate,
  history: ChatMessage[],
) {
  const phrases = localTutorPhrases[language]
  const previousUserMessage = [...history]
    .reverse()
    .find((message) => message.role === 'user' && message.text !== question)
  const directAnswerPreference = getDirectAnswerPreference(question, previousUserMessage?.text, language)
  const usePreviousQuestion = directAnswerPreference.usePreviousQuestion
  const activeQuestion = directAnswerPreference.activeQuestion
  const preferDirectAnswer = directAnswerPreference.preferDirectAnswer

  if (directAnswerPreference.localDirectAnswer) {
    return directAnswerPreference.localDirectAnswer
  }

  const solution = solveSimpleMath(activeQuestion)
  if (!solution) {
    const normalized = activeQuestion.toLowerCase()
    const definitionTerm = extractDefinitionTerm(activeQuestion)

    if (definitionTerm) {
      const definition = lookupDefinition(definitionTerm, language)

      if (preferDirectAnswer) {
        return definition.answer
      }

      return [
        `${t('chatExplanation')}:`,
        usePreviousQuestion ? phrases.followUpExplanation : phrases.definitionExplanation,
        usePreviousQuestion && previousUserMessage ? `${phrases.followUp} ${previousUserMessage.text}` : '',
        definition.context ? `${phrases.assumptionPrefix} "${definition.context}".` : '',
        '',
        `${t('chatSteps')}:`,
        ...phrases.definitionSteps.map((step, index) => `${index + 1}. ${step}`),
        '',
        `${t('chatFinal')}:`,
        definition.answer,
      ]
        .filter(Boolean)
        .join('\n')
    }

    const topic = /(essay|paragraph|theme|thesis|reading|book|poem|summary|character)/i.test(normalized)
      ? 'writing'
      : /(history|war|revolution|government|civilization|president|empire)/i.test(normalized)
        ? 'history'
        : /(math|algebra|geometry|equation|fraction|calculate|solve|physics|chemistry|biology|science|cell|force|energy|graph|english|grammar|language|literature|vocabulary)/i.test(
              normalized,
            )
          ? 'stem'
          : 'general'

    const topicMap = {
      stem: {
        explanation: phrases.stemExplanation,
        steps: phrases.stemSteps,
        finalAnswer: phrases.stemFinal,
      },
      writing: {
        explanation: phrases.writingExplanation,
        steps: phrases.writingSteps,
        finalAnswer: phrases.writingFinal,
      },
      history: {
        explanation: phrases.historyExplanation,
        steps: phrases.historySteps,
        finalAnswer: phrases.historyFinal,
      },
      general: {
        explanation: phrases.generalExplanation,
        steps: phrases.generalSteps,
        finalAnswer: phrases.generalFinal,
      },
    } as const

    const selected = topicMap[topic]

    if (preferDirectAnswer) {
      return selected.finalAnswer
    }

    return [
      `${t('chatExplanation')}:`,
      usePreviousQuestion ? phrases.followUpExplanation : selected.explanation,
      usePreviousQuestion && previousUserMessage ? `${phrases.followUp} ${previousUserMessage.text}` : '',
      `${phrases.assumptionPrefix} "${activeQuestion.trim()}".`,
      '',
      `${t('chatSteps')}:`,
      ...selected.steps.map((step, index) => `${index + 1}. ${step}`),
      '',
      `${t('chatFinal')}:`,
      selected.finalAnswer,
    ]
      .filter(Boolean)
      .join('\n')
  }

  if (preferDirectAnswer) {
    return String(solution.result)
  }

  return [
    `${t('chatExplanation')}:`,
    usePreviousQuestion ? phrases.followUpMathExplanation : t('mathFallbackExplanation'),
    usePreviousQuestion && previousUserMessage ? `${phrases.followUp} ${previousUserMessage.text}` : '',
    '',
    `${t('chatSteps')}:`,
    `1. ${usePreviousQuestion ? phrases.followUpMathStepOne : t('mathFallbackStepOne')} ${solution.expression}`,
    `2. ${usePreviousQuestion ? phrases.followUpMathStepTwo : t('mathFallbackStepTwo')}`,
    '',
    `${t('chatFinal')}:`,
    `${usePreviousQuestion ? phrases.followUpMathFinal : ''}${solution.result}`,
  ].join('\n')
}

const localTutorPhrases = {
  en: {
    assumptionPrefix: 'I am making a reasonable tutoring assumption based on',
    followUp: 'I also considered your earlier question:',
    followUpExplanation:
      'You asked for a direct follow-up answer, so I used the previous homework question as the context for this response.',
    definitionExplanation:
      'This looks like a definition question, so the best answer is a direct meaning written in simple student-friendly language.',
    definitionSteps: [
      'Identify the word or concept being defined.',
      'Give the plain meaning in simple language.',
      'Add a short detail so the definition is easier to remember.',
    ],
    followUpMathExplanation:
      'You asked for only the answer, so I used your previous math question and solved it directly.',
    followUpMathStepOne: 'Use the previous expression:',
    followUpMathStepTwo: 'Evaluate the arithmetic carefully to get the final total.',
    followUpMathFinal: 'The answer is ',
    stemExplanation:
      'This looks like a STEM homework question, so the safest way forward is to identify what is known, choose the correct formula or concept, and solve in a clear order.',
    stemSteps: [
      'Write down the known values, terms, or conditions from the problem.',
      'Choose the rule, formula, or scientific idea that best matches what you need to find.',
      'Work through the solution one step at a time and check whether the result is reasonable.',
    ],
    stemFinal:
      'Use the structure above on your exact homework numbers or prompt, and you should get a correct step-by-step answer. If you share the full problem statement, the solution can be made more precise.',
    writingExplanation:
      'This looks like a writing or reading task, so a strong answer should state the main idea clearly, support it with evidence, and explain why that evidence matters.',
    writingSteps: [
      'Restate the question in simple words so the goal is clear.',
      'Choose the strongest idea, quote, or example that supports your answer.',
      'Turn that evidence into a short explanation that directly answers the assignment.',
    ],
    writingFinal:
      'A good final response should include a clear claim, one or two supporting details, and a brief explanation that ties everything back to the question.',
    historyExplanation:
      'This looks like a history or social studies question, so the answer should identify the event, explain its context, and connect it to its impact.',
    historySteps: [
      'Name the event, person, or issue the question is asking about.',
      'Explain the important context or causes around it.',
      'Conclude with why it mattered or what changed because of it.',
    ],
    historyFinal:
      'Your final answer should briefly explain what happened, why it happened, and why it was important.',
    generalExplanation:
      'This appears to be a general homework question. I can still help by making a reasonable assumption and giving you a clear way to answer it.',
    generalSteps: [
      'Identify what the teacher is most likely asking you to explain or solve.',
      'Organize the answer into the simplest sequence possible.',
      'Finish with the clearest conclusion or result you can state from the available information.',
    ],
    generalFinal:
      'Based on the question as written, the best next step is to answer directly, keep the reasoning simple, and refine it once you have the full assignment wording.',
  },
  es: {
    assumptionPrefix: 'Estoy haciendo una suposición razonable de tutoría basada en',
    followUp: 'También tuve en cuenta tu pregunta anterior:',
    followUpExplanation:
      'Pediste una respuesta directa de seguimiento, así que usé la pregunta anterior como contexto para responder.',
    definitionExplanation:
      'Parece una pregunta de definición, así que la mejor respuesta es dar el significado de forma directa y fácil de entender.',
    definitionSteps: [
      'Identifica la palabra o el concepto que se debe definir.',
      'Da el significado con palabras simples.',
      'Añade un detalle corto para que sea más fácil recordarlo.',
    ],
    followUpMathExplanation:
      'Pediste solo la respuesta, así que usé tu pregunta anterior de matemáticas y la resolví directamente.',
    followUpMathStepOne: 'Usa la expresión anterior:',
    followUpMathStepTwo: 'Evalúa la operación con cuidado para obtener el resultado final.',
    followUpMathFinal: 'La respuesta es ',
    stemExplanation:
      'Parece una pregunta de ciencias o matemáticas, así que lo más seguro es identificar lo conocido, elegir la fórmula o el concepto correcto y resolver con un orden claro.',
    stemSteps: [
      'Anota los datos, términos o condiciones que ya aparecen en el problema.',
      'Elige la fórmula, regla o idea científica que mejor se relaciona con lo que debes encontrar.',
      'Resuelve paso a paso y comprueba si el resultado tiene sentido.',
    ],
    stemFinal:
      'Usa esa estructura con los números exactos o el enunciado completo y tendrás una respuesta paso a paso más precisa.',
    writingExplanation:
      'Parece una tarea de lectura o escritura, así que una buena respuesta debe presentar la idea principal, apoyarla con evidencia y explicar por qué esa evidencia importa.',
    writingSteps: [
      'Reformula la pregunta con palabras simples para aclarar el objetivo.',
      'Elige la mejor idea, cita o ejemplo para apoyar tu respuesta.',
      'Convierte esa evidencia en una explicación breve que responda directamente a la tarea.',
    ],
    writingFinal:
      'Una buena respuesta final debe incluir una idea clara, uno o dos detalles de apoyo y una explicación breve conectada con la pregunta.',
    historyExplanation:
      'Parece una pregunta de historia o estudios sociales, así que la respuesta debe identificar el evento, explicar su contexto y conectarlo con su impacto.',
    historySteps: [
      'Nombra el evento, la persona o el tema por el que pregunta el ejercicio.',
      'Explica el contexto o las causas importantes.',
      'Concluye con por qué fue importante o qué cambió a partir de eso.',
    ],
    historyFinal:
      'Tu respuesta final debe explicar brevemente qué pasó, por qué pasó y por qué fue importante.',
    generalExplanation:
      'Parece una pregunta general de tarea. Aun así puedo ayudarte haciendo una suposición razonable y dándote una forma clara de responder.',
    generalSteps: [
      'Identifica qué es lo más probable que el profesor quiera que expliques o resuelvas.',
      'Organiza la respuesta en la secuencia más simple posible.',
      'Termina con la conclusión o resultado más claro que puedas obtener con la información disponible.',
    ],
    generalFinal:
      'Con la pregunta tal como está escrita, lo mejor es responder de forma directa, mantener el razonamiento simple y ajustar la respuesta cuando tengas el enunciado completo.',
  },
  fr: {
    assumptionPrefix: 'Je fais une hypothèse raisonnable de tutorat à partir de',
    followUp: 'J’ai aussi pris en compte votre question précédente :',
    followUpExplanation:
      'Vous avez demandé une réponse directe de suivi, donc j’ai utilisé la question précédente comme contexte pour répondre.',
    definitionExplanation:
      'Cela ressemble à une question de définition, donc la meilleure réponse est de donner le sens directement avec des mots simples.',
    definitionSteps: [
      'Identifiez le mot ou le concept à définir.',
      'Donnez le sens avec des mots simples.',
      'Ajoutez un détail court pour mieux retenir la définition.',
    ],
    followUpMathExplanation:
      'Vous vouliez seulement la réponse, donc j’ai repris votre question précédente de maths et je l’ai résolue directement.',
    followUpMathStepOne: 'Utilisez l’expression précédente :',
    followUpMathStepTwo: 'Évaluez soigneusement l’opération pour obtenir le résultat final.',
    followUpMathFinal: 'La réponse est ',
    stemExplanation:
      'Cela ressemble à une question de maths ou de sciences. Le plus fiable est donc d’identifier les données connues, de choisir la bonne formule ou le bon concept, puis de résoudre dans un ordre clair.',
    stemSteps: [
      'Notez les données, termes ou conditions déjà présents dans l’énoncé.',
      'Choisissez la formule, la règle ou l’idée scientifique qui correspond le mieux à ce qu’il faut trouver.',
      'Résolvez étape par étape puis vérifiez si le résultat est cohérent.',
    ],
    stemFinal:
      'En appliquant cette structure à vos valeurs exactes ou à l’énoncé complet, vous obtiendrez une réponse plus précise étape par étape.',
    writingExplanation:
      'Cela ressemble à une tâche de lecture ou d’écriture. Une bonne réponse doit donc présenter l’idée principale, l’appuyer par une preuve, puis expliquer pourquoi cette preuve est importante.',
    writingSteps: [
      'Reformulez la question avec des mots simples pour clarifier l’objectif.',
      'Choisissez l’idée, la citation ou l’exemple le plus fort pour soutenir votre réponse.',
      'Transformez cette preuve en une explication courte qui répond directement au devoir.',
    ],
    writingFinal:
      'Une bonne réponse finale doit contenir une idée claire, un ou deux détails d’appui et une brève explication liée à la question.',
    historyExplanation:
      'Cela ressemble à une question d’histoire ou de sciences sociales. La réponse doit donc identifier l’événement, expliquer son contexte et le relier à son impact.',
    historySteps: [
      'Nommez l’événement, la personne ou le sujet visé par la question.',
      'Expliquez le contexte ou les causes importantes.',
      'Concluez par ce qui a changé ou pourquoi cela a compté.',
    ],
    historyFinal:
      'Votre réponse finale doit expliquer brièvement ce qui s’est passé, pourquoi cela s’est produit et pourquoi c’était important.',
    generalExplanation:
      'Cela ressemble à une question générale de devoir. Je peux quand même vous aider en faisant une hypothèse raisonnable et en proposant une manière claire d’y répondre.',
    generalSteps: [
      'Identifiez ce que l’enseignant demande probablement d’expliquer ou de résoudre.',
      'Organisez la réponse dans l’ordre le plus simple possible.',
      'Terminez par la conclusion ou le résultat le plus clair que vous pouvez donner avec les informations disponibles.',
    ],
    generalFinal:
      'Avec la question telle qu’elle est formulée, le mieux est de répondre directement, de garder un raisonnement simple, puis d’affiner une fois l’énoncé complet disponible.',
  },
} as const

function shouldUsePreviousQuestion(currentQuestion: string, previousQuestion?: string) {
  if (!previousQuestion) {
    return false
  }

  const normalized = currentQuestion.toLowerCase().trim()
  return /(just\s*(want|need)?\s*(the)?\s*answer|just\s*(want|need)?\s*(the)?\s*ans|only\s*(the)?\s*answer|answer\s*only|give me (just )?the answer|what'?s the answer|i just ant the ans|just ant the ans)/i.test(
    normalized,
  )
}

function shouldRespondDirectly(currentQuestion: string, previousQuestion?: string) {
  return getDirectAnswerPreference(currentQuestion, previousQuestion, 'en').preferDirectAnswer
}

function getDirectAnswerPreference(
  currentQuestion: string,
  previousQuestion: string | undefined,
  language: Language,
) {
  const usePreviousQuestion = shouldUsePreviousQuestion(currentQuestion, previousQuestion)
  const activeQuestion = usePreviousQuestion && previousQuestion ? previousQuestion : currentQuestion
  const trimmed = activeQuestion.trim()

  if (!trimmed) {
    return {
      usePreviousQuestion,
      activeQuestion,
      preferDirectAnswer: false,
      localDirectAnswer: null as string | null,
    }
  }

  const mathSolution = solveSimpleMath(trimmed)
  if (mathSolution) {
    return {
      usePreviousQuestion,
      activeQuestion,
      preferDirectAnswer: true,
      localDirectAnswer: String(mathSolution.result),
    }
  }

  const definitionTerm = extractDefinitionTerm(trimmed)
  if (definitionTerm) {
    return {
      usePreviousQuestion,
      activeQuestion,
      preferDirectAnswer: true,
      localDirectAnswer: lookupDefinition(definitionTerm, language).answer,
    }
  }

  return {
    usePreviousQuestion,
    activeQuestion,
    preferDirectAnswer: usePreviousQuestion || isSimpleFactQuestion(trimmed),
    localDirectAnswer: null as string | null,
  }
}

function extractDirectAnswer(
  text: string,
  labels: { explanation: string; steps: string; final: string; languageName: string },
) {
  const finalSectionPatterns = [
    new RegExp(`${escapeRegExp(labels.final)}\\s*:?[\\s\\n]*([\\s\\S]+)$`, 'i'),
    /final answer\s*:?\s*([\s\S]+)$/i,
    /respuesta final\s*:?\s*([\s\S]+)$/i,
    /réponse finale\s*:?\s*([\s\S]+)$/i,
  ]

  for (const pattern of finalSectionPatterns) {
    const match = text.match(pattern)
    const value = match?.[1]?.trim()
    if (value) {
      return value
    }
  }

  return text
    .replace(/^\s*[-*]\s*/gm, '')
    .replace(/```[\s\S]*?```/g, '')
    .trim()
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function extractDefinitionTerm(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  const patterns = [
    /^(?:hey\s+)?(?:w+hat|hat|what)\s+is\s+(.+)$/,
    /^what\s+does\s+(.+)\s+mean$/,
    /^meaning\s+of\s+(.+)$/,
    /^define\s+(.+)$/,
  ]

  for (const pattern of patterns) {
    const match = normalized.match(pattern)
    if (match?.[1]) {
      return match[1].trim()
    }
  }

  return null
}

function isSimpleFactQuestion(input: string) {
  const normalized = input
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s?'-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!normalized) {
    return false
  }

  if (/(explain|why|show|steps|solve|compare|analyze|proof|essay|write|discuss)/i.test(normalized)) {
    return false
  }

  const wordCount = normalized.split(' ').filter(Boolean).length
  if (wordCount > 10) {
    return false
  }

  return /^(what|who|when|where|which|whose|how many|how much)\b/.test(normalized)
}

function lookupDefinition(term: string, language: Language) {
  const cleanedTerm = term.replace(/\b(an|a|the)\b/g, '').trim()
  const key = cleanedTerm.toLowerCase()

  const definitions = {
    english: {
      en: 'English is a language and also a school subject that focuses on reading, writing, grammar, vocabulary, and literature.',
      es: 'El inglés es un idioma y también una materia escolar que se centra en lectura, escritura, gramática, vocabulario y literatura.',
      fr: "L'anglais est une langue et aussi une matière scolaire qui porte sur la lecture, l'écriture, la grammaire, le vocabulaire et la littérature.",
    },
    blood: {
      en: 'Blood is the red liquid in the body that carries oxygen, nutrients, and waste materials to and from different parts of the body.',
      es: 'La sangre es el líquido rojo del cuerpo que transporta oxígeno, nutrientes y desechos hacia y desde las diferentes partes del cuerpo.',
      fr: 'Le sang est le liquide rouge du corps qui transporte l’oxygène, les nutriments et les déchets vers et depuis les différentes parties du corps.',
    },
    photosynthesis: {
      en: 'Photosynthesis is the process plants use to make food from sunlight, water, and carbon dioxide.',
      es: 'La fotosíntesis es el proceso que usan las plantas para producir alimento a partir de la luz solar, el agua y el dióxido de carbono.',
      fr: 'La photosynthèse est le processus par lequel les plantes fabriquent leur nourriture à partir de la lumière du soleil, de l’eau et du dioxyde de carbone.',
    },
    democracy: {
      en: 'Democracy is a system of government in which the people choose their leaders, usually by voting.',
      es: 'La democracia es un sistema de gobierno en el que las personas eligen a sus líderes, normalmente mediante votación.',
      fr: 'La démocratie est un système de gouvernement dans lequel le peuple choisit ses dirigeants, généralement par le vote.',
    },
    homework: {
      en: 'Homework is school work that a student is asked to complete outside of class, usually at home.',
      es: 'La tarea es el trabajo escolar que un estudiante debe completar fuera de clase, normalmente en casa.',
      fr: 'Les devoirs sont le travail scolaire qu’un élève doit faire en dehors de la classe, généralement à la maison.',
    },
  } as const

  const directMatch = definitions[key as keyof typeof definitions]
  if (directMatch) {
    return {
      answer: directMatch[language],
      context: cleanedTerm,
    }
  }

  const capitalizedTerm = cleanedTerm
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  const genericAnswers = {
    en: `${capitalizedTerm} is the term or concept your question is asking about. In simple words, it refers to the main idea or meaning of "${cleanedTerm}".`,
    es: `${capitalizedTerm} es el término o concepto por el que pregunta tu ejercicio. En palabras simples, se refiere a la idea principal o al significado de "${cleanedTerm}".`,
    fr: `${capitalizedTerm} est le terme ou le concept visé par votre question. En mots simples, cela correspond à l’idée principale ou au sens de "${cleanedTerm}".`,
  }

  return {
    answer: genericAnswers[language],
    context: cleanedTerm,
  }
}

function solveSimpleMath(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[×x]/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\^/g, '**')
    .replace(/[^0-9+\-*/().\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  if (!cleaned || !/[+\-*/]/.test(cleaned) || !/^[\d\s+\-*/().*]+$/.test(cleaned) || /\*{3,}/.test(cleaned)) {
    return null
  }

  try {
    const result = Function(`"use strict"; return (${cleaned})`)() as number
    if (typeof result !== 'number' || !Number.isFinite(result)) {
      return null
    }

    return {
      expression: cleaned,
      result: Number.isInteger(result) ? result : Number(result.toFixed(6)),
    }
  } catch {
    return null
  }
}

export default App
