import { useMemo, useState } from 'react'
import {
  BookOpen,
  Brain,
  CalendarCheck2,
  Camera,
  ChartSpline,
  CheckCircle2,
  ChevronRight,
  Clock3,
  Flame,
  GraduationCap,
  Home,
  MessageSquareText,
  Sparkles,
  Star,
  Target,
  Trophy,
  Upload,
  UserRound,
  Zap,
} from 'lucide-react'
import './App.css'

import homeReference from '../home.png'
import homeworkReference from '../homework.png'
import challengesReference from '../challenges.png'
import progressReference from '../progress.png'
import profileReference from '../profile (1).png'

type TabId = 'home' | 'homework' | 'challenges' | 'progress' | 'profile'

type TabConfig = {
  id: TabId
  label: string
  icon: typeof Home
  title: string
  subtitle: string
  image: string
}

const tabs: TabConfig[] = [
  {
    id: 'home',
    label: 'Home',
    icon: Home,
    title: 'Home command center',
    subtitle: 'Daily overview, smart priorities, and one-tap AI actions.',
    image: homeReference,
  },
  {
    id: 'homework',
    label: 'Homework',
    icon: BookOpen,
    title: 'Homework breakdown',
    subtitle: 'Upload prompts, get step-by-step help, and finish faster.',
    image: homeworkReference,
  },
  {
    id: 'challenges',
    label: 'Challenges',
    icon: Trophy,
    title: 'Challenge arena',
    subtitle: 'Gamified streaks, daily quests, and class competition.',
    image: challengesReference,
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: ChartSpline,
    title: 'Progress analytics',
    subtitle: 'Visual growth tracking across subjects and study habits.',
    image: progressReference,
  },
  {
    id: 'profile',
    label: 'Profile',
    icon: UserRound,
    title: 'Profile + goals',
    subtitle: 'Personal learning settings, achievements, and routines.',
    image: profileReference,
  },
]

const subjectStats = [
  { subject: 'Math', score: 92, accent: '#7c4dff' },
  { subject: 'Physics', score: 87, accent: '#23c4b6' },
  { subject: 'Literature', score: 94, accent: '#ff8a65' },
]

const quests = [
  { label: 'Explain a geometry proof', reward: '+40 XP', done: true },
  { label: 'Review chemistry flashcards', reward: '+25 XP', done: true },
  { label: 'Finish history essay outline', reward: '+55 XP', done: false },
]

const homeworkQueue = [
  {
    title: 'Quadratic Functions Worksheet',
    due: 'Due in 3 hours',
    tag: 'Priority',
  },
  {
    title: 'Photosynthesis Lab Reflection',
    due: 'Due tomorrow',
    tag: 'Science',
  },
  {
    title: 'Read chapter 8 + annotate themes',
    due: 'Due Friday',
    tag: 'English',
  },
]

const messages = [
  {
    role: 'ai',
    text: 'Upload a question, photo, or worksheet and I will turn it into clear steps, hints, and practice prompts.',
  },
  {
    role: 'student',
    text: 'Can you help me solve a projectile-motion problem without giving the full answer right away?',
  },
  {
    role: 'ai',
    text: 'Absolutely. I will start with the known values, identify the formula family, and ask you for the missing variable before we compute anything.',
  },
] as const

function buildAiResponse(prompt: string) {
  const normalized = prompt.toLowerCase()
  const detectedSubject = normalized.includes('essay')
    ? 'writing'
    : normalized.includes('physics') || normalized.includes('force')
      ? 'physics'
      : normalized.includes('history')
        ? 'history'
        : normalized.includes('bio') || normalized.includes('cell')
          ? 'biology'
          : 'math'

  const playbooks: Record<string, { steps: string[]; coach: string; practice: string }> = {
    math: {
      coach: 'I would help you isolate the variables, choose the right formula, and check units before calculating.',
      steps: ['Highlight what the question gives you.', 'Choose the equation that matches the unknown.', 'Solve one step at a time and verify with estimation.'],
      practice: 'Try rewriting the problem in your own words, then solve only the first algebra step.',
    },
    physics: {
      coach: 'I would map the known values, identify the governing principle, and explain why each formula applies.',
      steps: ['List every known quantity with units.', 'Draw the scenario and mark directions.', 'Pick the relationship that connects the unknown to what you know.'],
      practice: 'Before calculating, predict whether the answer should increase or decrease based on the setup.',
    },
    history: {
      coach: 'I would organize the key event, evidence, and significance so your answer sounds analytical instead of memorized.',
      steps: ['State the historical claim in one sentence.', 'Add 2 supporting facts or dates.', 'Explain why the event mattered in a broader context.'],
      practice: 'Turn your answer into a PEEL paragraph: point, evidence, explanation, link.',
    },
    biology: {
      coach: 'I would connect the vocabulary to the actual process happening in the system so it is easier to remember.',
      steps: ['Name the structure or process involved.', 'Describe what enters and leaves the system.', 'Link the process to its purpose in the organism.'],
      practice: 'Sketch the process with arrows and label each step from memory.',
    },
    writing: {
      coach: 'I would help you form a thesis, organize your evidence, and improve clarity sentence by sentence.',
      steps: ['Draft a one-line claim.', 'Choose evidence that best supports it.', 'Revise the paragraph so each sentence advances the same idea.'],
      practice: 'Write a thesis using because + why it matters, then test whether your evidence proves it.',
    },
  }

  const plan = playbooks[detectedSubject]
  return {
    subject: detectedSubject,
    coach: plan.coach,
    steps: plan.steps,
    practice: plan.practice,
    summary: `AI read your prompt: "${prompt.trim() || 'new homework task'}" and prepared a ${detectedSubject}-focused support path.`,
  }
}

function App() {
  const [activeTab, setActiveTab] = useState<TabId>('home')
  const [prompt, setPrompt] = useState("Help me study for tomorrow's algebra quiz on quadratic functions.")
  const [studentName] = useState('Maya')

  const activeReference = tabs.find((tab) => tab.id === activeTab) ?? tabs[0]
  const aiResponse = useMemo(() => buildAiResponse(prompt), [prompt])

  return (
    <div className="app-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">AI homework companion</span>
          <h1>StepWise helps students understand homework, not just finish it.</h1>
          <p>
            Built from the reference screens in this repo, this experience combines guided AI tutoring,
            assignment planning, streak-based motivation, and progress analytics in one polished student app.
          </p>
          <div className="hero-pills">
            <span><Sparkles size={16} /> Explain in steps</span>
            <span><CalendarCheck2 size={16} /> Plan due dates</span>
            <span><Trophy size={16} /> Keep motivation high</span>
          </div>
        </div>

        <div className="reference-card">
          <div className="reference-header">
            <div>
              <p className="reference-label">Reference matched</p>
              <h2>{activeReference.title}</h2>
            </div>
            <span>{activeReference.label}</span>
          </div>
          <img src={activeReference.image} alt={`${activeReference.label} reference`} />
          <p>{activeReference.subtitle}</p>
        </div>
      </section>

      <section className="experience-grid">
        <div className="phone-stage">
          <div className="phone-frame">
            <div className="status-row">
              <span>9:41</span>
              <div className="status-dots">
                <span />
                <span />
                <span />
              </div>
            </div>

            <main className="phone-content">
              {activeTab === 'home' && (
                <div className="screen screen-home">
                  <header className="screen-header">
                    <div>
                      <p className="muted">Good evening, {studentName}</p>
                      <h2>Ready for a focused study sprint?</h2>
                    </div>
                    <button className="ghost-button" type="button" aria-label="Notifications">
                      <BellBadge />
                    </button>
                  </header>

                  <div className="hero-card gradient-card">
                    <div>
                      <span className="inline-pill"><Brain size={14} /> AI study plan</span>
                      <h3>Tonight&apos;s smartest next steps</h3>
                      <p>
                        Finish algebra first, review the photosynthesis lab after dinner, and end with a 12-minute writing warm-up.
                      </p>
                    </div>
                    <button type="button">Open plan</button>
                  </div>

                  <div className="stats-row">
                    <div className="stat-card">
                      <Flame size={18} />
                      <strong>18 day streak</strong>
                      <span>Consistency is compounding.</span>
                    </div>
                    <div className="stat-card">
                      <Clock3 size={18} />
                      <strong>2h 15m today</strong>
                      <span>Well balanced across 3 subjects.</span>
                    </div>
                  </div>

                  <section className="card-section">
                    <div className="section-heading">
                      <h3>Due next</h3>
                      <button type="button">View all</button>
                    </div>
                    {homeworkQueue.map((item) => (
                      <article key={item.title} className="list-card">
                        <div>
                          <span className="tag">{item.tag}</span>
                          <h4>{item.title}</h4>
                          <p>{item.due}</p>
                        </div>
                        <ChevronRight size={18} />
                      </article>
                    ))}
                  </section>
                </div>
              )}

              {activeTab === 'homework' && (
                <div className="screen screen-homework">
                  <header className="screen-header">
                    <div>
                      <p className="muted">Homework helper</p>
                      <h2>Turn any question into a study path</h2>
                    </div>
                  </header>

                  <div className="upload-card">
                    <div>
                      <span className="inline-pill"><Upload size={14} /> Worksheet or screenshot</span>
                      <h3>Drop homework here</h3>
                      <p>Import a PDF, snap a photo, or paste a prompt and StepWise will explain it clearly.</p>
                    </div>
                    <div className="upload-actions">
                      <button type="button"><Camera size={16} /> Scan</button>
                      <button type="button" className="secondary"><Upload size={16} /> Upload</button>
                    </div>
                  </div>

                  <label className="prompt-card">
                    <span className="muted">Try the AI tutor</span>
                    <textarea
                      value={prompt}
                      onChange={(event) => setPrompt(event.target.value)}
                      rows={4}
                    />
                  </label>

                  <article className="ai-plan-card">
                    <div className="section-heading compact">
                      <div>
                        <span className="inline-pill solid"><Sparkles size={14} /> AI response</span>
                        <h3>{aiResponse.summary}</h3>
                      </div>
                    </div>
                    <p>{aiResponse.coach}</p>
                    <ol>
                      {aiResponse.steps.map((step) => (
                        <li key={step}>{step}</li>
                      ))}
                    </ol>
                    <div className="practice-box">
                      <Target size={16} />
                      <span>{aiResponse.practice}</span>
                    </div>
                  </article>

                  <section className="chat-thread">
                    {messages.map((message, index) => (
                      <div key={`${message.role}-${index}`} className={`bubble ${message.role}`}>
                        {message.text}
                      </div>
                    ))}
                  </section>
                </div>
              )}

              {activeTab === 'challenges' && (
                <div className="screen screen-challenges">
                  <header className="screen-header">
                    <div>
                      <p className="muted">Challenges</p>
                      <h2>Keep study momentum playful</h2>
                    </div>
                  </header>

                  <div className="hero-card orange-card">
                    <div>
                      <span className="inline-pill"><Zap size={14} /> Level 12 Scholar</span>
                      <h3>Daily XP target: 140</h3>
                      <p>You have already earned 95 XP. One more quest unlocks your weekend bonus pack.</p>
                    </div>
                    <div className="xp-ring">
                      <strong>68%</strong>
                    </div>
                  </div>

                  <section className="card-section">
                    <div className="section-heading">
                      <h3>Today&apos;s quests</h3>
                      <span className="muted">3 active</span>
                    </div>
                    {quests.map((quest) => (
                      <article key={quest.label} className="quest-card">
                        <div className={`quest-check ${quest.done ? 'done' : ''}`}>
                          <CheckCircle2 size={18} />
                        </div>
                        <div>
                          <h4>{quest.label}</h4>
                          <p>{quest.reward}</p>
                        </div>
                      </article>
                    ))}
                  </section>

                  <div className="leaderboard-card">
                    <div className="section-heading compact">
                      <h3>Class leaderboard</h3>
                      <button type="button">See more</button>
                    </div>
                    <div className="leaderboard-row current">
                      <span>#3</span>
                      <strong>{studentName}</strong>
                      <span>1,240 XP</span>
                    </div>
                    <div className="leaderboard-row">
                      <span>#1</span>
                      <strong>Jordan</strong>
                      <span>1,540 XP</span>
                    </div>
                    <div className="leaderboard-row">
                      <span>#2</span>
                      <strong>Ana</strong>
                      <span>1,310 XP</span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'progress' && (
                <div className="screen screen-progress">
                  <header className="screen-header">
                    <div>
                      <p className="muted">Progress insights</p>
                      <h2>Your understanding is improving steadily</h2>
                    </div>
                  </header>

                  <div className="hero-card teal-card">
                    <div>
                      <span className="inline-pill"><GraduationCap size={14} /> Weekly growth</span>
                      <h3>+11% mastery gain this week</h3>
                      <p>AI sessions are helping you reduce retry time and improve concept retention.</p>
                    </div>
                  </div>

                  <section className="chart-card">
                    <div className="section-heading compact">
                      <h3>Subject mastery</h3>
                      <span className="muted">Last 7 days</span>
                    </div>
                    <div className="bars">
                      {subjectStats.map((item) => (
                        <div className="bar-row" key={item.subject}>
                          <div className="bar-labels">
                            <span>{item.subject}</span>
                            <strong>{item.score}%</strong>
                          </div>
                          <div className="bar-track">
                            <div className="bar-fill" style={{ width: `${item.score}%`, background: item.accent }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <div className="insight-grid">
                    <article className="insight-card">
                      <Star size={18} />
                      <strong>Best focus block</strong>
                      <p>7:00 PM - 8:15 PM</p>
                    </article>
                    <article className="insight-card">
                      <MessageSquareText size={18} />
                      <strong>AI questions answered</strong>
                      <p>36 this week</p>
                    </article>
                  </div>
                </div>
              )}

              {activeTab === 'profile' && (
                <div className="screen screen-profile">
                  <header className="screen-header">
                    <div>
                      <p className="muted">Student profile</p>
                      <h2>{studentName} Cole</h2>
                    </div>
                  </header>

                  <div className="profile-card">
                    <div className="avatar">MC</div>
                    <div>
                      <h3>College-prep track</h3>
                      <p>Prefers guided hints first, then worked examples if stuck.</p>
                    </div>
                  </div>

                  <section className="card-section">
                    <div className="section-heading compact">
                      <h3>Goals this month</h3>
                    </div>
                    <article className="goal-card">
                      <div>
                        <strong>Raise physics score to 90%</strong>
                        <p>3 AI practice sessions left</p>
                      </div>
                      <span>78%</span>
                    </article>
                    <article className="goal-card">
                      <div>
                        <strong>Maintain 20-day study streak</strong>
                        <p>2 more days to unlock the badge</p>
                      </div>
                      <span>90%</span>
                    </article>
                  </section>

                  <section className="card-section">
                    <div className="section-heading compact">
                      <h3>Achievement shelf</h3>
                    </div>
                    <div className="badge-grid">
                      <div className="badge-card"><Flame size={18} /> Focus Fire</div>
                      <div className="badge-card"><Brain size={18} /> Concept Climber</div>
                      <div className="badge-card"><Trophy size={18} /> Quiz Crusher</div>
                      <div className="badge-card"><Sparkles size={18} /> AI Explorer</div>
                    </div>
                  </section>
                </div>
              )}
            </main>

            <nav className="tab-bar" aria-label="Primary">
              {tabs.map((tab) => {
                const Icon = tab.icon
                const isActive = activeTab === tab.id
                return (
                  <button
                    key={tab.id}
                    type="button"
                    className={isActive ? 'active' : ''}
                    onClick={() => setActiveTab(tab.id)}
                  >
                    <Icon size={18} />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>
        </div>

        <aside className="feature-rail">
          <div className="rail-card">
            <span className="eyebrow">Why this UX works</span>
            <h2>Designed for students who need clarity, momentum, and proof they are improving.</h2>
            <ul>
              <li><Brain size={16} /> AI explanations focus on process, not answer dumping.</li>
              <li><CalendarCheck2 size={16} /> The home screen prioritizes what is due next.</li>
              <li><Trophy size={16} /> Challenges turn consistency into visible rewards.</li>
              <li><ChartSpline size={16} /> Progress analytics reinforce growth over time.</li>
            </ul>
          </div>

          <div className="rail-card compact-gallery">
            <div className="section-heading compact">
              <h3>Reference gallery</h3>
              <span className="muted">From repo assets</span>
            </div>
            <div className="gallery-grid">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  className={`gallery-item ${activeTab === tab.id ? 'selected' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <img src={tab.image} alt={`${tab.label} reference thumbnail`} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  )
}

function BellBadge() {
  return (
    <div className="bell-badge">
      <span />
      <span />
      <span />
    </div>
  )
}

export default App
