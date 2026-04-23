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
  completionEntries: CompletionEntry[]
  challengeState: ChallengeState
}

type TranslationKey = keyof typeof translations.en
type Translate = (key: TranslationKey, variables?: Record<string, string | number>) => string

const APP_STATE_KEY = 'stepwise.appState.v4'
const DAILY_GOAL = 5
const DEFAULT_USERNAME = 'User'
const MAX_RECENT_SEARCHES = 10
const MAX_CHAT_CONTEXT = 12
const OPENAI_BASE_URL = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined)?.trim() || 'https://api.openai.com/v1'
const OPENAI_API_KEY = (import.meta.env.VITE_OPENAI_API_KEY as string | undefined)?.trim() || ''
const OPENAI_MODEL = (import.meta.env.VITE_OPENAI_MODEL as string | undefined)?.trim() || 'gpt-4o-mini'

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
  const [appState, setAppState] = useState<AppState>(() => readInitialAppState())
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
    window.localStorage.setItem(APP_STATE_KEY, JSON.stringify(state))
  }, [state])

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
        question: cleaned,
        language: state.language,
        labels: getSectionLabels(state.language, t),
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
      const fallbackText = buildLocalFallback(cleaned, state.language, t)
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: fallbackText ?? t('apiError'),
        timestamp: Date.now(),
      }

      updateAppState((current) => ({
        ...current,
        chatHistory: [...current.chatHistory, assistantMessage],
      }))

      if (fallbackText) {
        registerSolvedQuestion(userMessage.id, cleaned, launch)
      }
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

  function clearProgress() {
    updateAppState((current) => ({
      ...current,
      chatHistory: [],
      completionEntries: [],
      challengeState: initialChallengeState,
    }))
    setHomeworkNotice('')
    setHomeNotice('')
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
                </section>

                <section className="panel-card settings-panel settings-panel--wide">
                  <div className="profile-actions">
                    <button type="button" className="ghost-button" onClick={clearSearches}>{t('clearSearches')}</button>
                    <button type="button" className="ghost-button" onClick={clearProgress}>{t('clearProgress')}</button>
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

async function requestTutorAnswer({
  history,
  labels,
}: {
  history: ChatMessage[]
  labels: { explanation: string; steps: string; final: string; languageName: string }
}) {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing API key')
  }

  const systemPrompt = [
    'You are an AI tutor. Always:',
    '- Answer the question',
    '- Explain clearly',
    '- Show steps',
    '- Give final answer',
    '',
    "Never refuse simple questions like '1+1'.",
    'If unclear, make a reasonable assumption.',
    '',
    `Respond in ${labels.languageName}.`,
    `Use exactly this structure: ${labels.explanation}: ... ${labels.steps}: ... ${labels.final}: ...`,
  ].join('\n')

  const response = await fetch(`${OPENAI_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: OPENAI_MODEL,
      temperature: 0.4,
      messages: [
        { role: 'system', content: systemPrompt },
        ...history.slice(-MAX_CHAT_CONTEXT).map((message) => ({
          role: message.role,
          content: message.text,
        })),
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`API request failed with ${response.status}`)
  }

  const data = (await response.json()) as {
    choices?: Array<{
      message?: {
        content?: string | Array<{ type?: string; text?: string }>
      }
    }>
  }

  const content = data.choices?.[0]?.message?.content
  const text = Array.isArray(content)
    ? content.map((item) => item.text ?? '').join('').trim()
    : String(content ?? '').trim()

  if (!text) {
    throw new Error('Missing assistant content')
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

function buildLocalFallback(question: string, language: Language, t: Translate) {
  const solution = solveSimpleMath(question)
  if (!solution) {
    return null
  }

  return [
    `${t('chatExplanation')}:`,
    t('mathFallbackExplanation'),
    '',
    `${t('chatSteps')}:`,
    `1. ${t('mathFallbackStepOne')} ${solution.expression}`,
    `2. ${t('mathFallbackStepTwo')}`,
    '',
    `${t('chatFinal')}:`,
    `${solution.result}`,
  ].join('\n')
}

function solveSimpleMath(input: string) {
  const cleaned = input
    .toLowerCase()
    .replace(/[×x]/g, '*')
    .replace(/÷/g, '/')
    .replace(/,/g, '.')
    .replace(/\^/g, '**')
    .replace(/what is|what's|calculate|solve|please|can you solve|cu[aá]nto es|calcula|resuelve|combien fait|calcule|résous|quel est/gi, ' ')
    .replace(/[=?]/g, ' ')
    .trim()

  if (!cleaned || !/^[\d\s+\-*/().*]+$/.test(cleaned) || /\*{3,}/.test(cleaned)) {
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
