import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenText,
  ChartNoAxesColumn,
  ChevronRight,
  Flame,
  Home,
  Languages,
  Menu,
  MoonStar,
  Search,
  Sparkles,
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
  summary: string
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

type TranslationKey = keyof typeof translations.en

type Translate = (key: TranslationKey, variables?: Record<string, string | number>) => string

const STORAGE_KEYS = {
  recentSearches: 'stepwise.recentSearches',
  completedItems: 'stepwise.completedItems',
  challengeState: 'stepwise.challengeState',
  theme: 'stepwise.theme',
  language: 'stepwise.language',
  username: 'stepwise.username',
} as const

const DAILY_GOAL = 5
const DEFAULT_USERNAME = 'User'

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
    chatSteps: 'Step-by-step solution',
    chatFinal: 'Final Answer',
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
    chatSteps: 'Solución paso a paso',
    chatFinal: 'Respuesta final',
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
    chatSteps: 'Solution étape par étape',
    chatFinal: 'Réponse finale',
  },
} as const

const responsePhrases = {
  en: {
    clarification:
      'I need a little more detail before I can solve this accurately. Please share the full homework question or the exact part that is confusing.',
    mathExplanation:
      'This looks like a math or science task, so the key is to identify the known information, choose the right formula or principle, and solve carefully in order.',
    generalExplanation:
      'This looks more conceptual, so I will explain the main idea first and then organize the answer clearly.',
    mathSteps: [
      'List what the problem gives you and identify the unknown.',
      'Choose the formula, rule, or concept that connects the known values to the answer.',
      'Work through the solution step by step and check whether the result makes sense.',
    ],
    generalSteps: [
      'Restate the question in simple words so the goal is clear.',
      'Identify the key idea, evidence, or structure needed for a strong response.',
      'Turn that understanding into a complete answer with the clearest explanation first.',
    ],
    finalMath:
      'Apply those steps to your exact numbers or worksheet details, and I can verify the final result with you if you send them next.',
    finalGeneral:
      'Use that structure for your response, and I can refine it further if you share your draft or teacher prompt.',
    followUp: 'Using context from your earlier question:',
  },
  es: {
    clarification:
      'Necesito un poco más de detalle para resolver esto con precisión. Comparte la pregunta completa o la parte exacta que te confunde.',
    mathExplanation:
      'Parece una tarea de matemáticas o ciencias, así que lo importante es identificar los datos, elegir la fórmula o el principio correcto y resolver con orden.',
    generalExplanation:
      'Parece una pregunta más conceptual, así que primero explicaré la idea principal y luego organizaré la respuesta con claridad.',
    mathSteps: [
      'Anota la información dada e identifica lo desconocido.',
      'Elige la fórmula, regla o concepto que conecta los datos con la respuesta.',
      'Resuelve paso a paso y comprueba si el resultado tiene sentido.',
    ],
    generalSteps: [
      'Reformula la pregunta con palabras simples para aclarar el objetivo.',
      'Identifica la idea clave, evidencia o estructura necesaria para una buena respuesta.',
      'Convierte eso en una respuesta completa empezando por la explicación más clara.',
    ],
    finalMath:
      'Aplica esos pasos a tus números exactos o al contenido de tu hoja, y puedo verificar el resultado final contigo después.',
    finalGeneral:
      'Usa esa estructura para tu respuesta y puedo mejorarla más si me compartes tu borrador o la consigna del profesor.',
    followUp: 'Usando contexto de tu pregunta anterior:',
  },
  fr: {
    clarification:
      'J’ai besoin d’un peu plus de détails pour résoudre cela correctement. Partagez la question complète ou la partie exacte qui vous bloque.',
    mathExplanation:
      'Cela ressemble à un exercice de maths ou de sciences : il faut donc identifier les données, choisir la bonne formule ou le bon principe, puis résoudre dans l’ordre.',
    generalExplanation:
      'Cela semble plus conceptuel, donc je vais d’abord expliquer l’idée principale puis organiser la réponse clairement.',
    mathSteps: [
      'Notez les informations données et identifiez l’inconnue.',
      'Choisissez la formule, la règle ou le concept qui relie les données à la réponse.',
      'Résolvez étape par étape et vérifiez si le résultat est cohérent.',
    ],
    generalSteps: [
      'Reformulez la question avec des mots simples pour clarifier l’objectif.',
      'Repérez l’idée clé, la preuve ou la structure nécessaire à une bonne réponse.',
      'Transformez cela en une réponse complète en commençant par l’explication la plus claire.',
    ],
    finalMath:
      'Appliquez ces étapes à vos nombres exacts ou aux détails de votre feuille, et je pourrai vérifier le résultat final ensuite.',
    finalGeneral:
      'Utilisez cette structure pour votre réponse, et je peux l’améliorer davantage si vous partagez votre brouillon ou la consigne.',
    followUp: 'En utilisant le contexte de votre question précédente :',
  },
} as const

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
  const [screen, setScreen] = useState<Screen>('home')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useLocalStorageState<Theme>(STORAGE_KEYS.theme, 'dark')
  const [language, setLanguage] = useLocalStorageState<Language>(STORAGE_KEYS.language, 'en')
  const [username, setUsername] = useLocalStorageState<string>(STORAGE_KEYS.username, '')
  const [recentSearches, setRecentSearches] = useLocalStorageState<SearchEntry[]>(STORAGE_KEYS.recentSearches, [])
  const [completedItems, setCompletedItems] = useLocalStorageState<CompletionEntry[]>(STORAGE_KEYS.completedItems, [])
  const [challengeState, setChallengeState] = useLocalStorageState<ChallengeState>(STORAGE_KEYS.challengeState, initialChallengeState)
  const [searchInput, setSearchInput] = useState('')
  const [homeNotice, setHomeNotice] = useState('')
  const [homeworkInput, setHomeworkInput] = useState('')
  const [homeworkNotice, setHomeworkNotice] = useState('')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [queuedLaunch, setQueuedLaunch] = useState<LaunchContext | null>(null)
  const [profileName, setProfileName] = useState(username)

  const t = useTranslator(language)
  const displayName = username.trim() || DEFAULT_USERNAME
  const messagesEndRef = useRef<HTMLDivElement | null>(null)

  const challenges = useMemo(() => getChallenges(t), [t])
  const subjects = useMemo(() => getSubjects(t), [t])
  const todayKey = dayKey(Date.now())
  const todaySolved = completedItems.filter((item) => item.dayKey === todayKey).length
  const totalSolved = completedItems.length
  const totalPoints = completedItems.reduce((sum, item) => sum + item.points, 0)
  const streak = calculateStreak(completedItems)
  const progressPercent = Math.min(100, (todaySolved / DAILY_GOAL) * 100)
  const unseenCount = challenges.filter((challenge) => challenge.startsNew && !challengeState[challenge.id]?.interacted).length

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setProfileName(username)
  }, [username])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isLoading])

  useEffect(() => {
    if (screen !== 'homework' || queuedLaunch === null || isLoading) {
      return
    }

    const launch = queuedLaunch
    setQueuedLaunch(null)
    sendHomeworkMessage(launch.prompt, launch)
  }, [screen, queuedLaunch, isLoading])

  function openScreen(next: Screen) {
    setScreen(next)
    setSidebarOpen(false)
    setHomeNotice('')
    setHomeworkNotice('')
  }

  function storeSearch(query: string) {
    setRecentSearches((current) => {
      const entry: SearchEntry = { id: createId(), query, timestamp: Date.now() }
      return [entry, ...current.filter((item) => item.query.toLowerCase() !== query.toLowerCase())].slice(0, 10)
    })
  }

  function launchHomework(prompt: string, launch?: Omit<LaunchContext, 'prompt'>) {
    const cleaned = prompt.trim()

    if (!cleaned) {
      setHomeNotice(t('searchValidation'))
      return
    }

    if (launch?.source === 'search') {
      storeSearch(cleaned)
    }

    setHomeNotice('')
    setHomeworkInput(cleaned)
    setQueuedLaunch({
      prompt: cleaned,
      source: launch?.source ?? 'quick-action',
      rewardPoints: launch?.rewardPoints,
      completionKey: launch?.completionKey,
      challengeId: launch?.challengeId,
      sourceLabel: launch?.sourceLabel,
    })
    setScreen('homework')
    setSidebarOpen(false)
  }

  function handleHomeSearchSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    launchHomework(searchInput, { source: 'search', rewardPoints: 10, sourceLabel: searchInput.trim() || t('navHomework') })
    setSearchInput('')
  }

  function handleChallengeClick(challenge: ChallengeDefinition) {
    setChallengeState((current) => ({
      ...current,
      [challenge.id]: { ...current[challenge.id], interacted: true },
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

  function sendHomeworkMessage(rawInput: string, launch?: LaunchContext) {
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

    const nextMessages = [...messages, userMessage]
    setMessages(nextMessages)
    setHomeworkInput('')
    setHomeworkNotice('')
    setIsLoading(true)

    const responseLanguage = detectInputLanguage(cleaned, language)

    window.setTimeout(() => {
      const aiResult = generateAiResponse(cleaned, responseLanguage, nextMessages, t)
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: aiResult,
        timestamp: Date.now(),
      }

      setMessages((current) => [...current, assistantMessage])
      setIsLoading(false)
      recordCompletion(cleaned, userMessage.id, launch)
    }, 1000 + Math.floor(Math.random() * 800))
  }

  function recordCompletion(question: string, messageId: string, launch?: LaunchContext) {
    const completionKey = launch?.completionKey ?? `message:${messageId}`

    setCompletedItems((current) => {
      if (current.some((item) => item.completionKey === completionKey)) {
        return current
      }

      return [
        {
          id: createId(),
          completionKey,
          question,
          completedAt: Date.now(),
          dayKey: dayKey(Date.now()),
          points: launch?.rewardPoints ?? 10,
          summary: question,
          sourceLabel: launch?.sourceLabel ?? question,
        },
        ...current,
      ]
    })

    if (launch?.source === 'challenge' && launch.challengeId) {
      setChallengeState((current) => ({
        ...current,
        [launch.challengeId as ChallengeId]: {
          ...current[launch.challengeId as ChallengeId],
          interacted: true,
          completed: true,
        },
      }))
    }
  }

  function saveProfile() {
    setUsername(profileName.trim())
  }

  function clearProgress() {
    setCompletedItems([])
    setChallengeState(initialChallengeState)
  }

  function clearSearches() {
    setRecentSearches([])
  }

  const navigation = [
    { id: 'home' as const, label: t('navHome'), icon: Home },
    { id: 'homework' as const, label: t('navHomework'), icon: BookOpenText },
    { id: 'challenges' as const, label: t('navChallenges'), icon: Trophy },
    { id: 'progress' as const, label: t('navProgress'), icon: ChartNoAxesColumn },
    { id: 'profile' as const, label: t('navProfile'), icon: UserRound },
  ]

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
              <p>⭐ {interpolate(t('problemsSolved'), { count: totalSolved })}</p>
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
                <button type="button" className="try-button" onClick={() => launchHomework('Help me solve a homework problem step by step.', { source: 'quick-action', rewardPoints: 10, sourceLabel: t('tryNow') })}>
                  <span>⊕</span> {t('tryNow')}
                </button>
              </section>

              <section className="progress-card panel-card">
                <div className="panel-heading panel-heading--center">📊 {t('progressTitle')}</div>
                <div className="progress-stats-grid">
                  <StatTile value={String(streak)} label={`${t('streak')} 🔥`} tone="purple" />
                  <StatTile value={String(todaySolved)} label={`${t('today')} 🛰`} tone="blue" />
                  <StatTile value={String(totalSolved)} label={`${t('total')} ⭐`} tone="green" />
                </div>
                <div className="goal-row">
                  <span>{interpolate(t('dailyGoal'), { count: DAILY_GOAL })}</span>
                  <strong>{Math.min(todaySolved, DAILY_GOAL)}/{DAILY_GOAL}</strong>
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
                    showNew={challenge.startsNew && !challengeState[challenge.id].interacted}
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
                    <p>{totalPoints} {t('points')}</p>
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
                  {messages.length === 0 && !isLoading ? <div className="chat-empty">{t('solverEmpty')}</div> : null}
                  {messages.map((message) => (
                    <article key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
                      <div className="chat-bubble__meta">
                        <strong>{message.role === 'user' ? displayName : t('brand')}</strong>
                        <span>{formatShortTime(message.timestamp, language)}</span>
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
                    sendHomeworkMessage(homeworkInput)
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
                    showNew={challenge.startsNew && !challengeState[challenge.id].interacted}
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
                <StatTile value={String(streak)} label={`${t('streak')} 🔥`} tone="purple" />
                <StatTile value={String(todaySolved)} label={`${t('today')} 🛰`} tone="blue" />
                <StatTile value={String(totalSolved)} label={`${t('total')} ⭐`} tone="green" />
              </div>

              <section className="panel-card history-panel">
                {completedItems.length === 0 ? (
                  <div className="empty-history">{t('progressEmpty')}</div>
                ) : (
                  completedItems.map((item) => (
                    <article key={item.id} className="history-item">
                      <div>
                        <strong>{item.sourceLabel}</strong>
                        <p>{item.question}</p>
                      </div>
                      <span>{t('completedOn')} {formatDateTime(item.completedAt, language)}</span>
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
                    <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                      <option value="en">{t('english')}</option>
                      <option value="es">{t('spanish')}</option>
                      <option value="fr">{t('french')}</option>
                    </select>
                  </label>
                  <div className="theme-toggle-row">
                    <button type="button" className={`theme-toggle ${theme === 'dark' ? 'theme-toggle--active' : ''}`} onClick={() => setTheme('dark')}>
                      <MoonStar size={16} /> {t('dark')}
                    </button>
                    <button type="button" className={`theme-toggle ${theme === 'light' ? 'theme-toggle--active' : ''}`} onClick={() => setTheme('light')}>
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
                    {recentSearches.length === 0 ? (
                      <p className="recent-empty">{t('noRecentSearches')}</p>
                    ) : (
                      <div className="recent-search-list">
                        {recentSearches.map((entry) => (
                          <button key={entry.id} type="button" className="recent-search-item" onClick={() => launchHomework(entry.query, { source: 'search', rewardPoints: 10, sourceLabel: entry.query })}>
                            <span>{entry.query}</span>
                            <strong>{formatShortTime(entry.timestamp, language)}</strong>
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

function SidebarButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
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

function ChallengeCard({ challenge, showNew, onClick }: { challenge: ChallengeDefinition; showNew: boolean; onClick: () => void }) {
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

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    try {
      const stored = window.localStorage.getItem(key)
      return stored ? (JSON.parse(stored) as T) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(value))
    } catch {
      // Ignore storage write failures.
    }
  }, [key, value])

  return [value, setValue] as const
}

function useTranslator(language: Language): Translate {
  return (key, variables = {}) => {
    const template = translations[language][key] ?? translations.en[key] ?? key
    return interpolate(String(template), variables)
  }
}

function interpolate(template: string, variables: Record<string, string | number>) {
  return Object.entries(variables).reduce((current, [key, value]) => current.split(`{${key}}`).join(String(value)), template)
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`
}

function dayKey(timestamp: number) {
  const date = new Date(timestamp)
  date.setHours(0, 0, 0, 0)
  return date.toISOString()
}

function calculateStreak(entries: CompletionEntry[]) {
  const solvedDays = new Set(entries.map((entry) => entry.dayKey))
  const cursor = new Date()
  cursor.setHours(0, 0, 0, 0)
  let streak = 0

  while (solvedDays.has(cursor.toISOString())) {
    streak += 1
    cursor.setDate(cursor.getDate() - 1)
  }

  return streak
}

function formatShortTime(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), { hour: 'numeric', minute: '2-digit' }).format(timestamp)
}

function formatDateTime(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

function localeForLanguage(language: Language) {
  if (language === 'es') return 'es-ES'
  if (language === 'fr') return 'fr-FR'
  return 'en-US'
}

function detectInputLanguage(input: string, fallback: Language): Language {
  const normalized = input.toLowerCase()
  if (/[¿¡]|\b(tarea|resolver|ecuacion|pregunta|explica|fraccion)\b/i.test(normalized)) return 'es'
  if (/[àâçéèêëîïôûùüÿœ]|\b(devoir|question|explique|equation|fraction)\b/i.test(normalized)) return 'fr'
  return fallback
}

function generateAiResponse(input: string, language: Language, history: ChatMessage[], t: Translate) {
  const phrases = responsePhrases[language]
  const normalized = input.toLowerCase()
  const words = input.trim().split(/\s+/).filter(Boolean)
  const previousUserMessage = [...history].reverse().find((message) => message.role === 'user' && message.text !== input)
  const isTechnical = /(math|science|physics|chemistry|biology|algebra|equation|fraction|force|energy|solve|calculate|triangle|graph|historia|matematicas|science|devoir)/i.test(normalized)

  if (words.length < 4) {
    return [
      `${t('chatExplanation')}:`,
      phrases.clarification,
      '',
      `${t('chatSteps')}:`,
      '1. Share the full problem statement.',
      '2. Tell me which part feels confusing.',
      '3. I will then explain and solve it clearly.',
      '',
      `${t('chatFinal')}:`,
      phrases.clarification,
    ].join('\n')
  }

  const explanation = isTechnical ? phrases.mathExplanation : phrases.generalExplanation
  const steps = isTechnical ? phrases.mathSteps : phrases.generalSteps
  const finalAnswer = isTechnical ? phrases.finalMath : phrases.finalGeneral

  return [
    `${t('chatExplanation')}:`,
    explanation,
    previousUserMessage ? `\n${phrases.followUp} ${previousUserMessage.text}` : '',
    '',
    `${t('chatSteps')}:`,
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    `${t('chatFinal')}:`,
    finalAnswer,
  ]
    .filter(Boolean)
    .join('\n')
}

export default App
