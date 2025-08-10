import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { ThemeToggle } from '@/components/ThemeToggle'
import { useAuth } from '@/contexts/AuthContext'
import { Alert, AlertDescription } from '@/components/ui/alert'

export default function Login() {
  const navigate = useNavigate()
  const { signIn, signInWithMagicLink } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [useMagicLink, setUseMagicLink] = useState(true)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    
    if (useMagicLink) {
      const { error } = await signInWithMagicLink(email)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        setMagicLinkSent(true)
        setLoading(false)
      }
    } else {
      const { error } = await signIn(email, password)
      
      if (error) {
        setError(error.message)
        setLoading(false)
      } else {
        navigate('/dashboard')
      }
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-light">Welcome back</CardTitle>
          <CardDescription>
            {magicLinkSent 
              ? 'Check your email for the magic link'
              : useMagicLink 
                ? 'Enter your email to receive a magic link'
                : 'Enter your email and password to sign in'
            }
          </CardDescription>
        </CardHeader>
        {magicLinkSent ? (
          <CardContent className="space-y-4">
            <Alert>
              <AlertDescription>
                We've sent you a magic link! Check your email and click the link to sign in.
              </AlertDescription>
            </Alert>
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => {
                setMagicLinkSent(false)
                setEmail('')
              }}
            >
              Try again
            </Button>
          </CardContent>
        ) : (
          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="parent@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!useMagicLink && (
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setUseMagicLink(!useMagicLink)}
                  className="text-sm text-primary hover:underline"
                >
                  {useMagicLink ? 'Use password instead' : 'Use magic link instead'}
                </button>
              </div>
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button type="submit" className="w-full" disabled={loading}>
                {loading 
                  ? 'Sending...' 
                  : useMagicLink 
                    ? 'Send Magic Link' 
                    : 'Sign In'
                }
              </Button>
              <div className="text-sm text-center text-muted-foreground">
                Don't have an account?{' '}
                <Link to="/signup" className="text-primary hover:underline">
                  Sign up
                </Link>
              </div>
            </CardFooter>
          </form>
        )}
      </Card>
    </div>
  )
}