export interface Child {
  id: string
  name: string
  age: string
  grade: string
  goals: string[]
  curriculumTypes: string[]
  notes: string
  color: string
  emoji: string
  user_id?: string
  interests?: string[]
}

export interface Activity {
  id: string
  childId: string
  title: string
  subject: string
  description: string
  day: string
  date?: string  // ISO date string (YYYY-MM-DD)
  startTime: string
  endTime: string
  materials?: string[]
  instructions?: string[]
  objectives?: string[]
  enhanced: boolean
  status?: 'pending' | 'completed' | 'skipped'
  completedAt?: string
  recurring?: boolean
  recurrenceRule?: 'weekly' | 'biweekly' | 'monthly'
}

// Mock children data (would come from onboarding)
export const mockChildren: Child[] = [
  {
    id: '1',
    name: 'Emma',
    age: '8',
    grade: '3rd Grade',
    goals: ['STEM Focus', 'Arts & Creativity', 'Language Learning'],
    curriculumTypes: ['Montessori', 'Project-Based'],
    notes: 'Loves hands-on activities and science experiments',
    color: 'bg-purple-200',
    emoji: '🦄'
  },
  {
    id: '2',
    name: 'Luna',
    age: '3',
    grade: 'Pre-K',
    goals: ['STEM Focus', 'Arts & Creativity', 'Language Learning'],
    curriculumTypes: ['Montessori', 'Project-Based'],
    notes: 'Loves hands-on activities and science experiments',
    color: 'bg-blue-200',
    emoji: '🦄'
  }
]

// Mock activities
export const mockActivities: Activity[] = [
  {
    id: '1',
    childId: '1',
    title: 'Math Patterns',
    subject: 'Mathematics',
    description: 'Exploring number patterns and sequences',
    day: 'Monday',
    startTime: '09:00',
    endTime: '10:00',
    enhanced: true,
    materials: ['Pattern blocks', 'Number cards', 'Worksheet'],
    instructions: [
      'Start with simple AB patterns',
      'Progress to ABC patterns',
      'Create own patterns'
    ],
    objectives: ['Recognize patterns', 'Predict sequences', 'Create patterns']
  },
  {
    id: '2',
    childId: '2',
    title: 'Story Time',
    subject: 'Language Arts',
    description: 'Reading comprehension and discussion',
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    enhanced: false
  },
  {
    id: '3',
    childId: '3',
    title: 'Story Time',
    subject: 'Language Arts',
    description: 'Reading comprehension and discussion',
    day: 'Monday',
    startTime: '10:00',
    endTime: '11:00',
    enhanced: false
  }
]

export const timeSlots = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', 
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
]

export const weekDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export const subjects = [
  'Mathematics',
  'Language Arts',
  'Science',
  'Social Studies',
  'Art',
  'Music',
  'Physical Education',
  'Life Skills',
  'Free Play'
]

export const childColors = [
  { bg: 'bg-purple-200', border: 'border-purple-400', text: 'text-purple-900' },
  { bg: 'bg-blue-200', border: 'border-blue-400', text: 'text-blue-900' },
  { bg: 'bg-green-200', border: 'border-green-400', text: 'text-green-900' },
  { bg: 'bg-yellow-200', border: 'border-yellow-400', text: 'text-yellow-900' },
  { bg: 'bg-pink-200', border: 'border-pink-400', text: 'text-pink-900' }
]