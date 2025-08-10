import { type Activity, type Child } from '@/lib/mockData'

export interface GenerationPreferences {
  childIds: string[]
  weekStart: Date
  subjectFocus: string[]
  maxActivitiesPerDay: number
  difficultyLevel: 'easy' | 'medium' | 'challenging'
  includeFieldTrips: boolean
  includeGroupActivities: boolean
  avoidTimeSlots: string[]
}

interface GenerateActivitiesParams {
  preferences: GenerationPreferences
  children: Child[]
  existingActivities: Activity[]
}

export function createSystemPrompt(): string {
  return `You are an expert homeschool curriculum planner and educational consultant. Your task is to generate personalized, age-appropriate educational activities for homeschooled children.

You should:
1. Create engaging, hands-on learning activities
2. Align activities with grade-level standards
3. Consider each child's age and developmental stage
4. Balance different subjects throughout the week
5. Include clear learning objectives and outcomes
6. Provide practical materials lists using common household items when possible
7. Give step-by-step instructions that parents can easily follow

Format your response as a JSON array of activity objects with this exact structure:
{
  "activities": [
    {
      "childId": "string (IMPORTANT: Use the exact ID provided in parentheses after each child's name, NOT the child's name)",
      "title": "string (concise, descriptive title)",
      "subject": "string (Math, Science, Reading, Art, Music, PE, or History)",
      "description": "string (brief overview of the activity)",
      "day": "string (Monday through Friday)",
      "startTime": "string (HH:MM format, e.g., '09:00')",
      "endTime": "string (HH:MM format, e.g., '10:00')",
      "materials": ["array", "of", "material", "strings"],
      "instructions": ["array", "of", "step-by-step", "instruction", "strings"],
      "objectives": ["array", "of", "learning", "objective", "strings"]
    }
  ]
}

CRITICAL: The childId field MUST contain the UUID provided in parentheses (ID: xxx) after each child's name, NOT the child's name itself.`
}

export function createUserPrompt(params: GenerateActivitiesParams): string {
  const { preferences, children, existingActivities } = params
  
  // Get children details with their IDs
  const selectedChildren = preferences.childIds
    .map(id => children.find(c => c.id === id))
    .filter(Boolean)
  
  const childrenInfo = selectedChildren
    .map(child => `- ${child!.name} (ID: ${child!.id}): Age ${child!.age}, Grade ${child!.grade}, Interests: ${child!.interests?.join(', ') || 'general'}`)
    .join('\n')
  
  // Calculate week dates
  const weekStart = new Date(preferences.weekStart)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 4) // Monday to Friday
  
  // Build subject focus string
  const subjectFocus = preferences.subjectFocus.length > 0
    ? `Focus especially on these subjects: ${preferences.subjectFocus.join(', ')}`
    : 'Create a balanced curriculum across all subjects'
  
  // Build constraints
  const constraints = []
  constraints.push(`Maximum ${preferences.maxActivitiesPerDay} activities per child per day`)
  constraints.push(`Difficulty level: ${preferences.difficultyLevel}`)
  
  if (preferences.includeFieldTrips) {
    constraints.push('Include 1-2 field trip suggestions that relate to the weekly themes')
  }
  
  if (preferences.includeGroupActivities) {
    constraints.push('Include activities where multiple children can work together when age-appropriate')
  }
  
  if (preferences.avoidTimeSlots.length > 0) {
    constraints.push(`Avoid these time slots: ${preferences.avoidTimeSlots.join(', ')}`)
  }
  
  // Check for existing activities to avoid conflicts
  const existingInfo = existingActivities.length > 0
    ? `\nNote: There are already ${existingActivities.length} activities scheduled this week. Please avoid time conflicts.`
    : ''
  
  return `Generate a week of homeschool activities for the following children:
${childrenInfo}

Week: ${weekStart.toLocaleDateString()} to ${weekEnd.toLocaleDateString()}

Requirements:
${subjectFocus}

Constraints:
${constraints.join('\n')}
${existingInfo}

Additional guidelines:
- For younger children (ages 4-7), focus on play-based learning and shorter activities (30-45 minutes)
- For elementary age (8-11), include more structured learning with hands-on experiments and projects (45-60 minutes)
- For middle school (12+), incorporate independent research, critical thinking, and longer projects (60-90 minutes)
- Ensure activities are age-appropriate and can be realistically completed at home
- Include a mix of individual work, creative projects, and physical activities
- Consider the progression of skills throughout the week
- Make activities fun and engaging to maintain interest

Generate a complete weekly schedule with activities distributed across Monday through Friday.`
}

export function createEnhancedUserPrompt(
  params: GenerateActivitiesParams,
  customSettings: {
    customInstructions: string
    focusAreas: string[]
    avoidTopics: string[]
    temperature: number
    maxTokens: number
  }
): string {
  // Start with the base prompt
  let prompt = createUserPrompt(params)
  
  // Add custom instructions if provided
  if (customSettings.customInstructions) {
    prompt += `\n\nIMPORTANT CUSTOM INSTRUCTIONS:\n${customSettings.customInstructions}`
  }
  
  // Add focus areas if specified
  if (customSettings.focusAreas && customSettings.focusAreas.length > 0) {
    prompt += `\n\nPREFERRED FOCUS AREAS:\nPlease prioritize activities related to: ${customSettings.focusAreas.join(', ')}`
  }
  
  // Add topics to avoid if specified
  if (customSettings.avoidTopics && customSettings.avoidTopics.length > 0) {
    prompt += `\n\nTOPICS TO AVOID:\nDo NOT include activities related to: ${customSettings.avoidTopics.join(', ')}`
  }
  
  return prompt
}

export async function generateActivities(params: GenerateActivitiesParams): Promise<Activity[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    throw new Error('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.')
  }
  
  // Load custom AI settings from localStorage
  const userId = params.children[0]?.user_id
  let customSettings = {
    temperature: 0.7,
    maxTokens: 4000,
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
        maxTokens: parsed.maxTokens || 4000,
        customInstructions: parsed.customInstructions || '',
        focusAreas: parsed.focusAreas || [],
        avoidTopics: parsed.avoidTopics || []
      }
    }
  }
  
  // Create enhanced prompt with custom settings
  const enhancedUserPrompt = createEnhancedUserPrompt(params, customSettings)
  
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: createSystemPrompt()
          },
          {
            role: 'user',
            content: enhancedUserPrompt
          }
        ],
        temperature: customSettings.temperature,
        max_tokens: customSettings.maxTokens,
        response_format: { type: "json_object" }
      })
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => null)
      console.error('OpenAI API error:', errorData)
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`)
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content
    
    if (!content) {
      throw new Error('No content in OpenAI response')
    }
    
    const parsed = JSON.parse(content)
    const activities = parsed.activities || []
    
    // Calculate dates for each activity based on the day
    const mondayOfWeek = new Date(params.preferences.weekStart)
    const dayOfWeek = mondayOfWeek.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    mondayOfWeek.setDate(mondayOfWeek.getDate() + daysToMonday)
    
    const dayToOffset: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6
    }
    
    // Create a mapping of names to IDs in case AI uses names
    const nameToIdMap: Record<string, string> = {}
    params.children.forEach(child => {
      nameToIdMap[child.name.toLowerCase()] = child.id
    })
    
    // Transform and validate activities
    return activities.map((activity: any, index: number) => {
      const dayOffset = dayToOffset[activity.day] ?? 0
      const activityDate = new Date(mondayOfWeek)
      activityDate.setDate(mondayOfWeek.getDate() + dayOffset)
      
      // Handle childId - it might be the actual ID or the child's name
      let childId = activity.childId
      
      // If childId looks like a name (not a UUID), try to map it
      if (childId && !childId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const mappedId = nameToIdMap[childId.toLowerCase()]
        if (mappedId) {
          childId = mappedId
        } else {
          // If we can't map it, try to find a child with this name
          const child = params.children.find(c => c.name.toLowerCase() === childId.toLowerCase())
          if (child) {
            childId = child.id
          } else {
            console.error(`Could not find child ID for name: ${childId}`)
            // Use the first child as fallback
            childId = params.preferences.childIds[0]
          }
        }
      }
      
      return {
        id: `ai-generated-${Date.now()}-${index}`,
        childId: childId,
        title: activity.title,
        subject: activity.subject,
        description: activity.description,
        day: activity.day,
        date: activityDate.toISOString().split('T')[0],
        startTime: activity.startTime,
        endTime: activity.endTime,
        materials: activity.materials || [],
        instructions: activity.instructions || [],
        objectives: activity.objectives || [],
        enhanced: true
      } as Activity
    })
  } catch (error) {
    console.error('Error generating activities:', error)
    throw error
  }
}

// Fallback mock generation for development/testing
export async function generateMockActivities(params: GenerateActivitiesParams): Promise<Activity[]> {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  const { preferences, children } = params
  const activities: Activity[] = []
  const timeSlots = ['09:00', '10:00', '11:00', '13:00', '14:00']
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const subjects = preferences.subjectFocus.length > 0 ? preferences.subjectFocus : ['Math', 'Science', 'Reading', 'Art']
  
  const mondayOfWeek = new Date(preferences.weekStart)
  const dayOfWeek = mondayOfWeek.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  mondayOfWeek.setDate(mondayOfWeek.getDate() + daysToMonday)
  
  preferences.childIds.forEach(childId => {
    const child = children.find(c => c.id === childId)
    if (!child) return
    
    days.forEach((day, dayIndex) => {
      const activitiesForDay = Math.min(
        preferences.maxActivitiesPerDay,
        Math.floor(Math.random() * 3) + 1
      )
      
      for (let i = 0; i < activitiesForDay; i++) {
        const subject = subjects[Math.floor(Math.random() * subjects.length)]
        const time = timeSlots[i]
        
        const activityDate = new Date(mondayOfWeek)
        activityDate.setDate(mondayOfWeek.getDate() + dayIndex)
        
        activities.push({
          id: `mock-${Date.now()}-${Math.random()}`,
          childId,
          title: `${subject} Activity for ${child.name}`,
          subject,
          description: `Age-appropriate ${subject.toLowerCase()} activity for Grade ${child.grade}`,
          day,
          date: activityDate.toISOString().split('T')[0],
          startTime: time,
          endTime: getEndTime(time),
          materials: ['Paper', 'Pencils', 'Learning materials'],
          instructions: [
            'Prepare the learning space',
            'Introduce the concept',
            'Complete the activity',
            'Review and discuss'
          ],
          objectives: [
            `Understand ${subject.toLowerCase()} concepts`,
            'Develop critical thinking',
            'Apply knowledge practically'
          ],
          enhanced: true
        })
      }
    })
  })
  
  return activities
}

function getEndTime(startTime: string): string {
  const [hours, minutes] = startTime.split(':').map(Number)
  const endHours = hours + 1
  return `${String(endHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}