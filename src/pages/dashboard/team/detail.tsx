import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader } from "@/components/ui/loader";
import { useFirestoreDocument, useActivitiesByUser } from "@/hooks/firestore";
import { useCandidates } from "@/store/hooks/useCandidates";
import { useJobs } from "@/store/hooks/useJobs";
import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";
import type { TeamMember } from "@/types/team";
import {
  Activity,
  ArrowLeft,
  Briefcase,
  Calendar,
  FileText,
  Mail,
  Phone,
  Shield,
  TrendingUp,
  Users,
  UserCheck,
  UserPlus,
  CheckCircle,
  XCircle,
  LogIn,
  LogOut,
  GitBranch,
  Upload,
  MessageSquare,
  Clock,
  Video,
  Building2,
  Send,
  Settings,
  Lock,
  Download,
} from "lucide-react";
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";

interface Activity {
  _id: string;
  action: string;
  resourceType?: string;
  resourceName?: string;
  metadata?: Record<string, string | number | boolean | null>;
  createdAt: string;
}

const getInitials = (firstName: string, lastName: string) => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

type ActivityIconConfig = {
  icon: typeof Activity;
  color: string;
  bgColor: string;
};

const getActivityIcon = (action: string): ActivityIconConfig => {
  const iconMap: Record<string, ActivityIconConfig> = {
    // Authentication
    login: { icon: LogIn, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    logout: { icon: LogOut, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/20" },
    
    // Candidate Activities
    created_candidate: { icon: UserPlus, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    updated_candidate: { icon: UserCheck, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    reviewed_candidate: { icon: UserCheck, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
    candidate_status_changed: { icon: GitBranch, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
    candidate_assigned: { icon: Users, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    candidate_stage_changed: { icon: GitBranch, color: "text-indigo-600", bgColor: "bg-indigo-100 dark:bg-indigo-900/20" },
    candidate_document_uploaded: { icon: Upload, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    candidate_note_added: { icon: MessageSquare, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
    
    // Job Activities
    created_job: { icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    updated_job: { icon: Briefcase, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    job_published: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    job_closed: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20" },
    job_archived: { icon: FileText, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/20" },
    job_assigned: { icon: Users, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    
    // Application Activities
    created_application: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    updated_application: { icon: FileText, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    application_approved: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    application_rejected: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20" },
    application_status_changed: { icon: GitBranch, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
    reviewed_application: { icon: CheckCircle, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
    
    // Client Activities
    created_client: { icon: Building2, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    updated_client: { icon: Building2, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    client_note_added: { icon: MessageSquare, color: "text-yellow-600", bgColor: "bg-yellow-100 dark:bg-yellow-900/20" },
    
    // Interview Activities
    scheduled_interview: { icon: Clock, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    completed_interview: { icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    interview_rescheduled: { icon: Clock, color: "text-orange-600", bgColor: "bg-orange-100 dark:bg-orange-900/20" },
    interview_cancelled: { icon: XCircle, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20" },
    created_zoom_meeting: { icon: Video, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    
    // Communication
    sent_email: { icon: Send, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    email_template_used: { icon: Mail, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    
    // Profile & Settings
    profile_updated: { icon: Settings, color: "text-blue-600", bgColor: "bg-blue-100 dark:bg-blue-900/20" },
    permissions_changed: { icon: Shield, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
    password_changed: { icon: Lock, color: "text-red-600", bgColor: "bg-red-100 dark:bg-red-900/20" },
    
    // Other
    export_data: { icon: Download, color: "text-green-600", bgColor: "bg-green-100 dark:bg-green-900/20" },
    bulk_action: { icon: Users, color: "text-purple-600", bgColor: "bg-purple-100 dark:bg-purple-900/20" },
  };
  
  return iconMap[action] || { icon: Activity, color: "text-gray-600", bgColor: "bg-gray-100 dark:bg-gray-900/20" };
};

const getRoleBadgeColor = (role: string) => {
  switch (role) {
    case "admin":
      return "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20";
    case "recruiter":
      return "bg-blue-500/10 text-blue-600 dark:text-blue-500 border-blue-500/20";
    case "hiring_manager":
      return "bg-purple-500/10 text-purple-600 dark:text-purple-500 border-purple-500/20";
    case "interviewer":
      return "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20";
    case "coordinator":
      return "bg-orange-500/10 text-orange-600 dark:text-orange-500 border-orange-500/20";
    default:
      return "bg-muted text-muted-foreground border";
  }
};

const formatRoleName = (role: string) => {
  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
};

export default function TeamMemberDetailPage() {
  const { memberId } = useParams();
  const navigate = useNavigate();
  
  // 🔥 REALTIME: Get team member from Firestore with real-time updates
  const { data: currentMember, loading: isLoading, error: memberError } = useFirestoreDocument<TeamMember>({
    documentPath: `users/${memberId}`,
    enabled: !!memberId,
  });
  
  const { jobs } = useJobs(); // Realtime data from Firestore
  const { candidates } = useCandidates(); // Realtime data from Firestore
  
  // Get activities from Firestore with realtime updates
  const { 
    data: firestoreActivities, 
    loading: isLoadingActivities
  } = useActivitiesByUser(memberId, { limitCount: 50 });

  // Transform Firestore activities to match component interface
  const activities = useMemo(() => {
    return (firestoreActivities || []).map(activity => ({
      _id: activity.id,
      action: activity.action,
      resourceType: activity.resourceType,
      resourceName: activity.resourceName,
      metadata: activity.metadata as Record<string, string | number | boolean | null> | undefined,
      createdAt: activity.createdAt.toISOString(),
    }));
  }, [firestoreActivities]);

  const formatActivityAction = (action: string): string => {
    const actionMap: Record<string, string> = {
      // Authentication
      login: "Logged in",
      logout: "Logged out",
      
      // Candidate Activities
      created_candidate: "Created candidate",
      updated_candidate: "Updated candidate",
      reviewed_candidate: "Reviewed candidate",
      candidate_status_changed: "Changed candidate status",
      candidate_assigned: "Assigned candidate",
      candidate_stage_changed: "Moved candidate to new stage",
      candidate_document_uploaded: "Uploaded candidate document",
      candidate_note_added: "Added note to candidate",
      
      // Job Activities
      created_job: "Created job",
      updated_job: "Updated job",
      job_published: "Published job",
      job_closed: "Closed job",
      job_archived: "Archived job",
      job_assigned: "Assigned job",
      
      // Application Activities
      created_application: "Created application",
      updated_application: "Updated application",
      application_approved: "Approved application",
      application_rejected: "Rejected application",
      application_status_changed: "Changed application status",
      reviewed_application: "Reviewed application",
      
      // Client Activities
      created_client: "Created client",
      updated_client: "Updated client",
      client_note_added: "Added note to client",
      
      // Interview Activities
      scheduled_interview: "Scheduled interview",
      completed_interview: "Completed interview",
      interview_rescheduled: "Rescheduled interview",
      interview_cancelled: "Cancelled interview",
      created_zoom_meeting: "Created Zoom meeting",
      
      // Communication
      sent_email: "Sent email",
      email_template_used: "Used email template",
      
      // Profile & Settings
      profile_updated: "Updated profile",
      permissions_changed: "Changed permissions",
      password_changed: "Changed password",
      
      // Other
      export_data: "Exported data",
      bulk_action: "Performed bulk action",
    };
    return actionMap[action] || action.replace(/_/g, " ");
  };

  const formatTimeAgo = (date: string): string => {
    const now = new Date();
    const activityDate = new Date(date);
    const diffInSeconds = Math.floor(
      (now.getTime() - activityDate.getTime()) / 1000
    );

    if (diffInSeconds < 60) return "Just now";
    if (diffInSeconds < 3600)
      return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400)
      return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    if (diffInSeconds < 604800)
      return `${Math.floor(diffInSeconds / 86400)} days ago`;
    return activityDate.toLocaleDateString();
  };

  // Show loading state while fetching
  if (isLoading && !currentMember) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard/team")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <Loader size="md" text="Loading team member from Firestore..." />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if Firestore subscription failed
  if (memberError) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard/team")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <Card>
                    <CardContent className="py-8 text-center">
                      <Users className="h-12 w-12 mx-auto text-red-400 mb-4" />
                      <h3 className="text-lg font-semibold mb-2 text-red-600">
                        Error loading team member
                      </h3>
                      <p className="text-muted-foreground">
                        {memberError.message || 'Failed to load team member from Firestore'}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentMember) {
    return (
      <div className="flex flex-1 flex-col">
        <div className="@container/main flex flex-1 flex-col gap-2">
          <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div className="px-4 lg:px-6">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard/team")}
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <h2 className="text-2xl font-bold">Team Member Not Found</h2>
              </div>
              <p className="text-muted-foreground">
                The team member you're looking for doesn't exist.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // assignedTo references User ID (currentMember.userId), not TeamMember ID (currentMember.id)
  // assignedTo can be either a string (User ID) or a populated user object
  const userIdToMatch = currentMember.userId || currentMember.id;
  const assignedCandidates = candidates.filter((candidate: Candidate) => {
    if (typeof candidate.assignedTo === "string") {
      // assignedTo is a User ID string
      return candidate.assignedTo === userIdToMatch;
    } else if (
      candidate.assignedTo &&
      typeof candidate.assignedTo === "object"
    ) {
      // assignedTo is a populated User object - check both id and _id fields
      return (
        candidate.assignedTo.id === userIdToMatch ||
        candidate.assignedTo._id === userIdToMatch
      );
    }
    return false;
  });

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
          <div className="px-3 lg:px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 md:gap-4 mb-4 md:mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/dashboard/team")}
                className="self-start"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1 min-w-0">
                <h2 className="text-xl md:text-2xl font-bold">
                  Team Member Details
                </h2>
                <p className="text-xs md:text-sm text-muted-foreground">
                  View and manage team member information
                </p>
              </div>
            </div>

            {/* Profile Card */}
            <Card className="mb-4 md:mb-6">
              <CardContent className="pt-4 md:pt-6">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6">
                  <div className="flex flex-col items-center md:items-start">
                    <Avatar className="h-20 w-20 md:h-24 md:w-24 mb-3 md:mb-4">
                      {currentMember.avatar &&
                        !currentMember.avatar.includes("dicebear.com") &&
                        !currentMember.avatar.includes("api.dicebear") && (
                          <AvatarImage
                            src={currentMember.avatar}
                            alt={`${currentMember.firstName} ${currentMember.lastName}`}
                          />
                        )}
                      <AvatarFallback className="text-xl md:text-2xl">
                        {getInitials(
                          currentMember.firstName,
                          currentMember.lastName
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <Badge
                      variant="outline"
                      className={`${getRoleBadgeColor(
                        currentMember.role
                      )} text-xs md:text-sm w-full md:w-auto md:min-w-[120px] justify-center py-1.5`}
                    >
                      {formatRoleName(currentMember.role)}
                    </Badge>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="mb-3 md:mb-4">
                      <h3 className="text-xl md:text-2xl font-bold mb-1">
                        {currentMember.firstName} {currentMember.lastName}
                      </h3>
                      <p className="text-base md:text-lg text-muted-foreground">
                        {currentMember.title}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 mb-3 md:mb-4">
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <a
                          href={`mailto:${currentMember.email}`}
                          className="hover:underline truncate"
                        >
                          {currentMember.email}
                        </a>
                      </div>
                      {currentMember.phone && (
                        <div className="flex items-center gap-2 text-xs md:text-sm">
                          <Phone className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                          <a
                            href={`tel:${currentMember.phone}`}
                            className="hover:underline"
                          >
                            {currentMember.phone}
                          </a>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Briefcase className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="truncate">
                          {currentMember.department}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs md:text-sm">
                        <Calendar className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span>
                          Joined{" "}
                          {(() => {
                            // Try different date fields
                            const memberData = currentMember as unknown as Record<string, unknown>;
                            const dateValue = currentMember.createdAt || currentMember.startDate || memberData.createdDate;
                            if (!dateValue) return "recently";
                            
                            try {
                              // Handle Firestore Timestamp
                              let date: Date;
                              if (dateValue && typeof dateValue === 'object' && 'toDate' in dateValue) {
                                date = (dateValue as { toDate: () => Date }).toDate();
                              } else {
                                date = new Date(dateValue as string | number | Date);
                              }
                              
                              if (isNaN(date.getTime())) return "recently";
                              
                              const day = String(date.getDate()).padStart(2, "0");
                              const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                              return `${day} ${months[date.getMonth()]}, ${date.getFullYear()}`;
                            } catch (error) {
                              return "recently";
                            }
                          })()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Activity className="h-3.5 w-3.5 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                        <span className="text-xs md:text-sm text-muted-foreground">
                          Last active:{" "}
                          {(() => {
                            const memberData = currentMember as unknown as Record<string, unknown>;
                            const lastActive = currentMember.lastLoginAt || memberData.lastLogin || memberData.lastActive;
                            
                            if (!lastActive) return "Not recorded";
                            
                            try {
                              // Handle Firestore Timestamp
                              let date: Date;
                              if (lastActive && typeof lastActive === 'object' && 'toDate' in lastActive) {
                                date = (lastActive as { toDate: () => Date }).toDate();
                              } else {
                                date = new Date(lastActive as string | number | Date);
                              }
                              
                              if (isNaN(date.getTime())) return "Not recorded";
                              
                              return date.toLocaleString(undefined, {
                                month: 'short',
                                day: 'numeric',
                                year: 'numeric',
                                hour: 'numeric',
                                minute: '2-digit',
                              });
                            } catch (error) {
                              return "Not recorded";
                            }
                          })()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs md:text-sm text-muted-foreground">Status:</span>
                        <Badge
                          variant="outline"
                          className={`${
                            (currentMember.status === "active" || (currentMember as unknown as Record<string, unknown>).isActive === true)
                              ? "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20"
                              : "bg-muted text-muted-foreground border"
                          } text-xs capitalize`}
                        >
                          {currentMember.status || ((currentMember as unknown as Record<string, unknown>).isActive ? "active" : "inactive")}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Statistics - Real-time from Firestore */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-4 md:mb-6">
              <Card>
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="h-4 w-4 md:h-5 md:w-5 text-blue-600 dark:text-blue-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {assignedCandidates.length}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Assigned Candidates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <UserCheck className="h-4 w-4 md:h-5 md:w-5 text-green-600 dark:text-green-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {assignedCandidates.filter((c: Candidate) => c.status === 'hired').length}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Hired Candidates
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-orange-600 dark:text-orange-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {assignedCandidates.filter((c: Candidate) => 
                      c.status === 'active' || c.status === 'interviewing' || c.status === 'offered'
                    ).length}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    In Progress
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-4 md:pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Activity className="h-4 w-4 md:h-5 md:w-5 text-purple-600 dark:text-purple-500" />
                  </div>
                  <div className="text-xl md:text-2xl font-bold">
                    {activities.length}
                  </div>
                  <p className="text-[10px] md:text-xs text-muted-foreground">
                    Recent Activities
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Permissions */}
              <Card>
                <CardHeader className="p-4 md:p-6">
                  <CardTitle className="flex items-center gap-2 text-base md:text-lg">
                    <Shield className="h-4 w-4 md:h-5 md:w-5" />
                    Permissions
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 md:p-6 pt-0">
                  <div className="space-y-2 md:space-y-3">
                    {Object.entries(currentMember.permissions)
                      .filter(([key]) => key !== "_id" && key !== "id")
                      .map(([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between py-2 border-b last:border-0"
                        >
                          <span className="text-xs md:text-sm">
                            {key
                              .replace(/([A-Z])/g, " $1")
                              .replace(/^./, (str) => str.toUpperCase())
                              .trim()}
                          </span>
                          <Badge
                            variant="outline"
                            className={`${
                              value
                                ? "bg-green-500/10 text-green-600 dark:text-green-500 border-green-500/20"
                                : "bg-red-500/10 text-red-600 dark:text-red-500 border-red-500/20"
                            } text-[10px] md:text-xs`}
                          >
                            {value ? "Allowed" : "Denied"}
                          </Badge>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>

              {/* Assigned Candidates */}
              <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Assigned Candidates
                </CardTitle>
              </CardHeader>
              <CardContent>
                {assignedCandidates.length > 0 ? (
                  <div className="space-y-3">
                    {assignedCandidates.map((candidate) => (
                      <div
                        key={candidate.id}
                        className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors cursor-pointer"
                        onClick={() =>
                          (() => {
                            const jobId = (candidate as any).jobId || (candidate as any).jobIds?.[0];
                            const params = new URLSearchParams();
                            if (jobId) params.append('jobId', typeof jobId === 'string' ? jobId : jobId?.toString());
                            navigate(`/dashboard/candidates/${candidate.id}${params.toString() ? `?${params.toString()}` : ''}`);
                          })()
                        }
                      >
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <Avatar className="h-10 w-10">
                            {candidate.avatar &&
                              !candidate.avatar.includes("dicebear.com") &&
                              !candidate.avatar.includes("api.dicebear") && (
                                <AvatarImage
                                  src={candidate.avatar}
                                  alt={`${candidate.firstName} ${candidate.lastName}`}
                                />
                              )}
                            <AvatarFallback>
                              {getInitials(
                                candidate.firstName,
                                candidate.lastName
                              )}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">
                              {candidate.firstName} {candidate.lastName}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              ID: {candidate.id}
                            </p>
                            <p className="text-sm text-muted-foreground truncate">
                              {/* eslint-disable @typescript-eslint/no-explicit-any */}
                              {(() => {
                                if (!candidate.jobIds || candidate.jobIds.length === 0) {
                                  return "No job assigned";
                                }

                                // Get the first job ID (can be string or populated object)
                                const firstJobId = typeof candidate.jobIds[0] === "string" 
                                  ? candidate.jobIds[0] 
                                  : (candidate.jobIds[0] as any)?.id || (candidate.jobIds[0] as any)?._id;

                                if (!firstJobId) {
                                  return "No job assigned";
                                }

                                // Look up the job from the jobs array
                                const job = jobs.find((j: Job) => j.id === firstJobId || (j as any)._id === firstJobId);

                                if (!job) {
                                  return "Job not found";
                                }

                                // Get client name if available
                                const clientId = typeof job.clientId === "string" 
                                  ? job.clientId 
                                  : (job.clientId as any)?.id || (job.clientId as any)?._id;

                                const client = clientId 
                                  ? jobs.find((j: Job) => {
                                      const jClientId = typeof j.clientId === "string" 
                                        ? j.clientId 
                                        : (j.clientId as any)?.id || (j.clientId as any)?._id;
                                      return jClientId === clientId;
                                    }) 
                                  : null;

                                const clientName = client && typeof job.clientId === "object" 
                                  ? (job.clientId as any)?.companyName 
                                  : null;

                                return (
                                  <>
                                    {job.title}
                                    {clientName && (
                                      <>
                                        {" "}
                                        •{" "}
                                        {clientName}
                                      </>
                                    )}
                                  </>
                                );
                              })()}
                              {/* eslint-enable @typescript-eslint/no-explicit-any */}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="outline">
                            {candidate.status || "Active"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-8">
                    No candidates assigned
                  </p>
                )}
              </CardContent>
            </Card>
            </div>

            {/* Activity Timeline */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoadingActivities ? (
                  <div className="py-8">
                    <Loader size="md" text="Loading activities..." />
                  </div>
                ) : activities.length > 0 ? (
                  <div className="space-y-3">
                    {activities.map((activity) => {
                      const iconConfig = getActivityIcon(activity.action);
                      const IconComponent = iconConfig.icon;
                      
                      return (
                        <div
                          key={activity._id}
                          className="flex items-start gap-3 pb-3 border-b last:border-0 hover:bg-muted/50 -mx-2 px-2 py-2 rounded-lg transition-colors"
                        >
                          <div className={`rounded-full p-2 shrink-0 ${iconConfig.bgColor}`}>
                            <IconComponent className={`h-4 w-4 ${iconConfig.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium">
                              {formatActivityAction(activity.action)}
                            </p>
                            {activity.resourceName && (
                              <p className="text-sm text-muted-foreground truncate mt-0.5">
                                {activity.resourceName}
                              </p>
                            )}
                            {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">
                                {'status' in activity.metadata && activity.metadata.status && (
                                  <Badge variant="outline" className="text-xs">
                                    {String(activity.metadata.status)}
                                  </Badge>
                                )}
                                {'stage' in activity.metadata && activity.metadata.stage && (
                                  <Badge variant="outline" className="text-xs">
                                    {String(activity.metadata.stage)}
                                  </Badge>
                                )}
                              </div>
                            )}
                            <p className="text-xs text-muted-foreground mt-1">
                              {formatTimeAgo(activity.createdAt)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <p className="text-sm text-muted-foreground mb-2">
                      No recent activity
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Activities will appear here as the user interacts with the
                      system
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
