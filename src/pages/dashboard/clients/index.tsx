import { AddClientModal } from '@/components/modals/add-client-modal'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCandidates, useClients, useJobs, useUI } from '@/store/hooks/index'
import type { Client, CreateClientRequest } from '@/types/client'
import {
  Briefcase,
  Building2,
  CheckCircle2,
  ChevronRight,
  Mail,
  Plus,
  Search,
  User,
  Users,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function ClientsPage() {
  const navigate = useNavigate()
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [clientToDelete, setClientToDelete] = useState<Client | null>(null)
  const [isCreating, setIsCreating] = useState(false)

  // Get realtime data from Firestore via Redux hook
  const { clients, filters, createClient, deleteClient, setFilters } =
    useClients()
  const { jobs } = useJobs()
  const { candidates } = useCandidates()
  const { modals, openModal, closeModal } = useUI()

  // Calculate client statistics from jobs and candidates data in real-time
  const clientsWithStats = useMemo(() => {
    return clients.map(client => {
      // Calculate job statistics from real-time jobs data
      const clientJobs = jobs.filter(job => job.clientId === client.id)
      const totalJobs = clientJobs.length
      const activeJobs = clientJobs.filter(job => job.status === 'open').length
      const closedJobs = clientJobs.filter(
        job => job.status === 'closed'
      ).length
      const draftJobs = clientJobs.filter(job => job.status === 'draft').length

      // Get all job IDs for this client
      const clientJobIds = clientJobs.map(job => job.id)

      // Calculate candidate statistics from real-time candidates data
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const clientCandidates = candidates.filter((candidate: any) => {
        const candidateJobIds = candidate.jobIds || []
        return candidateJobIds.some((jobId: string) =>
          clientJobIds.includes(jobId)
        )
      })

      const totalCandidates = clientCandidates.length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeCandidates = clientCandidates.filter(
        (c: any) =>
          c.status === 'active' ||
          c.status === 'interviewing' ||
          c.status === 'offered'
      ).length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const rejectedCandidates = clientCandidates.filter(
        (c: any) => c.status === 'rejected'
      ).length
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const hiredCandidates = clientCandidates.filter(
        (c: any) => c.status === 'hired'
      ).length

      const successRate =
        totalCandidates > 0
          ? Math.round((hiredCandidates / totalCandidates) * 100)
          : 0

      return {
        ...client,
        statistics: {
          totalJobs,
          activeJobs,
          closedJobs,
          draftJobs,
          totalCandidates,
          activeCandidates,
          rejectedCandidates,
          hiredCandidates,
          successRate,
        },
      }
    })
  }, [clients, jobs, candidates])

  // Filter clients locally based on filters state
  const filteredClients = clientsWithStats
    .filter(client => {
      // Search filter
      const matchesSearch = filters.search
        ? client.companyName
            .toLowerCase()
            .includes(filters.search.toLowerCase()) ||
          client.email.toLowerCase().includes(filters.search.toLowerCase()) ||
          client.industry?.toLowerCase().includes(filters.search.toLowerCase())
        : true

      // Status filter
      const matchesStatus =
        filters.status === 'all' || !filters.status
          ? true
          : client.status === filters.status

      // Industry filter
      const matchesIndustry =
        filters.industry === 'all' || !filters.industry
          ? true
          : client.industry === filters.industry

      return matchesSearch && matchesStatus && matchesIndustry
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case 'name':
          return a.companyName.localeCompare(b.companyName)
        case 'oldest':
          return (
            new Date(a.createdAt || 0).getTime() -
            new Date(b.createdAt || 0).getTime()
          )
        case 'jobs':
          return (b.statistics?.totalJobs || 0) - (a.statistics?.totalJobs || 0)
        case 'candidates':
          return (
            (b.statistics?.totalCandidates || 0) -
            (a.statistics?.totalCandidates || 0)
          )
        case 'newest':
        default:
          return (
            new Date(b.createdAt || 0).getTime() -
            new Date(a.createdAt || 0).getTime()
          )
      }
    })

  // No useEffect needed - Firestore provides realtime data automatically via Redux hooks!

  const handleAddClient = async (data: CreateClientRequest) => {
    setIsCreating(true)
    try {
      await createClient(data)
      closeModal('addClient')
    } finally {
      setIsCreating(false)
    }
  }

  const confirmDeleteClient = async () => {
    if (!clientToDelete) return

    try {
      await deleteClient(clientToDelete.id)
      setDeleteConfirmOpen(false)
      setClientToDelete(null)
    } catch (error) {
      // Error is already handled in the Redux thunk with toast notification
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          <div className="px-4 lg:px-6">
            {/* Header */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">
                    Clients
                  </h2>
                  <p className="text-muted-foreground">
                    Manage your client companies and their hiring processes
                  </p>
                </div>
                <Button onClick={() => openModal('addClient')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Client
                </Button>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search clients by name, email, industry, or location..."
                    value={filters.search}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setFilters({ search: e.target.value })
                    }
                    className="pl-10"
                  />
                </div>
                <Select
                  value={filters.status}
                  onValueChange={(value: string) =>
                    setFilters({ status: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="on_hold">On Hold</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.industry}
                  onValueChange={(value: string) =>
                    setFilters({ industry: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Industry" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Industries</SelectItem>
                    <SelectItem value="technology">Technology</SelectItem>
                    <SelectItem value="healthcare">Healthcare</SelectItem>
                    <SelectItem value="finance">Finance</SelectItem>
                    <SelectItem value="education">Education</SelectItem>
                    <SelectItem value="retail">Retail</SelectItem>
                    <SelectItem value="manufacturing">Manufacturing</SelectItem>
                    <SelectItem value="consulting">Consulting</SelectItem>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="hospitality">Hospitality</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
                <Select
                  value={filters.sortBy}
                  onValueChange={(value: string) =>
                    setFilters({ sortBy: value })
                  }
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name">Name (A-Z)</SelectItem>
                    <SelectItem value="newest">Newest First</SelectItem>
                    <SelectItem value="oldest">Oldest First</SelectItem>
                    <SelectItem value="jobs">Most Jobs</SelectItem>
                    <SelectItem value="candidates">Most Candidates</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                <div className="rounded-lg border bg-linear-to-br from-card to-muted/20 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="rounded-md bg-primary/10 p-1.5">
                      <Building2 className="h-4 w-4 text-primary" />
                    </div>
                    <span className="text-xs font-medium text-muted-foreground">
                      Total
                    </span>
                  </div>
                  <p className="text-xl font-bold">{filteredClients.length}</p>
                  <p className="text-xs text-muted-foreground">Clients</p>
                </div>
                <div className="rounded-lg border bg-linear-to-br from-green-50 to-green-100/20 dark:from-green-950/20 dark:to-green-900/10 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="rounded-md bg-green-500/10 p-1.5">
                      <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-xs font-medium text-green-700 dark:text-green-400">
                      Active
                    </span>
                  </div>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    {
                      filteredClients.filter(
                        (c: Client) => c.status === 'active'
                      ).length
                    }
                  </p>
                  <p className="text-xs text-green-600/70 dark:text-green-400/70">
                    {filteredClients.length > 0
                      ? Math.round(
                          (filteredClients.filter(
                            (c: Client) => c.status === 'active'
                          ).length /
                            filteredClients.length) *
                            100
                        )
                      : 0}
                    % of total
                  </p>
                </div>
                <div className="rounded-lg border bg-linear-to-br from-blue-50 to-blue-100/20 dark:from-blue-950/20 dark:to-blue-900/10 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="rounded-md bg-blue-500/10 p-1.5">
                      <Briefcase className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-400">
                      Total Jobs
                    </span>
                  </div>
                  <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
                    {filteredClients.reduce(
                      (acc: number, c: Client) =>
                        acc + (c.statistics?.totalJobs || 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-blue-600/70 dark:text-blue-400/70">
                    Across all clients
                  </p>
                </div>
                <div className="rounded-lg border bg-linear-to-br from-purple-50 to-purple-100/20 dark:from-purple-950/20 dark:to-purple-900/10 p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="rounded-md bg-purple-500/10 p-1.5">
                      <Users className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    </div>
                    <span className="text-xs font-medium text-purple-700 dark:text-purple-400">
                      Active Jobs
                    </span>
                  </div>
                  <p className="text-xl font-bold text-purple-600 dark:text-purple-400">
                    {filteredClients.reduce(
                      (acc: number, c: Client) =>
                        acc + (c.statistics?.activeJobs || 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-purple-600/70 dark:text-purple-400/70">
                    Currently open
                  </p>
                </div>
              </div>
            </div>

            {/* Clients Table */}
            {filteredClients.length === 0 ? (
              <div className="text-center py-12 border rounded-lg bg-card">
                <Building2 className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground">
                  {filters.search
                    ? 'No clients found matching your search'
                    : 'No clients yet. Add your first client to get started.'}
                </p>
              </div>
            ) : (
              <div className="rounded-lg border bg-card overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/40">
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Company
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Status
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden md:table-cell">
                        Industry
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                        Contact
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3">
                        Jobs
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden sm:table-cell">
                        Candidates
                      </th>
                      <th className="text-left font-medium text-muted-foreground px-4 py-3 hidden lg:table-cell">
                        Recruiter
                      </th>
                      <th className="w-8 px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredClients.map((client: Client, idx: number) => {
                      const primaryContact =
                        client.contacts?.find(c => c.isPrimary) ||
                        client.contacts?.[0]
                      const statusConfig: Record<
                        string,
                        { label: string; className: string }
                      > = {
                        active: {
                          label: 'Active',
                          className:
                            'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
                        },
                        inactive: {
                          label: 'Inactive',
                          className:
                            'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
                        },
                        pending: {
                          label: 'Pending',
                          className:
                            'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
                        },
                        on_hold: {
                          label: 'On Hold',
                          className:
                            'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
                        },
                      }
                      const status = statusConfig[client.status] ?? {
                        label: client.status,
                        className: 'bg-muted text-muted-foreground',
                      }
                      const industryLabel = client.industry
                        ? client.industry
                            .replace(/_/g, ' ')
                            .replace(/\b\w/g, l => l.toUpperCase())
                        : '—'

                      return (
                        <tr
                          key={client.id}
                          onClick={() =>
                            navigate(`/dashboard/clients/${client.id}`)
                          }
                          className={`cursor-pointer hover:bg-muted/50 transition-colors ${idx !== filteredClients.length - 1 ? 'border-b' : ''}`}
                        >
                          {/* Company */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <Avatar className="h-8 w-8 shrink-0">
                                <AvatarImage
                                  src={client.logo}
                                  alt={client.companyName}
                                />
                                <AvatarFallback className="text-xs bg-primary/10 text-primary">
                                  {client.companyName.slice(0, 2).toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium truncate">
                                {client.companyName}
                              </span>
                            </div>
                          </td>

                          {/* Status */}
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${status.className}`}
                            >
                              {status.label}
                            </span>
                          </td>

                          {/* Industry */}
                          <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">
                            {industryLabel}
                          </td>

                          {/* Contact */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {primaryContact?.email ? (
                              <span className="flex items-center gap-1.5 text-muted-foreground truncate max-w-[200px]">
                                <Mail className="h-3.5 w-3.5 shrink-0" />
                                <span className="truncate">
                                  {primaryContact.email}
                                </span>
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>

                          {/* Jobs */}
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              <Briefcase className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span className="font-medium">
                                {client.statistics?.activeJobs ?? 0}
                              </span>
                              <span className="text-muted-foreground text-xs">
                                / {client.statistics?.totalJobs ?? 0}
                              </span>
                            </div>
                          </td>

                          {/* Candidates */}
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <div className="flex items-center gap-1.5">
                              <Users className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                              <span>
                                {client.statistics?.totalCandidates ?? 0}
                              </span>
                              {(client.statistics?.hiredCandidates ?? 0) >
                                0 && (
                                <span className="text-green-600 dark:text-green-400 text-xs font-medium">
                                  · {client.statistics.hiredCandidates} hired
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Recruiter */}
                          <td className="px-4 py-3 hidden lg:table-cell">
                            {client.assignedToName ? (
                              <span className="flex items-center gap-1.5 text-muted-foreground">
                                <User className="h-3.5 w-3.5 shrink-0" />
                                {client.assignedToName}
                              </span>
                            ) : (
                              <span className="text-muted-foreground/40">
                                —
                              </span>
                            )}
                          </td>

                          {/* Arrow */}
                          <td className="px-4 py-3 text-muted-foreground/40">
                            <ChevronRight className="h-4 w-4" />
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add Client Modal */}
      <AddClientModal
        open={modals.addClient}
        onClose={() => closeModal('addClient')}
        onSubmit={handleAddClient}
        isLoading={isCreating}
      />

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Client</AlertDialogTitle>
            <AlertDialogDescription>
              {clientToDelete && (
                <>
                  Are you sure you want to delete{' '}
                  <strong>{clientToDelete.companyName}</strong>?
                  {clientToDelete.statistics.totalJobs > 0 && (
                    <span className="block mt-2 text-amber-600 dark:text-amber-500">
                      This client has {clientToDelete.statistics.totalJobs} job
                      {clientToDelete.statistics.totalJobs > 1 ? 's' : ''} in
                      the system.
                    </span>
                  )}
                  <span className="block mt-2">
                    This action cannot be undone.
                  </span>
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteClient}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Client
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
