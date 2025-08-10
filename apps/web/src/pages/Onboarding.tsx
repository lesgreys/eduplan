import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, X, GraduationCap, User, Sparkles, BookOpen, StickyNote, Check, Edit2 } from 'lucide-react'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { createChild } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import { Alert, AlertDescription } from '@/components/ui/alert'

interface Child {
  id: string
  name: string
  age: string
  grade: string
  goals: string[]
  curriculumTypes: string[]
  notes: string
  notesCompleted: boolean // Track if user has interacted with notes section
  color?: string
  emoji?: string
}

const educationGoals = [
  'College Prep',
  'STEM Focus',
  'Arts & Creativity',
  'Language Learning',
  'Special Needs',
  'Religious Studies',
  'Life Skills',
  'Advanced Academics',
  'Sports & PE',
  'Social Skills'
]

const curriculumOptions = [
  'Traditional Textbooks',
  'Online Learning',
  'Project-Based',
  'Montessori',
  'Charlotte Mason',
  'Classical Education',
  'Unit Studies',
  'Unschooling',
  'Waldorf/Steiner',
  'Eclectic Mix'
]

type SectionType = 'info' | 'goals' | 'curriculum' | 'notes' | 'complete'

export default function Onboarding() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null)
  const [activeSection, setActiveSection] = useState<SectionType>('info')
  const [newChildName, setNewChildName] = useState('')
  const [newChildAge, setNewChildAge] = useState('')
  const [newChildGrade, setNewChildGrade] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const selectedChild = children.find(c => c.id === selectedChildId)

  const addChild = () => {
    if (newChildName && newChildAge) {
      const colors = ['bg-purple-200', 'bg-blue-200', 'bg-green-200', 'bg-yellow-200', 'bg-pink-200']
      const emojis = ['🦄', '🚀', '🌟', '🎨', '🌈', '🦋', '🐢', '🦊']
      
      const newChild: Child = {
        id: Date.now().toString(),
        name: newChildName,
        age: newChildAge,
        grade: newChildGrade,
        goals: [],
        curriculumTypes: [],
        notes: '',
        notesCompleted: false,
        color: colors[children.length % colors.length],
        emoji: emojis[children.length % emojis.length]
      }
      setChildren([...children, newChild])
      setSelectedChildId(newChild.id)
      setNewChildName('')
      setNewChildAge('')
      setNewChildGrade('')
      setActiveSection('goals')
    }
  }

  const removeChild = (id: string) => {
    const newChildren = children.filter(child => child.id !== id)
    setChildren(newChildren)
    if (selectedChildId === id) {
      setSelectedChildId(newChildren[0]?.id || null)
    }
  }

  const toggleGoal = (childId: string, goal: string) => {
    setChildren(children.map(child => {
      if (child.id === childId) {
        const goals = child.goals.includes(goal)
          ? child.goals.filter(g => g !== goal)
          : [...child.goals, goal]
        return { ...child, goals }
      }
      return child
    }))
  }

  const toggleCurriculum = (childId: string, curriculum: string) => {
    setChildren(children.map(child => {
      if (child.id === childId) {
        let curriculumTypes = [...child.curriculumTypes]
        
        if (curriculumTypes.includes(curriculum)) {
          curriculumTypes = curriculumTypes.filter(c => c !== curriculum)
        } else {
          if (curriculumTypes.length >= 2) {
            curriculumTypes = [curriculumTypes[1], curriculum]
          } else {
            curriculumTypes.push(curriculum)
          }
        }
        
        return { ...child, curriculumTypes }
      }
      return child
    }))
  }

  const updateNotes = (childId: string, notes: string) => {
    setChildren(children.map(child => 
      child.id === childId ? { ...child, notes } : child
    ))
  }

  const markNotesCompleted = (childId: string) => {
    setChildren(children.map(child => 
      child.id === childId ? { ...child, notesCompleted: true } : child
    ))
  }

  const handleComplete = async () => {
    if (!user) return
    
    setSaving(true)
    setError(null)
    
    try {
      // Save each child to the database
      for (const child of children) {
        if (isChildComplete(child)) {
          await createChild({
            user_id: user.id,
            name: child.name,
            age: child.age,
            grade: child.grade || '',
            goals: child.goals,
            curriculumTypes: child.curriculumTypes,
            notes: child.notes || '',
            color: child.color || 'bg-purple-200',
            emoji: child.emoji || '🦄'
          })
        }
      }
      
      // Update user metadata to mark onboarding as complete
      const { error: updateError } = await supabase.auth.updateUser({
        data: { onboarding_completed: true }
      })
      
      if (updateError) throw updateError
      
      // Navigate to dashboard
      navigate('/dashboard')
    } catch (err) {
      console.error('Error saving children:', err)
      setError('Failed to save children. Please try again.')
      setSaving(false)
    }
  }

  const isChildComplete = (child: Child) => {
    return child.goals.length >= 3 && child.curriculumTypes.length > 0 && child.notesCompleted
  }

  const allChildrenComplete = children.length > 0 && children.every(isChildComplete)

  // Calculate section statuses for selected child
  const getSectionStatus = (section: SectionType): 'locked' | 'active' | 'complete' => {
    if (!selectedChild) return 'locked'
    
    switch(section) {
      case 'info':
        return 'complete'
      case 'goals':
        return selectedChild.goals.length >= 3 ? 'complete' : 'active'
      case 'curriculum':
        if (selectedChild.goals.length < 3) return 'locked'
        return selectedChild.curriculumTypes.length > 0 ? 'complete' : 'active'
      case 'notes':
        if (selectedChild.goals.length < 3 || selectedChild.curriculumTypes.length === 0) return 'locked'
        return selectedChild.notesCompleted ? 'complete' : 'active'
      default:
        return 'locked'
    }
  }

  const handleSectionClick = (section: SectionType) => {
    const status = getSectionStatus(section)
    if (status !== 'locked') {
      setActiveSection(section)
    }
  }

  // Check if current section requirements are met
  const canProceedToNext = () => {
    if (!selectedChild) return false
    
    switch(activeSection) {
      case 'goals':
        return selectedChild.goals.length >= 3
      case 'curriculum':
        return selectedChild.curriculumTypes.length > 0
      default:
        return false
    }
  }

  const getNextSection = (): SectionType | null => {
    switch(activeSection) {
      case 'info':
        return 'goals'
      case 'goals':
        return 'curriculum'
      case 'curriculum':
        return 'notes'
      default:
        return null
    }
  }

  const proceedToNextSection = () => {
    const next = getNextSection()
    if (next) {
      setActiveSection(next)
    }
  }

  const sections = [
    { id: 'info' as SectionType, label: 'Child Info', icon: User },
    { id: 'goals' as SectionType, label: 'Education Goals', icon: Sparkles },
    { id: 'curriculum' as SectionType, label: 'Curriculum', icon: BookOpen },
    { id: 'notes' as SectionType, label: 'Notes', icon: StickyNote }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      {/* Theme Toggle in top right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto mb-4 w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-3xl font-light mb-2">Set Up Your Family Profile</h1>
          <p className="text-muted-foreground">Add your children and customize their education journey</p>
        </div>

        {/* Child Tabs */}
        {children.length > 0 && activeSection !== 'complete' && (
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {children.map(child => (
              <button
                key={child.id}
                onClick={() => setSelectedChildId(child.id)}
                className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-all ${
                  selectedChildId === child.id
                    ? 'bg-primary/15 border-primary text-primary-foreground'
                    : 'bg-background border-border hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span>{child.name}</span>
                  {isChildComplete(child) && (
                    <Check className="w-4 h-4 text-green-600" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      removeChild(child.id)
                    }}
                    className="ml-2"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </button>
            ))}
            <button
              onClick={() => {
                setSelectedChildId(null)
                setActiveSection('info')
              }}
              className="px-4 py-2 rounded-lg border bg-background border-dashed border-border hover:bg-muted/50 text-muted-foreground"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Pizza Tracker Progress Bar */}
        {selectedChild && activeSection !== 'complete' && (
          <Card className="mb-6 overflow-hidden">
            <div className="flex h-20 relative">
              {sections.map((section, index) => {
                const status = getSectionStatus(section.id)
                const isActive = activeSection === section.id
                const isComplete = status === 'complete'
                const isLocked = status === 'locked'
                const allComplete = isChildComplete(selectedChild)
                
                // Calculate widths
                const baseWidth = allComplete ? '25%' : '15%'
                const activeWidth = allComplete ? '25%' : '55%'
                const width = isActive && !allComplete ? activeWidth : baseWidth
                
                const Icon = section.icon
                
                return (
                  <button
                    key={section.id}
                    onClick={() => handleSectionClick(section.id)}
                    disabled={isLocked}
                    className={`relative transition-all duration-500 ease-in-out flex items-center justify-center ${
                      isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                    }`}
                    style={{ 
                      width,
                      backgroundColor: allComplete 
                        ? 'rgb(187 247 208 / 0.3)' 
                        : isComplete 
                          ? 'rgb(187 247 208 / 0.3)'
                          : isActive 
                            ? 'rgb(232 229 255 / 0.3)'
                            : 'rgb(243 244 246 / 0.3)',
                      borderRight: index < sections.length - 1 ? '1px solid rgb(229 231 235)' : 'none'
                    }}
                  >
                    <div className={`flex flex-col items-center gap-1 ${
                      isLocked ? 'opacity-40' : ''
                    }`}>
                      <div className={`rounded-full p-2 ${
                        allComplete || isComplete
                          ? 'bg-green-100 text-green-700'
                          : isActive
                            ? 'bg-primary/20 text-primary'
                            : 'bg-gray-100 text-gray-500'
                      }`}>
                        {isComplete ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-xs font-medium ${
                        isActive && !allComplete ? 'text-sm' : ''
                      }`}>
                        {section.label}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </Card>
        )}

        {/* Content Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            {activeSection === 'info' && (
              <div className="space-y-4">
                {selectedChild ? (
                  // Show current child's info
                  <div>
                    <h3 className="text-lg font-medium mb-4">Child Information</h3>
                    <div className="bg-muted/30 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <Label className="text-sm text-muted-foreground">Name</Label>
                          <p className="text-lg font-medium mt-1">{selectedChild.name}</p>
                        </div>
                        <div>
                          <Label className="text-sm text-muted-foreground">Age</Label>
                          <p className="text-lg font-medium mt-1">{selectedChild.age} years old</p>
                        </div>
                        {selectedChild.grade && (
                          <div>
                            <Label className="text-sm text-muted-foreground">Grade</Label>
                            <p className="text-lg font-medium mt-1">{selectedChild.grade}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="pt-4 space-y-3">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-accent-foreground" />
                          <span className="text-sm">
                            {selectedChild.goals.length > 0 
                              ? `${selectedChild.goals.length} education goal${selectedChild.goals.length !== 1 ? 's' : ''} selected`
                              : 'No goals selected yet'
                            }
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <BookOpen className="w-4 h-4 text-secondary-foreground" />
                          <span className="text-sm">
                            {selectedChild.curriculumTypes.length > 0
                              ? `${selectedChild.curriculumTypes.length} curriculum type${selectedChild.curriculumTypes.length !== 1 ? 's' : ''} selected`
                              : 'No curriculum selected yet'
                            }
                          </span>
                        </div>
                        {selectedChild.notes && (
                          <div className="flex items-center gap-2">
                            <StickyNote className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm">Notes added</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                      <Button 
                        onClick={() => {
                          // Move to next incomplete section for this child
                          if (selectedChild.goals.length < 3) {
                            setActiveSection('goals')
                          } else if (selectedChild.curriculumTypes.length === 0) {
                            setActiveSection('curriculum')
                          } else if (!selectedChild.notesCompleted) {
                            setActiveSection('notes')
                          }
                        }}
                      >
                        Continue Setup
                      </Button>
                    </div>
                  </div>
                ) : (
                  // Show add child form if no child is selected
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      {children.length === 0 ? 'Add Your First Child' : 'Add Another Child'}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Child's name"
                          value={newChildName}
                          onChange={(e) => setNewChildName(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="age">Age</Label>
                        <Input
                          id="age"
                          type="number"
                          placeholder="Age"
                          min="3"
                          max="18"
                          value={newChildAge}
                          onChange={(e) => setNewChildAge(e.target.value)}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="grade">Grade (Optional)</Label>
                        <Input
                          id="grade"
                          placeholder="e.g., 3rd Grade"
                          value={newChildGrade}
                          onChange={(e) => setNewChildGrade(e.target.value)}
                        />
                      </div>
                    </div>
                    <Button
                      onClick={addChild}
                      disabled={!newChildName || !newChildAge}
                      className="mt-4"
                    >
                      Add Child
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedChild && activeSection === 'goals' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Education Focus Areas for {selectedChild.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select at least 3 areas of focus ({selectedChild.goals.length}/3 minimum selected)
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {educationGoals.map(goal => (
                    <button
                      key={goal}
                      onClick={() => toggleGoal(selectedChild.id, goal)}
                      className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                        selectedChild.goals.includes(goal)
                          ? 'bg-primary/15 border-primary text-primary-foreground font-medium'
                          : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {goal}
                    </button>
                  ))}
                </div>
                {canProceedToNext() && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={proceedToNextSection}>
                      Continue to Curriculum Selection
                    </Button>
                  </div>
                )}
              </div>
            )}

            {selectedChild && activeSection === 'curriculum' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Curriculum Types for {selectedChild.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Select up to 2 curriculum approaches ({selectedChild.curriculumTypes.length}/2 selected)
                  </p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {curriculumOptions.map(curriculum => (
                    <button
                      key={curriculum}
                      onClick={() => toggleCurriculum(selectedChild.id, curriculum)}
                      disabled={selectedChild.curriculumTypes.length >= 2 && !selectedChild.curriculumTypes.includes(curriculum)}
                      className={`px-4 py-3 rounded-lg border text-sm transition-all ${
                        selectedChild.curriculumTypes.includes(curriculum)
                          ? 'bg-secondary/15 border-secondary text-secondary-foreground font-medium'
                          : selectedChild.curriculumTypes.length >= 2 && !selectedChild.curriculumTypes.includes(curriculum)
                          ? 'bg-muted/30 border-border text-muted-foreground/50 cursor-not-allowed'
                          : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                      }`}
                    >
                      {curriculum}
                    </button>
                  ))}
                </div>
                {canProceedToNext() && (
                  <div className="pt-4 border-t flex justify-end">
                    <Button onClick={proceedToNextSection}>
                      Continue to Additional Notes
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Completion View */}
            {activeSection === 'complete' && (
              <div className="text-center py-12">
                {error && (
                  <Alert variant="destructive" className="mb-6 max-w-md mx-auto">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="mb-8">
                  <div className="mx-auto mb-4 w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="w-8 h-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-light mb-2">
                    {selectedChild ? `${selectedChild.name}'s Profile Complete!` : 'Profile Complete!'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    You've successfully set up the education profile
                  </p>
                </div>

                {/* Display completed children */}
                <div className="mb-8">
                  <Label className="text-sm text-muted-foreground block mb-3">Completed Profiles</Label>
                  <p className="text-xs text-muted-foreground mb-3">Click on a name to edit their profile</p>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {children.filter(c => isChildComplete(c)).map(child => (
                      <button
                        key={child.id}
                        onClick={() => {
                          setSelectedChildId(child.id)
                          setActiveSection('info')
                        }}
                        className="px-4 py-2 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 hover:bg-green-100 transition-colors cursor-pointer group"
                      >
                        <Check className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{child.name}</span>
                        <Edit2 className="w-3 h-3 text-green-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Options */}
                <div className="space-y-4">
                  {children.some(c => !isChildComplete(c)) && (
                    <div className="p-4 bg-muted/30 rounded-lg">
                      <p className="text-sm text-muted-foreground mb-3">
                        You have incomplete profiles:
                      </p>
                      <div className="flex flex-wrap gap-2 justify-center mb-4">
                        {children.filter(c => !isChildComplete(c)).map(child => (
                          <button
                            key={child.id}
                            onClick={() => {
                              setSelectedChildId(child.id)
                              if (child.goals.length < 3) {
                                setActiveSection('goals')
                              } else if (child.curriculumTypes.length === 0) {
                                setActiveSection('curriculum')
                              } else {
                                setActiveSection('notes')
                              }
                            }}
                            className="px-4 py-2 bg-background border border-border rounded-lg hover:bg-muted/50 transition-colors"
                          >
                            Continue {child.name}'s Setup
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-3 justify-center">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedChildId(null)
                        setActiveSection('info')
                      }}
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add Another Child
                    </Button>
                    
                    {allChildrenComplete && (
                      <Button
                        onClick={handleComplete}
                        disabled={saving}
                      >
                        {saving ? 'Saving...' : 'Continue to Dashboard'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {selectedChild && activeSection === 'notes' && (
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-medium mb-2">Additional Notes for {selectedChild.name}</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Add any special considerations, learning styles, or interests (optional)
                  </p>
                </div>
                <textarea
                  value={selectedChild.notes}
                  onChange={(e) => updateNotes(selectedChild.id, e.target.value)}
                  placeholder="Any special needs, interests, learning styles, or other considerations..."
                  className="w-full min-h-[200px] p-4 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                />
                <div className="pt-4 border-t flex justify-between items-center">
                  <p className="text-sm text-muted-foreground">
                    Notes are optional - you can finish or add more details
                  </p>
                  <div className="flex gap-2">
                    {children.length > 1 && children.some(c => c.id !== selectedChild.id && !isChildComplete(c)) && (
                      <Button 
                        variant="outline"
                        onClick={() => {
                          const nextIncomplete = children.find(c => c.id !== selectedChild.id && !isChildComplete(c))
                          if (nextIncomplete) {
                            setSelectedChildId(nextIncomplete.id)
                            setActiveSection('goals')
                          }
                        }}
                      >
                        Next Child
                      </Button>
                    )}
                    <Button 
                      variant={selectedChild.notes ? "default" : "outline"}
                      onClick={() => {
                        // Mark notes as completed
                        markNotesCompleted(selectedChild.id)
                        
                        // Show completion view
                        setActiveSection('complete')
                      }}
                    >
                      {selectedChild.notes ? "Save & Continue" : "Skip Notes"}
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Action Buttons - Only show when not in complete view */}
        {activeSection !== 'complete' && (
          <div className="flex gap-3 justify-between">
            <Button
              variant="outline"
              onClick={() => navigate('/signup')}
            >
              Back
            </Button>
          </div>
        )}

        {/* Helper Text */}
        {children.length > 0 && !allChildrenComplete && activeSection !== 'complete' && (
          <p className="text-center mt-4 text-sm text-muted-foreground">
            Complete all sections for each child to continue
          </p>
        )}
      </div>
    </div>
  )
}