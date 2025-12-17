import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { API_BASE_URL } from "@/config/api";
import { useEmailsByCandidate } from "@/hooks/useEmails";
import { useEmailAccounts } from "@/hooks/useEmailAccounts";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import {
  extractEmailVariables,
  replaceTemplateVariables,
} from "@/lib/email-template-helper";
import { extractReplyContent, formatQuotedText } from "@/lib/email-parser";
import { cn } from "@/lib/utils";
import { useEmailTemplates } from "@/store/hooks/index";
import type { Candidate } from "@/types/candidate";
import type { Job } from "@/types/job";
import {
  Archive,
  ArrowLeft,
  CheckCheck,
  ChevronDown,
  ChevronUp,
  Clock,
  Download,
  FileText,
  Forward,
  Image,
  Inbox,
  Mail,
  MoreVertical,
  Paperclip,
  Reply,
  Send,
  SendHorizontal,
  Star,
  Trash2,
  Type,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface CandidateEmailCommunicationProps {
  candidate: Candidate;
  job: Job;
  onBack: () => void;
}

interface EmailThread {
  id: string;
  _id?: string;
  subject: string;
  from: string;
  to: string[];
  timestamp: Date;
  sentAt?: Date;
  receivedAt?: Date;
  createdAt?: Date;
  body: string;
  bodyHtml?: string;
  isRead?: boolean;
  isStarred?: boolean;
  direction: "outbound" | "inbound";
  status: string;
  sentBy?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  candidateId?: string;
  jobId?: string;
  attachments?: {
    filename: string;
    url: string;
    contentType: string;
    size: number;
  }[];
}

export function CandidateEmailCommunication({
  candidate,
  job,
  onBack,
}: CandidateEmailCommunicationProps) {
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedEmail, setSelectedEmail] = useState<EmailThread | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isInboxOpen, setIsInboxOpen] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emailToDelete, setEmailToDelete] = useState<EmailThread | null>(null);

  // 🔥 REALTIME: Get ALL emails for candidate from Firestore (not just for this job)
  // This ensures reply emails are visible even if they're associated with a different job
  const { data: allCandidateEmails, loading: isLoading } = useEmailsByCandidate(
    candidate.id
  );
  
  // 🔥 REALTIME: Get email accounts from Firestore
  const { data: emailAccounts } = useEmailAccounts();
  
  // 🔥 REALTIME: Get email templates from Firestore
  const { templates: emailTemplates } = useEmailTemplates();
  
  // Get first active email account for sending
  const activeEmailAccount = emailAccounts?.find(acc => acc.isActive);
  const fromEmail = activeEmailAccount?.email || '';  // Filter emails for current job, but include emails with no jobId (replies without job context)
  const firestoreEmails = allCandidateEmails.filter(
    (email) => email.jobId === job.id || !email.jobId
  );

  // Transform Firestore emails to match EmailThread interface
  // Note: Timestamps are already converted to JavaScript Date objects by transformEmailDocument in useEmails hook
  const emails: EmailThread[] = firestoreEmails.map((email) => ({
    ...email,
    _id: email.id, // Add _id for backward compatibility
    timestamp: email.sentAt || email.createdAt,
    // sentBy is a string (user ID) in Firestore, EmailThread expects object or undefined
    sentBy: undefined, // Can be populated later if user details are needed
  }));

  // Compose email state
  const [composeData, setComposeData] = useState({
    to: candidate.email,
    subject: "",
    content: "",
  });

  const fullName = `${candidate.firstName} ${candidate.lastName}`;
  const initials =
    `${candidate.firstName[0]}${candidate.lastName[0]}`.toUpperCase();

  // Email templates are now loaded in real-time via useEmailTemplates hook!

  const sentEmails = emails.filter((e) => e.direction === "outbound");
  const receivedEmails = emails.filter((e) => e.direction === "inbound");
  const allEmails = [...emails].sort(
    (a, b) => b.timestamp.getTime() - a.timestamp.getTime()
  );

  const handleSendEmail = async () => {
    if (!composeData.subject || !composeData.content) {
      toast.error("Please fill in subject and content");
      return;
    }

    try {
      setIsSending(true);

      // Extract variables from candidate and job data
      const variables = extractEmailVariables(candidate, job);

      // Replace template variables with actual values
      const processedSubject = replaceTemplateVariables(
        composeData.subject,
        variables
      );
      const processedContent = replaceTemplateVariables(
        composeData.content,
        variables
      );

      // Ensure we have an email account configured
      if (!fromEmail) {
        toast.error("No email account configured. Please add an email account in Settings.");
        return;
      }

      const response = await authenticatedFetch(`${API_BASE_URL}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromEmail, // Use email from configured account
          to: [composeData.to],
          subject: processedSubject,
          body: processedContent,
          candidateId: candidate.id,
          jobId: job.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      await response.json();
      // No need to manually update state - Firestore will sync automatically!

      setComposeData({
        to: candidate.email,
        subject: "",
        content: "",
      });
      setIsComposing(false);
      toast.success("Email sent successfully");
    } catch (error) {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (email: EmailThread) => {
    const replyTo =
      email.direction === "outbound"
        ? email.to && email.to.length > 0
          ? email.to[0]
          : candidate.email
        : email.from || candidate.email;

    setComposeData({
      to: replyTo,
      subject: email.subject?.startsWith("Re:")
        ? email.subject
        : `Re: ${email.subject || "(No Subject)"}`,
      content: `\n\n---\nOn ${email.timestamp.toLocaleString()}, ${
        email.from || "Unknown"
      } wrote:\n${email.body || ""}`,
    });
    setIsComposing(true);
    setSelectedEmail(null);
  };

  const handleDeleteEmail = async (email: EmailThread) => {
    setEmailToDelete(email);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEmail = async () => {
    if (!emailToDelete) return;

    try {
      const response = await authenticatedFetch(
        `${API_BASE_URL}/emails/${emailToDelete.id}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to delete email");
      }

      // No need to manually update state - Firestore will sync automatically!
      // Just clear selection if this email was selected
      if (selectedEmail?.id === emailToDelete.id) {
        setSelectedEmail(null);
      }

      toast.success("Email deleted successfully");
    } catch (error) {
      toast.error("Failed to delete email");
    }
  };

  const filteredEmails = allEmails.filter(
    (email) =>
      email.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.body?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      email.from?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDisplayEmails = () => {
    switch (activeTab) {
      case "sent":
        return sentEmails;
      case "received":
        return receivedEmails;
      default:
        return filteredEmails;
    }
  };

  const displayEmails = getDisplayEmails();

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <div className="space-y-3 md:space-y-4 p-2 md:p-3 lg:p-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-start gap-2 md:gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 self-start"
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
              <Avatar className="h-10 w-10 md:h-12 md:w-12  border-border shrink-0">
                <AvatarImage src={candidate.avatar} alt={fullName} />
                <AvatarFallback className="text-xs md:text-sm font-semibold">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg md:text-xl lg:text-2xl font-bold text-foreground truncate">
                  Email Communication
                </h1>
                <p className="text-xs md:text-sm text-muted-foreground truncate">
                  {fullName} • {candidate.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs md:text-sm text-muted-foreground">
              <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 shrink-0" />
              <span className="truncate">Regarding: {job.title}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
            <Button
              onClick={() => {
                setIsComposing(true);
                setSelectedEmail(null);
                // Close inbox on mobile when composing
                if (window.innerWidth < 1024) {
                  setIsInboxOpen(false);
                }
              }}
              className="flex-1 sm:flex-initial"
            >
              <Send className="h-4 w-4 mr-2" />
              New Email
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-12 gap-3 md:gap-4">
          {/* Email List */}
          <div className="lg:col-span-5">
            <Card>
              <CardHeader className="p-2 md:p-3 lg:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 md:gap-3 flex-1">
                    <CardTitle className="text-base md:text-lg">
                      Emails
                    </CardTitle>
                    <Badge variant="outline" className="text-xs w-fit">
                      {displayEmails.length} total
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsInboxOpen(!isInboxOpen)}
                    className="lg:hidden h-8 w-8"
                  >
                    {isInboxOpen ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                {isInboxOpen && (
                  <div className="mt-2 md:mt-3">
                    <Input
                      placeholder="Search emails..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-8 md:h-9 text-xs md:text-sm"
                    />
                  </div>
                )}
              </CardHeader>
              {isInboxOpen && (
                <CardContent className="p-0">
                  <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <div className="px-2 md:px-3 lg:px-4 pt-2 md:pt-3 pb-1.5 md:pb-2 overflow-x-auto">
                      <TabsList className="h-9 md:h-10 lg:h-11 p-1 bg-card border border-border w-full min-w-max sm:w-fit">
                        <TabsTrigger
                          value="inbox"
                          className="px-2 md:px-3 lg:px-4 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground"
                        >
                          <Inbox className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          <span className="hidden sm:inline">All</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="sent"
                          className="px-2 md:px-3 lg:px-4 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground"
                        >
                          <SendHorizontal className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          <span className="hidden sm:inline">Sent</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="received"
                          className="px-2 md:px-3 lg:px-4 text-xs md:text-sm data-[state=active]:bg-primary data-[state=active]:text-white! data-[state=inactive]:text-muted-foreground"
                        >
                          <Mail className="h-3.5 w-3.5 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                          <span className="hidden sm:inline">Received</span>
                        </TabsTrigger>
                      </TabsList>
                    </div>

                    <div className="max-h-[400px] md:max-h-[500px] lg:max-h-[600px] overflow-y-auto border-t">
                      {isLoading ? (
                        <div className="px-6 py-12 text-center">
                          <Loader size="md" text="Loading emails..." />
                        </div>
                      ) : displayEmails.length > 0 ? (
                        displayEmails.map((email, index) => (
                          <div key={email.id}>
                            <div
                              className={cn(
                                "px-2 py-2 md:px-3 md:py-3 lg:px-4 lg:py-3 cursor-pointer hover:bg-muted/50 transition-colors",
                                selectedEmail?.id === email.id && "bg-muted",
                                !email.isRead &&
                                  "bg-blue-50/50 dark:bg-blue-950/20"
                              )}
                              onClick={() => {
                                setSelectedEmail(email);
                                setIsComposing(false);
                                // Close inbox on mobile when email is selected
                                if (window.innerWidth < 1024) {
                                  setIsInboxOpen(false);
                                }
                              }}
                            >
                              <div className="flex items-start gap-2 md:gap-3">
                                <div className="shrink-0 mt-0.5 md:mt-1">
                                  {email.direction === "outbound" ? (
                                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-primary/10 flex items-center justify-center">
                                      <SendHorizontal className="h-3 w-3 md:h-4 md:w-4 text-primary" />
                                    </div>
                                  ) : (
                                    <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-blue-500/10 flex items-center justify-center">
                                      <Mail className="h-3 w-3 md:h-4 md:w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2 mb-0.5 md:mb-1">
                                    <p
                                      className={cn(
                                        "text-xs md:text-sm truncate",
                                        !email.isRead
                                          ? "font-semibold"
                                          : "font-medium"
                                      )}
                                    >
                                      {email.direction === "outbound"
                                        ? email.to && email.to.length > 0
                                          ? email.to[0]
                                          : "Unknown"
                                        : email.from || "Unknown"}
                                    </p>
                                    <span className="text-[10px] md:text-xs text-muted-foreground shrink-0">
                                      {formatTimestamp(email.timestamp)}
                                    </span>
                                  </div>
                                  <p
                                    className={cn(
                                      "text-xs md:text-sm mb-0.5 md:mb-1 truncate",
                                      !email.isRead
                                        ? "font-medium text-foreground"
                                        : "text-muted-foreground"
                                    )}
                                  >
                                    {email.subject || "(No Subject)"}
                                  </p>
                                  <p className="text-[10px] md:text-xs text-muted-foreground line-clamp-2">
                                    {extractReplyContent(email.body || "").replyText || email.body || ""}
                                  </p>
                                </div>
                                {email.isStarred && (
                                  <Star className="h-3 w-3 md:h-4 md:w-4 fill-amber-500 text-amber-500 shrink-0" />
                                )}
                              </div>
                            </div>
                            {index < displayEmails.length - 1 && <Separator />}
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-6 md:px-3 md:py-8 lg:px-4 lg:py-10 text-center">
                          <Mail className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 md:mb-3 text-muted-foreground opacity-20" />
                          <p className="text-xs md:text-sm text-muted-foreground">
                            {searchQuery ? "No emails found" : "No emails yet"}
                          </p>
                          <p className="text-[10px] md:text-xs text-muted-foreground mt-1 md:mt-2">
                            {searchQuery
                              ? "Try a different search term"
                              : "Send your first email to this candidate"}
                          </p>
                        </div>
                      )}
                    </div>
                  </Tabs>
                </CardContent>
              )}
            </Card>
          </div>

          {/* Email Content / Compose */}
          <div className="lg:col-span-7">
            {isComposing ? (
              <Card>
                <CardHeader className="p-2 md:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setIsComposing(false);
                          setIsInboxOpen(true);
                        }}
                        className="lg:hidden h-8 w-8 shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <CardTitle className="text-base md:text-lg">
                        Compose Email
                      </CardTitle>
                    </div>
                    <div className="flex items-center gap-2 self-end sm:self-auto">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setIsComposing(false);
                          if (window.innerWidth < 1024) {
                            setIsInboxOpen(true);
                          }
                        }}
                        disabled={isSending}
                        className="h-8 px-2 md:px-3 text-xs md:text-sm"
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleSendEmail}
                        disabled={isSending}
                        className="h-8 px-2 md:px-3 text-xs md:text-sm"
                      >
                        {isSending ? (
                          <>
                            <Loader size="sm" />
                            <span className="hidden sm:inline ml-1.5 md:ml-2">
                              Sending...
                            </span>
                          </>
                        ) : (
                          <>
                            <Send className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                            Send
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
                  {/* Template Selection */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="template" className="text-xs md:text-sm">
                      Use Template (Optional)
                    </Label>
                    <Select
                      onValueChange={(value) => {
                        if (value === "none") return;
                        const template = emailTemplates.find(
                          (t) => t.id === value
                        );
                        if (template) {
                          // Extract variables and apply template
                          const variables = extractEmailVariables(
                            candidate,
                            job
                          );
                          const processedSubject = replaceTemplateVariables(
                            template.subject,
                            variables
                          );
                          const processedBody = replaceTemplateVariables(
                            template.body,
                            variables
                          );

                          setComposeData({
                            ...composeData,
                            subject: processedSubject,
                            content: processedBody,
                          });
                          toast.success(`Template "${template.name}" applied`);
                        }
                      }}
                    >
                      <SelectTrigger
                        id="template"
                        className="h-9 md:h-10 text-sm"
                      >
                        <SelectValue placeholder="Select a template..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none" className="text-sm">
                          <div className="flex items-center gap-1.5 md:gap-2">
                            <Mail className="h-3 w-3 md:h-4 md:w-4" />
                            <span>No template</span>
                          </div>
                        </SelectItem>
                        {emailTemplates.map((template) => {
                          return (
                            <SelectItem
                              key={template.id}
                              value={template.id}
                              className="text-sm"
                            >
                              <div className="flex items-center gap-1.5 md:gap-2">
                                <FileText className="h-3 w-3 md:h-4 md:w-4" />
                                <span>{template.name}</span>
                              </div>
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* To */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="to" className="text-xs md:text-sm">
                      To
                    </Label>
                    <Input
                      id="to"
                      value={composeData.to}
                      onChange={(e) =>
                        setComposeData({ ...composeData, to: e.target.value })
                      }
                      placeholder="recipient@email.com"
                      disabled={isSending}
                      className="h-8 md:h-9 text-xs md:text-sm"
                    />
                  </div>

                  {/* Subject */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="subject" className="text-xs md:text-sm">
                      Subject
                    </Label>
                    <Input
                      id="subject"
                      value={composeData.subject}
                      onChange={(e) =>
                        setComposeData({
                          ...composeData,
                          subject: e.target.value,
                        })
                      }
                      placeholder="Email subject..."
                      disabled={isSending}
                      className="h-8 md:h-9 text-xs md:text-sm"
                    />
                  </div>

                  {/* Content */}
                  <div className="space-y-1 md:space-y-1.5">
                    <Label htmlFor="content" className="text-xs md:text-sm">
                      Message
                    </Label>
                    <textarea
                      id="content"
                      value={composeData.content}
                      onChange={(e) =>
                        setComposeData({
                          ...composeData,
                          content: e.target.value,
                        })
                      }
                      placeholder="Write your message..."
                      className="w-full min-h-[200px] md:min-h-[300px] px-3 py-2 text-xs md:text-sm rounded-md border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                      disabled={isSending}
                    />
                  </div>

                  {/* Compose Actions */}
                  <div className="flex items-center gap-2 pt-1 md:pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSending}
                      className="h-8 px-2 md:px-3 text-xs md:text-sm"
                    >
                      <Paperclip className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">Attach</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSending}
                      className="h-8 px-2 md:px-3 text-xs md:text-sm"
                    >
                      <Image className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">Image</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={isSending}
                      className="h-8 px-2 md:px-3 text-xs md:text-sm"
                    >
                      <Type className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      <span className="hidden sm:inline">Format</span>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : selectedEmail ? (
              <Card>
                <CardHeader className="p-2 md:p-3 lg:p-4">
                  <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 md:gap-3">
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setIsInboxOpen(true)}
                        className="lg:hidden h-8 w-8 shrink-0"
                      >
                        <ArrowLeft className="h-4 w-4" />
                      </Button>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base md:text-lg font-semibold mb-1 md:mb-1.5">
                          {selectedEmail.subject || "(No Subject)"}
                        </h3>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 text-xs md:text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5 md:h-6 md:w-6">
                              <AvatarFallback className="text-[10px] md:text-xs">
                                {selectedEmail.direction === "outbound"
                                  ? "You"
                                  : initials}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium text-foreground truncate">
                              {selectedEmail.direction === "outbound"
                                ? selectedEmail.sentBy
                                  ? `${selectedEmail.sentBy.firstName} ${selectedEmail.sentBy.lastName}`
                                  : "You"
                                : selectedEmail.from || "Unknown"}
                            </span>
                          </div>
                          <span className="hidden sm:inline">→</span>
                          <span className="truncate">
                            {selectedEmail.direction === "outbound"
                              ? selectedEmail.to && selectedEmail.to.length > 0
                                ? selectedEmail.to[0]
                                : "Unknown"
                              : "You"}
                          </span>
                        </div>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="shrink-0 h-8 w-8 md:h-9 md:w-9"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleReply(selectedEmail)}
                        >
                          <Reply className="h-4 w-4 mr-2" />
                          Reply
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() => handleDeleteEmail(selectedEmail)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="p-2 md:p-3 lg:p-4 space-y-2 md:space-y-3">
                  <div className="flex items-center gap-2 text-[10px] md:text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 md:h-3.5 md:w-3.5 shrink-0" />
                    <span className="truncate">
                      {selectedEmail.timestamp.toLocaleString()}
                    </span>
                    {selectedEmail.direction === "outbound" &&
                      selectedEmail.status === "sent" && (
                        <>
                          <CheckCheck className="h-3 w-3 md:h-3.5 md:w-3.5 text-green-600 dark:text-green-400 shrink-0" />
                          <span className="text-green-600 dark:text-green-400">
                            Sent
                          </span>
                        </>
                      )}
                  </div>

                  <Separator />

                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    {(() => {
                      const { replyText, hasQuotedText, quotedText } = extractReplyContent(selectedEmail.body || "");
                      const [showQuoted, setShowQuoted] = useState(false);

                      return (
                        <div className="space-y-3">
                          {/* Main reply content */}
                          <p className="whitespace-pre-wrap text-xs md:text-sm leading-relaxed">
                            {replyText || "(No content)"}
                          </p>

                          {/* Expandable quoted text */}
                          {hasQuotedText && quotedText && (
                            <div className="border-l-2 border-muted pl-3 space-y-2">
                              <button
                                onClick={() => setShowQuoted(!showQuoted)}
                                className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {showQuoted ? (
                                  <ChevronUp className="h-3 w-3" />
                                ) : (
                                  <ChevronDown className="h-3 w-3" />
                                )}
                                <span>
                                  {showQuoted ? "Hide" : "Show"} previous messages
                                </span>
                              </button>

                              {showQuoted && (
                                <div className="text-xs text-muted-foreground whitespace-pre-wrap leading-relaxed opacity-75">
                                  {formatQuotedText(quotedText)}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {selectedEmail.attachments &&
                    selectedEmail.attachments.length > 0 && (
                      <>
                        <Separator />
                        <div className="space-y-2">
                          <Label className="text-[10px] md:text-xs text-muted-foreground">
                            Attachments
                          </Label>
                          <div className="grid gap-2">
                            {selectedEmail.attachments.map(
                              (attachment, index) => (
                                <div
                                  key={index}
                                  className="flex items-center gap-2 md:gap-3 p-2 md:p-3 rounded-lg border bg-muted/50"
                                >
                                  <Paperclip className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs md:text-sm font-medium truncate">
                                      {attachment.filename}
                                    </p>
                                    <p className="text-[10px] md:text-xs text-muted-foreground">
                                      {formatFileSize(attachment.size)}
                                    </p>
                                  </div>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      window.open(attachment.url, "_blank")
                                    }
                                    className="h-8 w-8 md:h-9 md:w-9 p-0"
                                  >
                                    <Download className="h-3 w-3 md:h-4 md:w-4" />
                                  </Button>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      </>
                    )}

                  <Separator />

                  <div className="flex flex-col sm:flex-row gap-2">
                    <Button
                      onClick={() => handleReply(selectedEmail)}
                      className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9"
                    >
                      <Reply className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      Reply
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full sm:w-auto text-xs md:text-sm h-8 md:h-9"
                    >
                      <Forward className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                      Forward
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card className="h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
                <div className="text-center p-3 md:p-4">
                  <Mail className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-2 md:mb-3 text-muted-foreground opacity-20" />
                  <p className="text-base md:text-lg font-medium text-muted-foreground mb-1 md:mb-1.5">
                    No email selected
                  </p>
                  <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                    Select an email to view or compose a new one
                  </p>
                  <Button
                    onClick={() => setIsComposing(true)}
                    className="text-xs md:text-sm h-8 md:h-9"
                  >
                    <Send className="h-3 w-3 md:h-4 md:w-4 mr-1.5 md:mr-2" />
                    Compose Email
                  </Button>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Dialog */}
      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Email"
        description="Are you sure you want to delete this email? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDeleteEmail}
        variant="destructive"
      />
    </>
  );
}

function formatTimestamp(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
