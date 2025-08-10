import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { 
  Plus, Calendar, Users, Sparkles, Clock, 
  ChevronLeft, ChevronRight, Wand2, X, Printer, Save, FolderOpen, Trash2, GripVertical,
  ChevronDown, CalendarDays, CalendarRange, RotateCcw, Check, SkipForward, Copy,
  Search, Undo2, Redo2, CheckCircle2, XCircle,
  AlertTriangle, Inbox, Keyboard, Settings, Globe2, LogOut
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { getChildren, getActivities, createActivity, updateActivity, deleteActivity as deleteActivityFromDB } from '@/lib/database'
import { mockChildren, mockActivities, timeSlots, weekDays, type Activity, type Child } from '@/lib/mockData'
import ActivityModal from '@/components/ActivityModal'
import GeneratePlanModal from '@/components/GeneratePlanModal'
import { ThemeToggle } from '@/components/ThemeToggle'
import { DndContext, DragOverlay } from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import { useDraggable, useDroppable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

// Draggable Activity Component
function DraggableActivity({ 
  activity, 
  child, 
  onClick,
  onStatusChange,
  onCopy
}: { 
  activity: Activity
  child: Child
  onClick: () => void
  onStatusChange?: (id: string, status: 'completed' | 'skipped' | 'pending') => void
  onCopy?: (activity: Activity) => void
}) {
  const [showActions, setShowActions] = useState(false)
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: activity.id,
    data: { activity }
  })

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
  }

  const getChildColor = (color: string) => {
    const colorMap: Record<string, string> = {
      'bg-purple-200': 'bg-purple-100 border-purple-300 text-purple-900',
      'bg-blue-200': 'bg-blue-100 border-blue-300 text-blue-900',
      'bg-green-200': 'bg-green-100 border-green-300 text-green-900',
      'bg-yellow-200': 'bg-yellow-100 border-yellow-300 text-yellow-900',
      'bg-pink-200': 'bg-pink-100 border-pink-300 text-pink-900'
    }
    return colorMap[color] || 'bg-gray-100 border-gray-300 text-gray-700'
  }

  const getStatusStyles = () => {
    if (activity.status === 'completed') return 'opacity-60 bg-green-50 dark:bg-green-950/20'
    if (activity.status === 'skipped') return 'opacity-50 line-through'
    return ''
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded border ${getChildColor(child.color)} ${getStatusStyles()} h-full flex items-center group text-xs relative`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div 
        className="p-1 cursor-move touch-none opacity-40 hover:opacity-100"
        {...listeners}
        {...attributes}
      >
        <GripVertical className="w-2.5 h-2.5" />
      </div>
      <div 
        className="flex-1 py-1 pr-1 cursor-pointer"
        onClick={(e) => {
          e.stopPropagation()
          onClick()
        }}
      >
        <div className="flex items-start justify-between gap-1">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-0.5">
              {activity.status === 'completed' && (
                <CheckCircle2 className="w-2.5 h-2.5 text-green-600" />
              )}
              {activity.status === 'skipped' && (
                <XCircle className="w-2.5 h-2.5 text-red-600" />
              )}
              <span style={{ fontSize: '10px' }}>{child.emoji}</span>
              <p className="font-medium truncate" style={{ fontSize: '11px' }}>{activity.title}</p>
              {activity.recurring && (
                <RotateCcw className="w-2.5 h-2.5 text-blue-600" />
              )}
              {activity.enhanced && (
                <Sparkles className="w-2.5 h-2.5 text-yellow-600" />
              )}
            </div>
            <p className="opacity-75 truncate" style={{ fontSize: '10px' }}>{activity.subject}</p>
          </div>
        </div>
      </div>
      
      {/* Quick Actions */}
      {showActions && onStatusChange && (
        <div className="absolute -right-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 bg-background border rounded shadow-sm p-0.5 z-10">
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(activity.id, activity.status === 'completed' ? 'pending' : 'completed')
            }}
            title={activity.status === 'completed' ? 'Mark as pending' : 'Mark as complete'}
          >
            <Check className="w-3 h-3 text-green-600" />
          </button>
          <button
            className="p-1 hover:bg-muted rounded"
            onClick={(e) => {
              e.stopPropagation()
              onStatusChange(activity.id, activity.status === 'skipped' ? 'pending' : 'skipped')
            }}
            title={activity.status === 'skipped' ? 'Mark as pending' : 'Skip'}
          >
            <SkipForward className="w-3 h-3 text-orange-600" />
          </button>
          {onCopy && (
            <button
              className="p-1 hover:bg-muted rounded"
              onClick={(e) => {
                e.stopPropagation()
                onCopy(activity)
              }}
              title="Copy activity"
            >
              <Copy className="w-3 h-3 text-blue-600" />
            </button>
          )}
        </div>
      )}
    </div>
  )
}

// Droppable Time Slot Component
function DroppableSlot({ 
  day, 
  time, 
  activities,
  children, 
  onActivityClick,
  onEmptyClick,
  onStatusChange,
  onCopy,
  isWeekend = false
}: { 
  day: string
  time: string
  activities: Activity[]
  children: Child[]
  onActivityClick: (activity: Activity) => void
  onEmptyClick: () => void
  onStatusChange?: (id: string, status: 'completed' | 'skipped' | 'pending') => void
  onCopy?: (activity: Activity) => void
  isWeekend?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `${day}-${time}`,
    data: { day, time }
  })

  const getChild = (childId: string) => children.find(c => c.id === childId)
  
  return (
    <div
      ref={setNodeRef}
      className={`relative border-r last:border-r-0 group ${
        isOver ? 'bg-primary/10' : isWeekend ? 'bg-muted/10' : 'hover:bg-muted/5'
      }`}
    >
      <div className="p-1 h-full">
        <div className="flex flex-col gap-1">
          {activities.map(activity => {
            const child = getChild(activity.childId)
            return child ? (
              <div key={activity.id} className="min-h-[40px]">
                <DraggableActivity 
                  activity={activity} 
                  child={child} 
                  onClick={() => onActivityClick(activity)}
                  onStatusChange={onStatusChange}
                  onCopy={onCopy}
                />
              </div>
            ) : null
          })}
          {/* Always show add button, even when there are activities */}
          <button
            onClick={(e) => {
              e.stopPropagation()
              onEmptyClick()
            }}
            className={`w-full py-2 border border-dashed border-muted-foreground/20 rounded text-xs hover:border-muted-foreground/40 hover:bg-muted/5 transition-all flex items-center justify-center ${
              activities.length === 0 ? 'min-h-[40px]' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <Plus className="w-3 h-3 text-muted-foreground" />
          </button>
        </div>
      </div>
    </div>
  )
}

export default function Dashboard() {
  const navigate = useNavigate()
  const { user, signOut } = useAuth()
  const [children, setChildren] = useState<Child[]>([])
  const [activities, setActivities] = useState<Activity[]>([])
  const [selectedView, setSelectedView] = useState<string>('family')
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null)
  const [currentWeek, setCurrentWeek] = useState(new Date())
  const [modalOpen, setModalOpen] = useState(false)
  const [modalActivity, setModalActivity] = useState<Activity | null>(null)
  const [modalDay, setModalDay] = useState('')
  const [modalTime, setModalTime] = useState('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const [savedPlans, setSavedPlans] = useState<{ id: string; name: string; activities: Activity[] }[]>([])
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null)
  const [currentPlanName, setCurrentPlanName] = useState('Untitled Plan')
  const [showLoadMenu, setShowLoadMenu] = useState(false)
  const [viewType, setViewType] = useState<'today' | 'week' | 'month'>('week')
  const [showViewMenu, setShowViewMenu] = useState(false)
  const [showGeneratePlan, setShowGeneratePlan] = useState(false)
  const [, setCopiedActivity] = useState<Activity | null>(null)
  const [history, setHistory] = useState<Activity[][]>([mockActivities])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showKeyboardShortcuts, setShowKeyboardShortcuts] = useState(false)
  const [checkingFirstLogin, setCheckingFirstLogin] = useState(true)

  // Check if it's user's first login
  useEffect(() => {
    async function checkFirstTimeUser() {
      if (!user) return
      
      // Check if user has completed onboarding (stored in user metadata)
      const hasCompletedOnboarding = user.user_metadata?.onboarding_completed || false
      
      if (!hasCompletedOnboarding) {
        // First time user, redirect to onboarding
        navigate('/onboarding')
      } else {
        // Load user's data
        try {
          const userChildren = await getChildren(user.id)
          const userActivities = await getActivities(user.id)
          setChildren(userChildren as any)
          setActivities(userActivities as any)
        } catch (error) {
          console.error('Error loading data:', error)
          // Use mock data as fallback for now
          setChildren(mockChildren)
          setActivities(mockActivities)
        }
      }
      
      setCheckingFirstLogin(false)
    }
    
    checkFirstTimeUser()
  }, [user, navigate])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      const metaKey = e.metaKey || e.ctrlKey
      
      if (metaKey) {
        switch(e.key.toLowerCase()) {
          case 'z':
            if (e.shiftKey) {
              redo()
            } else {
              undo()
            }
            e.preventDefault()
            break
          case 'n':
            setModalOpen(true)
            e.preventDefault()
            break
          case 's':
            handleSave()
            e.preventDefault()
            break
          case 'p':
            handlePrint()
            e.preventDefault()
            break
          case 'k':
            setShowSearch(true)
            setTimeout(() => {
              document.getElementById('search-input')?.focus()
            }, 100)
            e.preventDefault()
            break
          case '?':
            setShowKeyboardShortcuts(!showKeyboardShortcuts)
            e.preventDefault()
            break
        }
      }
      
      // View shortcuts (no modifier key needed)
      if (!e.metaKey && !e.ctrlKey && !e.altKey && document.activeElement?.tagName !== 'INPUT') {
        switch(e.key.toLowerCase()) {
          case 'd':
            setViewType('today')
            break
          case 'w':
            setViewType('week')
            break
          case 'm':
            setViewType('month')
            break
          case 'escape':
            setShowKeyboardShortcuts(false)
            setShowSearch(false)
            break
        }
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [showKeyboardShortcuts, historyIndex, history])

  // Helper to save history for undo/redo and persist to database
  const saveToHistory = async (newActivities: Activity[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(newActivities)
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
    setActivities(newActivities)
    
    // Don't save to database if user is not logged in
    if (!user) return
    
    // For now, we'll handle database saves in specific functions
    // This function just manages local state and history
  }

  // Undo function
  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setActivities(history[historyIndex - 1])
    }
  }

  // Redo function
  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setActivities(history[historyIndex + 1])
    }
  }

  // Update activity status
  const updateActivityStatus = async (id: string, status: 'completed' | 'skipped' | 'pending') => {
    // Find the activity to update
    const activityToUpdate = activities.find(a => a.id === id)
    if (!activityToUpdate) return
    
    // Update local state immediately for responsive UI
    const newActivities = activities.map(a => 
      a.id === id 
        ? { ...a, status, completedAt: status === 'completed' ? new Date().toISOString() : undefined }
        : a
    )
    setActivities(newActivities)
    saveToHistory(newActivities)
    
    // Save to database
    try {
      if (user) {
        await updateActivity(id, {
          ...activityToUpdate,
          status,
          completedAt: status === 'completed' ? new Date().toISOString() : undefined
        })
      }
    } catch (error) {
      console.error('Error updating activity status:', error)
      // Revert on error
      setActivities(activities)
    }
  }

  // Copy activity
  const copyActivity = (activity: Activity) => {
    setCopiedActivity(activity)
    // Show toast or notification that activity was copied
  }

  // Paste activity
  // Get week date range for filtering
  const getWeekDateRange = () => {
    // Create a clean date at noon to avoid timezone issues
    const cleanDate = new Date(currentWeek.getFullYear(), currentWeek.getMonth(), currentWeek.getDate(), 12, 0, 0)
    
    // Find Monday of this week
    const dayOfWeek = cleanDate.getDay()
    const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    const startOfWeek = new Date(cleanDate)
    startOfWeek.setDate(cleanDate.getDate() + daysToMonday)
    startOfWeek.setHours(0, 0, 0, 0)
    
    // Sunday is 6 days after Monday
    const endOfWeek = new Date(startOfWeek)
    endOfWeek.setDate(startOfWeek.getDate() + 6)
    endOfWeek.setHours(23, 59, 59, 999)
    
    return { startOfWeek, endOfWeek }
  }
  
  // Filter activities based on selected view, week, and search
  const filteredActivities = (() => {
    let filtered = activities
    
    // Filter by week/day/month based on view type
    if (viewType === 'week') {
      const { startOfWeek, endOfWeek } = getWeekDateRange()
      filtered = filtered.filter(activity => {
        if (activity.date) {
          // Parse the date string and compare as date strings to avoid timezone issues
          const activityDateStr = activity.date
          const startDateStr = startOfWeek.toISOString().split('T')[0]
          const endDateStr = endOfWeek.toISOString().split('T')[0]
          
          const inRange = activityDateStr >= startDateStr && activityDateStr <= endDateStr
          return inRange
        }
        // For activities without dates, don't show them
        return false
      })
    } else if (viewType === 'today') {
      // Format today's date as YYYY-MM-DD in local timezone
      const year = currentWeek.getFullYear()
      const month = String(currentWeek.getMonth() + 1).padStart(2, '0')
      const day = String(currentWeek.getDate()).padStart(2, '0')
      const todayStr = `${year}-${month}-${day}`
      
      filtered = filtered.filter(activity => {
        if (activity.date) {
          const matches = activity.date === todayStr
          return matches
        }
        // Fallback: show activities for the current day name if no date
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
        const todayName = dayNames[currentWeek.getDay()]
        return activity.day === todayName && !activity.date
      })
    } else if (viewType === 'month') {
      const year = currentWeek.getFullYear()
      const month = currentWeek.getMonth()
      
      // Calculate start and end of month as date strings
      const monthStart = `${year}-${String(month + 1).padStart(2, '0')}-01`
      const nextMonth = month === 11 ? 0 : month + 1
      const nextYear = month === 11 ? year + 1 : year
      const monthEnd = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-01`
      
      filtered = filtered.filter(activity => {
        if (activity.date) {
          // Compare date strings directly
          const inRange = activity.date >= monthStart && activity.date < monthEnd
          return inRange
        }
        // For activities without dates, don't show them in month view
        return false
      })
    }
    
    // Filter by child view
    if (selectedView !== 'family') {
      filtered = filtered.filter(a => a.childId === selectedView)
    }
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(a => 
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }
    
    return filtered
  })()

  // Calculate completion stats for current view
  const stats = (() => {
    const total = filteredActivities.length
    const completed = filteredActivities.filter(a => a.status === 'completed').length
    const skipped = filteredActivities.filter(a => a.status === 'skipped').length
    const pending = total - completed - skipped
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0
    
    return { total, completed, skipped, pending, completionRate }
  })()

  // Get child by ID
  const getChild = (childId: string) => children.find(c => c.id === childId)

  // Get activities for a specific day and time (filtered by view)
  const getActivitiesForSlot = (day: string, time: string) => {
    const slotActivities = filteredActivities.filter(a => 
      a.day === day && a.startTime === time
    )
    return slotActivities
  }

  // Calculate ISO week number
  const getWeekNumber = (date: Date) => {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()))
    const dayNum = d.getUTCDay() || 7
    d.setUTCDate(d.getUTCDate() + 4 - dayNum)
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
    return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7)
  }

  // Format date display based on view type
  const getWeekDisplay = () => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    
    if (viewType === 'today') {
      return `${dayNames[currentWeek.getDay()]}, ${monthNames[currentWeek.getMonth()]} ${currentWeek.getDate()}, ${currentWeek.getFullYear()}`
    } else if (viewType === 'week') {
      const startOfWeek = new Date(currentWeek)
      const day = startOfWeek.getDay()
      const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1)
      startOfWeek.setDate(diff)
      
      const endOfWeek = new Date(startOfWeek)
      endOfWeek.setDate(startOfWeek.getDate() + 6) // Changed from 4 to 6 to include Sunday
      
      const weekNum = getWeekNumber(startOfWeek)
      
      return `Week ${weekNum} • ${monthNames[startOfWeek.getMonth()]} ${startOfWeek.getDate()} - ${monthNames[endOfWeek.getMonth()]} ${endOfWeek.getDate()}, ${startOfWeek.getFullYear()}`
    } else {
      return `${monthNames[currentWeek.getMonth()]} ${currentWeek.getFullYear()}`
    }
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  // Handle drag end
  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const draggedActivity = activities.find(a => a.id === active.id)
    const [newDay, newTime] = (over.id as string).split('-')

    if (draggedActivity && newDay && newTime) {
      // Check if slot is occupied by the same child
      const existingActivities = activities.filter(a => 
        a.day === newDay && a.startTime === newTime
      )
      const hasConflict = existingActivities.some(a => a.childId === draggedActivity.childId)
      
      if (!hasConflict) {
        // Update activity position
        const updatedActivity = { ...draggedActivity, day: newDay, startTime: newTime }
        
        // Optimistically update local state immediately for snappy UI
        setActivities(activities.map(a => 
          a.id === draggedActivity.id ? updatedActivity : a
        ))
        
        // Then update in database if user is logged in
        if (user) {
          try {
            // Only send the changed fields to update
            await updateActivity(draggedActivity.id, { 
              day: newDay, 
              startTime: newTime 
            })
          } catch (error) {
            console.error('Error updating activity position:', error)
            setError('Failed to save activity position')
            
            // Revert the optimistic update on error
            setActivities(activities.map(a => 
              a.id === draggedActivity.id ? draggedActivity : a
            ))
          }
        }
      }
    }

    setActiveId(null)
  }

  // Open modal for new/edit activity
  const openActivityModal = (activity: Activity | null, day: string, time: string) => {
    setModalActivity(activity)
    setModalDay(day)
    setModalTime(time)
    setModalOpen(true)
  }

  // Save activity from modal
  const saveActivity = async (activity: Activity) => {
    const isUpdate = activities.find(a => a.id === activity.id)
    const originalActivities = [...activities]
    
    try {
      if (isUpdate) {
        // Optimistically update UI immediately
        setActivities(activities.map(a => a.id === activity.id ? activity : a))
        
        // Then update in database
        if (user) {
          await updateActivity(activity.id, activity)
        }
      } else {
        // Create new activity
        if (user) {
          // Create in database and get the real ID
          const dbActivity = await createActivity({
            ...activity,
            user_id: user.id
          } as any)
          
          // Add the new activity with the real database ID
          setActivities([...activities, dbActivity])
        } else {
          // No user, just add to local state with temp ID
          const tempActivity = { ...activity, id: `temp-${Date.now()}` }
          setActivities([...activities, tempActivity])
        }
      }
    } catch (error) {
      console.error('Error saving activity:', error)
      setError('Failed to save activity')
      // Revert to original state on error
      setActivities(originalActivities)
    }
  }

  // Delete activity
  const deleteActivity = async (id: string) => {
    const originalActivities = [...activities]
    const activityToDelete = activities.find(a => a.id === id)
    
    // Optimistically remove from UI immediately
    setActivities(activities.filter(a => a.id !== id))
    setModalOpen(false)
    setSelectedActivity(null)
    
    try {
      if (user && activityToDelete) {
        await deleteActivityFromDB(id)
      }
    } catch (error) {
      console.error('Error deleting activity:', error)
      setError('Failed to delete activity')
      // Restore the activity on error
      setActivities(originalActivities)
    }
  }

  // Save current plan
  const savePlan = () => {
    const planName = prompt('Enter a name for this plan:', currentPlanName)
    if (planName) {
      if (currentPlanId) {
        // Update existing plan
        setSavedPlans(savedPlans.map(plan => 
          plan.id === currentPlanId 
            ? { ...plan, name: planName, activities: [...activities] }
            : plan
        ))
        setCurrentPlanName(planName)
        alert('Plan updated successfully!')
      } else {
        // Create new plan
        const newPlan = {
          id: Date.now().toString(),
          name: planName,
          activities: [...activities]
        }
        setSavedPlans([...savedPlans, newPlan])
        setCurrentPlanId(newPlan.id)
        setCurrentPlanName(planName)
        alert('Plan saved successfully!')
      }
    }
  }

  // Load a saved plan
  const loadPlan = (plan: { id: string; name: string; activities: Activity[] }) => {
    setActivities(plan.activities)
    setCurrentPlanId(plan.id)
    setCurrentPlanName(plan.name)
    setShowLoadMenu(false)
  }

  // Delete a saved plan
  const deletePlan = (planId: string) => {
    setSavedPlans(savedPlans.filter(p => p.id !== planId))
  }

  // Clear all activities
  const clearSchedule = () => {
    if (activities.length > 0) {
      if (confirm('This will clear all activities from the schedule. Continue?')) {
        setActivities([])
        setCurrentPlanId(null)
        setCurrentPlanName('Untitled Plan')
      }
    }
  }

  // Print schedule
  const printSchedule = () => {
    window.print()
  }

  // Aliases for keyboard shortcuts
  const handleSave = savePlan
  const handlePrint = printSchedule

  const draggedActivity = activeId ? activities.find(a => a.id === activeId) : null
  const draggedChild = draggedActivity ? getChild(draggedActivity.childId) : null

  // Show loading state while checking first login
  if (checkingFirstLogin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        {/* Header */}
        <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20 print:static">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-primary" />
                </div>
                <div className="flex items-center gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      {/* Combined Navigation and View Controls */}
                      <div className="flex items-center gap-1">
                        {/* Previous Button */}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-r-none border-r-0" 
                          onClick={() => {
                            const newWeek = new Date(currentWeek)
                            if (viewType === 'today') {
                              newWeek.setDate(newWeek.getDate() - 1)
                            } else if (viewType === 'week') {
                              newWeek.setDate(newWeek.getDate() - 7)
                            } else {
                              newWeek.setMonth(newWeek.getMonth() - 1)
                            }
                            setCurrentWeek(newWeek)
                          }}
                          title={viewType === 'week' ? 'Previous week' : viewType === 'today' ? 'Previous day' : 'Previous month'}
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </Button>
                        
                        {/* Date Picker in the middle */}
                        <div className="relative">
                          <input
                            id="date-picker"
                            type="date"
                            value={currentWeek.toISOString().split('T')[0]}
                            onChange={(e) => setCurrentWeek(new Date(e.target.value))}
                            className="absolute opacity-0 w-full h-8 cursor-pointer z-10"
                            title="Jump to specific date"
                          />
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="h-8 px-3 rounded-none border-x-0" 
                          >
                            <Calendar className="w-4 h-4" />
                          </Button>
                        </div>
                        
                        {/* Next Button */}
                        <Button 
                          variant="outline" 
                          size="icon" 
                          className="h-8 w-8 rounded-l-none border-l-0" 
                          onClick={() => {
                            const newWeek = new Date(currentWeek)
                            if (viewType === 'today') {
                              newWeek.setDate(newWeek.getDate() + 1)
                            } else if (viewType === 'week') {
                              newWeek.setDate(newWeek.getDate() + 7)
                            } else {
                              newWeek.setMonth(newWeek.getMonth() + 1)
                            }
                            setCurrentWeek(newWeek)
                          }}
                          title={viewType === 'week' ? 'Next week' : viewType === 'today' ? 'Next day' : 'Next month'}
                        >
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                      
                      {/* Split Button for Today/Week/Month */}
                      <div className="relative flex">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setCurrentWeek(new Date())} 
                          className="h-8 px-3 rounded-r-none border-r-0"
                          title="Go to current period"
                        >
                          {viewType === 'today' && <CalendarDays className="w-4 h-4 mr-1" />}
                          {viewType === 'week' && <Calendar className="w-4 h-4 mr-1" />}
                          {viewType === 'month' && <CalendarRange className="w-4 h-4 mr-1" />}
                          {viewType === 'week' ? 'This Week' : viewType === 'today' ? 'Today' : 'This Month'}
                        </Button>
                        <Button 
                          variant="outline" 
                          size="icon"
                          onClick={() => setShowViewMenu(!showViewMenu)}
                          className="h-8 w-8 rounded-l-none"
                        >
                          <ChevronDown className="w-3 h-3" />
                        </Button>
                        {showViewMenu && (
                          <div className="absolute top-full mt-1 right-0 w-32 bg-background border rounded-lg shadow-lg z-50">
                            <button
                              onClick={() => { setViewType('today'); setShowViewMenu(false) }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <CalendarDays className="w-4 h-4" />
                              Today
                            </button>
                            <button
                              onClick={() => { setViewType('week'); setShowViewMenu(false) }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <Calendar className="w-4 h-4" />
                              Week
                            </button>
                            <button
                              onClick={() => { setViewType('month'); setShowViewMenu(false) }}
                              className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2"
                            >
                              <CalendarRange className="w-4 h-4" />
                              Month
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground">{getWeekDisplay()}</p>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-wrap items-center gap-2 sm:gap-3 print:hidden">
                {/* Generate Plan Button */}
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => setShowGeneratePlan(true)}
                  className="h-8"
                >
                  <Sparkles className="w-4 h-4 mr-1" />
                  Generate Plan
                </Button>
                
                <ThemeToggle />
                
                {/* Settings Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/settings')}
                  title="Settings"
                >
                  <Settings className="w-4 h-4" />
                </Button>
                
                {/* Keyboard Shortcuts Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setShowKeyboardShortcuts(true)}
                  className="hidden sm:flex"
                  title="Keyboard Shortcuts (⌘?)"
                >
                  <Keyboard className="w-4 h-4" />
                </Button>
                
                {/* Sign Out Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={async () => {
                    await signOut()
                    navigate('/login')
                  }}
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
                
                <div className="border-l pl-3">
                  <div className="flex flex-col gap-2">
                    {/* Secondary actions */}
                    <div className="flex gap-1">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={clearSchedule}
                        disabled={activities.length === 0}
                        className="flex-1"
                      >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Clear
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={savePlan}
                        disabled={activities.length === 0}
                        className="flex-1"
                      >
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </Button>
                      <div className="relative flex-1">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => setShowLoadMenu(!showLoadMenu)}
                          disabled={savedPlans.length === 0}
                          className="w-full"
                        >
                          <FolderOpen className="w-3 h-3 mr-1" />
                          Load
                        </Button>
                        {showLoadMenu && (
                          <div className="absolute top-full mt-1 right-0 w-48 bg-background border rounded-lg shadow-lg z-50">
                            <div className="p-1">
                              {savedPlans.map(plan => (
                                <div 
                                  key={plan.id} 
                                  className={`flex items-center justify-between p-1.5 rounded ${
                                    plan.id === currentPlanId ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted'
                                  }`}
                                >
                                  <button
                                    onClick={() => loadPlan(plan)}
                                    className="flex-1 text-left text-xs truncate flex items-center gap-1"
                                  >
                                    {plan.id === currentPlanId && (
                                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                                    )}
                                    {plan.name}
                                  </button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-5 w-5"
                                    onClick={() => deletePlan(plan.id)}
                                  >
                                    <Trash2 className="w-2.5 h-2.5" />
                                  </Button>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={printSchedule}
                        className="flex-1"
                      >
                        <Printer className="w-3 h-3 mr-1" />
                        Print
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* View Tabs and Controls */}
            <div className="flex items-center justify-between gap-4 mt-4 print:hidden">
              <div className="flex gap-2 overflow-x-auto pb-2 flex-1">
                <button
                  onClick={() => setSelectedView('family')}
                  className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-all flex items-center gap-2 ${
                    selectedView === 'family'
                      ? 'bg-primary/15 border-primary text-primary-foreground'
                      : 'bg-background border-border hover:bg-muted/50'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Family View
                </button>
                {children.map(child => (
                  <button
                    key={child.id}
                    onClick={() => setSelectedView(child.id)}
                    className={`px-4 py-2 rounded-lg border whitespace-nowrap transition-all flex items-center gap-2 ${
                      selectedView === child.id
                        ? 'bg-primary/15 border-primary text-primary-foreground'
                        : 'bg-background border-border hover:bg-muted/50'
                    }`}
                  >
                    <span>{child.emoji}</span>
                    {child.name}
                  </button>
                ))}
              </div>
              
              {/* Search and Edit Controls */}
              <div className="flex items-center gap-2">
                {/* Search Bar */}
                <div className="relative">
                  {showSearch ? (
                    <div className="flex items-center gap-2">
                      <div className="relative">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <input
                          id="search-input"
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Search activities..."
                          className="pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-2 focus:ring-primary w-32 sm:w-48"
                          autoFocus
                        />
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setShowSearch(false)
                          setSearchQuery('')
                        }}
                        className="h-8 w-8"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowSearch(true)}
                      className="h-8 w-8"
                    >
                      <Search className="w-4 h-4" />
                    </Button>
                  )}
                </div>

                {/* Undo/Redo */}
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={undo}
                    disabled={historyIndex === 0}
                    title="Undo (⌘Z)"
                    className="h-8 w-8"
                  >
                    <Undo2 className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={redo}
                    disabled={historyIndex === history.length - 1}
                    title="Redo (⌘⇧Z)"
                    className="h-8 w-8"
                  >
                    <Redo2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="max-w-7xl mx-auto px-4 mt-4">
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span className="text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Progress Indicator */}
        {stats.total > 0 && (
          <div className="max-w-7xl mx-auto px-4 pt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-6">
                    {/* Completion Rate */}
                    <div className="flex items-center gap-3">
                      <div className="relative w-12 h-12">
                        <svg className="transform -rotate-90 w-12 h-12">
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            className="text-muted"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="20"
                            stroke="currentColor"
                            strokeWidth="4"
                            fill="none"
                            strokeDasharray={`${stats.completionRate * 1.26} 126`}
                            className="text-primary transition-all duration-500"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs font-bold">{stats.completionRate}%</span>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Progress</p>
                        <p className="text-xs text-muted-foreground">
                          {viewType === 'today' ? 'Today' : viewType === 'week' ? 'This Week' : 'This Month'}
                        </p>
                      </div>
                    </div>
                    
                    {/* Stats */}
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <span className="font-medium">{stats.completed}</span>
                        <span className="text-muted-foreground">done</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-blue-600" />
                        <span className="font-medium">{stats.pending}</span>
                        <span className="text-muted-foreground">pending</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <SkipForward className="w-4 h-4 text-orange-600" />
                        <span className="font-medium">{stats.skipped}</span>
                        <span className="text-muted-foreground">skipped</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center gap-2">
                    {stats.completed > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          const message = `Great job! You completed ${stats.completed} ${stats.completed === 1 ? 'activity' : 'activities'} ${viewType === 'today' ? 'today' : viewType === 'week' ? 'this week' : 'this month'}!`
                          alert(message) // Replace with proper toast notification
                        }}
                      >
                        <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                        Celebrate
                      </Button>
                    )}
                    {stats.pending > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          // Mark all as complete
                          if (confirm(`Mark all ${stats.pending} pending activities as complete?`)) {
                            filteredActivities
                              .filter(a => !a.status || a.status === 'pending')
                              .forEach(a => updateActivityStatus(a.id, 'completed'))
                          }
                        }}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                        Complete All
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Loading State */}
          {isLoading ? (
            <Card>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <div className="grid grid-cols-8 gap-4">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="grid grid-cols-8 gap-4">
                      <Skeleton className="h-16 w-16" />
                      {Array.from({ length: 7 }).map((_, j) => (
                        <Skeleton key={j} className="h-16" />
                      ))}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : filteredActivities.length === 0 && !modalOpen ? (
            /* Empty State */
            <Card>
              <CardContent className="p-12 text-center">
                <div className="max-w-md mx-auto">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                    <Inbox className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">
                    {searchQuery ? 'No activities found' : 'No activities scheduled'}
                  </h3>
                  <p className="text-muted-foreground mb-6">
                    {searchQuery 
                      ? `No activities match "${searchQuery}". Try a different search term.`
                      : selectedView !== 'family' 
                        ? `${getChild(selectedView)?.name || 'This child'} doesn't have any activities scheduled yet.`
                        : 'Start by adding activities to your weekly schedule.'}
                  </p>
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => setModalOpen(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Add Activity
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setShowGeneratePlan(true)}
                    >
                      <Sparkles className="w-4 h-4 mr-2" />
                      Generate Plan
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : viewType === 'week' ? (
            <Card className="print:shadow-none overflow-x-auto">
              <CardContent className="p-0">
                <div className="min-w-[900px]">
                  <div className="grid" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                    {/* Time column header */}
                    <div className="p-2 text-center border-r bg-muted/30 sticky left-0 bg-background">
                      <Clock className="w-3 h-3 mx-auto text-muted-foreground" />
                    </div>
                    {/* Day headers */}
                    {weekDays.map((day, index) => (
                      <div 
                        key={day} 
                        className={`p-2 text-center font-medium border-r last:border-r-0 text-sm ${
                          index >= 5 ? 'bg-muted/20' : ''
                        }`}
                      >
                        {day}
                      </div>
                    ))}
                  </div>

                  {/* Time slots */}
                  {timeSlots.map(time => {
                    // Calculate max activities for this time slot across all days
                    const maxActivities = Math.max(
                      ...weekDays.map(day => getActivitiesForSlot(day, time).length),
                      1
                    )
                    const rowHeight = maxActivities > 1 ? Math.max(64, maxActivities * 48) : 64
                    
                    return (
                      <div key={time} className="grid border-b last:border-b-0" style={{ gridTemplateColumns: '80px repeat(7, 1fr)' }}>
                        {/* Time label */}
                        <div 
                          className="flex items-center justify-center text-xs text-muted-foreground border-r bg-muted/10 sticky left-0 bg-background/95"
                          style={{ minHeight: `${rowHeight}px` }}
                        >
                          {time}
                        </div>
                        {/* Day slots */}
                        {weekDays.map((day, index) => {
                          const activities = getActivitiesForSlot(day, time)
                          const isWeekend = index >= 5 // Saturday and Sunday
                          
                          return (
                            <DroppableSlot
                              key={`${day}-${time}`}
                              day={day}
                              time={time}
                              activities={activities}
                              children={children}
                              isWeekend={isWeekend}
                              onActivityClick={(activity) => setSelectedActivity(activity)}
                              onEmptyClick={() => openActivityModal(null, day, time)}
                              onStatusChange={updateActivityStatus}
                              onCopy={copyActivity}
                            />
                          )
                        })}
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          ) : viewType === 'today' ? (
            <Card className="print:shadow-none">
              <CardContent className="p-0">
                <div className="max-w-3xl mx-auto">
                  {/* Today's Day Header */}
                  <div className="border-b p-4 bg-muted/30">
                    <h3 className="text-lg font-medium text-center">
                      {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentWeek.getDay()]}
                    </h3>
                    {selectedView !== 'family' && (
                      <p className="text-sm text-muted-foreground text-center mt-1">
                        Showing activities for {children.find(c => c.id === selectedView)?.name}
                      </p>
                    )}
                  </div>
                  
                  {/* Time slots for today */}
                  <div className="divide-y">
                    {timeSlots.map(time => {
                      const todayName = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentWeek.getDay()]
                      const dayActivities = filteredActivities.filter(a => 
                        a.day === todayName && a.startTime === time
                      )
                      
                      return (
                        <div key={time} className="flex hover:bg-muted/5 transition-colors">
                          {/* Time label */}
                          <div className="w-24 p-4 text-right text-sm font-medium text-muted-foreground border-r">
                            {time}
                          </div>
                          
                          {/* Activities - Using DroppableSlot for drag and drop */}
                          <div className="flex-1">
                            <DroppableSlot
                              day={todayName}
                              time={time}
                              activities={dayActivities}
                              children={children}
                              isWeekend={currentWeek.getDay() === 0 || currentWeek.getDay() === 6}
                              onActivityClick={(activity) => setSelectedActivity(activity)}
                              onEmptyClick={() => openActivityModal(null, todayName, time)}
                              onStatusChange={updateActivityStatus}
                              onCopy={copyActivity}
                            />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                  
                  {/* Current time indicator */}
                  <div className="mt-6 p-4 text-center text-sm text-muted-foreground">
                    Current time: {new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="print:shadow-none">
              <CardContent className="p-4">
                <div className="max-w-6xl mx-auto">
                  {/* Helper text */}
                  <p className="text-xs text-muted-foreground text-center mb-3">
                    Click on any day to view its detailed schedule
                  </p>
                  
                  {/* Month Calendar Grid */}
                  <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                    {/* Day headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-muted/30 p-2 text-center text-sm font-medium">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar days */}
                    {(() => {
                      const year = currentWeek.getFullYear()
                      const month = currentWeek.getMonth()
                      const firstDay = new Date(year, month, 1)
                      const lastDay = new Date(year, month + 1, 0)
                      const startPadding = firstDay.getDay()
                      const totalDays = lastDay.getDate()
                      const weeks = Math.ceil((startPadding + totalDays) / 7)
                      
                      const days = []
                      
                      // Add padding for start of month
                      for (let i = 0; i < startPadding; i++) {
                        days.push(
                          <div key={`pad-start-${i}`} className="bg-background p-2 min-h-[100px]" />
                        )
                      }
                      
                      // Add actual days
                      for (let day = 1; day <= totalDays; day++) {
                        // Create date string for this day
                        const dayDateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                        
                        // Filter activities for this specific date
                        const dayActivities = filteredActivities.filter(a => a.date === dayDateStr)
                        
                        const isToday = new Date().getDate() === day && 
                                       new Date().getMonth() === month && 
                                       new Date().getFullYear() === year
                        
                        days.push(
                          <div 
                            key={`day-${day}`} 
                            className={`bg-background p-2 min-h-[100px] border-t hover:bg-muted/5 transition-colors cursor-pointer group ${
                              isToday ? 'ring-2 ring-primary ring-inset' : ''
                            }`}
                            onClick={(e) => {
                              // If clicking on the day number or the "more" text, switch to Today view
                              if (!(e.target as HTMLElement).closest('.activity-item')) {
                                const clickedDate = new Date(year, month, day)
                                setCurrentWeek(clickedDate)
                                setViewType('today')
                              }
                            }}
                          >
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-sm font-medium group-hover:text-primary transition-colors ${isToday ? 'text-primary' : ''}`}>
                                {day}
                              </span>
                              {dayActivities.length > 0 && (
                                <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                  {dayActivities.length}
                                </span>
                              )}
                            </div>
                            
                            {/* Show first few activities */}
                            <div className="space-y-1">
                              {dayActivities.slice(0, 3).map((activity, index) => {
                                const child = getChild(activity.childId)
                                if (!child) return null
                                
                                return (
                                  <div 
                                    key={`${activity.id}-${index}`}
                                    className="activity-item text-xs p-1 bg-muted/50 rounded truncate cursor-pointer hover:bg-muted transition-colors"
                                    onClick={(e) => {
                                      e.stopPropagation()
                                      setSelectedActivity(activity)
                                    }}
                                  >
                                    <span className="mr-1">{child.emoji}</span>
                                    <span>{activity.title}</span>
                                  </div>
                                )
                              })}
                              {dayActivities.length > 3 && (
                                <div className="text-xs text-center py-1 px-2 bg-primary/5 text-primary rounded hover:bg-primary/10 transition-colors">
                                  +{dayActivities.length - 3} more →
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      }
                      
                      // Add padding for end of month
                      const endPadding = weeks * 7 - (startPadding + totalDays)
                      for (let i = 0; i < endPadding; i++) {
                        days.push(
                          <div key={`pad-end-${i}`} className="bg-background p-2 min-h-[100px]" />
                        )
                      }
                      
                      return days
                    })()}
                  </div>
                  
                  {/* Month Summary */}
                  <div className="mt-6 p-4 bg-muted/30 rounded-lg">
                    <div className="flex justify-around text-center">
                      <div>
                        <p className="text-2xl font-light">{filteredActivities.length}</p>
                        <p className="text-sm text-muted-foreground">
                          {selectedView === 'family' ? 'Total Activities' : 'Activities'}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-light">
                          {selectedView === 'family' 
                            ? children.length 
                            : children.filter(c => c.id === selectedView).length
                          }
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {selectedView === 'family' ? 'Children' : 'Child'}
                        </p>
                      </div>
                      <div>
                        <p className="text-2xl font-light">
                          {[...new Set(filteredActivities.map(a => a.subject))].length}
                        </p>
                        <p className="text-sm text-muted-foreground">Subjects</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Activity Modal */}
        <ActivityModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSave={saveActivity}
          onDelete={deleteActivity}
          activity={modalActivity}
          children={children}
          day={modalDay}
          time={modalTime}
          currentWeek={currentWeek}
        />
        
        {/* Generate Plan Modal */}
        <GeneratePlanModal
          isOpen={showGeneratePlan}
          onClose={() => setShowGeneratePlan(false)}
          children={children}
          currentWeek={currentWeek}
          existingActivities={activities}
          onGenerate={async (generatedActivities) => {
            if (!user) return
            
            try {
              // Batch create all activities at once instead of one by one
              const activitiesToCreate = generatedActivities.map(activity => {
                const { id, ...activityWithoutId } = activity
                return {
                  ...activityWithoutId,
                  user_id: user.id
                }
              })
              
              // Create all activities in the database
              const createdActivities = []
              for (const activity of activitiesToCreate) {
                const dbActivity = await createActivity(activity as any)
                createdActivities.push(dbActivity)
              }
              
              // Update the UI once with all new activities
              setActivities([...activities, ...createdActivities])
              setShowGeneratePlan(false)
            } catch (error) {
              console.error('Error saving generated activities:', error)
              setError('Failed to save generated activities')
            }
          }}
        />

        {/* Activity Detail Sidebar */}
        {selectedActivity && (
          <div className="fixed right-0 top-0 h-full w-96 bg-background border-l shadow-lg z-20 overflow-y-auto print:hidden">
            <div className="p-6">
              <div className="flex items-start justify-between mb-6">
                <h2 className="text-xl font-medium">Activity Details</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedActivity(null)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {(() => {
                const child = getChild(selectedActivity.childId)
                return child ? (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{child.emoji}</span>
                      <span className="font-medium">{child.name}</span>
                    </div>

                    {/* Status Controls */}
                    <div className="bg-muted/50 rounded-lg p-3">
                      <Label className="text-sm text-muted-foreground mb-2 block">Activity Status</Label>
                      <div className="flex gap-2">
                        <Button
                          variant={selectedActivity.status === 'completed' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            updateActivityStatus(selectedActivity.id, 'completed')
                            setSelectedActivity({ ...selectedActivity, status: 'completed' })
                          }}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                          Complete
                        </Button>
                        <Button
                          variant={selectedActivity.status === 'skipped' ? 'default' : 'outline'}
                          size="sm"
                          className="flex-1"
                          onClick={() => {
                            updateActivityStatus(selectedActivity.id, 'skipped')
                            setSelectedActivity({ ...selectedActivity, status: 'skipped' })
                          }}
                        >
                          <SkipForward className="w-3.5 h-3.5 mr-1.5" />
                          Skip
                        </Button>
                        {selectedActivity.status && selectedActivity.status !== 'pending' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              updateActivityStatus(selectedActivity.id, 'pending')
                              setSelectedActivity({ ...selectedActivity, status: 'pending' })
                            }}
                          >
                            <RotateCcw className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                      {selectedActivity.completedAt && (
                        <p className="text-xs text-muted-foreground mt-2">
                          Completed: {new Date(selectedActivity.completedAt).toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Title</Label>
                      <p className="text-lg font-medium">{selectedActivity.title}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Subject</Label>
                      <p>{selectedActivity.subject}</p>
                    </div>

                    <div>
                      <Label className="text-sm text-muted-foreground">Time</Label>
                      <p>{selectedActivity.day}, {selectedActivity.startTime} - {selectedActivity.endTime}</p>
                    </div>

                    {selectedActivity.description && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Description</Label>
                        <p className="text-sm">{selectedActivity.description}</p>
                      </div>
                    )}

                    {selectedActivity.materials && selectedActivity.materials.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Materials Needed</Label>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {selectedActivity.materials.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedActivity.instructions && selectedActivity.instructions.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Instructions</Label>
                        <ol className="list-decimal list-inside text-sm space-y-1">
                          {selectedActivity.instructions.map((step, i) => (
                            <li key={i}>{step}</li>
                          ))}
                        </ol>
                      </div>
                    )}

                    {selectedActivity.objectives && selectedActivity.objectives.length > 0 && (
                      <div>
                        <Label className="text-sm text-muted-foreground">Learning Objectives</Label>
                        <ul className="list-disc list-inside text-sm space-y-1">
                          {selectedActivity.objectives.map((obj, i) => (
                            <li key={i}>{obj}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <div className="pt-4 space-y-2">
                      <Button 
                        className="w-full"
                        onClick={() => {
                          openActivityModal(selectedActivity, selectedActivity.day, selectedActivity.startTime)
                          setSelectedActivity(null)
                        }}
                      >
                        Edit Activity
                      </Button>
                      {!selectedActivity.enhanced && (
                        <Button variant="outline" className="w-full">
                          <Sparkles className="w-4 h-4 mr-2" />
                          Enhance with AI
                        </Button>
                      )}
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          </div>
        )}

        {/* Drag Overlay */}
        <DragOverlay>
          {draggedActivity && draggedChild && (
            <div className="opacity-80">
              <DraggableActivity activity={draggedActivity} child={draggedChild} onClick={() => {}} />
            </div>
          )}
        </DragOverlay>
      </div>

      {/* Keyboard Shortcuts Modal */}
      {showKeyboardShortcuts && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-lg w-full max-h-[80vh] overflow-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Keyboard className="w-5 h-5" />
                  Keyboard Shortcuts
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowKeyboardShortcuts(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Navigation</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Today View</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">D</kbd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Week View</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">W</kbd>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Month View</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">M</kbd>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Actions</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>New Activity</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">N</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Save Plan</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">S</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Print</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">P</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Search</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">K</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">Edit</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Undo</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Z</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Redo</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⇧</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">Z</kbd>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-medium text-muted-foreground mb-2">General</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>Show Shortcuts</span>
                      <div className="flex gap-1">
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">⌘</kbd>
                        <kbd className="px-2 py-1 bg-muted rounded text-xs">?</kbd>
                      </div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Close Dialog</span>
                      <kbd className="px-2 py-1 bg-muted rounded text-xs">ESC</kbd>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 max-w-md">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription className="pr-8">{error}</AlertDescription>
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-2 right-2"
              onClick={() => setError(null)}
            >
              <X className="h-4 w-4" />
            </Button>
          </Alert>
        </div>
      )}

      {/* Floating Map Toggle Button - Airbnb Style */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 print:hidden">
        <Button
          className="rounded-full shadow-lg bg-background hover:bg-muted border-2 text-foreground hover:scale-105 transition-all"
          onClick={() => navigate('/map')}
          size="lg"
        >
          <span className="flex items-center gap-2">
            <span className="text-sm font-medium">Show map</span>
            <div className="relative">
              <Globe2 className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
            </div>
          </span>
        </Button>
      </div>

      {/* Print Styles */}
      <style>{`
        @media print {
          .print\\:hidden {
            display: none !important;
          }
          .print\\:static {
            position: static !important;
          }
          .print\\:shadow-none {
            box-shadow: none !important;
          }
        }
      `}</style>
    </DndContext>
  )
}