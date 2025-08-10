import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Slider } from '@/components/ui/slider'
import { X, Sparkles, Loader2, ChevronRight, ChevronDown, Info, AlertCircle, Zap, Layers } from 'lucide-react'
import { type Child, type Activity, subjects } from '@/lib/mockData'
import { generateActivities, generateMockActivities, type GenerationPreferences as OpenAIPreferences } from '@/lib/openai'
import { generateActivitiesMultiStep } from '@/lib/openai-multistep'
import { generateActivityConceptsOnly, type ActivityConcept } from '@/lib/openai-concepts'

interface GeneratePlanModalProps {
  isOpen: boolean
  onClose: () => void
  children: Child[]
  currentWeek: Date
  existingActivities: Activity[]
  onGenerate: (activities: Activity[]) => void
}

type GenerationPreferences = OpenAIPreferences

export default function GeneratePlanModal({
  isOpen,
  onClose,
  children,
  currentWeek,
  existingActivities,
  onGenerate
}: GeneratePlanModalProps) {
  const [step, setStep] = useState<'preferences' | 'generating' | 'concepts' | 'detailing' | 'preview' | 'error'>('preferences')
  const [error, setError] = useState<string | null>(null)
  const [activityConcepts, setActivityConcepts] = useState<ActivityConcept[]>([])
  const [selectedConcepts, setSelectedConcepts] = useState<Set<string>>(new Set())
  const [editingConcept, setEditingConcept] = useState<string | null>(null)
  const [generationProgress, setGenerationProgress] = useState({ step: '', progress: 0, message: '' })
  const [preferences, setPreferences] = useState<GenerationPreferences>({
    childIds: children.map(c => c.id),
    weekStart: currentWeek,
    subjectFocus: [],
    maxActivitiesPerDay: 3,
    difficultyLevel: 'medium',
    includeFieldTrips: false,
    includeGroupActivities: true,
    avoidTimeSlots: []
  })
  const [generatedActivities, setGeneratedActivities] = useState<Activity[]>([])
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set())
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleGenerateConcepts = async () => {
    setStep('generating')
    setError(null)
    
    try {
      // First, generate lightweight activity concepts
      const concepts = await generateActivityConceptsOnly({
        preferences,
        children,
        existingActivities
      })
      
      setActivityConcepts(concepts)
      setSelectedConcepts(new Set(concepts.map(c => c.id)))
      setStep('concepts')
    } catch (err) {
      console.error('Concept generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate activity concepts.')
      setStep('error')
    }
  }
  
  const handleGenerateDetails = async () => {
    setStep('detailing')
    setError(null)
    
    try {
      const selectedConceptsList = activityConcepts.filter(c => selectedConcepts.has(c.id))
      
      // Convert concepts to the format expected by multi-step
      const conceptsForGeneration = selectedConceptsList.map(concept => ({
        id: concept.id,
        childId: concept.childId,
        childName: concept.childName,
        title: concept.title,
        subject: concept.subject,
        day: concept.day,
        startTime: concept.startTime,
        endTime: concept.endTime,
        ageAppropriate: concept.ageAppropriate,
        conceptSummary: concept.conceptSummary || concept.description || ''
      }))
      
      // Generate full details for selected concepts with progress tracking
      const activities = await generateActivitiesMultiStep({
        preferences,
        children,
        existingActivities,
        concepts: conceptsForGeneration,
        onProgress: (progress) => {
          setGenerationProgress(progress)
        }
      })
      
      setGeneratedActivities(activities)
      setSelectedActivities(new Set(activities.map(a => a.id)))
      setStep('preview')
    } catch (err) {
      console.error('Detail generation error:', err)
      setError(err instanceof Error ? err.message : 'Failed to generate activity details.')
      setStep('error')
    }
  }

  const handleAccept = () => {
    const acceptedActivities = generatedActivities.filter(a => 
      selectedActivities.has(a.id)
    )
    onGenerate(acceptedActivities)
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Generate Weekly Plan
            </CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        {step === 'preferences' && (
          <>
            <CardContent className="space-y-6 overflow-y-auto">
              {/* Child Selection */}
              <div className="space-y-3">
                <Label>Select Children</Label>
                <div className="space-y-2">
                  {children.map(child => (
                    <div key={child.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={child.id}
                        checked={preferences.childIds.includes(child.id)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setPreferences({
                              ...preferences,
                              childIds: [...preferences.childIds, child.id]
                            })
                          } else {
                            setPreferences({
                              ...preferences,
                              childIds: preferences.childIds.filter(id => id !== child.id)
                            })
                          }
                        }}
                      />
                      <label
                        htmlFor={child.id}
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                      >
                        {child.emoji} {child.name} ({child.age} years, Grade {child.grade})
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              {/* Subject Focus */}
              <div className="space-y-3">
                <Label>Subject Focus (Optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {subjects.map(subject => (
                    <Button
                      key={subject}
                      variant={preferences.subjectFocus.includes(subject) ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (preferences.subjectFocus.includes(subject)) {
                          setPreferences({
                            ...preferences,
                            subjectFocus: preferences.subjectFocus.filter(s => s !== subject)
                          })
                        } else {
                          setPreferences({
                            ...preferences,
                            subjectFocus: [...preferences.subjectFocus, subject]
                          })
                        }
                      }}
                    >
                      {subject}
                    </Button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  Leave empty for a balanced schedule across all subjects
                </p>
              </div>

              {/* Activities Per Day */}
              <div className="space-y-3">
                <Label>Maximum Activities Per Day: {preferences.maxActivitiesPerDay}</Label>
                <Slider
                  value={[preferences.maxActivitiesPerDay]}
                  onValueChange={([value]) => 
                    setPreferences({ ...preferences, maxActivitiesPerDay: value })
                  }
                  min={1}
                  max={6}
                  step={1}
                  className="w-full"
                />
              </div>

              {/* Difficulty Level */}
              <div className="space-y-3">
                <Label>Difficulty Level</Label>
                <div className="flex gap-2">
                  {(['easy', 'medium', 'challenging'] as const).map(level => (
                    <Button
                      key={level}
                      variant={preferences.difficultyLevel === level ? "default" : "outline"}
                      size="sm"
                      onClick={() => setPreferences({ ...preferences, difficultyLevel: level })}
                      className="flex-1 capitalize"
                    >
                      {level}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Advanced Options */}
              <div className="space-y-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full justify-start"
                >
                  {showAdvanced ? <ChevronDown className="w-4 h-4 mr-2" /> : <ChevronRight className="w-4 h-4 mr-2" />}
                  Advanced Options
                </Button>
                
                {showAdvanced && (
                  <div className="space-y-3 pl-6">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="field-trips"
                        checked={preferences.includeFieldTrips}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, includeFieldTrips: checked as boolean })
                        }
                      />
                      <label htmlFor="field-trips" className="text-sm cursor-pointer">
                        Include field trip suggestions
                      </label>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="group-activities"
                        checked={preferences.includeGroupActivities}
                        onCheckedChange={(checked) => 
                          setPreferences({ ...preferences, includeGroupActivities: checked as boolean })
                        }
                      />
                      <label htmlFor="group-activities" className="text-sm cursor-pointer">
                        Include group activities for multiple children
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Box */}
              <div className="bg-muted/50 rounded-lg p-3 flex gap-2">
                <Info className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div className="text-sm text-muted-foreground">
                  <p>The AI will generate age-appropriate activities based on each child's profile, learning goals, and curriculum preferences.</p>
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button 
                onClick={handleGenerateConcepts}
                disabled={preferences.childIds.length === 0}
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Generate Ideas
              </Button>
            </CardFooter>
          </>
        )}
        
        {step === 'generating' && (
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Generating Activity Ideas</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md">
              Creating personalized activity concepts for your children...
            </p>
          </CardContent>
        )}
        
        {step === 'concepts' && (
          <>
            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="font-medium">Activity Concepts ({activityConcepts.length})</h3>
                    <p className="text-sm text-muted-foreground">
                      Review and select which activities to develop
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConcepts(new Set(activityConcepts.map(c => c.id)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedConcepts(new Set())}
                    >
                      Clear
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {activityConcepts.map(concept => {
                    const child = children.find(c => c.id === concept.childId)
                    const isEditing = editingConcept === concept.id
                    
                    return (
                      <div
                        key={concept.id}
                        className={`border rounded-lg p-3 transition-colors ${
                          selectedConcepts.has(concept.id) 
                            ? 'bg-primary/5 border-primary' 
                            : 'bg-background border-border'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedConcepts.has(concept.id)}
                            onCheckedChange={(checked) => {
                              const newSelected = new Set(selectedConcepts)
                              if (checked) {
                                newSelected.add(concept.id)
                              } else {
                                newSelected.delete(concept.id)
                              }
                              setSelectedConcepts(newSelected)
                            }}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            {isEditing ? (
                              <div className="space-y-2">
                                <input
                                  type="text"
                                  value={concept.title}
                                  onChange={(e) => {
                                    const updated = activityConcepts.map(c => 
                                      c.id === concept.id ? { ...c, title: e.target.value } : c
                                    )
                                    setActivityConcepts(updated)
                                  }}
                                  className="w-full px-2 py-1 border rounded text-sm"
                                  placeholder="Activity title"
                                />
                                <textarea
                                  value={concept.conceptSummary}
                                  onChange={(e) => {
                                    const updated = activityConcepts.map(c => 
                                      c.id === concept.id ? { ...c, conceptSummary: e.target.value } : c
                                    )
                                    setActivityConcepts(updated)
                                  }}
                                  className="w-full px-2 py-1 border rounded text-sm h-16"
                                  placeholder="Concept description"
                                />
                                <div className="flex gap-2">
                                  <Button size="sm" onClick={() => setEditingConcept(null)}>
                                    Save
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={() => setEditingConcept(null)}>
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <>
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-sm font-medium">{concept.title}</span>
                                  <span className="text-xs bg-muted px-2 py-0.5 rounded">{concept.subject}</span>
                                  {child && (
                                    <span className="text-xs">
                                      {child.emoji} {child.name}
                                    </span>
                                  )}
                                  <button
                                    onClick={() => setEditingConcept(concept.id)}
                                    className="ml-auto text-xs text-muted-foreground hover:text-foreground"
                                  >
                                    Edit
                                  </button>
                                </div>
                                <p className="text-xs text-muted-foreground mb-1">
                                  {concept.conceptSummary || concept.description}
                                </p>
                                <div className="flex gap-4 text-xs text-muted-foreground">
                                  <span>{concept.day}</span>
                                  <span>{concept.startTime} - {concept.endTime}</span>
                                  {concept.ageAppropriate && (
                                    <span className="text-green-600">✓ Age appropriate</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('preferences')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleGenerateConcepts}>
                  Regenerate Ideas
                </Button>
                <Button 
                  onClick={handleGenerateDetails}
                  disabled={selectedConcepts.size === 0}
                >
                  <Layers className="w-4 h-4 mr-2" />
                  Generate Full Details ({selectedConcepts.size})
                </Button>
              </div>
            </CardFooter>
          </>
        )}
        
        {step === 'detailing' && (
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-medium mb-2">Creating Detailed Activities</h3>
            <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
              {generationProgress.message || 'Generating comprehensive instructions and materials...'}
            </p>
            {generationProgress.progress > 0 && (
              <div className="w-full max-w-xs">
                <div className="bg-muted rounded-full h-2 overflow-hidden">
                  <div 
                    className="bg-primary h-full transition-all duration-300"
                    style={{ width: `${generationProgress.progress}%` }}
                  />
                </div>
                <p className="text-xs text-center mt-2 text-muted-foreground">
                  {generationProgress.progress}% complete
                </p>
              </div>
            )}
          </CardContent>
        )}
        
        {step === 'error' && (
          <>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <AlertCircle className="w-8 h-8 text-destructive mb-4" />
              <h3 className="text-lg font-medium mb-2">Generation Failed</h3>
              <p className="text-sm text-muted-foreground text-center max-w-md mb-4">
                {error}
              </p>
              {!import.meta.env.VITE_OPENAI_API_KEY && (
                <div className="bg-muted/50 rounded-lg p-3 max-w-md">
                  <p className="text-xs text-muted-foreground">
                    <strong>Note:</strong> OpenAI API key not configured. Add VITE_OPENAI_API_KEY to your .env file to use AI generation.
                    Currently using mock data.
                  </p>
                </div>
              )}
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('preferences')}>
                Back to Preferences
              </Button>
              <Button onClick={handleGenerateConcepts}>
                <Sparkles className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </CardFooter>
          </>
        )}
        
        {step === 'preview' && (
          <>
            <CardContent className="overflow-y-auto">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Generated Activities ({generatedActivities.length})</h3>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedActivities(new Set(generatedActivities.map(a => a.id)))}
                    >
                      Select All
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedActivities(new Set())}
                    >
                      Deselect All
                    </Button>
                  </div>
                </div>
                
                <div className="space-y-2">
                  {generatedActivities.map(activity => {
                    const child = children.find(c => c.id === activity.childId)
                    return (
                      <div
                        key={activity.id}
                        className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                          selectedActivities.has(activity.id) 
                            ? 'bg-primary/5 border-primary' 
                            : 'hover:bg-muted/50'
                        }`}
                        onClick={() => {
                          const newSelected = new Set(selectedActivities)
                          if (newSelected.has(activity.id)) {
                            newSelected.delete(activity.id)
                          } else {
                            newSelected.add(activity.id)
                          }
                          setSelectedActivities(newSelected)
                        }}
                      >
                        <div className="flex items-start gap-3">
                          <Checkbox
                            checked={selectedActivities.has(activity.id)}
                            onCheckedChange={() => {}}
                            className="mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-sm font-medium">{activity.title}</span>
                              <span className="text-xs bg-muted px-2 py-0.5 rounded">{activity.subject}</span>
                              {child && (
                                <span className="text-xs">
                                  {child.emoji} {child.name}
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">{activity.description}</p>
                            <div className="flex gap-4 text-xs text-muted-foreground">
                              <span>{activity.day}</span>
                              <span>{activity.startTime} - {activity.endTime}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </CardContent>
            
            <CardFooter className="flex justify-between">
              <Button variant="outline" onClick={() => setStep('preferences')}>
                Back
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => {
                  setStep('concepts')
                  handleGenerateConcepts()
                }}>
                  Regenerate
                </Button>
                <Button 
                  onClick={handleAccept}
                  disabled={selectedActivities.size === 0}
                >
                  Add {selectedActivities.size} Activities
                </Button>
              </div>
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  )
}

