import { CandidatesDataTable } from '@/components/candidates-data-table'
import { Loader } from '@/components/ui/loader'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  useApplications,
  useCandidates,
  useClients,
  useJobs,
  usePipelines,
} from '@/store/hooks/index'
import * as React from 'react'
import { useSearchParams } from 'react-router-dom'

export default function CandidatesPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  // Initialize state from URL params
  const [activeTab, setActiveTab] = React.useState(
    searchParams.get('tab') || 'all'
  )
  const [isTabChanging, setIsTabChanging] = React.useState(false)

  const {
    candidates,
    deleteCandidate,
    invalidateCache,
    isLoading: candidatesLoading,
  } = useCandidates()
  const { applications, isLoading: applicationsLoading } = useApplications()
  const { jobs, isLoading: jobsLoading } = useJobs()
  const { clients, isLoading: clientsLoading } = useClients()
  const { pipelines, isLoading: pipelinesLoading } = usePipelines()

  const handleDeleteCandidate = async (candidateId: string) => {
    try {
      await deleteCandidate(candidateId)
      invalidateCache()
    } catch (error: unknown) {
      console.error('Failed to delete candidate:', error)
    }
  }

  const handleTabChange = (value: string) => {
    setIsTabChanging(true)
    setActiveTab(value)

    // Update URL params
    const newParams = new URLSearchParams(searchParams)
    newParams.set('tab', value)
    setSearchParams(newParams, { replace: true })

    // Reset after animation
    setTimeout(() => setIsTabChanging(false), 300)
  }

  const transformedApplications = React.useMemo(
    () =>
      applications
        // Only show pending applications - approved ones are already candidates
        .filter(app => app.status === 'pending')
        .map(app => {
          const job = jobs.find(j => j.id === (app.jobId || app.targetJobId))
          const client = job ? clients.find(c => c.id === job.clientId) : null

          return {
            id: app.id,
            candidateId: app.id,
            isApplication: true,
            applicationStatus: app.status,
            header: `${app.firstName} ${app.lastName}`,
            type: job?.title || 'General Applicant',
            status:
              app.status === 'approved'
                ? 'Approved'
                : app.status === 'rejected'
                  ? 'Rejected'
                  : 'Pending Review',
            target: app.createdAt ? new Date(app.createdAt).getTime() : 0,
            limit: 0,
            reviewer: 'Team',
            source: app.source || 'direct_apply',
            dateApplied: app.createdAt
              ? new Date(app.createdAt).toLocaleDateString()
              : 'N/A',
            currentStage: 'Application',
            jobIdDisplay: job?.id || 'N/A',
            jobTitle: job?.title || 'General Applicant',
            clientName: client?.companyName || 'Unknown Client',
            clientLogo:
              client?.logo ||
              `https://api.dicebear.com/7.x/initials/svg?seed=${client?.companyName || 'C'}`,
            teamMembers: [],
            assignedTo: undefined,
            photo: app.photo,
            email: app.email,
            phone: app.phone,
            currentTitle: app.currentTitle,
            currentCompany: app.currentCompany,
            yearsOfExperience: app.yearsOfExperience || 0,
            skills: app.skills || [],
            coverLetter: app.coverLetter,
            resumeText: app.resumeText || app.resumeRawText,
            resumeFilename: app.resume?.name,
            resumeFileSize: app.resume?.size
              ? String(app.resume.size)
              : undefined,
            resumeUrl: app.resume?.url,
            location: app.address,
            linkedinUrl: app.linkedInUrl,
            portfolioUrl: app.portfolioUrl,
            educationLevel: undefined,
            expectedSalary: app.expectedSalary
              ? `${app.expectedSalary.currency} ${app.expectedSalary.min}-${app.expectedSalary.max}/${app.expectedSalary.period}`
              : undefined,
            languages: undefined,
            notes: app.reviewNotes,
            videoIntroUrl: app.videoIntroUrl,
            videoIntroFilename: undefined,
            videoIntroFileSize: undefined,
            videoIntroDuration: undefined,
          }
        }),
    [applications, jobs, clients]
  )

  const transformedData = React.useMemo(() => {
    return candidates.flatMap((candidate, index) => {
      const jobIds = candidate.jobIds || []
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const apps: any[] = (candidate as any).jobApplications || []

      if (jobIds.length === 0) {
        return [createCandidateRow(candidate, null, index)]
      }

      // Only show jobs where the application is not inactive (not moved away from)
      const visibleJobIds = jobIds.filter(jobId => {
        const app = apps.find(a => a.jobId === jobId)
        return !app || app.status !== 'inactive'
      })

      // Fallback: if all are inactive, show the latest one
      const idsToRender =
        visibleJobIds.length > 0 ? visibleJobIds : [jobIds[jobIds.length - 1]]

      return idsToRender.map(jobId =>
        createCandidateRow(candidate, jobId, index)
      )
    })

    function createCandidateRow(
      candidate: (typeof candidates)[0],
      jobIdOrObject: unknown,
      index: number
    ) {
      const selectedTeamMembers: string[] = []

      const firstJobId = jobIdOrObject
      let job = null
      let client = null

      if (firstJobId) {
        if (
          typeof firstJobId === 'object' &&
          firstJobId !== null &&
          'title' in firstJobId
        ) {
          job = {
            ...(firstJobId as Record<string, unknown>),
            id:
              (firstJobId as Record<string, unknown>).id ||
              (firstJobId as Record<string, unknown>)._id,
          } as Record<string, unknown>

          const jobRecord = job as Record<string, unknown>
          if (
            jobRecord.clientId &&
            typeof jobRecord.clientId === 'object' &&
            jobRecord.clientId !== null &&
            'companyName' in jobRecord.clientId
          ) {
            client = {
              ...(jobRecord.clientId as Record<string, unknown>),
              id:
                (jobRecord.clientId as Record<string, unknown>).id ||
                (jobRecord.clientId as Record<string, unknown>)._id,
            }
          } else if (jobRecord.clientId) {
            const clientIdStr =
              typeof jobRecord.clientId === 'object' &&
              jobRecord.clientId !== null
                ? (jobRecord.clientId as Record<string, unknown>)._id ||
                  (jobRecord.clientId as Record<string, unknown>).id
                : jobRecord.clientId
            client = clients.find(c => c.id === clientIdStr)
          }
        } else {
          const jobIdStr =
            typeof firstJobId === 'object' && firstJobId !== null
              ? (firstJobId as Record<string, unknown>).id ||
                (firstJobId as Record<string, unknown>)._id ||
                String(firstJobId)
              : String(firstJobId)
          job = jobs.find(j => j.id === jobIdStr)
          if (job) {
            client = clients.find(c => c.id === job!.clientId)
          }
        }
      }

      const getDisplayStatus = (status: string) => {
        switch (status) {
          case 'active':
          case 'interviewing':
          case 'offered':
            return 'In Process'
          case 'hired':
            return 'Hired'
          case 'rejected':
          case 'withdrawn':
            return 'Rejected'
          default:
            return 'In Process'
        }
      }

      const candidateId = candidate.id

      const currentJobApp = candidate.jobApplications?.find(app => {
        const appJobId =
          typeof app.jobId === 'string'
            ? app.jobId
            : (app.jobId as Record<string, unknown>)?.id
        return appJobId === (job as Record<string, unknown> | null)?.id
      })

      let currentStage = 'Not Started'

      const stageId = currentJobApp
        ? currentJobApp.currentStage
        : candidate.currentPipelineStageId || candidate.currentStage

      if (
        stageId &&
        typeof stageId === 'string' &&
        (job as Record<string, unknown> | null)?.pipelineId
      ) {
        const jobPipeline = pipelines.find(
          p => p.id === (job as Record<string, unknown>)!.pipelineId
        )

        if (jobPipeline?.stages && jobPipeline.stages.length > 0) {
          let stage = jobPipeline.stages.find(s => s.id === stageId)

          if (!stage) {
            stage = jobPipeline.stages.find(
              s => s.name?.toLowerCase() === stageId.toLowerCase()
            )
          }

          if (!stage && stageId.includes('stage_') && stageId.includes('_')) {
            const parts = stageId.split('_')
            const stageIndex = parseInt(parts[parts.length - 1])
            if (!isNaN(stageIndex) && stageIndex < jobPipeline.stages.length) {
              stage = jobPipeline.stages[stageIndex]
            }
          }

          if (!stage) {
            const stageIdLower = stageId.toLowerCase()
            stage = jobPipeline.stages.find(s => {
              const stageName = s.name?.toLowerCase() || ''
              const significantWords = stageIdLower
                .split(' ')
                .filter(w => w.length > 2)
              if (significantWords.length >= 2) {
                const matchCount = significantWords.filter(word =>
                  stageName.includes(word)
                ).length
                if (matchCount >= 2) return true
              }
              return false
            })
          }

          if (stage?.name) {
            currentStage = stage.name
          }
        }
      }

      const jobIdStr =
        ((job as Record<string, unknown> | null)?.id as string) || 'no-job'
      const uniqueRowId = `${candidateId}-${jobIdStr}`

      const appliedAt = currentJobApp?.appliedAt
        ? typeof currentJobApp.appliedAt === 'object' &&
          currentJobApp.appliedAt !== null &&
          'seconds' in currentJobApp.appliedAt
          ? (currentJobApp.appliedAt as { seconds: number }).seconds * 1000
          : new Date(currentJobApp.appliedAt as unknown as string).getTime()
        : new Date(candidate.createdAt).getTime()

      return {
        id: uniqueRowId,
        candidateId: candidateId,
        jobIdForRow: jobIdStr,
        header: `${candidate.firstName} ${candidate.lastName}`,
        type:
          ((job as Record<string, unknown> | null)?.title as string) ||
          'General Applicant',
        status: getDisplayStatus(candidate.status || 'active'),
        target: appliedAt,
        limit: candidate.yearsOfExperience || 0,
        reviewer: 'Team',
        source: candidate.source || 'direct_apply',
        dateApplied: new Date(appliedAt).toLocaleDateString(),
        currentStage: currentStage,
        jobIdDisplay:
          ((job as Record<string, unknown> | null)?.id as string) || 'N/A',
        jobTitle:
          ((job as Record<string, unknown> | null)?.title as string) ||
          'General Applicant',
        clientName:
          ((client as Record<string, unknown> | null)?.companyName as string) ||
          'Unknown Client',
        clientLogo:
          ((client as Record<string, unknown> | null)?.logo as string) ||
          `https://api.dicebear.com/7.x/initials/svg?seed=${(client as Record<string, unknown> | null)?.companyName || 'C'}`,
        teamMembers: selectedTeamMembers,
        assignedTo: candidate.assignedTo,
        photo: candidate.avatar || undefined,
        email: candidate.email,
        phone: candidate.phone,
        currentTitle: candidate.currentTitle,
        currentCompany: candidate.currentCompany,
        yearsOfExperience: candidate.yearsOfExperience,
        skills:
          candidate.skills?.map(s => (typeof s === 'string' ? s : s.name)) ||
          [],
        coverLetter: candidate.coverLetter?.url || undefined,
        resumeText: undefined,
        resumeFilename: candidate.resume?.name || undefined,
        resumeFileSize: candidate.resume?.size
          ? String(candidate.resume.size)
          : undefined,
        resumeUrl: candidate.resume?.url || undefined,
        location: candidate.address
          ? `${candidate.address.city}, ${candidate.address.country}`
          : undefined,
        linkedinUrl: undefined,
        portfolioUrl: undefined,
        educationLevel: candidate.education?.[0]?.level || undefined,
        expectedSalary: undefined,
        languages:
          candidate.languages?.map(l => (typeof l === 'string' ? l : l.name)) ||
          undefined,
        notes: undefined,
        videoIntroUrl: undefined,
        videoIntroFilename: undefined,
        videoIntroFileSize: undefined,
        videoIntroDuration: undefined,
        inTalentPool: candidate.inTalentPool === true,
      }
    }
  }, [candidates, jobs, clients, pipelines])

  const allData = React.useMemo(() => {
    const sortedCandidates = [...transformedData].sort(
      (a, b) => b.target - a.target
    )
    return [...transformedApplications, ...sortedCandidates]
  }, [transformedApplications, transformedData])

  // Helper to detect if a candidate has been moved into an active pipeline stage
  const hasActivePipelineStage = (item: (typeof allData)[number]) => {
    return Boolean(
      item.currentStage &&
      item.currentStage !== 'Not Started' &&
      item.currentStage !== 'Not Assigned' &&
      item.currentStage !== 'Application' &&
      item.currentStage !== 'N/A'
    )
  }

  const filteredData = React.useMemo(() => {
    switch (activeTab) {
      case 'pending':
        // Only pending applications (not yet approved)
        return allData.filter(
          item => 'isApplication' in item && item.isApplication
        )

      case 'approved':
        // Approved candidates: real candidates (not applications) that have NOT yet been
        // assigned a pipeline stage — they are in the "holding/approved" area
        return allData.filter(item => {
          if ('isApplication' in item && item.isApplication) return false
          if (item.status === 'Hired' || item.status === 'Rejected')
            return false
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((item as any).inTalentPool === true) return false
          return !hasActivePipelineStage(item)
        })

      case 'active':
        // Active candidates: in the pipeline with an assigned stage
        return allData.filter(item => {
          if ('isApplication' in item && item.isApplication) return false
          if (item.status === 'Hired' || item.status === 'Rejected')
            return false
          return hasActivePipelineStage(item)
        })

      case 'hired':
        return allData.filter(
          item =>
            !('isApplication' in item && item.isApplication) &&
            item.status === 'Hired'
        )

      case 'talent_pool':
        return allData.filter(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          item =>
            !('isApplication' in item && item.isApplication) &&
            (item as any).inTalentPool === true
        )

      case 'all':
      default:
        // Show all: pending applications + all non-rejected, non-talent-pool candidates
        return allData.filter(item => {
          if ('isApplication' in item && item.isApplication) return true
          if (item.status === 'Rejected') return false
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((item as any).inTalentPool === true) return false
          return true
        })
    }
  }, [activeTab, allData])

  const isLoading =
    candidatesLoading ||
    applicationsLoading ||
    jobsLoading ||
    clientsLoading ||
    pipelinesLoading

  if (isLoading)
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader size="lg" text="Loading candidates..." />
      </div>
    )

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-foreground mb-2">
                Candidates & Applications
              </h2>
              <p className="text-muted-foreground">
                Review applications and track candidates across all job
                applications
              </p>
            </div>
          </div>

          <Tabs
            value={activeTab}
            onValueChange={handleTabChange}
            className="px-4 lg:px-6"
          >
            <TabsList className="grid w-full grid-cols-6 max-w-[900px] h-12 p-1 bg-card border-2 shadow-sm">
              <TabsTrigger
                value="all"
                className="data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  All
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-primary-foreground/20 data-[state=active]:bg-white/20">
                    {allData.length}
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="pending"
                className="data-[state=active]:bg-amber-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  Pending
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-amber-100 text-amber-900 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {
                      allData.filter(
                        item =>
                          'isApplication' in item &&
                          item.isApplication &&
                          item.applicationStatus === 'pending'
                      ).length
                    }
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="approved"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  Approved
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-900 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {
                      allData.filter(
                        item =>
                          !('isApplication' in item && item.isApplication) &&
                          item.status !== 'Hired' &&
                          item.status !== 'Rejected' &&
                          !(item as any).inTalentPool &&
                          !(
                            item.currentStage &&
                            item.currentStage !== 'Not Started' &&
                            item.currentStage !== 'Not Assigned' &&
                            item.currentStage !== 'Application' &&
                            item.currentStage !== 'N/A'
                          )
                      ).length
                    }
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="active"
                className="data-[state=active]:bg-blue-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  Active
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-blue-100 text-blue-900 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {
                      allData.filter(
                        item =>
                          !('isApplication' in item && item.isApplication) &&
                          item.status !== 'Hired' &&
                          item.status !== 'Rejected' &&
                          !!(
                            item.currentStage &&
                            item.currentStage !== 'Not Started' &&
                            item.currentStage !== 'Not Assigned' &&
                            item.currentStage !== 'Application' &&
                            item.currentStage !== 'N/A'
                          )
                      ).length
                    }
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="hired"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  Hired
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-green-100 text-green-900 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {
                      allData.filter(
                        item =>
                          !('isApplication' in item && item.isApplication) &&
                          item.status === 'Hired'
                      ).length
                    }
                  </span>
                </span>
              </TabsTrigger>
              <TabsTrigger
                value="talent_pool"
                className="data-[state=active]:bg-yellow-500 data-[state=active]:text-white data-[state=active]:shadow-md transition-all duration-200 font-medium"
              >
                <span className="flex items-center gap-2">
                  Talent Pool
                  <span className="inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-900 data-[state=active]:bg-white/20 data-[state=active]:text-white">
                    {
                      allData.filter(
                        item =>
                          !('isApplication' in item && item.isApplication) &&
                          (item as any).inTalentPool === true
                      ).length
                    }
                  </span>
                </span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-6 relative">
              {isTabChanging && (
                <div className="absolute inset-0 z-10 bg-background/50 backdrop-blur-sm flex items-center justify-center rounded-lg">
                  <Loader
                    size="md"
                    text={`Loading ${activeTab === 'all' ? 'all' : activeTab} candidates...`}
                  />
                </div>
              )}
              <div
                className={`transition-opacity duration-200 ${isTabChanging ? 'opacity-50' : 'opacity-100'}`}
              >
                {filteredData.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="rounded-full bg-muted p-3 mb-4">
                      <svg
                        className="h-8 w-8 text-muted-foreground"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                        />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2">
                      No{' '}
                      {activeTab === 'all'
                        ? 'candidates or applications'
                        : activeTab}{' '}
                      found
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-md">
                      {activeTab === 'pending' &&
                        'There are no pending applications at the moment. New applications will appear here.'}
                      {activeTab === 'approved' &&
                        'No approved candidates yet. Approve applications to see candidates here.'}
                      {activeTab === 'active' &&
                        'No active candidates found. Assign a pipeline stage to an approved candidate to move them here.'}
                      {activeTab === 'hired' &&
                        'No hired candidates yet. Mark candidates as hired to see them here.'}
                      {activeTab === 'talent_pool' &&
                        'No candidates in the Talent Pool yet. Use "Add to Talent Pool" from the candidate actions menu.'}
                      {activeTab === 'all' &&
                        'No candidates or applications found. Start by receiving some applications.'}
                    </p>
                  </div>
                ) : (
                  <CandidatesDataTable
                    data={filteredData}
                    onDeleteCandidate={handleDeleteCandidate}
                    searchParams={searchParams}
                    setSearchParams={setSearchParams}
                  />
                )}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
