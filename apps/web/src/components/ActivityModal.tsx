import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { X, Plus, Trash2 } from 'lucide-react'
import { subjects, type Activity, type Child } from '@/lib/mockData'

interface ActivityModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (activity: Activity) => void
  onDelete?: (id: string) => void
  activity?: Activity | null
  children: Child[]
  day: string
  time: string
  currentWeek?: Date
}

export default function ActivityModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  activity,
  children,
  day,
  time,
  currentWeek
}: ActivityModalProps) {
  const [formData, setFormData] = useState<Partial<Activity>>({
    childId: children[0]?.id || '',
    title: '',
    subject: subjects[0],
    description: '',
    day,
    startTime: time,
    endTime: getEndTime(time),
    materials: [],
    instructions: [],
    objectives: [],
    enhanced: false
  })

  const [newMaterial, setNewMaterial] = useState('')
  const [newInstruction, setNewInstruction] = useState('')
  const [newObjective, setNewObjective] = useState('')

  useEffect(() => {
    if (activity) {
      setFormData(activity)
    } else {
      setFormData({
        childId: children[0]?.id || '',
        title: '',
        subject: subjects[0],
        description: '',
        day: day || 'Monday',
        startTime: time || '09:00',
        endTime: getEndTime(time || '09:00'),
        materials: [],
        instructions: [],
        objectives: [],
        enhanced: false
      })
    }
  }, [activity, day, time, children])
  
  // Update end time when start time changes
  useEffect(() => {
    if (formData.startTime && !activity) {
      setFormData(prev => ({
        ...prev,
        endTime: getEndTime(prev.startTime || '09:00')
      }))
    }
  }, [formData.startTime, activity])

  function getEndTime(startTime: string): string {
    const [hours, minutes] = startTime.split(':').map(Number)
    const endHours = minutes === 30 ? hours + 1 : hours
    const endMinutes = minutes === 30 ? 0 : 30
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`
  }

  const handleSave = () => {
    // Calculate the date based on the selected day of the week
    const baseDate = currentWeek || new Date()
    
    // Create a clean date at noon to avoid timezone issues
    const cleanDate = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate(), 12, 0, 0)
    
    // Find the Monday of the week containing baseDate
    const dayOfWeek = cleanDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const mondayOfWeek = new Date(cleanDate)
    mondayOfWeek.setDate(cleanDate.getDate() + daysToMonday)
    
    // Map day names to offsets from Monday
    const dayToOffset: Record<string, number> = {
      'Monday': 0,
      'Tuesday': 1,
      'Wednesday': 2,
      'Thursday': 3,
      'Friday': 4,
      'Saturday': 5,
      'Sunday': 6
    }
    
    const targetDay = formData.day || day
    const daysFromMonday = dayToOffset[targetDay] ?? 0
    
    // Calculate the target date
    const targetDate = new Date(mondayOfWeek)
    targetDate.setDate(mondayOfWeek.getDate() + daysFromMonday)
    
    const activityToSave: Activity = {
      id: activity?.id || Date.now().toString(),
      childId: formData.childId || '',
      title: formData.title || '',
      subject: formData.subject || subjects[0],
      description: formData.description || '',
      day: formData.day || day,
      date: targetDate.toISOString().split('T')[0],
      startTime: formData.startTime || time,
      endTime: formData.endTime || getEndTime(time),
      materials: formData.materials || [],
      instructions: formData.instructions || [],
      objectives: formData.objectives || [],
      enhanced: formData.enhanced || false
    }
    onSave(activityToSave)
    onClose()
  }

  const addMaterial = () => {
    if (newMaterial.trim()) {
      setFormData({
        ...formData,
        materials: [...(formData.materials || []), newMaterial.trim()]
      })
      setNewMaterial('')
    }
  }

  const addInstruction = () => {
    if (newInstruction.trim()) {
      setFormData({
        ...formData,
        instructions: [...(formData.instructions || []), newInstruction.trim()]
      })
      setNewInstruction('')
    }
  }

  const addObjective = () => {
    if (newObjective.trim()) {
      setFormData({
        ...formData,
        objectives: [...(formData.objectives || []), newObjective.trim()]
      })
      setNewObjective('')
    }
  }

  const removeMaterial = (index: number) => {
    setFormData({
      ...formData,
      materials: formData.materials?.filter((_, i) => i !== index) || []
    })
  }

  const removeInstruction = (index: number) => {
    setFormData({
      ...formData,
      instructions: formData.instructions?.filter((_, i) => i !== index) || []
    })
  }

  const removeObjective = (index: number) => {
    setFormData({
      ...formData,
      objectives: formData.objectives?.filter((_, i) => i !== index) || []
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{activity ? 'Edit Activity' : 'New Activity'}</CardTitle>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Basic Info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="child">Child</Label>
              <select
                id="child"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.childId}
                onChange={(e) => setFormData({ ...formData, childId: e.target.value })}
              >
                {children.map(child => (
                  <option key={child.id} value={child.id}>
                    {child.emoji} {child.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <select
                id="subject"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              >
                {subjects.map(subject => (
                  <option key={subject} value={subject}>
                    {subject}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Activity Title</Label>
            <Input
              id="title"
              placeholder="e.g., Math Patterns"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              className="w-full min-h-[80px] p-3 rounded-md border border-input bg-background text-sm"
              placeholder="Brief description of the activity..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          {/* Time */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="day">Day</Label>
              <select
                id="day"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.day}
                onChange={(e) => setFormData({ ...formData, day: e.target.value })}
              >
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time</Label>
              <select
                id="startTime"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.startTime}
                onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00'].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <select
                id="endTime"
                className="w-full h-10 px-3 rounded-md border border-input bg-background"
                value={formData.endTime}
                onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
              >
                {['09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00']
                  .filter(t => t > (formData.startTime || '09:00'))
                  .map(t => (
                    <option key={t} value={t}>{t}</option>
                  ))
                }
              </select>
            </div>
          </div>

          {/* Materials */}
          <div className="space-y-2">
            <Label>Materials Needed</Label>
            <div className="space-y-2">
              {formData.materials?.map((material, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={material} disabled />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeMaterial(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add material..."
                  value={newMaterial}
                  onChange={(e) => setNewMaterial(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addMaterial())}
                />
                <Button variant="outline" size="icon" onClick={addMaterial}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Instructions */}
          <div className="space-y-2">
            <Label>Step-by-Step Instructions</Label>
            <div className="space-y-2">
              {formData.instructions?.map((instruction, index) => (
                <div key={index} className="flex gap-2">
                  <div className="flex-1 flex items-center gap-2">
                    <span className="text-sm font-medium">{index + 1}.</span>
                    <Input value={instruction} disabled />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeInstruction(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add instruction step..."
                  value={newInstruction}
                  onChange={(e) => setNewInstruction(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addInstruction())}
                />
                <Button variant="outline" size="icon" onClick={addInstruction}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Learning Objectives */}
          <div className="space-y-2">
            <Label>Learning Objectives</Label>
            <div className="space-y-2">
              {formData.objectives?.map((objective, index) => (
                <div key={index} className="flex gap-2">
                  <Input value={objective} disabled />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeObjective(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <div className="flex gap-2">
                <Input
                  placeholder="Add learning objective..."
                  value={newObjective}
                  onChange={(e) => setNewObjective(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addObjective())}
                />
                <Button variant="outline" size="icon" onClick={addObjective}>
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          <div>
            {activity && onDelete && (
              <Button variant="destructive" onClick={() => onDelete(activity.id)}>
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Activity
              </Button>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {activity ? 'Save Changes' : 'Create Activity'}
            </Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  )
}