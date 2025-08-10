import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { 
  Calendar, Users, Sparkles, MapPin, 
  School, Brain, Star, Filter, 
  ChevronLeft, Globe2, UserPlus, Bell
} from 'lucide-react'

// Mock data for nearby families
const mockFamilies = [
  {
    id: '1',
    name: 'The Johnson Family',
    distance: '0.8 miles',
    children: ['Emma (8)', 'Liam (6)'],
    interests: ['STEM Focus', 'Arts & Creativity'],
    curriculum: 'Montessori',
    rating: 4.8,
    avatar: '👨‍👩‍👧‍👦'
  },
  {
    id: '2',
    name: 'The Chen Family',
    distance: '1.2 miles',
    children: ['Sophie (7)', 'Alex (9)'],
    interests: ['Language Learning', 'Music'],
    curriculum: 'Classical Education',
    rating: 4.9,
    avatar: '👨‍👩‍👧‍👦'
  },
  {
    id: '3',
    name: 'The Martinez Family',
    distance: '2.1 miles',
    children: ['Diego (8)'],
    interests: ['Sports & PE', 'STEM Focus'],
    curriculum: 'Project-Based',
    rating: 4.7,
    avatar: '👨‍👩‍👦'
  }
]

export default function Map() {
  const navigate = useNavigate()
  const [selectedFamily, setSelectedFamily] = useState<string | null>(null)
  const [showFilters, setShowFilters] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 relative">
      {/* Header */}
      <div className="border-b bg-background/80 backdrop-blur-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/dashboard')}
              >
                <ChevronLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-light flex items-center gap-2">
                  <Globe2 className="w-6 h-6 text-primary" />
                  EduPlan Connect
                </h1>
                <p className="text-sm text-muted-foreground">Discover homeschooling families near you</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative h-[calc(100vh-80px)]">
        {/* Map Placeholder */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-green-50 to-yellow-50 dark:from-blue-950/20 dark:via-green-950/20 dark:to-yellow-950/20">
          <div className="relative w-full h-full">
            {/* Simulated Map Pins */}
            <div className="absolute top-1/4 left-1/3 animate-pulse">
              <div className="relative">
                <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 bg-green-500 text-white text-xs rounded-full px-1.5">3</span>
              </div>
            </div>
            
            <div className="absolute top-1/2 left-1/2 animate-pulse delay-100">
              <div className="relative">
                <div className="w-12 h-12 bg-secondary/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-secondary" />
                </div>
                <span className="absolute -top-2 -right-2 bg-blue-500 text-white text-xs rounded-full px-1.5">2</span>
              </div>
            </div>
            
            <div className="absolute top-2/3 left-2/3 animate-pulse delay-200">
              <div className="relative">
                <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-accent" />
                </div>
                <span className="absolute -top-2 -right-2 bg-purple-500 text-white text-xs rounded-full px-1.5">1</span>
              </div>
            </div>

            {/* You Are Here */}
            <div className="absolute top-1/2 left-1/4">
              <div className="relative">
                <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center animate-pulse">
                  <School className="w-8 h-8 text-white" />
                </div>
                <div className="absolute inset-0 bg-primary rounded-full animate-ping opacity-20"></div>
                <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs font-medium whitespace-nowrap">You</span>
              </div>
            </div>

            {/* Coming Soon Overlay */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-sm flex items-center justify-center">
              <Card className="max-w-2xl w-full mx-4">
                <CardContent className="p-8 text-center">
                  <div className="mb-6">
                    <div className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
                      <Globe2 className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-3xl font-light mb-2">Coming Soon!</h2>
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 rounded-full text-sm mb-4">
                      <Sparkles className="w-4 h-4" />
                      Experimental Feature
                    </div>
                  </div>

                  <p className="text-lg text-muted-foreground mb-6">
                    Connect with nearby homeschooling families based on location, 
                    shared interests, and learning approaches.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    <div className="bg-muted/30 rounded-lg p-4">
                      <MapPin className="w-8 h-8 text-primary mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Location-Based</h3>
                      <p className="text-sm text-muted-foreground">
                        Find families in your neighborhood
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <Brain className="w-8 h-8 text-secondary mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Smart Matching</h3>
                      <p className="text-sm text-muted-foreground">
                        Match by curriculum & learning style
                      </p>
                    </div>
                    <div className="bg-muted/30 rounded-lg p-4">
                      <UserPlus className="w-8 h-8 text-accent mx-auto mb-2" />
                      <h3 className="font-medium mb-1">Build Community</h3>
                      <p className="text-sm text-muted-foreground">
                        Create study groups & playdates
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3 justify-center">
                    <Button
                      onClick={() => navigate('/dashboard')}
                    >
                      <Calendar className="w-4 h-4 mr-2" />
                      Back to Calendar
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {}}
                      disabled
                    >
                      <Bell className="w-4 h-4 mr-2" />
                      Notify Me
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Side Panel - Family Cards Preview */}
        <div className="absolute left-4 top-4 bottom-4 w-80 overflow-y-auto space-y-3 hidden lg:block">
          <div className="bg-background/95 backdrop-blur-sm rounded-lg p-4 border">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Nearby Families (Preview)
            </h3>
            {mockFamilies.map(family => (
              <div 
                key={family.id}
                className={`border rounded-lg p-3 mb-2 hover:bg-muted/50 cursor-pointer transition-all ${
                  selectedFamily === family.id ? 'bg-primary/10 border-primary' : ''
                }`}
                onClick={() => setSelectedFamily(family.id)}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{family.avatar}</span>
                    <div>
                      <p className="font-medium text-sm">{family.name}</p>
                      <p className="text-xs text-muted-foreground">{family.distance}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                    <span className="text-xs">{family.rating}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">
                    Children: {family.children.join(', ')}
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {family.interests.slice(0, 2).map(interest => (
                      <span key={interest} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                        {interest}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Floating Toggle Button (visible on Dashboard) */}
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full shadow-lg"
          onClick={() => navigate('/dashboard')}
        >
          <Calendar className="w-5 h-5 mr-2" />
          Show Calendar
        </Button>
      </div>
    </div>
  )
}