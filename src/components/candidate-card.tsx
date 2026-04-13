import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { Candidate } from '@/types/candidate'
import {
  Award,
  Briefcase,
  Calendar,
  GraduationCap,
  Mail,
  MapPin,
  Phone,
} from 'lucide-react'

interface CandidateCardProps {
  candidate: Candidate
  jobId: string
  onClick: () => void
}

const statusColors = {
  active: 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/20',
  interviewing:
    'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
  offered:
    'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
  hired:
    'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20',
  rejected: 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20',
  withdrawn:
    'bg-gray-500/10 text-gray-700 dark:text-gray-400 border-gray-500/20',
} as const

export function CandidateCard({ candidate, onClick }: CandidateCardProps) {
  // Backend doesn't have per-job applications, use candidate-level data
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const candidateData = candidate as any
  const status = candidateData.status || 'active'

  // AI Score details
  const aiScore = candidateData.aiScore?.overallScore
  const recommendation = candidateData.aiScore?.recommendation
  const strengths = candidateData.aiScore?.strengths || []

  const fullName = `${candidate.firstName} ${candidate.lastName}`
  const initials =
    `${candidate.firstName[0]}${candidate.lastName[0]}`.toUpperCase()
  const daysSinceApplied = Math.floor(
    (new Date().getTime() - new Date(candidate.createdAt).getTime()) /
      (1000 * 60 * 60 * 24)
  )

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group overflow-hidden"
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Avatar className="h-12 w-12 border-2 border-border">
              <AvatarImage src={candidate.avatar} alt={fullName} />
              <AvatarFallback className="text-sm font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                {fullName}
              </h3>
              {(candidateData.currentTitle || candidateData.currentCompany) && (
                <p className="text-xs text-muted-foreground truncate">
                  {candidateData.currentTitle || 'Professional'}
                  {candidateData.currentCompany &&
                    ` at ${candidateData.currentCompany}`}
                </p>
              )}
            </div>
          </div>
          <Badge
            className={cn(
              'text-xs px-2 py-1 border',
              statusColors[status as keyof typeof statusColors] ||
                statusColors.active
            )}
          >
            {status.replace(/_/g, ' ')}
          </Badge>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-2 mb-3">
          {candidate.email && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground min-w-0">
              <Mail className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{candidate.email}</span>
            </div>
          )}
          {candidate.phone && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{candidate.phone}</span>
            </div>
          )}
          {candidateData.location && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{candidateData.location}</span>
            </div>
          )}
          {candidateData.experience && candidateData.experience.length > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Briefcase className="h-3.5 w-3.5 shrink-0" />
              <span>
                {candidateData.experience.length} position
                {candidateData.experience.length > 1 ? 's' : ''}
              </span>
            </div>
          )}
        </div>

        {/* Skills Section */}
        {candidateData.skills && candidateData.skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {candidateData.skills
              .slice(0, 5)
              .map((skill: string | { name: string }, index: number) => (
                <Badge
                  key={index}
                  variant="outline"
                  className="text-xs px-2 py-0.5 font-normal"
                >
                  {typeof skill === 'object' ? skill.name : skill}
                </Badge>
              ))}
            {candidateData.skills.length > 5 && (
              <Badge
                variant="outline"
                className="text-xs px-2 py-0.5 bg-muted/50 font-normal"
              >
                +{candidateData.skills.length - 5} more
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t">
          <div className="flex flex-col gap-1.5 flex-1">
            {/* AI Score and Recommendation */}
            {aiScore !== undefined && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-amber-500" />
                  <span className="text-xs font-medium text-foreground">
                    AI Score: {aiScore}%
                  </span>
                </div>
                {recommendation && (
                  <Badge
                    variant={
                      recommendation === 'excellent_fit'
                        ? 'primary'
                        : recommendation === 'good_fit'
                          ? 'secondary'
                          : 'outline'
                    }
                    className="text-[10px] px-1.5 py-0.5"
                  >
                    {recommendation
                      .replace('_', ' ')
                      .replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Badge>
                )}
              </div>
            )}

            {/* Top Strength */}
            {strengths.length > 0 && (
              <div className="text-xs text-muted-foreground">
                <span className="font-medium">Strength:</span>{' '}
                {typeof strengths[0] === 'object'
                  ? (strengths[0] as { name: string }).name
                  : strengths[0]}
              </div>
            )}

            {/* Education */}
            {candidateData.education && candidateData.education.length > 0 && (
              <div className="flex items-center gap-1.5">
                <GraduationCap className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">
                  {candidateData.education[0].degree}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {candidateData.certifications &&
              candidateData.certifications.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {candidateData.certifications.length} certs
                  </span>
                </div>
              )}
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>{daysSinceApplied}d ago</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
