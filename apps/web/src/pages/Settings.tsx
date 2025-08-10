import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ThemeToggle } from '@/components/ThemeToggle'
import { 
  ArrowLeft, User, Users, Trash2, Edit2, Plus, Save, 
  BookOpen, Sparkles, StickyNote, Check, Brain, RotateCcw,
  Eye, Copy, TestTube
} from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAuth } from '@/contexts/AuthContext'
import { getChildren, updateChild, deleteChild, getProfile, updateProfile } from '@/lib/database'
import { supabase } from '@/lib/supabase'
import type { Child } from '@/lib/supabase'

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

export default function Settings() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState<'profile' | 'children' | 'ai'>('profile')
  const [children, setChildren] = useState<Child[]>([])
  const [editingChild, setEditingChild] = useState<string | null>(null)
  const [originalChildData, setOriginalChildData] = useState<Child | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  
  // Profile state
  const [profileData, setProfileData] = useState({
    fullName: '',
    email: ''
  })
  const [editingProfile, setEditingProfile] = useState(false)
  const [tempProfileData, setTempProfileData] = useState(profileData)
  
  // AI Settings state
  const [aiSettings, setAiSettings] = useState({
    systemPrompt: '',
    temperature: 0.7,
    maxTokens: 4000,
    focusAreas: [] as string[],
    avoidTopics: [] as string[],
    customInstructions: ''
  })
  const [editingAI, setEditingAI] = useState(false)
  const [tempAISettings, setTempAISettings] = useState(aiSettings)
  const [showPromptPreview, setShowPromptPreview] = useState(false)
  const [promptPreview, setPromptPreview] = useState('')
  const [testingPrompt, setTestingPrompt] = useState(false)
  const [testResult, setTestResult] = useState<string | null>(null)

  // Load user data on mount
  useEffect(() => {
    async function loadUserData() {
      if (!user) return
      
      try {
        // Load profile
        const profile = await getProfile(user.id)
        const userData = {
          fullName: profile?.full_name || user.user_metadata?.full_name || '',
          email: user.email || ''
        }
        setProfileData(userData)
        setTempProfileData(userData)
        
        // Load children
        const userChildren = await getChildren(user.id)
        setChildren(userChildren as Child[])
        
        // Load AI settings from localStorage
        const savedAISettings = localStorage.getItem(`ai_settings_${user.id}`)
        if (savedAISettings) {
          const parsed = JSON.parse(savedAISettings)
          setAiSettings(parsed)
          setTempAISettings(parsed)
        } else {
          // Set default values
          const defaults = {
            systemPrompt: '',
            temperature: 0.7,
            maxTokens: 4000,
            focusAreas: [],
            avoidTopics: [],
            customInstructions: ''
          }
          setAiSettings(defaults)
          setTempAISettings(defaults)
        }
      } catch (error) {
        console.error('Error loading user data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    loadUserData()
  }, [user])

  const handleSaveProfile = async () => {
    if (!user) return
    
    setSaving(true)
    try {
      await updateProfile(user.id, {
        full_name: tempProfileData.fullName,
        email: tempProfileData.email
      })
      
      // Update auth metadata too
      await supabase.auth.updateUser({
        data: { full_name: tempProfileData.fullName }
      })
      
      setProfileData(tempProfileData)
      setEditingProfile(false)
      setSuccessMessage('Profile updated successfully!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating profile:', error)
      setSuccessMessage('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleCancelProfile = () => {
    setTempProfileData(profileData)
    setEditingProfile(false)
  }

  const handleEditChild = (childId: string) => {
    const child = children.find(c => c.id === childId)
    if (child) {
      setOriginalChildData({ ...child })
      setEditingChild(childId)
    }
  }

  const handleSaveChild = async (childId: string, updates: Partial<Child>) => {
    setSaving(true)
    try {
      await updateChild(childId, updates)
      setChildren(children.map(child => 
        child.id === childId ? { ...child, ...updates } : child
      ))
      setEditingChild(null)
      setOriginalChildData(null)
      setSuccessMessage('Child information updated!')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error updating child:', error)
      setSuccessMessage('Failed to update child')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteChild = async (childId: string) => {
    setSaving(true)
    try {
      await deleteChild(childId)
      setChildren(children.filter(child => child.id !== childId))
      setShowDeleteConfirm(null)
      setSuccessMessage('Child removed successfully')
      setTimeout(() => setSuccessMessage(null), 3000)
    } catch (error) {
      console.error('Error deleting child:', error)
      setSuccessMessage('Failed to delete child')
    } finally {
      setSaving(false)
    }
  }

  const handleAddChild = () => {
    navigate('/onboarding')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading settings...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <h1 className="text-2xl font-light">Settings</h1>
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      {/* Success Message */}
      {successMessage && (
        <div className="max-w-4xl mx-auto px-4 mt-4">
          <Alert className="bg-green-50 border-green-200">
            <Check className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              {successMessage}
            </AlertDescription>
          </Alert>
        </div>
      )}

      {/* Tabs */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'bg-primary/15 border-primary text-primary-foreground'
                : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <User className="w-4 h-4" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('children')}
            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'children'
                ? 'bg-primary/15 border-primary text-primary-foreground'
                : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <Users className="w-4 h-4" />
            Children
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`px-4 py-2 rounded-lg border transition-all flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'bg-primary/15 border-primary text-primary-foreground'
                : 'bg-background border-border hover:bg-muted/50'
            }`}
          >
            <Brain className="w-4 h-4" />
            AI Settings
          </button>
        </div>

        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>
                Manage your account details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingProfile ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      value={tempProfileData.fullName}
                      onChange={(e) => setTempProfileData({
                        ...tempProfileData,
                        fullName: e.target.value
                      })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={tempProfileData.email}
                      onChange={(e) => setTempProfileData({
                        ...tempProfileData,
                        email: e.target.value
                      })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSaveProfile} disabled={saving}>
                      <Save className="w-4 h-4 mr-2" />
                      {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                    <Button variant="outline" onClick={handleCancelProfile} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-muted-foreground">Full Name</Label>
                      <p className="text-lg">{profileData.fullName}</p>
                    </div>
                    <div>
                      <Label className="text-sm text-muted-foreground">Email</Label>
                      <p className="text-lg">{profileData.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setEditingProfile(true)}
                  >
                    <Edit2 className="w-4 h-4 mr-2" />
                    Edit Profile
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Children Tab */}
        {activeTab === 'children' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Manage Children</CardTitle>
                    <CardDescription>
                      Add, edit, or remove children from your profile
                    </CardDescription>
                  </div>
                  <Button onClick={handleAddChild}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Child
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {children.map(child => (
                    <div
                      key={child.id}
                      className="border rounded-lg p-4 space-y-3"
                    >
                      {editingChild === child.id ? (
                        // Edit Mode - Full onboarding-style editing
                        <div className="space-y-6">
                          {/* Basic Info */}
                          <div>
                            <h4 className="font-medium mb-3">Basic Information</h4>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-2">
                                <Label htmlFor={`name-${child.id}`}>Name</Label>
                                <Input
                                  id={`name-${child.id}`}
                                  defaultValue={child.name}
                                  onChange={(e) => {
                                    const newName = e.target.value
                                    setChildren(children.map(c => 
                                      c.id === child.id ? { ...c, name: newName } : c
                                    ))
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`age-${child.id}`}>Age</Label>
                                <Input
                                  id={`age-${child.id}`}
                                  type="number"
                                  min="3"
                                  max="18"
                                  defaultValue={child.age}
                                  onChange={(e) => {
                                    const newAge = e.target.value
                                    setChildren(children.map(c => 
                                      c.id === child.id ? { ...c, age: newAge } : c
                                    ))
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor={`grade-${child.id}`}>Grade</Label>
                                <Input
                                  id={`grade-${child.id}`}
                                  placeholder="e.g., 3rd Grade"
                                  defaultValue={child.grade}
                                  onChange={(e) => {
                                    const newGrade = e.target.value
                                    setChildren(children.map(c => 
                                      c.id === child.id ? { ...c, grade: newGrade } : c
                                    ))
                                  }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Education Goals */}
                          <div>
                            <h4 className="font-medium mb-2">Education Focus Areas</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Select at least 3 areas of focus ({(child.goals || []).length}/3 minimum selected)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {educationGoals.map(goal => (
                                <button
                                  key={goal}
                                  type="button"
                                  onClick={() => {
                                    const currentGoals = child.goals || []
                                    const newGoals = currentGoals.includes(goal)
                                      ? currentGoals.filter(g => g !== goal)
                                      : [...currentGoals, goal]
                                    setChildren(children.map(c => 
                                      c.id === child.id ? { ...c, goals: newGoals } : c
                                    ))
                                  }}
                                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                    child.goals?.includes(goal)
                                      ? 'bg-primary/15 border-primary text-primary-foreground font-medium'
                                      : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                                  }`}
                                >
                                  {goal}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Curriculum Types */}
                          <div>
                            <h4 className="font-medium mb-2">Curriculum Types</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Select up to 2 curriculum approaches ({(child.curriculumTypes || []).length}/2 selected)
                            </p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                              {curriculumOptions.map(curriculum => (
                                <button
                                  key={curriculum}
                                  type="button"
                                  onClick={() => {
                                    const currentTypes = child.curriculumTypes || []
                                    let newTypes = [...currentTypes]
                                    
                                    if (currentTypes.includes(curriculum)) {
                                      newTypes = currentTypes.filter(c => c !== curriculum)
                                    } else {
                                      if (currentTypes.length >= 2) {
                                        newTypes = [currentTypes[1], curriculum]
                                      } else {
                                        newTypes.push(curriculum)
                                      }
                                    }
                                    
                                    setChildren(children.map(c => 
                                      c.id === child.id ? { ...c, curriculumTypes: newTypes } : c
                                    ))
                                  }}
                                  disabled={(child.curriculumTypes || []).length >= 2 && !(child.curriculumTypes || []).includes(curriculum)}
                                  className={`px-3 py-2 rounded-lg border text-sm transition-all ${
                                    child.curriculumTypes?.includes(curriculum)
                                      ? 'bg-secondary/15 border-secondary text-secondary-foreground font-medium'
                                      : (child.curriculumTypes || []).length >= 2 && !(child.curriculumTypes || []).includes(curriculum)
                                      ? 'bg-muted/30 border-border text-muted-foreground/50 cursor-not-allowed'
                                      : 'bg-background border-border hover:bg-muted/50 text-muted-foreground'
                                  }`}
                                >
                                  {curriculum}
                                </button>
                              ))}
                            </div>
                          </div>

                          {/* Additional Notes */}
                          <div>
                            <h4 className="font-medium mb-2">Additional Notes</h4>
                            <p className="text-sm text-muted-foreground mb-3">
                              Any special considerations, learning styles, or interests (optional)
                            </p>
                            <textarea
                              value={child.notes || ''}
                              onChange={(e) => {
                                const newNotes = e.target.value
                                setChildren(children.map(c => 
                                  c.id === child.id ? { ...c, notes: newNotes } : c
                                ))
                              }}
                              placeholder="Any special needs, interests, learning styles, or other considerations..."
                              className="w-full min-h-[120px] p-3 rounded-lg border border-input bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                            />
                          </div>

                          {/* Action Buttons */}
                          <div className="flex gap-2 pt-2 border-t">
                            <Button
                              onClick={() => {
                                const updatedChild = children.find(c => c.id === child.id)
                                if (updatedChild && (updatedChild.goals || []).length >= 3 && (updatedChild.curriculumTypes || []).length > 0) {
                                  handleSaveChild(child.id, updatedChild)
                                } else {
                                  setSuccessMessage('Please select at least 3 education goals and 1 curriculum type')
                                  setTimeout(() => setSuccessMessage(null), 3000)
                                }
                              }}
                            >
                              <Save className="w-4 h-4 mr-2" />
                              Save Changes
                            </Button>
                            <Button
                              variant="outline"
                              onClick={() => {
                                // Reset child to original state
                                if (originalChildData) {
                                  setChildren(children.map(c => 
                                    c.id === child.id ? originalChildData : c
                                  ))
                                }
                                setEditingChild(null)
                                setOriginalChildData(null)
                              }}
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View Mode
                        <>
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3">
                              <div className="text-2xl">{child.emoji}</div>
                              <div>
                                <h3 className="font-semibold text-lg">{child.name}</h3>
                                <p className="text-sm text-muted-foreground">
                                  {child.age} years old • {child.grade}
                                </p>
                                
                                {/* Child Details */}
                                <div className="mt-3 space-y-2">
                                  {child.goals && child.goals.length > 0 && (
                                    <div className="flex items-start gap-2">
                                      <Sparkles className="w-4 h-4 text-muted-foreground mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium">Education Goals</p>
                                        <p className="text-sm text-muted-foreground">
                                          {child.goals.join(', ')}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {child.curriculumTypes && child.curriculumTypes.length > 0 && (
                                    <div className="flex items-start gap-2">
                                      <BookOpen className="w-4 h-4 text-muted-foreground mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium">Curriculum</p>
                                        <p className="text-sm text-muted-foreground">
                                          {child.curriculumTypes.join(', ')}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {child.notes && (
                                    <div className="flex items-start gap-2">
                                      <StickyNote className="w-4 h-4 text-muted-foreground mt-0.5" />
                                      <div>
                                        <p className="text-sm font-medium">Notes</p>
                                        <p className="text-sm text-muted-foreground">
                                          {child.notes}
                                        </p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditChild(child.id)}
                              >
                                <Edit2 className="w-4 h-4" />
                              </Button>
                              {showDeleteConfirm === child.id ? (
                                <div className="flex gap-2">
                                  <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={() => handleDeleteChild(child.id)}
                                  >
                                    Confirm
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowDeleteConfirm(null)}
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => setShowDeleteConfirm(child.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  ))}
                  
                  {children.length === 0 && (
                    <div className="text-center py-8">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                        <Users className="w-8 h-8 text-muted-foreground" />
                      </div>
                      <p className="text-muted-foreground mb-4">
                        No children added yet
                      </p>
                      <Button onClick={handleAddChild}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Your First Child
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* AI Settings Tab */}
        {activeTab === 'ai' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle>AI Generation Settings</CardTitle>
                    <CardDescription>
                      Customize how the AI generates educational activities for your children
                    </CardDescription>
                  </div>
                  {!editingAI ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setEditingAI(true)
                        setTempAISettings(aiSettings)
                      }}
                    >
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </Button>
                  ) : (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={async () => {
                          // Save to localStorage
                          if (user) {
                            localStorage.setItem(
                              `ai_settings_${user.id}`,
                              JSON.stringify(tempAISettings)
                            )
                            setAiSettings(tempAISettings)
                            setEditingAI(false)
                            setSuccessMessage('AI settings saved successfully')
                            setTimeout(() => setSuccessMessage(null), 3000)
                          }
                        }}
                      >
                        <Save className="w-4 h-4 mr-2" />
                        Save
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setTempAISettings(aiSettings)
                          setEditingAI(false)
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Custom Instructions */}
                <div className="space-y-2">
                  <Label htmlFor="customInstructions">
                    Custom Instructions
                    <span className="text-xs text-muted-foreground ml-2">
                      (Additional context for activity generation)
                    </span>
                  </Label>
                  <textarea
                    id="customInstructions"
                    className="w-full min-h-[120px] p-3 rounded-md border border-input bg-background text-sm resize-vertical"
                    placeholder="Example: Focus on hands-on experiments, avoid screen time, include outdoor activities, emphasize critical thinking..."
                    value={editingAI ? tempAISettings.customInstructions : aiSettings.customInstructions}
                    onChange={(e) => setTempAISettings({
                      ...tempAISettings,
                      customInstructions: e.target.value
                    })}
                    disabled={!editingAI}
                  />
                </div>

                {/* Focus Areas */}
                <div className="space-y-2">
                  <Label>
                    Preferred Focus Areas
                    <span className="text-xs text-muted-foreground ml-2">
                      (Topics to emphasize in activities)
                    </span>
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {['Nature & Science', 'Creative Arts', 'Mathematics', 'Reading & Writing', 
                      'History & Culture', 'Physical Education', 'Life Skills', 'Technology',
                      'Music & Rhythm', 'Social Studies'].map(area => (
                      <button
                        key={area}
                        onClick={() => {
                          if (editingAI) {
                            const current = tempAISettings.focusAreas || []
                            if (current.includes(area)) {
                              setTempAISettings({
                                ...tempAISettings,
                                focusAreas: current.filter(a => a !== area)
                              })
                            } else {
                              setTempAISettings({
                                ...tempAISettings,
                                focusAreas: [...current, area]
                              })
                            }
                          }
                        }}
                        disabled={!editingAI}
                        className={`px-3 py-1.5 rounded-md border text-sm transition-colors ${
                          (editingAI ? tempAISettings.focusAreas : aiSettings.focusAreas)?.includes(area)
                            ? 'bg-primary/15 border-primary text-primary-foreground'
                            : 'bg-background border-border hover:bg-muted/50'
                        } ${!editingAI ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        {area}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Topics to Avoid */}
                <div className="space-y-2">
                  <Label htmlFor="avoidTopics">
                    Topics to Avoid
                    <span className="text-xs text-muted-foreground ml-2">
                      (Comma-separated list)
                    </span>
                  </Label>
                  <Input
                    id="avoidTopics"
                    placeholder="Example: competitive sports, advanced technology, specific religious content..."
                    value={editingAI 
                      ? tempAISettings.avoidTopics?.join(', ') || ''
                      : aiSettings.avoidTopics?.join(', ') || ''
                    }
                    onChange={(e) => setTempAISettings({
                      ...tempAISettings,
                      avoidTopics: e.target.value.split(',').map(t => t.trim()).filter(Boolean)
                    })}
                    disabled={!editingAI}
                  />
                </div>

                {/* Advanced Settings */}
                <div className="border-t pt-6">
                  <h3 className="font-medium mb-4">Advanced Settings</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="temperature">
                        Creativity Level: {editingAI ? tempAISettings.temperature : aiSettings.temperature}
                        <span className="text-xs text-muted-foreground ml-2">
                          (0.3 = focused, 0.7 = balanced, 1.0 = creative)
                        </span>
                      </Label>
                      <input
                        type="range"
                        id="temperature"
                        min="0.3"
                        max="1.0"
                        step="0.1"
                        value={editingAI ? tempAISettings.temperature : aiSettings.temperature}
                        onChange={(e) => setTempAISettings({
                          ...tempAISettings,
                          temperature: parseFloat(e.target.value)
                        })}
                        disabled={!editingAI}
                        className="w-full"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="maxTokens">
                        Response Length: {editingAI ? tempAISettings.maxTokens : aiSettings.maxTokens}
                        <span className="text-xs text-muted-foreground ml-2">
                          (tokens)
                        </span>
                      </Label>
                      <input
                        type="range"
                        id="maxTokens"
                        min="2000"
                        max="8000"
                        step="500"
                        value={editingAI ? tempAISettings.maxTokens : aiSettings.maxTokens}
                        onChange={(e) => setTempAISettings({
                          ...tempAISettings,
                          maxTokens: parseInt(e.target.value)
                        })}
                        disabled={!editingAI}
                        className="w-full"
                      />
                    </div>
                  </div>
                </div>

                {/* Reset Button */}
                {editingAI && (
                  <div className="flex justify-end">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const defaults = {
                          systemPrompt: '',
                          temperature: 0.7,
                          maxTokens: 4000,
                          focusAreas: [],
                          avoidTopics: [],
                          customInstructions: ''
                        }
                        setTempAISettings(defaults)
                      }}
                    >
                      <RotateCcw className="w-4 h-4 mr-2" />
                      Reset to Defaults
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Example Output Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">How Your Settings Affect Generation</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 rounded-lg p-4 text-sm space-y-2">
                  <p className="font-medium">The AI will:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    {aiSettings.customInstructions && (
                      <li>Follow your custom instructions: "{aiSettings.customInstructions.slice(0, 100)}..."</li>
                    )}
                    {aiSettings.focusAreas?.length > 0 && (
                      <li>Emphasize activities in: {aiSettings.focusAreas.join(', ')}</li>
                    )}
                    {aiSettings.avoidTopics?.length > 0 && (
                      <li>Avoid topics related to: {aiSettings.avoidTopics.join(', ')}</li>
                    )}
                    <li>Generate {aiSettings.temperature < 0.5 ? 'more predictable' : aiSettings.temperature > 0.7 ? 'more creative' : 'balanced'} activity suggestions</li>
                    <li>Provide {aiSettings.maxTokens < 3000 ? 'concise' : aiSettings.maxTokens > 5000 ? 'detailed' : 'moderate'} descriptions and instructions</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Prompt Preview & Testing */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-base">Prompt Preview & Testing</CardTitle>
                    <CardDescription>
                      View and test the actual prompt sent to the AI
                    </CardDescription>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        // Generate sample prompt with current settings
                        const samplePrompt = generateSamplePrompt(aiSettings, children)
                        setPromptPreview(samplePrompt)
                        setShowPromptPreview(true)
                      }}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      View Prompt
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        setTestingPrompt(true)
                        setTestResult(null)
                        
                        try {
                          // Test the prompt with current settings
                          const result = await testPromptGeneration(aiSettings, children)
                          setTestResult(result)
                        } catch (error) {
                          setTestResult(`Error: ${error instanceof Error ? error.message : 'Failed to test prompt'}`)
                        } finally {
                          setTestingPrompt(false)
                        }
                      }}
                      disabled={testingPrompt || children.length === 0}
                    >
                      {testingPrompt ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2" />
                          Testing...
                        </>
                      ) : (
                        <>
                          <TestTube className="w-4 h-4 mr-2" />
                          Test Generation
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>
              {(showPromptPreview || testResult) && (
                <CardContent className="space-y-4">
                  {/* Prompt Preview */}
                  {showPromptPreview && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <Label>Generated Prompt</Label>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            navigator.clipboard.writeText(promptPreview)
                            setSuccessMessage('Prompt copied to clipboard')
                            setTimeout(() => setSuccessMessage(null), 2000)
                          }}
                        >
                          <Copy className="w-4 h-4 mr-2" />
                          Copy
                        </Button>
                      </div>
                      <div className="bg-muted rounded-lg p-4 max-h-96 overflow-y-auto">
                        <pre className="text-xs whitespace-pre-wrap font-mono">
                          {promptPreview}
                        </pre>
                      </div>
                    </div>
                  )}
                  
                  {/* Test Result */}
                  {testResult && (
                    <div className="space-y-2">
                      <Label>Test Result</Label>
                      <div className={`rounded-lg p-4 max-h-96 overflow-y-auto ${
                        testResult.startsWith('Error') 
                          ? 'bg-destructive/10 border border-destructive/20' 
                          : 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      }`}>
                        <pre className="text-xs whitespace-pre-wrap">
                          {testResult}
                        </pre>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

// Helper function to generate a sample prompt for preview
function generateSamplePrompt(
  aiSettings: {
    systemPrompt: string
    temperature: number
    maxTokens: number
    focusAreas: string[]
    avoidTopics: string[]
    customInstructions: string
  },
  children: Child[]
): string {
  const systemPrompt = `You are an expert homeschool curriculum planner and educational consultant. Your task is to generate personalized, age-appropriate educational activities for homeschooled children.

You should:
1. Create engaging, hands-on learning activities
2. Align activities with grade-level standards
3. Consider each child's age and developmental stage
4. Balance different subjects throughout the week
5. Include clear learning objectives and outcomes
6. Provide practical materials lists using common household items when possible
7. Give step-by-step instructions that parents can easily follow`

  // Sample user prompt
  let userPrompt = `Generate a week of homeschool activities for the following children:\n`
  
  if (children.length > 0) {
    children.slice(0, 2).forEach(child => {
      userPrompt += `- ${child.name} (ID: ${child.id}): Age ${child.age}, Grade ${child.grade}\n`
    })
  } else {
    userPrompt += `- Emma (ID: sample-123): Age 8, Grade 3rd\n`
    userPrompt += `- Luna (ID: sample-456): Age 5, Grade Kindergarten\n`
  }
  
  userPrompt += `\nWeek: ${new Date().toLocaleDateString()} to ${new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString()}\n`
  
  // Add custom settings
  if (aiSettings.customInstructions) {
    userPrompt += `\n\nIMPORTANT CUSTOM INSTRUCTIONS:\n${aiSettings.customInstructions}`
  }
  
  if (aiSettings.focusAreas?.length > 0) {
    userPrompt += `\n\nPREFERRED FOCUS AREAS:\nPlease prioritize activities related to: ${aiSettings.focusAreas.join(', ')}`
  }
  
  if (aiSettings.avoidTopics?.length > 0) {
    userPrompt += `\n\nTOPICS TO AVOID:\nDo NOT include activities related to: ${aiSettings.avoidTopics.join(', ')}`
  }
  
  userPrompt += `\n\nRequirements:
- Maximum 3 activities per child per day
- Difficulty level: balanced
- Include a mix of individual and group activities
- Distribute activities across Monday through Friday

Additional guidelines:
- For younger children (ages 4-7), focus on play-based learning and shorter activities (30-45 minutes)
- For elementary age (8-11), include more structured learning with hands-on experiments and projects (45-60 minutes)
- For middle school (12+), incorporate independent research, critical thinking, and longer projects (60-90 minutes)
- Ensure activities are age-appropriate and can be realistically completed at home
- Include a mix of individual work, creative projects, and physical activities
- Consider the progression of skills throughout the week
- Make activities fun and engaging to maintain interest`

  return `=== SYSTEM PROMPT ===\n${systemPrompt}\n\n=== USER PROMPT ===\n${userPrompt}\n\n=== AI SETTINGS ===\nTemperature: ${aiSettings.temperature}\nMax Tokens: ${aiSettings.maxTokens}`
}

// Helper function to test prompt generation
async function testPromptGeneration(
  aiSettings: {
    systemPrompt: string
    temperature: number
    maxTokens: number
    focusAreas: string[]
    avoidTopics: string[]
    customInstructions: string
  },
  _children: Child[]
): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  
  if (!apiKey) {
    return 'Error: OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your .env file.'
  }
  
  // Use a smaller model for testing to save costs
  try {
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
            content: 'You are an expert homeschool curriculum planner. Generate a sample activity.'
          },
          {
            role: 'user',
            content: `Generate ONE sample homeschool activity for testing purposes. Use these preferences:
            ${aiSettings.customInstructions ? `Custom Instructions: ${aiSettings.customInstructions}` : ''}
            ${aiSettings.focusAreas?.length > 0 ? `Focus Areas: ${aiSettings.focusAreas.join(', ')}` : ''}
            ${aiSettings.avoidTopics?.length > 0 ? `Avoid: ${aiSettings.avoidTopics.join(', ')}` : ''}
            
            Return a brief JSON object with: title, subject, description, duration.`
          }
        ],
        temperature: aiSettings.temperature,
        max_tokens: 500
      })
    })
    
    if (!response.ok) {
      const error = await response.json()
      return `Error: ${error.error?.message || 'Failed to generate test activity'}`
    }
    
    const data = await response.json()
    const content = data.choices[0]?.message?.content || 'No response generated'
    
    return `=== TEST GENERATION SUCCESS ===\n\nSample Activity Generated:\n${content}\n\n=== SETTINGS USED ===\nTemperature: ${aiSettings.temperature}\nMax Tokens: ${aiSettings.maxTokens}\nCustom Instructions: ${aiSettings.customInstructions || 'None'}\nFocus Areas: ${aiSettings.focusAreas?.join(', ') || 'None'}\nAvoid Topics: ${aiSettings.avoidTopics?.join(', ') || 'None'}`
  } catch (error) {
    return `Error: ${error instanceof Error ? error.message : 'Failed to test generation'}`
  }
}