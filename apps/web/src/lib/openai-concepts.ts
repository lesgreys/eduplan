import { type Activity, type Child } from '@/lib/mockData'
import { type GenerationPreferences } from './openai'

export interface ActivityConcept {
  id: string
  childId: string
  childName: string
  title: string
  subject: string
  day: string
  startTime: string
  endTime: string
  ageAppropriate: boolean
  conceptSummary: string
  description?: string
}

/**
 * Generate only lightweight activity concepts (prompts) that users can review
 * This is extremely efficient - only ~500-700 tokens for a full week
 */
export async function generateActivityConceptsOnly(params: {
  preferences: GenerationPreferences
  children: Child[]
  existingActivities: Activity[]
}): Promise<ActivityConcept[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    // Return mock concepts for testing
    return generateMockConcepts(params.preferences, params.children)
  }

  const { preferences, children } = params
  
  // Load custom settings
  const userId = children[0]?.user_id
  let customSettings = {
    temperature: 0.7,
    customInstructions: '',
    focusAreas: [] as string[],
    avoidTopics: [] as string[]
  }
  
  if (userId) {
    const savedSettings = localStorage.getItem(`ai_settings_${userId}`)
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings)
      customSettings = {
        temperature: parsed.temperature || 0.7,
        customInstructions: parsed.customInstructions || '',
        focusAreas: parsed.focusAreas || [],
        avoidTopics: parsed.avoidTopics || []
      }
    }
  }

  const childrenInfo = preferences.childIds
    .map(id => children.find(c => c.id === id))
    .filter(Boolean)
    .map(child => `${child!.name} (ID: ${child!.id}): Age ${child!.age}, Grade ${child!.grade}`)
    .join('\n')

  const prompt = `Create a week of homeschool activity concepts. These are just IDEAS/PROMPTS, not full activities yet.

Children:
${childrenInfo}

Requirements:
- ${preferences.maxActivitiesPerDay} activities max per child per day
- Focus: ${customSettings.focusAreas?.join(', ') || 'balanced curriculum'}
- Avoid: ${customSettings.avoidTopics?.join(', ') || 'none'}
- Difficulty: ${preferences.difficultyLevel}
${customSettings.customInstructions ? `\nSpecial instructions: ${customSettings.customInstructions}` : ''}

Generate creative, engaging activity CONCEPTS (not full details).
Each concept should be:
- Age-appropriate
- Clearly titled
- Briefly summarized (one sentence)
- Scheduled appropriately

Return JSON array:
{
  "concepts": [
    {
      "id": "concept-1",
      "childId": "[use exact UUID from above]",
      "childName": "[child name]",
      "title": "[catchy, clear activity title]",
      "subject": "[Math/Science/Reading/Art/Music/PE/History]",
      "day": "[Monday-Friday]",
      "startTime": "[HH:MM format]",
      "endTime": "[HH:MM format]",
      "ageAppropriate": true,
      "conceptSummary": "[one engaging sentence about what they'll learn/do]"
    }
  ]
}

Be creative! These are prompts the parent will review and can edit before generating full details.`

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo', // Cheaper model for concept generation
        messages: [
          {
            role: 'system',
            content: 'You are a creative homeschool curriculum designer. Generate engaging, age-appropriate activity concepts.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: customSettings.temperature * 1.1, // Slightly higher for creativity
        max_tokens: 1200,
        response_format: { type: "json_object" }
      })
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = JSON.parse(data.choices[0].message.content)
    const concepts = content.concepts || []
    
    // Validate and fix child IDs
    return concepts.map((concept: ActivityConcept) => ({
      ...concept,
      id: `concept-${Date.now()}-${Math.random()}`,
      childId: validateChildId(concept.childId, concept.childName, children)
    }))
  } catch (error) {
    console.error('Error generating concepts:', error)
    throw error
  }
}

/**
 * Generate mock concepts for testing
 */
export function generateMockConcepts(
  preferences: GenerationPreferences,
  children: Child[]
): ActivityConcept[] {
  const concepts: ActivityConcept[] = []
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const timeSlots = ['09:00', '10:30', '13:00', '14:30', '16:00', '17:30', '19:00']
  
  const activityIdeas = [
    { title: 'Nature Math Hunt', subject: 'Math', summary: 'Find and count patterns in nature while learning multiplication' },
    { title: 'Kitchen Chemistry', subject: 'Science', summary: 'Safe experiments using household items to explore chemical reactions' },
    { title: 'Story Building Workshop', subject: 'Reading', summary: 'Create original stories using picture prompts and vocabulary cards' },
    { title: 'Rhythm & Fractions', subject: 'Music', summary: 'Learn fractions through musical beats and rhythm patterns' },
    { title: 'Map Your World', subject: 'History', summary: 'Create maps of your neighborhood and learn about local history' },
    { title: 'Artistic Symmetry', subject: 'Art', summary: 'Explore symmetry through painting and paper folding' },
    { title: 'Obstacle Olympics', subject: 'PE', summary: 'Design and complete physical challenges while timing and measuring' },
    { title: 'Coding Unplugged', subject: 'Science', summary: 'Learn programming concepts through physical games and puzzles' },
    { title: 'Poetry Cafe', subject: 'Reading', summary: 'Write and perform original poems in a cozy cafe setting' },
    { title: 'Math Bakery', subject: 'Math', summary: 'Practice measurements and fractions while baking treats' }
  ]
  
  preferences.childIds.forEach(childId => {
    const child = children.find(c => c.id === childId)
    if (!child) return
    
    days.forEach((day) => {
      const activitiesForDay = Math.min(
        preferences.maxActivitiesPerDay,
        Math.floor(Math.random() * 2) + 2
      )
      
      for (let i = 0; i < activitiesForDay; i++) {
        const idea = activityIdeas[Math.floor(Math.random() * activityIdeas.length)]
        const startTime = timeSlots[i] || '15:30'
        
        concepts.push({
          id: `concept-${Date.now()}-${Math.random()}`,
          childId: child.id,
          childName: child.name,
          title: idea.title,
          subject: idea.subject,
          day,
          startTime,
          endTime: getEndTime(startTime),
          ageAppropriate: true,
          conceptSummary: idea.summary
        })
      }
    })
  })
  
  return concepts
}

function validateChildId(childId: string, childName: string, children: Child[]): string {
  // If it's already a valid UUID, return it
  if (childId?.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return childId
  }
  
  // Try to find by name
  const child = children.find(c => 
    c.name.toLowerCase() === (childName || childId || '').toLowerCase()
  )
  
  return child?.id || children[0]?.id || childId
}

function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + 1
  const endMinutes = minutes === 30 ? 0 : 30
  return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
}