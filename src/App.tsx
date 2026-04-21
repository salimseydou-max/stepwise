import { useEffect, useMemo, useRef, useState } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  BookOpenText,
  BrainCircuit,
  ChartNoAxesColumn,
  ChevronRight,
  Languages,
  Menu,
  MoonStar,
  PanelsTopLeft,
  Search,
  SendHorizontal,
  Settings2,
  Sparkles,
  SunMedium,
  Trash2,
  Users,
  X,
} from 'lucide-react'
import './App.css'

import challengesReference from '../challenges.png'
import homeReference from '../home.png'
import homeworkReference from '../homework.png'
import profileReference from '../profile (1).png'
import progressReference from '../progress.png'

type Screen = 'dashboard' | 'solver' | 'community' | 'progress' | 'settings'
type Theme = 'dark' | 'light'
type Language = 'en' | 'es' | 'fr'
type MessageRole = 'user' | 'assistant'

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

type CommunityAnswer = {
  id: string
  text: string
  timestamp: number
}

type CommunityPost = {
  id: string
  question: string
  timestamp: number
  answers: CommunityAnswer[]
}

type CompletedHomework = {
  id: string
  question: string
  summary: string
  completedAt: number
}

type TranslationKey = keyof typeof translations.en

type Translate = (key: TranslationKey, variables?: Record<string, string | number>) => string

const STORAGE_KEYS = {
  recentSearches: 'stepwise.recentSearches',
  communityPosts: 'stepwise.communityPosts',
  completedHomework: 'stepwise.completedHomework',
  language: 'stepwise.language',
  theme: 'stepwise.theme',
  username: 'stepwise.username',
} as const

const screenPreviewImages = [
  homeReference,
  homeworkReference,
  progressReference,
  challengesReference,
  profileReference,
]

const translations = {
  en: {
    brand: 'StepWise AI',
    navDashboard: 'Dashboard',
    navSolver: 'AI Solver',
    navCommunity: 'Community',
    navProgress: 'Progress',
    navSettings: 'Settings',
    dashboardLabel: 'Dashboard',
    dashboardTitle: 'Stay on top of every homework task.',
    dashboardSubtitle:
      'Search a question, jump into AI help, revisit recent activity, and keep your study workflow moving.',
    welcomeBack: 'Welcome back, {name}',
    searchPlaceholder: 'Search your homework question...',
    searchButton: 'Search',
    searchValidation: 'Please enter a homework question first.',
    searchHint: 'Press Enter to send your question straight to the AI Homework Solver.',
    quickActions: 'Quick actions',
    solveHomework: 'Solve Homework',
    askAI: 'Ask AI',
    communityAction: 'Community',
    recentSearches: 'Recent searches',
    noRecentActivity: 'No recent activity',
    completedCount: 'Completed homework',
    communityQuestions: 'Community questions',
    preferredLanguage: 'Preferred language',
    designMatched: 'Responsive web recreation',
    designMatchedText:
      'The layout uses the attached screen designs as the visual direction while adding full app behavior and local persistence.',
    solverLabel: 'AI Homework Solver',
    solverTitle: 'Get clear homework help in a chat-style workspace.',
    solverSubtitle:
      'Ask follow-up questions, get structured explanations, and keep context during the session.',
    solverInputPlaceholder: 'Type a homework question or follow-up...',
    sendMessage: 'Send message',
    solverEmptyState: 'Start by asking a homework question and I will break it down clearly.',
    solverThinking: 'Thinking through your homework...',
    solverLongWarning: 'Your message is too long. Please shorten it before sending.',
    solverTipsTitle: 'How StepWise responds',
    solverTipOne: 'Explains the concept before solving.',
    solverTipTwo: 'Shows step-by-step reasoning.',
    solverTipThree: 'Ends with a clearly labeled final answer.',
    communityLabel: 'Community',
    communityTitle: 'Ask classmates and build answers together.',
    communitySubtitle:
      'Post a question, open any discussion, and add multiple answers without leaving the app.',
    communityPlaceholder: 'Ask the community a question...',
    communityValidation: 'Please enter a question before posting.',
    communityPostButton: 'Post question',
    communityNoPosts: 'No questions yet',
    communityAnswers: 'Answers',
    communityNoAnswers: 'No answers yet',
    answerPlaceholder: 'Write an answer...',
    answerValidation: 'Please enter an answer before posting.',
    addAnswer: 'Add answer',
    collapse: 'Collapse',
    expand: 'Expand',
    progressLabel: 'Progress',
    progressTitle: 'Track the homework you complete with AI support.',
    progressSubtitle:
      'Every successful solver response is recorded automatically so progress updates in real time.',
    progressTotal: 'Completed Homework',
    progressEmpty: 'No progress yet',
    completedOn: 'Completed on',
    progressLatest: 'Latest completed work',
    settingsLabel: 'Settings',
    settingsTitle: 'Personalize how the app looks and behaves.',
    settingsSubtitle:
      'Update your profile, switch themes, change language, and clear stored data whenever you need to.',
    profileSection: 'Profile',
    usernameLabel: 'Username',
    usernamePlaceholder: 'Enter your username',
    usernameValidation: 'Please enter a username.',
    saveProfile: 'Save profile',
    appearanceSection: 'Appearance',
    lightMode: 'Light',
    darkMode: 'Dark',
    languageSection: 'Language',
    languageLabel: 'App language',
    languageEnglish: 'English',
    languageSpanish: 'Spanish',
    languageFrench: 'French',
    dataControls: 'Data controls',
    clearChatHistory: 'Clear chat history',
    clearRecentSearches: 'Clear recent searches',
    clearProgress: 'Clear progress',
    settingsSaved: 'Saved successfully.',
    chatCleared: 'AI chat history cleared.',
    searchesCleared: 'Recent searches cleared.',
    progressCleared: 'Progress reset.',
    postedAt: 'Posted',
    activeNow: 'Active now',
    goToCommunity: 'Open community',
    goToSolver: 'Open AI Solver',
    viewProgress: 'View progress',
  },
  es: {
    brand: 'StepWise AI',
    navDashboard: 'Panel',
    navSolver: 'Solucionador IA',
    navCommunity: 'Comunidad',
    navProgress: 'Progreso',
    navSettings: 'Configuración',
    dashboardLabel: 'Panel',
    dashboardTitle: 'Mantente al día con cada tarea.',
    dashboardSubtitle:
      'Busca una pregunta, entra a la ayuda con IA, revisa la actividad reciente y mantén tu estudio en movimiento.',
    welcomeBack: 'Bienvenida de nuevo, {name}',
    searchPlaceholder: 'Busca tu pregunta de tarea...',
    searchButton: 'Buscar',
    searchValidation: 'Primero escribe una pregunta de tarea.',
    searchHint: 'Pulsa Enter para enviar tu pregunta directamente al Solucionador IA.',
    quickActions: 'Acciones rápidas',
    solveHomework: 'Resolver tarea',
    askAI: 'Preguntar a la IA',
    communityAction: 'Comunidad',
    recentSearches: 'Búsquedas recientes',
    noRecentActivity: 'No hay actividad reciente',
    completedCount: 'Tareas completadas',
    communityQuestions: 'Preguntas de la comunidad',
    preferredLanguage: 'Idioma preferido',
    designMatched: 'Recreación web adaptable',
    designMatchedText:
      'El diseño usa las pantallas adjuntas como dirección visual mientras añade comportamiento real de la app y persistencia local.',
    solverLabel: 'Solucionador IA',
    solverTitle: 'Obtén ayuda clara en un espacio de chat.',
    solverSubtitle:
      'Haz preguntas de seguimiento, recibe explicaciones estructuradas y mantén el contexto durante la sesión.',
    solverInputPlaceholder: 'Escribe una pregunta de tarea o seguimiento...',
    sendMessage: 'Enviar mensaje',
    solverEmptyState: 'Empieza con una pregunta de tarea y la explicaré con claridad.',
    solverThinking: 'Pensando en tu tarea...',
    solverLongWarning: 'Tu mensaje es demasiado largo. Acórtalo antes de enviarlo.',
    solverTipsTitle: 'Cómo responde StepWise',
    solverTipOne: 'Explica el concepto antes de resolver.',
    solverTipTwo: 'Muestra el proceso paso a paso.',
    solverTipThree: 'Termina con una respuesta final claramente etiquetada.',
    communityLabel: 'Comunidad',
    communityTitle: 'Pregunta a tus compañeros y construyan respuestas juntos.',
    communitySubtitle:
      'Publica una pregunta, abre cualquier discusión y añade varias respuestas sin recargar la app.',
    communityPlaceholder: 'Pregunta a la comunidad...',
    communityValidation: 'Escribe una pregunta antes de publicar.',
    communityPostButton: 'Publicar pregunta',
    communityNoPosts: 'Aún no hay preguntas',
    communityAnswers: 'Respuestas',
    communityNoAnswers: 'Aún no hay respuestas',
    answerPlaceholder: 'Escribe una respuesta...',
    answerValidation: 'Escribe una respuesta antes de publicarla.',
    addAnswer: 'Agregar respuesta',
    collapse: 'Ocultar',
    expand: 'Expandir',
    progressLabel: 'Progreso',
    progressTitle: 'Sigue la tarea que completas con ayuda de IA.',
    progressSubtitle:
      'Cada respuesta exitosa del solucionador se guarda automáticamente para actualizar el progreso en tiempo real.',
    progressTotal: 'Tareas completadas',
    progressEmpty: 'Todavía no hay progreso',
    completedOn: 'Completado el',
    progressLatest: 'Trabajo completado recientemente',
    settingsLabel: 'Configuración',
    settingsTitle: 'Personaliza cómo se ve y funciona la app.',
    settingsSubtitle:
      'Actualiza tu perfil, cambia el tema, cambia el idioma y borra datos guardados cuando lo necesites.',
    profileSection: 'Perfil',
    usernameLabel: 'Nombre de usuario',
    usernamePlaceholder: 'Escribe tu nombre de usuario',
    usernameValidation: 'Escribe un nombre de usuario.',
    saveProfile: 'Guardar perfil',
    appearanceSection: 'Apariencia',
    lightMode: 'Claro',
    darkMode: 'Oscuro',
    languageSection: 'Idioma',
    languageLabel: 'Idioma de la aplicación',
    languageEnglish: 'Inglés',
    languageSpanish: 'Español',
    languageFrench: 'Francés',
    dataControls: 'Controles de datos',
    clearChatHistory: 'Borrar historial del chat',
    clearRecentSearches: 'Borrar búsquedas recientes',
    clearProgress: 'Borrar progreso',
    settingsSaved: 'Guardado correctamente.',
    chatCleared: 'Se borró el historial del chat de IA.',
    searchesCleared: 'Se borraron las búsquedas recientes.',
    progressCleared: 'Se reinició el progreso.',
    postedAt: 'Publicado',
    activeNow: 'Activo ahora',
    goToCommunity: 'Abrir comunidad',
    goToSolver: 'Abrir solucionador IA',
    viewProgress: 'Ver progreso',
  },
  fr: {
    brand: 'StepWise AI',
    navDashboard: 'Tableau de bord',
    navSolver: 'Assistant IA',
    navCommunity: 'Communauté',
    navProgress: 'Progrès',
    navSettings: 'Paramètres',
    dashboardLabel: 'Tableau de bord',
    dashboardTitle: 'Gardez le contrôle sur chaque devoir.',
    dashboardSubtitle:
      'Recherchez une question, lancez l’aide IA, retrouvez l’activité récente et gardez votre rythme de travail.',
    welcomeBack: 'Bon retour, {name}',
    searchPlaceholder: 'Recherchez votre question de devoir...',
    searchButton: 'Rechercher',
    searchValidation: 'Veuillez d’abord saisir une question de devoir.',
    searchHint: 'Appuyez sur Entrée pour envoyer la question directement à l’Assistant IA.',
    quickActions: 'Actions rapides',
    solveHomework: 'Résoudre un devoir',
    askAI: 'Demander à l’IA',
    communityAction: 'Communauté',
    recentSearches: 'Recherches récentes',
    noRecentActivity: 'Aucune activité récente',
    completedCount: 'Devoirs terminés',
    communityQuestions: 'Questions de la communauté',
    preferredLanguage: 'Langue préférée',
    designMatched: 'Recréation web responsive',
    designMatchedText:
      'La mise en page suit les écrans PNG fournis tout en ajoutant une vraie logique applicative et une persistance locale.',
    solverLabel: 'Assistant IA',
    solverTitle: 'Obtenez une aide claire dans un espace de chat.',
    solverSubtitle:
      'Posez des questions de suivi, recevez des explications structurées et gardez le contexte pendant la session.',
    solverInputPlaceholder: 'Saisissez une question de devoir ou un suivi...',
    sendMessage: 'Envoyer',
    solverEmptyState: 'Commencez par une question de devoir et je la décomposerai clairement.',
    solverThinking: 'Réflexion sur votre devoir...',
    solverLongWarning: 'Votre message est trop long. Raccourcissez-le avant de l’envoyer.',
    solverTipsTitle: 'Comment StepWise répond',
    solverTipOne: 'Explique le concept avant de résoudre.',
    solverTipTwo: 'Montre une solution étape par étape.',
    solverTipThree: 'Se termine par une réponse finale clairement indiquée.',
    communityLabel: 'Communauté',
    communityTitle: 'Posez une question et construisez des réponses ensemble.',
    communitySubtitle:
      'Publiez une question, ouvrez une discussion et ajoutez plusieurs réponses sans rechargement.',
    communityPlaceholder: 'Posez une question à la communauté...',
    communityValidation: 'Veuillez saisir une question avant de publier.',
    communityPostButton: 'Publier la question',
    communityNoPosts: 'Aucune question pour le moment',
    communityAnswers: 'Réponses',
    communityNoAnswers: 'Aucune réponse pour le moment',
    answerPlaceholder: 'Rédigez une réponse...',
    answerValidation: 'Veuillez saisir une réponse avant de publier.',
    addAnswer: 'Ajouter une réponse',
    collapse: 'Réduire',
    expand: 'Développer',
    progressLabel: 'Progrès',
    progressTitle: 'Suivez les devoirs terminés avec l’aide de l’IA.',
    progressSubtitle:
      'Chaque réponse réussie de l’assistant est enregistrée automatiquement pour mettre à jour les progrès en temps réel.',
    progressTotal: 'Devoirs terminés',
    progressEmpty: 'Aucun progrès pour le moment',
    completedOn: 'Terminé le',
    progressLatest: 'Travail terminé récemment',
    settingsLabel: 'Paramètres',
    settingsTitle: 'Personnalisez l’apparence et le comportement de l’application.',
    settingsSubtitle:
      'Mettez à jour votre profil, changez de thème, changez de langue et effacez les données enregistrées quand vous le souhaitez.',
    profileSection: 'Profil',
    usernameLabel: 'Nom d’utilisateur',
    usernamePlaceholder: 'Saisissez votre nom d’utilisateur',
    usernameValidation: 'Veuillez saisir un nom d’utilisateur.',
    saveProfile: 'Enregistrer le profil',
    appearanceSection: 'Apparence',
    lightMode: 'Clair',
    darkMode: 'Sombre',
    languageSection: 'Langue',
    languageLabel: 'Langue de l’application',
    languageEnglish: 'Anglais',
    languageSpanish: 'Espagnol',
    languageFrench: 'Français',
    dataControls: 'Contrôles des données',
    clearChatHistory: 'Effacer l’historique du chat',
    clearRecentSearches: 'Effacer les recherches récentes',
    clearProgress: 'Effacer les progrès',
    settingsSaved: 'Enregistré avec succès.',
    chatCleared: 'L’historique du chat IA a été effacé.',
    searchesCleared: 'Les recherches récentes ont été effacées.',
    progressCleared: 'Les progrès ont été réinitialisés.',
    postedAt: 'Publié',
    activeNow: 'Actif maintenant',
    goToCommunity: 'Ouvrir la communauté',
    goToSolver: 'Ouvrir l’assistant IA',
    viewProgress: 'Voir les progrès',
  },
} as const

const responsePhrases = {
  en: {
    explanation: 'Explanation',
    steps: 'Step-by-step solution',
    finalAnswer: 'Final Answer',
    clarificationConcept:
      'I need a little more detail before I can give an accurate solution. A complete problem statement helps me explain the right method instead of guessing.',
    clarificationSteps: [
      'Share the exact homework question, including numbers, instructions, or answer choices.',
      'Tell me which part feels confusing so I can focus the explanation.',
      'If there is a diagram or formula, describe it or paste it into the chat.',
    ],
    clarificationFinal:
      'Please send the full question and I will respond with a complete explanation, steps, and final answer.',
    mathConcept:
      'This looks like a math or science problem, so the goal is to identify what is known, choose the governing rule or formula, and solve in a logical order.',
    generalConcept:
      'This looks more conceptual, so I will explain the idea first, then show a clean way to organize the response or solution.',
    followUpPrefix: 'I am also using context from your earlier question:',
    mathSteps: [
      'List the given information and label the unknown clearly.',
      'Choose the formula, theorem, or principle that connects the known values to the unknown.',
      'Substitute carefully, solve one step at a time, and check whether the result makes sense.',
    ],
    generalSteps: [
      'Restate the question in simpler words so the goal is clear.',
      'Identify the key concept, evidence, or structure needed for a strong answer.',
      'Turn that understanding into a complete response using the clearest explanation first.',
    ],
    mathFinal:
      'Use the method above on the values in your worksheet. If you share the exact numbers or equation, I can verify the exact result next.',
    generalFinal:
      'Build your final response around the explanation above, and I can refine it further if you send your draft or teacher prompt.',
  },
  es: {
    explanation: 'Explicación',
    steps: 'Solución paso a paso',
    finalAnswer: 'Respuesta Final',
    clarificationConcept:
      'Necesito un poco más de detalle antes de darte una solución exacta. Un enunciado completo me permite explicar el método correcto sin adivinar.',
    clarificationSteps: [
      'Comparte la pregunta exacta, incluyendo números, instrucciones u opciones de respuesta.',
      'Dime qué parte te confunde para enfocar mejor la explicación.',
      'Si hay un diagrama o una fórmula, descríbelo o pégalo en el chat.',
    ],
    clarificationFinal:
      'Envíame la pregunta completa y responderé con explicación, pasos y respuesta final.',
    mathConcept:
      'Parece un problema de matemáticas o ciencias, así que primero conviene identificar los datos, elegir la regla o fórmula adecuada y resolver con orden.',
    generalConcept:
      'Parece una pregunta más conceptual, así que primero explicaré la idea principal y luego mostraré una forma clara de organizar la respuesta.',
    followUpPrefix: 'También estoy usando el contexto de tu pregunta anterior:',
    mathSteps: [
      'Anota la información dada y define claramente lo desconocido.',
      'Elige la fórmula, teorema o principio que conecta los datos con lo que buscas.',
      'Sustituye con cuidado, resuelve paso a paso y comprueba si el resultado tiene sentido.',
    ],
    generalSteps: [
      'Reformula la pregunta con palabras más simples para aclarar el objetivo.',
      'Identifica el concepto clave, la evidencia o la estructura necesaria para una buena respuesta.',
      'Convierte esa comprensión en una respuesta completa empezando por la explicación más clara.',
    ],
    mathFinal:
      'Aplica el método anterior a los valores de tu ejercicio. Si compartes los números o la ecuación exacta, puedo verificar el resultado preciso después.',
    generalFinal:
      'Construye tu respuesta final alrededor de la explicación anterior y puedo mejorarla si me compartes tu borrador o la consigna del profesor.',
  },
  fr: {
    explanation: 'Explication',
    steps: 'Solution étape par étape',
    finalAnswer: 'Réponse Finale',
    clarificationConcept:
      'J’ai besoin d’un peu plus de détails avant de donner une solution précise. Un énoncé complet me permet d’expliquer la bonne méthode sans deviner.',
    clarificationSteps: [
      'Partagez la question exacte avec les nombres, les consignes ou les choix de réponse.',
      'Indiquez la partie qui vous bloque pour que je cible mieux l’explication.',
      'S’il y a un schéma ou une formule, décrivez-le ou collez-le dans le chat.',
    ],
    clarificationFinal:
      'Envoyez la question complète et je répondrai avec une explication, des étapes et une réponse finale.',
    mathConcept:
      'Cela ressemble à un problème de mathématiques ou de sciences : il faut donc repérer les données, choisir la règle ou la formule adaptée, puis résoudre dans le bon ordre.',
    generalConcept:
      'Cela semble plus conceptuel, donc je vais d’abord expliquer l’idée principale avant de montrer une manière claire d’organiser la réponse.',
    followUpPrefix: 'Je tiens aussi compte de votre question précédente :',
    mathSteps: [
      'Notez les informations données et identifiez clairement l’inconnue.',
      'Choisissez la formule, le théorème ou le principe qui relie les données à ce que vous cherchez.',
      'Remplacez soigneusement, résolvez étape par étape et vérifiez si le résultat est cohérent.',
    ],
    generalSteps: [
      'Reformulez la question avec des mots plus simples pour clarifier l’objectif.',
      'Repérez le concept clé, la preuve ou la structure nécessaire à une bonne réponse.',
      'Transformez cette compréhension en une réponse complète en commençant par l’explication la plus claire.',
    ],
    mathFinal:
      'Utilisez la méthode ci-dessus avec les valeurs de votre exercice. Si vous partagez les nombres ou l’équation exacte, je peux ensuite vérifier le résultat précis.',
    generalFinal:
      'Construisez votre réponse finale autour de l’explication ci-dessus, et je peux l’améliorer si vous m’envoyez votre brouillon ou la consigne du professeur.',
  },
} as const

function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [theme, setTheme] = useLocalStorageState<Theme>(STORAGE_KEYS.theme, 'dark')
  const [language, setLanguage] = useLocalStorageState<Language>(STORAGE_KEYS.language, 'en')
  const [username, setUsername] = useLocalStorageState<string>(STORAGE_KEYS.username, 'Maya')
  const [recentSearches, setRecentSearches] = useLocalStorageState<SearchEntry[]>(STORAGE_KEYS.recentSearches, [])
  const [communityPosts, setCommunityPosts] = useLocalStorageState<CommunityPost[]>(STORAGE_KEYS.communityPosts, [])
  const [completedHomework, setCompletedHomework] = useLocalStorageState<CompletedHomework[]>(
    STORAGE_KEYS.completedHomework,
    [],
  )
  const [dashboardQuery, setDashboardQuery] = useState('')
  const [dashboardNotice, setDashboardNotice] = useState('')
  const [solverInput, setSolverInput] = useState('')
  const [solverNotice, setSolverNotice] = useState('')
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [isSolverLoading, setIsSolverLoading] = useState(false)
  const [pendingSolverQuery, setPendingSolverQuery] = useState<string | null>(null)
  const [communityInput, setCommunityInput] = useState('')
  const [communityNotice, setCommunityNotice] = useState('')
  const [expandedPosts, setExpandedPosts] = useState<Record<string, boolean>>({})
  const [answerDrafts, setAnswerDrafts] = useState<Record<string, string>>({})
  const [answerNotices, setAnswerNotices] = useState<Record<string, string>>({})
  const [settingsNameDraft, setSettingsNameDraft] = useState(username)
  const [settingsNotice, setSettingsNotice] = useState('')
  const chatEndRef = useRef<HTMLDivElement | null>(null)
  const t = useTranslator(language)

  const navigationItems = useMemo(
    () => [
      { id: 'dashboard' as const, label: t('navDashboard'), icon: PanelsTopLeft },
      { id: 'solver' as const, label: t('navSolver'), icon: Sparkles },
      { id: 'community' as const, label: t('navCommunity'), icon: Users },
      { id: 'progress' as const, label: t('navProgress'), icon: ChartNoAxesColumn },
      { id: 'settings' as const, label: t('navSettings'), icon: Settings2 },
    ],
    [t],
  )

  const sortedPosts = useMemo(
    () => [...communityPosts].sort((left, right) => right.timestamp - left.timestamp),
    [communityPosts],
  )

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    setSettingsNameDraft(username)
  }, [username])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages, isSolverLoading])

  useEffect(() => {
    if (activeScreen !== 'solver' || pendingSolverQuery === null || isSolverLoading) {
      return
    }

    const query = pendingSolverQuery
    setPendingSolverQuery(null)
    handleSolverSend(query)
  }, [activeScreen, pendingSolverQuery, isSolverLoading])

  function navigateTo(screen: Screen) {
    setActiveScreen(screen)
    setSidebarOpen(false)
    setDashboardNotice('')
    setCommunityNotice('')
    setSolverNotice('')
    setSettingsNotice('')
  }

  function recordRecentSearch(query: string) {
    setRecentSearches((current) => {
      const nextEntry: SearchEntry = { id: createId(), query, timestamp: Date.now() }
      return [nextEntry, ...current.filter((item) => item.query.toLowerCase() !== query.toLowerCase())].slice(0, 10)
    })
  }

  function openSolverWithQuery(query: string) {
    const cleaned = query.trim()
    if (!cleaned) {
      setDashboardNotice(t('searchValidation'))
      return
    }

    recordRecentSearch(cleaned)
    setDashboardQuery('')
    setDashboardNotice('')
    setSolverInput(cleaned)
    setPendingSolverQuery(cleaned)
    navigateTo('solver')
  }

  function handleDashboardSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    openSolverWithQuery(dashboardQuery)
  }

  function handleQuickAction(action: 'solve' | 'ask' | 'community') {
    if (action === 'community') {
      navigateTo('community')
      return
    }

    setPendingSolverQuery(null)
    setSolverInput('')
    navigateTo('solver')
  }
  function handleSolverSend(rawInput: string) {
    const cleaned = rawInput.trim()
    if (!cleaned || isSolverLoading) {
      return
    }

    if (cleaned.length > 600) {
      setSolverNotice(t('solverLongWarning'))
      return
    }

    const userMessage: ChatMessage = { id: createId(), role: 'user', text: cleaned, timestamp: Date.now() }
    const nextMessages = [...chatMessages, userMessage]

    setChatMessages(nextMessages)
    setSolverInput('')
    setSolverNotice('')
    setIsSolverLoading(true)

    const responseLanguage = detectInputLanguage(cleaned, language)
    const waitTime = 1000 + Math.floor(Math.random() * 900)

    window.setTimeout(() => {
      const generated = generateAiResponse(cleaned, responseLanguage, nextMessages)
      const assistantMessage: ChatMessage = {
        id: createId(),
        role: 'assistant',
        text: generated.text,
        timestamp: Date.now(),
      }

      setChatMessages((current) => [...current, assistantMessage])
      setIsSolverLoading(false)

      if (generated.completed) {
        setCompletedHomework((current) => [
          { id: createId(), question: cleaned, summary: generated.summary, completedAt: Date.now() },
          ...current,
        ])
      }
    }, waitTime)
  }

  function handleCommunitySubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleaned = communityInput.trim()
    if (!cleaned) {
      setCommunityNotice(t('communityValidation'))
      return
    }

    const nextPost: CommunityPost = { id: createId(), question: cleaned, timestamp: Date.now(), answers: [] }
    setCommunityPosts((current) => [nextPost, ...current])
    setExpandedPosts((current) => ({ ...current, [nextPost.id]: true }))
    setCommunityInput('')
    setCommunityNotice('')
  }

  function handleAnswerSubmit(postId: string) {
    const cleaned = (answerDrafts[postId] ?? '').trim()
    if (!cleaned) {
      setAnswerNotices((current) => ({ ...current, [postId]: t('answerValidation') }))
      return
    }

    setCommunityPosts((current) =>
      current.map((post) =>
        post.id === postId
          ? { ...post, answers: [...post.answers, { id: createId(), text: cleaned, timestamp: Date.now() }] }
          : post,
      ),
    )
    setExpandedPosts((current) => ({ ...current, [postId]: true }))
    setAnswerDrafts((current) => ({ ...current, [postId]: '' }))
    setAnswerNotices((current) => ({ ...current, [postId]: '' }))
  }

  function handleSaveProfile(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const cleaned = settingsNameDraft.trim()
    if (!cleaned) {
      setSettingsNotice(t('usernameValidation'))
      return
    }

    setUsername(cleaned)
    setSettingsNotice(t('settingsSaved'))
  }

  function handleClearChatHistory() {
    setChatMessages((current) => current.filter((message) => message.role === 'user'))
    setIsSolverLoading(false)
    setSettingsNotice(t('chatCleared'))
  }

  function handleClearRecentSearches() {
    setRecentSearches([])
    setSettingsNotice(t('searchesCleared'))
  }

  function handleClearProgress() {
    setCompletedHomework([])
    setSettingsNotice(t('progressCleared'))
  }

  return (
    <div className="shell">
      <button
        type="button"
        className={`overlay ${sidebarOpen ? 'overlay--visible' : ''}`}
        aria-label="Close navigation"
        onClick={() => setSidebarOpen(false)}
      />

      <div className="app-layout">
        <aside className={`sidebar ${sidebarOpen ? 'sidebar--open' : ''}`}>
          <div className="sidebar__brand">
            <div className="brand-badge">
              <BrainCircuit size={20} />
            </div>
            <div>
              <strong>{t('brand')}</strong>
              <p>{t('activeNow')}</p>
            </div>
            <button type="button" className="sidebar__close" onClick={() => setSidebarOpen(false)}>
              <X size={18} />
            </button>
          </div>

          <nav className="sidebar__nav" aria-label="Primary navigation">
            {navigationItems.map((item) => (
              <NavButton
                key={item.id}
                icon={item.icon}
                label={item.label}
                active={activeScreen === item.id}
                onClick={() => navigateTo(item.id)}
              />
            ))}
          </nav>

          <div className="sidebar__meta card">
            <div>
              <p className="eyebrow">{t('preferredLanguage')}</p>
              <strong>{languageLabel(language, t)}</strong>
            </div>
            <div className="chip-row">
              <span className="chip">
                <Languages size={14} /> {language.toUpperCase()}
              </span>
              <span className="chip">
                {theme === 'dark' ? <MoonStar size={14} /> : <SunMedium size={14} />} {theme}
              </span>
            </div>
          </div>
        </aside>

        <main className="main-content">
          <header className="topbar card">
            <div className="topbar__left">
              <button type="button" className="menu-button" onClick={() => setSidebarOpen(true)}>
                <Menu size={20} />
              </button>
              <div>
                <p className="eyebrow">{screenLabel(activeScreen, t)}</p>
                <h1>{interpolate(t('welcomeBack'), { name: username })}</h1>
              </div>
            </div>
            <div className="topbar__actions">
              <button type="button" className="topbar-chip" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}>
                {theme === 'dark' ? <SunMedium size={16} /> : <MoonStar size={16} />}
                <span>{theme === 'dark' ? t('lightMode') : t('darkMode')}</span>
              </button>
              <div className="topbar-chip">
                <Languages size={16} />
                <span>{languageLabel(language, t)}</span>
              </div>
            </div>
          </header>
          {activeScreen === 'dashboard' && (
            <section className="screen-grid screen-grid--dashboard">
              <div className="hero card hero-card-web">
                <div className="hero-card-web__content">
                  <p className="eyebrow">{t('dashboardLabel')}</p>
                  <h2>{t('dashboardTitle')}</h2>
                  <p>{t('dashboardSubtitle')}</p>
                  <form className="search-panel" onSubmit={handleDashboardSubmit}>
                    <div className="search-input-wrap">
                      <Search size={18} />
                      <input
                        value={dashboardQuery}
                        onChange={(event) => setDashboardQuery(event.target.value)}
                        placeholder={t('searchPlaceholder')}
                        aria-label={t('searchPlaceholder')}
                      />
                    </div>
                    <button type="submit">{t('searchButton')}</button>
                  </form>
                  <p className={`inline-notice ${dashboardNotice ? 'inline-notice--error' : ''}`}>
                    {dashboardNotice || t('searchHint')}
                  </p>
                </div>
                <div className="preview-stack">
                  {screenPreviewImages.slice(0, 3).map((image, index) => (
                    <img key={image} src={image} alt={`preview-${index + 1}`} className={`preview-card preview-card--${index + 1}`} />
                  ))}
                </div>
              </div>

              <div className="quick-actions card">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">{t('quickActions')}</p>
                    <h3>{t('quickActions')}</h3>
                  </div>
                </div>
                <div className="action-grid">
                  <ActionButton icon={BookOpenText} title={t('solveHomework')} onClick={() => handleQuickAction('solve')} />
                  <ActionButton icon={Sparkles} title={t('askAI')} onClick={() => handleQuickAction('ask')} />
                  <ActionButton icon={Users} title={t('communityAction')} onClick={() => handleQuickAction('community')} />
                </div>
              </div>

              <div className="stats-grid">
                <StatCard label={t('completedCount')} value={String(completedHomework.length)} />
                <StatCard label={t('communityQuestions')} value={String(communityPosts.length)} />
                <StatCard label={t('preferredLanguage')} value={languageLabel(language, t)} />
              </div>

              <div className="card recent-card">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">{t('recentSearches')}</p>
                    <h3>{t('recentSearches')}</h3>
                  </div>
                </div>
                {recentSearches.length === 0 ? (
                  <p className="empty-state">{t('noRecentActivity')}</p>
                ) : (
                  <div className="stack-list">
                    {recentSearches.map((entry) => (
                      <button key={entry.id} type="button" className="list-item-button" onClick={() => openSolverWithQuery(entry.query)}>
                        <div>
                          <strong>{entry.query}</strong>
                          <span>{formatTimestamp(entry.timestamp, language)}</span>
                        </div>
                        <ChevronRight size={18} />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="card insight-card-web">
                <div className="section-header">
                  <div>
                    <p className="eyebrow">{t('designMatched')}</p>
                    <h3>{t('designMatched')}</h3>
                  </div>
                </div>
                <p>{t('designMatchedText')}</p>
                <div className="inline-actions">
                  <button type="button" className="secondary-button" onClick={() => navigateTo('solver')}>
                    {t('goToSolver')}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => navigateTo('community')}>
                    {t('goToCommunity')}
                  </button>
                  <button type="button" className="secondary-button" onClick={() => navigateTo('progress')}>
                    {t('viewProgress')}
                  </button>
                </div>
              </div>
            </section>
          )}

          {activeScreen === 'solver' && (
            <section className="screen-grid screen-grid--solver">
              <div className="card screen-heading-card">
                <p className="eyebrow">{t('solverLabel')}</p>
                <h2>{t('solverTitle')}</h2>
                <p>{t('solverSubtitle')}</p>
              </div>
              <div className="card tips-card">
                <div className="section-header">
                  <h3>{t('solverTipsTitle')}</h3>
                </div>
                <ul className="tips-list">
                  <li>{t('solverTipOne')}</li>
                  <li>{t('solverTipTwo')}</li>
                  <li>{t('solverTipThree')}</li>
                </ul>
              </div>
              <div className="card chat-card">
                <div className="chat-thread">
                  {chatMessages.length === 0 && !isSolverLoading ? <div className="assistant-placeholder">{t('solverEmptyState')}</div> : null}
                  {chatMessages.map((message) => (
                    <article key={message.id} className={`message message--${message.role}`}>
                      <div className="message__meta">
                        <span>{message.role === 'user' ? username : t('brand')}</span>
                        <time>{formatShortTime(message.timestamp, language)}</time>
                      </div>
                      <p>{message.text}</p>
                    </article>
                  ))}
                  {isSolverLoading ? (
                    <article className="message message--assistant message--loading">
                      <div className="message__meta">
                        <span>{t('brand')}</span>
                      </div>
                      <div className="loading-dots" aria-label={t('solverThinking')}>
                        <span />
                        <span />
                        <span />
                      </div>
                      <p>{t('solverThinking')}</p>
                    </article>
                  ) : null}
                  <div ref={chatEndRef} />
                </div>
                <form className="chat-form" onSubmit={(event) => {
                  event.preventDefault()
                  handleSolverSend(solverInput)
                }}>
                  <textarea
                    value={solverInput}
                    onChange={(event) => setSolverInput(event.target.value)}
                    placeholder={t('solverInputPlaceholder')}
                    rows={3}
                    aria-label={t('solverInputPlaceholder')}
                  />
                  <div className="chat-form__footer">
                    <p className={`inline-notice ${solverNotice ? 'inline-notice--error' : ''}`}>{solverNotice}</p>
                    <button type="submit" disabled={isSolverLoading}>
                      <SendHorizontal size={16} /> {t('sendMessage')}
                    </button>
                  </div>
                </form>
              </div>
            </section>
          )}

          {activeScreen === 'community' && (
            <section className="screen-grid screen-grid--community">
              <div className="card screen-heading-card">
                <p className="eyebrow">{t('communityLabel')}</p>
                <h2>{t('communityTitle')}</h2>
                <p>{t('communitySubtitle')}</p>
              </div>
              <div className="card community-form-card">
                <form onSubmit={handleCommunitySubmit} className="community-form">
                  <textarea
                    value={communityInput}
                    onChange={(event) => setCommunityInput(event.target.value)}
                    placeholder={t('communityPlaceholder')}
                    rows={4}
                    aria-label={t('communityPlaceholder')}
                  />
                  <div className="chat-form__footer">
                    <p className={`inline-notice ${communityNotice ? 'inline-notice--error' : ''}`}>{communityNotice}</p>
                    <button type="submit">{t('communityPostButton')}</button>
                  </div>
                </form>
              </div>
              <div className="card feed-card">
                <div className="section-header">
                  <h3>{t('communityQuestions')}</h3>
                </div>
                {sortedPosts.length === 0 ? (
                  <p className="empty-state">{t('communityNoPosts')}</p>
                ) : (
                  <div className="post-list">
                    {sortedPosts.map((post) => {
                      const isExpanded = expandedPosts[post.id] ?? false
                      return (
                        <article key={post.id} className="post-card">
                          <button
                            type="button"
                            className="post-card__toggle"
                            onClick={() => setExpandedPosts((current) => ({ ...current, [post.id]: !isExpanded }))}
                          >
                            <div>
                              <strong>{post.question}</strong>
                              <span>{t('postedAt')} {formatTimestamp(post.timestamp, language)}</span>
                            </div>
                            <span>{isExpanded ? t('collapse') : t('expand')}</span>
                          </button>
                          {isExpanded ? (
                            <div className="post-card__body">
                              <div className="section-header section-header--compact">
                                <h4>{t('communityAnswers')} ({post.answers.length})</h4>
                              </div>
                              {post.answers.length === 0 ? (
                                <p className="empty-state empty-state--inline">{t('communityNoAnswers')}</p>
                              ) : (
                                <div className="answer-list">
                                  {post.answers.map((answer) => (
                                    <div key={answer.id} className="answer-card">
                                      <p>{answer.text}</p>
                                      <span>{formatTimestamp(answer.timestamp, language)}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                              <div className="answer-form">
                                <textarea
                                  value={answerDrafts[post.id] ?? ''}
                                  onChange={(event) => setAnswerDrafts((current) => ({ ...current, [post.id]: event.target.value }))}
                                  placeholder={t('answerPlaceholder')}
                                  rows={3}
                                  aria-label={t('answerPlaceholder')}
                                />
                                <div className="chat-form__footer">
                                  <p className={`inline-notice ${answerNotices[post.id] ? 'inline-notice--error' : ''}`}>{answerNotices[post.id] ?? ''}</p>
                                  <button type="button" onClick={() => handleAnswerSubmit(post.id)}>
                                    {t('addAnswer')}
                                  </button>
                                </div>
                              </div>
                            </div>
                          ) : null}
                        </article>
                      )
                    })}
                  </div>
                )}
              </div>
            </section>
          )}
          {activeScreen === 'progress' && (
            <section className="screen-grid screen-grid--progress">
              <div className="card screen-heading-card">
                <p className="eyebrow">{t('progressLabel')}</p>
                <h2>{t('progressTitle')}</h2>
                <p>{t('progressSubtitle')}</p>
              </div>
              <div className="stats-grid">
                <StatCard label={t('progressTotal')} value={String(completedHomework.length)} />
                <StatCard label={t('recentSearches')} value={String(recentSearches.length)} />
                <StatCard label={t('communityQuestions')} value={String(communityPosts.length)} />
              </div>
              <div className="card progress-list-card">
                <div className="section-header">
                  <h3>{t('progressLatest')}</h3>
                </div>
                {completedHomework.length === 0 ? (
                  <p className="empty-state">{t('progressEmpty')}</p>
                ) : (
                  <div className="stack-list">
                    {completedHomework.map((item) => (
                      <article key={item.id} className="progress-item">
                        <div>
                          <strong>{item.question}</strong>
                          <p>{item.summary}</p>
                        </div>
                        <span>{t('completedOn')} {formatTimestamp(item.completedAt, language)}</span>
                      </article>
                    ))}
                  </div>
                )}
              </div>
            </section>
          )}

          {activeScreen === 'settings' && (
            <section className="screen-grid screen-grid--settings">
              <div className="card screen-heading-card">
                <p className="eyebrow">{t('settingsLabel')}</p>
                <h2>{t('settingsTitle')}</h2>
                <p>{t('settingsSubtitle')}</p>
              </div>
              <div className="settings-grid">
                <div className="card settings-card">
                  <div className="section-header">
                    <h3>{t('profileSection')}</h3>
                  </div>
                  <form className="settings-form" onSubmit={handleSaveProfile}>
                    <label>
                      <span>{t('usernameLabel')}</span>
                      <input
                        value={settingsNameDraft}
                        onChange={(event) => setSettingsNameDraft(event.target.value)}
                        placeholder={t('usernamePlaceholder')}
                      />
                    </label>
                    <button type="submit">{t('saveProfile')}</button>
                  </form>
                </div>
                <div className="card settings-card">
                  <div className="section-header">
                    <h3>{t('appearanceSection')}</h3>
                  </div>
                  <div className="segmented-control">
                    <button type="button" className={theme === 'light' ? 'active' : ''} onClick={() => setTheme('light')}>
                      <SunMedium size={16} /> {t('lightMode')}
                    </button>
                    <button type="button" className={theme === 'dark' ? 'active' : ''} onClick={() => setTheme('dark')}>
                      <MoonStar size={16} /> {t('darkMode')}
                    </button>
                  </div>
                </div>
                <div className="card settings-card">
                  <div className="section-header">
                    <h3>{t('languageSection')}</h3>
                  </div>
                  <label className="select-field">
                    <span>{t('languageLabel')}</span>
                    <select value={language} onChange={(event) => setLanguage(event.target.value as Language)}>
                      <option value="en">{t('languageEnglish')}</option>
                      <option value="es">{t('languageSpanish')}</option>
                      <option value="fr">{t('languageFrench')}</option>
                    </select>
                  </label>
                </div>
                <div className="card settings-card">
                  <div className="section-header">
                    <h3>{t('dataControls')}</h3>
                  </div>
                  <div className="danger-list">
                    <button type="button" className="danger-button" onClick={handleClearChatHistory}>
                      <Trash2 size={16} /> {t('clearChatHistory')}
                    </button>
                    <button type="button" className="danger-button" onClick={handleClearRecentSearches}>
                      <Trash2 size={16} /> {t('clearRecentSearches')}
                    </button>
                    <button type="button" className="danger-button" onClick={handleClearProgress}>
                      <Trash2 size={16} /> {t('clearProgress')}
                    </button>
                  </div>
                </div>
              </div>
              <p className={`inline-notice ${settingsNotice ? '' : 'inline-notice--muted'}`}>{settingsNotice}</p>
            </section>
          )}
        </main>
      </div>

      <nav className="mobile-nav" aria-label="Mobile navigation">
        {navigationItems.map((item) => (
          <button key={item.id} type="button" className={activeScreen === item.id ? 'active' : ''} onClick={() => navigateTo(item.id)}>
            <item.icon size={18} />
            <span>{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}

function NavButton({ icon: Icon, label, active, onClick }: { icon: LucideIcon; label: string; active: boolean; onClick: () => void }) {
  return (
    <button type="button" className={`nav-button ${active ? 'nav-button--active' : ''}`} onClick={onClick}>
      <Icon size={18} />
      <span>{label}</span>
    </button>
  )
}

function ActionButton({ icon: Icon, title, onClick }: { icon: LucideIcon; title: string; onClick: () => void }) {
  return (
    <button type="button" className="action-button" onClick={onClick}>
      <Icon size={18} />
      <span>{title}</span>
    </button>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <article className="card stat-card-web">
      <p>{label}</p>
      <strong>{value}</strong>
    </article>
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
      // Ignore storage write failures so the app still works in restricted environments.
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
  return Object.entries(variables).reduce(
    (text, [key, value]) => text.split(`{${key}}`).join(String(value)),
    template,
  )
}

function screenLabel(screen: Screen, t: Translate) {
  if (screen === 'dashboard') return t('navDashboard')
  if (screen === 'solver') return t('navSolver')
  if (screen === 'community') return t('navCommunity')
  if (screen === 'progress') return t('navProgress')
  return t('navSettings')
}

function languageLabel(language: Language, t: Translate) {
  if (language === 'es') return t('languageSpanish')
  if (language === 'fr') return t('languageFrench')
  return t('languageEnglish')
}

function createId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`
}

function formatTimestamp(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), { dateStyle: 'medium', timeStyle: 'short' }).format(timestamp)
}

function formatShortTime(timestamp: number, language: Language) {
  return new Intl.DateTimeFormat(localeForLanguage(language), { hour: 'numeric', minute: '2-digit' }).format(timestamp)
}

function localeForLanguage(language: Language) {
  if (language === 'es') return 'es-ES'
  if (language === 'fr') return 'fr-FR'
  return 'en-US'
}

function detectInputLanguage(input: string, fallback: Language): Language {
  const normalized = input.toLowerCase()
  if (/[¿¡]|\b(porque|resolver|deberes|ecuacion|pregunta|tarea|explica)\b/i.test(normalized)) return 'es'
  if (/[àâçéèêëîïôûùüÿœ]|\b(pourquoi|devoir|question|reponse|explique|equation)\b/i.test(normalized)) return 'fr'
  return fallback
}

function generateAiResponse(input: string, language: Language, history: ChatMessage[]) {
  const phrases = responsePhrases[language]
  const trimmed = input.trim()
  const normalized = trimmed.toLowerCase()
  const words = trimmed.split(/\s+/).filter(Boolean)
  const previousUserMessage = [...history].reverse().find((message) => message.role === 'user' && message.text !== trimmed)
  const followUpContext = previousUserMessage ? `${phrases.followUpPrefix} ${previousUserMessage.text}` : ''
  const isUnclear = words.length < 4 || trimmed.length < 12
  const looksTechnical = /(solve|equation|fraction|calculate|integral|derivative|triangle|velocity|force|energy|mass|cell|photosynthesis|atom|molecule|graph|algebra|geometry|physics|chemistry|biology|math|science|résoudre|ecuacion|fuerza|energia|fraccion|derivada|algèbre|géométrie)/i.test(normalized)

  if (isUnclear) {
    const text = [
      `${phrases.explanation}:`,
      phrases.clarificationConcept,
      '',
      `${phrases.steps}:`,
      ...phrases.clarificationSteps.map((step, index) => `${index + 1}. ${step}`),
      '',
      `${phrases.finalAnswer}:`,
      phrases.clarificationFinal,
    ].join('\n')

    return { text, summary: phrases.clarificationFinal, completed: false }
  }

  const explanation = looksTechnical ? phrases.mathConcept : phrases.generalConcept
  const steps = looksTechnical ? phrases.mathSteps : phrases.generalSteps
  const finalAnswer = looksTechnical ? phrases.mathFinal : phrases.generalFinal
  const text = [
    `${phrases.explanation}:`,
    explanation,
    followUpContext ? `\n${followUpContext}` : '',
    '',
    `${phrases.steps}:`,
    ...steps.map((step, index) => `${index + 1}. ${step}`),
    '',
    `${phrases.finalAnswer}:`,
    finalAnswer,
  ]
    .filter(Boolean)
    .join('\n')

  return { text, summary: finalAnswer, completed: true }
}

export default App
