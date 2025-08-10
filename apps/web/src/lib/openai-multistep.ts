import { type Activity, type Child } from '@/lib/mockData'
import { type GenerationPreferences } from './openai'

interface ActivityOutline {
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
}

interface GenerationStep {
  step: 'outline' | 'details' | 'materials' | 'enrichment'
  progress: number
  currentActivity?: string
  message: string
}

type ProgressCallback = (step: GenerationStep) => void

/**
 * Multi-step generation that builds context progressively
 * More efficient token usage by carrying context forward
 */
export async function generateActivitiesMultiStep(
  params: {
    preferences: GenerationPreferences
    children: Child[]
    existingActivities: Activity[]
    concepts?: ActivityOutline[]  // Optional: use provided concepts
    onProgress?: ProgressCallback
  }
): Promise<Activity[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  if (!apiKey) {
    throw new Error('OpenAI API key not configured')
  }

  const { preferences, children, existingActivities, onProgress } = params
  
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

  try {
    // Step 1: Use provided concepts or generate outline
    let outline: ActivityOutline[]
    
    if (params.concepts && params.concepts.length > 0) {
      // Use provided concepts
      outline = params.concepts
      onProgress?.({
        step: 'outline',
        progress: 25,
        message: `Using ${outline.length} selected concepts`
      })
    } else {
      // Generate Week Outline (lightweight - ~500 tokens)
      onProgress?.({
        step: 'outline',
        progress: 0,
        message: 'Creating weekly activity outline...'
      })
      
      outline = await generateWeekOutline(
        preferences,
        children,
        customSettings,
        apiKey
      )
      
      onProgress?.({
        step: 'outline',
        progress: 25,
        message: `Generated ${outline.length} activity concepts`
      })
    }

    // Step 2: Generate Detailed Instructions (focused - ~300 tokens per activity)
    const activities: Activity[] = []
    
    for (let i = 0; i < outline.length; i++) {
      const item = outline[i]
      
      onProgress?.({
        step: 'details',
        progress: 25 + (50 * i / outline.length),
        currentActivity: item.title,
        message: `Generating details for: ${item.title}`
      })
      
      const details = await generateActivityDetails(
        item,
        children.find(c => c.id === item.childId)!,
        customSettings,
        apiKey
      )
      
      activities.push(details)
      
      // Small delay to avoid rate limiting
      if (i < outline.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100))
      }
    }

    // Step 3: Enrich with materials and cross-curricular connections (batch - ~800 tokens)
    onProgress?.({
      step: 'materials',
      progress: 75,
      message: 'Adding materials lists and learning connections...'
    })
    
    const enrichedActivities = await enrichActivities(
      activities,
      children,
      customSettings,
      apiKey
    )

    // Step 4: Final optimization and week cohesion
    onProgress?.({
      step: 'enrichment',
      progress: 90,
      message: 'Optimizing weekly progression and themes...'
    })
    
    const finalActivities = await optimizeWeekCohesion(
      enrichedActivities,
      preferences,
      apiKey
    )

    onProgress?.({
      step: 'enrichment',
      progress: 100,
      message: 'Generation complete!'
    })

    return finalActivities
  } catch (error) {
    console.error('Multi-step generation error:', error)
    throw error
  }
}

/**
 * Step 1: Generate lightweight outline of activities
 * ~500-700 tokens total
 */
async function generateWeekOutline(
  preferences: GenerationPreferences,
  children: Child[],
  customSettings: any,
  apiKey: string
): Promise<ActivityOutline[]> {
  const childrenInfo = preferences.childIds
    .map(id => children.find(c => c.id === id))
    .filter(Boolean)
    .map(child => `${child!.name} (ID: ${child!.id}): Age ${child!.age}, Grade ${child!.grade}`)
    .join('\n')

  const prompt = `Create a week outline of homeschool activities.

Children:
${childrenInfo}

Requirements:
- ${preferences.maxActivitiesPerDay} activities max per child per day
- Focus: ${customSettings.focusAreas?.join(', ') || 'balanced curriculum'}
- Avoid: ${customSettings.avoidTopics?.join(', ') || 'none'}
- Level: ${preferences.difficultyLevel}
${customSettings.customInstructions ? `\nSpecial: ${customSettings.customInstructions}` : ''}

Return a JSON array of activity outlines:
[{
  "id": "temp-1",
  "childId": "[exact UUID from above]",
  "childName": "[child name]",
  "title": "[concise activity name]",
  "subject": "[Math/Science/Reading/Art/Music/PE/History]",
  "day": "[Monday-Friday]",
  "startTime": "[HH:MM]",
  "endTime": "[HH:MM]",
  "ageAppropriate": true,
  "conceptSummary": "[one sentence core concept]"
}]

Create a balanced, progressive week. Just the outline, no details yet.`

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
          content: 'You are an expert homeschool curriculum designer. Create concise, well-structured activity outlines.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: customSettings.temperature * 0.8, // Slightly lower for consistency
      max_tokens: 1000,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)
  
  const data = await response.json()
  let content
  
  try {
    content = JSON.parse(data.choices[0].message.content)
  } catch (parseError) {
    console.error('Failed to parse AI response:', data.choices[0].message.content)
    // Try to extract JSON from the response if it's wrapped in text
    const jsonMatch = data.choices[0].message.content.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        content = JSON.parse(jsonMatch[0])
      } catch (e) {
        throw new Error('Invalid JSON response from AI')
      }
    } else {
      throw new Error('Could not parse AI response')
    }
  }
  
  // Fix any ID mapping issues
  const activities = content.activities || content.outline || content || []
  return activities.map((item: any) => ({
    ...item,
    childId: validateAndFixChildId(item.childId, item.childName, children)
  }))
}

/**
 * Step 2: Generate detailed content for each activity
 * ~300-400 tokens per activity
 */
async function generateActivityDetails(
  outline: ActivityOutline,
  child: Child,
  customSettings: any,
  apiKey: string
): Promise<Activity> {
  const prompt = `Create detailed instructions for this activity:

Activity: ${outline.title}
Subject: ${outline.subject}
Child: ${child.name}, Age ${child.age}, Grade ${child.grade}
Concept: ${outline.conceptSummary}
Duration: ${outline.startTime} - ${outline.endTime}

Generate:
1. Clear description (2-3 sentences)
2. Step-by-step instructions (4-6 steps)
3. Learning objectives (2-3 goals)

Return JSON:
{
  "description": "...",
  "instructions": ["step1", "step2", ...],
  "objectives": ["goal1", "goal2", ...]
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo', // Cheaper for detail generation
      messages: [
        {
          role: 'system',
          content: `You are an expert educator. Create clear, age-appropriate activity instructions for ${child.age}-year-olds.`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: customSettings.temperature,
      max_tokens: 400,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)
  
  const data = await response.json()
  let details
  
  try {
    details = JSON.parse(data.choices[0].message.content)
  } catch (parseError) {
    console.error('Failed to parse details:', data.choices[0].message.content)
    // Provide fallback details
    details = {
      description: outline.conceptSummary || 'Engaging educational activity',
      instructions: [
        'Prepare materials',
        'Introduce the concept',
        'Guide through the activity',
        'Review and discuss'
      ],
      objectives: [
        'Learn key concepts',
        'Develop skills',
        'Apply knowledge'
      ]
    }
  }
  
  // Calculate date
  const mondayOfWeek = getMondayOfWeek(new Date())
  const dayOffset = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].indexOf(outline.day)
  const activityDate = new Date(mondayOfWeek)
  activityDate.setDate(mondayOfWeek.getDate() + dayOffset)
  
  return {
    id: `ai-${Date.now()}-${Math.random()}`,
    childId: outline.childId,
    title: outline.title,
    subject: outline.subject,
    description: details.description,
    day: outline.day,
    date: activityDate.toISOString().split('T')[0],
    startTime: outline.startTime,
    endTime: outline.endTime,
    materials: [], // Will be added in step 3
    instructions: details.instructions,
    objectives: details.objectives,
    enhanced: true
  }
}

/**
 * Step 3: Batch enrich activities with materials
 * ~800 tokens for all activities
 */
async function enrichActivities(
  activities: Activity[],
  children: Child[],
  customSettings: any,
  apiKey: string
): Promise<Activity[]> {
  const activitiesSummary = activities.map(a => ({
    title: a.title,
    subject: a.subject,
    age: children.find(c => c.id === a.childId)?.age
  }))

  const prompt = `Generate materials lists for these activities:

${JSON.stringify(activitiesSummary, null, 2)}

For each activity, provide common household materials and supplies needed.
Consider age-appropriateness and safety.

Return JSON:
{
  "materials": {
    "[activity title]": ["material1", "material2", ...]
  }
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are an expert educator. Suggest practical, affordable materials for homeschool activities.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.5, // Lower for consistent materials
      max_tokens: 800,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`)
  
  const data = await response.json()
  const materials = JSON.parse(data.choices[0].message.content).materials
  
  return activities.map(activity => ({
    ...activity,
    materials: materials[activity.title] || ['Paper', 'Pencils', 'Learning materials']
  }))
}

/**
 * Step 4: Optimize week cohesion and progression
 * ~500 tokens
 */
async function optimizeWeekCohesion(
  activities: Activity[],
  preferences: GenerationPreferences,
  apiKey: string
): Promise<Activity[]> {
  // Group activities by child and day
  const weekStructure = activities.reduce((acc, activity) => {
    const key = `${activity.childId}-${activity.day}`
    if (!acc[key]) acc[key] = []
    acc[key].push(activity.title)
    return acc
  }, {} as Record<string, string[]>)

  const prompt = `Review this week's activities and suggest minor title/description improvements for better progression:

${JSON.stringify(weekStructure, null, 2)}

Suggest any title tweaks to show skill progression through the week.
Keep suggestions minimal and optional.

Return JSON:
{
  "improvements": {
    "[current title]": {
      "newTitle": "[improved title or null]",
      "themeConnection": "[how it connects to week theme]"
    }
  }
}`

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: 'You are a curriculum designer. Suggest minor improvements for weekly cohesion.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.3, // Very low for minor tweaks only
      max_tokens: 500,
      response_format: { type: "json_object" }
    })
  })

  if (!response.ok) {
    // If optimization fails, just return activities as-is
    console.warn('Week optimization failed, using activities as-is')
    return activities
  }
  
  try {
    const data = await response.json()
    const improvements = JSON.parse(data.choices[0].message.content).improvements || {}
    
    return activities.map(activity => {
      const improvement = improvements[activity.title]
      if (improvement?.newTitle) {
        return {
          ...activity,
          title: improvement.newTitle,
          description: `${activity.description} ${improvement.themeConnection ? `(${improvement.themeConnection})` : ''}`
        }
      }
      return activity
    })
  } catch (e) {
    // If parsing fails, return as-is
    return activities
  }
}

// Helper functions
function getMondayOfWeek(date: Date): Date {
  const d = new Date(date)
  const day = d.getDay()
  const diff = d.getDate() - day + (day === 0 ? -6 : 1)
  return new Date(d.setDate(diff))
}

function validateAndFixChildId(
  childId: string,
  childName: string,
  children: Child[]
): string {
  // If it's already a valid UUID, return it
  if (childId && childId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
    return childId
  }
  
  // Try to find by name
  const child = children.find(c => 
    c.name.toLowerCase() === (childName || childId || '').toLowerCase()
  )
  
  return child?.id || children[0]?.id || childId
}