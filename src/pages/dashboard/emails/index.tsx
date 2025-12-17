import { useState, useMemo } from "react";
import * as React from "react";
import {
  Mail,
  Send,
  Inbox,
  Trash2,
  Star,
  Archive,
  Search,
  Plus,
  Reply,
  Forward,
  MoreVertical,
  Paperclip,
  ChevronDown,
  ChevronUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEmails, useCandidates } from "@/hooks/firestore";
import { extractReplyContent, formatQuotedText } from "@/lib/email-parser";
import { API_BASE_URL } from "@/config/api";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import type { Email as EmailType } from "@/hooks/useEmails";

// Extend the Email type to include optional fields
type Email = EmailType & {
  isStarred?: boolean;
  attachments?: Array<{
    filename: string;
    url: string;
    contentType: string;
    size: number;
  }>;
};

export default function EmailsPage() {
  const [activeTab, setActiveTab] = useState<"inbox" | "sent" | "starred">("inbox");
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showQuotedText, setShowQuotedText] = useState(false);
  const [systemEmail, setSystemEmail] = useState<string>("");
  const [systemEmailLoading, setSystemEmailLoading] = useState(true);

  // Compose form state
  const [composeTo, setComposeTo] = useState("");
  const [composeSubject, setComposeSubject] = useState("");
  const [composeBody, setComposeBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // Get data from Firestore
  const { data: allEmails, loading: emailsLoading } = useEmails();
  const { data: candidates } = useCandidates();

  // Fetch system email configuration
  React.useEffect(() => {
    const fetchSystemEmail = async () => {
      try {
        setSystemEmailLoading(true);
        const response = await authenticatedFetch(`${API_BASE_URL}/email-settings`);
        if (response.ok) {
          const data = await response.json();
          setSystemEmail(data.fromEmail.toLowerCase());
        }
      } catch (error) {
        console.error("Failed to fetch system email:", error);
      } finally {
        setSystemEmailLoading(false);
      }
    };
    fetchSystemEmail();
  }, []);

  // Filter emails based on active tab
  const filteredEmails = useMemo(() => {
    let filtered = allEmails as Email[];

    // Filter by system email association - only show emails related to our system email
    if (systemEmail) {
      filtered = filtered.filter((email) => {
        const fromEmail = email.from.toLowerCase();
        const toEmails = email.to.map((e) => e.toLowerCase());
        
        // Show if email is FROM system email (outbound) OR TO system email (inbound)
        return fromEmail === systemEmail || toEmails.includes(systemEmail);
      });
    }

    // Apply tab filter
    if (activeTab === "inbox") {
      filtered = filtered.filter((email) => email.direction === "inbound");
    } else if (activeTab === "sent") {
      filtered = filtered.filter((email) => email.direction === "outbound");
    } else if (activeTab === "starred") {
      filtered = filtered.filter((email) => email.isStarred);
    }

    // Apply search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (email) =>
          email.from.toLowerCase().includes(query) ||
          email.subject.toLowerCase().includes(query) ||
          email.body.toLowerCase().includes(query)
      );
    }

    // Sort by date (most recent first)
    return filtered.sort((a, b) => {
      const dateA = a.receivedAt || a.sentAt || new Date(0);
      const dateB = b.receivedAt || b.sentAt || new Date(0);
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    });
  }, [allEmails, activeTab, searchQuery, systemEmail]);

  const handleSendEmail = async () => {
    if (!composeTo || !composeSubject || !composeBody) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSending(true);
    try {
      const response = await authenticatedFetch(`${API_BASE_URL}/emails`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          to: [composeTo],
          subject: composeSubject,
          body: composeBody,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send email");
      }

      toast.success("Email sent successfully");
      setIsComposing(false);
      setComposeTo("");
      setComposeSubject("");
      setComposeBody("");
    } catch {
      toast.error("Failed to send email");
    } finally {
      setIsSending(false);
    }
  };

  const handleReply = (email: Email) => {
    setComposeTo(email.from);
    setComposeSubject(email.subject.startsWith("Re:") ? email.subject : `Re: ${email.subject}`);
    setComposeBody(`\n\n---\nOn ${new Date(email.sentAt || email.receivedAt || "").toLocaleString()}, ${email.from} wrote:\n${email.body}`);
    setIsComposing(true);
    setSelectedEmail(null);
  };

  const handleForward = (email: Email) => {
    setComposeTo("");
    setComposeSubject(email.subject.startsWith("Fwd:") ? email.subject : `Fwd: ${email.subject}`);
    setComposeBody(`\n\n---\nForwarded message from ${email.from}:\n${email.body}`);
    setIsComposing(true);
    setSelectedEmail(null);
  };

  const handleToggleStar = async (email: Email) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isStarred: !email.isStarred }),
      });
      toast.success(email.isStarred ? "Email unstarred" : "Email starred");
    } catch {
      toast.error("Failed to update email");
    }
  };

  const handleArchive = async (email: Email) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isArchived: true }),
      });
      toast.success("Email archived");
      setSelectedEmail(null);
    } catch {
      toast.error("Failed to archive email");
    }
  };

  const handleDelete = async (email: Email) => {
    try {
      await authenticatedFetch(`${API_BASE_URL}/emails/${email.id}`, {
        method: "DELETE",
      });
      toast.success("Email deleted");
      setSelectedEmail(null);
    } catch {
      toast.error("Failed to delete email");
    }
  };

  const handleMarkAsRead = async (email: Email) => {
    if (email.isRead) return;
    try {
      await authenticatedFetch(`${API_BASE_URL}/emails/${email.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isRead: true }),
      });
    } catch {
      console.error("Failed to mark email as read");
    }
  };

  const formatDate = (date: Date | undefined) => {
    if (!date) return "Unknown";
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  };

  const getEmailCount = (type: "inbox" | "sent" | "starred") => {
    const emails = allEmails as Email[];
    if (type === "inbox") return emails.filter((e) => e.direction === "inbound").length;
    if (type === "sent") return emails.filter((e) => e.direction === "outbound").length;
    if (type === "starred") return emails.filter((e) => e.isStarred).length;
    return 0;
  };

  // Get candidate or team member name from email
  const getEmailSenderName = (email: Email) => {
    if (email.candidateId) {
      const candidate = candidates.find((c) => c.id === email.candidateId);
      return candidate?.firstName && candidate?.lastName
        ? `${candidate.firstName} ${candidate.lastName}`
        : email.from;
    }
    return email.from;
  };

  if (emailsLoading || systemEmailLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Mail className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
          <p className="text-muted-foreground">Loading emails...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-var(--header-height))] w-full overflow-hidden">
      {/* Header */}
      <div className="border-b bg-background flex-shrink-0">
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Emails</h1>
            <p className="text-sm text-muted-foreground">
              Centralized email communication hub
            </p>
          </div>
          <Button onClick={() => setIsComposing(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 md:grid-cols-[256px_384px_1fr] flex-1 overflow-hidden w-full">
        {/* Sidebar Tabs - Hidden on mobile when email is selected */}
        <div className={cn(
          "border-r bg-muted/30 overflow-hidden",
          "md:block",
          selectedEmail && "hidden md:block"
        )}>
          <div className="p-4 space-y-2">
            <Button
              variant={activeTab === "inbox" ? "primary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => {
                setActiveTab("inbox");
                setSelectedEmail(null);
              }}
            >
              <Inbox className="h-4 w-4" />
              <span className="flex-1 text-left">Inbox</span>
              <Badge variant="secondary">{getEmailCount("inbox")}</Badge>
            </Button>

            <Button
              variant={activeTab === "sent" ? "primary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => {
                setActiveTab("sent");
                setSelectedEmail(null);
              }}
            >
              <Send className="h-4 w-4" />
              <span className="flex-1 text-left">Sent</span>
              <Badge variant="secondary">{getEmailCount("sent")}</Badge>
            </Button>

            <Button
              variant={activeTab === "starred" ? "primary" : "ghost"}
              className="w-full justify-start gap-3"
              onClick={() => {
                setActiveTab("starred");
                setSelectedEmail(null);
              }}
            >
              <Star className="h-4 w-4" />
              <span className="flex-1 text-left">Starred</span>
              <Badge variant="secondary">{getEmailCount("starred")}</Badge>
            </Button>
          </div>
        </div>

        {/* Email List - Hidden on mobile when email is selected or composing */}
        <div className={cn(
          "border-r flex flex-col overflow-hidden",
          (selectedEmail || isComposing) && "hidden md:flex"
        )}>
          {/* Search */}
          <div className="p-4 border-b">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search emails..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          {/* Email List */}
          <div className="flex-1 overflow-y-auto">
            {filteredEmails.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center p-8">
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No emails found" : `No ${activeTab} emails`}
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredEmails.map((email) => (
                  <button
                    key={email.id}
                    onClick={() => {
                      setSelectedEmail(email);
                      handleMarkAsRead(email);
                    }}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/50 transition-colors",
                      selectedEmail?.id === email.id && "bg-muted",
                      !email.isRead && "bg-blue-50/50 dark:bg-blue-950/20"
                    )}
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {getEmailSenderName(email).charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {!email.isRead && (
                          <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full border-2 border-background"></span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className={cn("text-sm truncate", !email.isRead && "font-bold")}>
                            {getEmailSenderName(email)}
                          </span>
                          <span className="text-xs text-muted-foreground shrink-0">
                            {formatDate(email.receivedAt || email.sentAt)}
                          </span>
                        </div>
                        <p className={cn("text-sm truncate mb-1", !email.isRead ? "font-bold" : "font-medium")}>
                          {email.subject || "(No subject)"}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {extractReplyContent(email.body).replyText}
                        </p>
                      </div>
                      {email.isStarred && (
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 shrink-0" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Email Detail / Compose - Full width on mobile */}
        <div className={cn(
          "flex flex-col bg-background overflow-hidden",
          !selectedEmail && !isComposing && "hidden md:flex"
        )}>
          {isComposing ? (
            /* Compose Email */
            <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden w-full">
              <div className="border-b p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden"
                    onClick={() => setIsComposing(false)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  <h2 className="text-lg font-semibold">New Message</h2>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="hidden md:flex"
                  onClick={() => setIsComposing(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                <div className="space-y-2">
                  <Label>To</Label>
                  <Input
                    placeholder="recipient@example.com"
                    value={composeTo}
                    onChange={(e) => setComposeTo(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subject</Label>
                  <Input
                    placeholder="Email subject"
                    value={composeSubject}
                    onChange={(e) => setComposeSubject(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <Textarea
                    placeholder="Write your message..."
                    value={composeBody}
                    onChange={(e) => setComposeBody(e.target.value)}
                    rows={10}
                    className="resize-none min-h-[200px] md:min-h-[300px]"
                  />
                </div>
              </div>

              <div className="border-t p-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Paperclip className="h-4 w-4 mr-2" />
                    Attach
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    onClick={() => setIsComposing(false)}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSendEmail} disabled={isSending}>
                    <Send className="h-4 w-4 mr-2" />
                    {isSending ? "Sending..." : "Send"}
                  </Button>
                </div>
              </div>
            </div>
          ) : selectedEmail ? (
            /* Email Detail */
            <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-hidden w-full">
              {/* Email Header */}
              <div className="border-b p-4 md:p-6 overflow-hidden w-full max-w-full">
                <div className="flex items-start gap-2 mb-4 min-w-0 max-w-full">
                  {/* Back button for mobile */}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="md:hidden shrink-0"
                    onClick={() => setSelectedEmail(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                  
                  <div className="flex-1 min-w-0 max-w-full overflow-hidden">
                    <h2 className="text-lg md:text-xl font-semibold mb-2 break-words overflow-wrap-anywhere">
                      {selectedEmail.subject || "(No subject)"}
                    </h2>
                    <div className="flex flex-col gap-1 text-sm text-muted-foreground">
                      <span className="font-medium">
                        {getEmailSenderName(selectedEmail)}
                      </span>
                      <span className="break-all">&lt;{selectedEmail.from}&gt;</span>
                      <span className="text-xs">
                        {new Date(
                          selectedEmail.receivedAt || selectedEmail.sentAt || ""
                        ).toLocaleString()}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReply(selectedEmail)}
                      className="hidden md:flex"
                    >
                      <Reply className="h-4 w-4 mr-2" />
                      Reply
                    </Button>
                    
                    {/* Mobile Reply Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleReply(selectedEmail)}
                      className="md:hidden"
                    >
                      <Reply className="h-4 w-4" />
                    </Button>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleForward(selectedEmail)}>
                          <Forward className="h-4 w-4 mr-2" />
                          Forward
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleToggleStar(selectedEmail)}>
                          <Star className="h-4 w-4 mr-2" />
                          {selectedEmail.isStarred ? "Unstar" : "Star"}
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleArchive(selectedEmail)}>
                          <Archive className="h-4 w-4 mr-2" />
                          Archive
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="text-destructive" onClick={() => handleDelete(selectedEmail)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </div>

              {/* Email Body */}
              <div className="flex-1 overflow-y-auto p-4 md:p-6 overflow-x-hidden w-full max-w-full">
                <div className="prose prose-sm dark:prose-invert max-w-full break-words overflow-wrap-anywhere">
                  {(() => {
                    const { replyText, hasQuotedText, quotedText } = extractReplyContent(
                      selectedEmail.body || ""
                    );

                    return (
                      <div className="space-y-4">
                        <div className="whitespace-pre-wrap break-words">{replyText || "(No content)"}</div>

                        {hasQuotedText && quotedText && (
                          <div className="border-l-2 border-muted pl-4 space-y-2">
                            <button
                              onClick={() => setShowQuotedText(!showQuotedText)}
                              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              {showQuotedText ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                              <span>
                                {showQuotedText ? "Hide" : "Show"} previous messages
                              </span>
                            </button>

                            {showQuotedText && (
                              <div className="text-sm text-muted-foreground whitespace-pre-wrap break-words opacity-75">
                                {formatQuotedText(quotedText)}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>

                {/* Attachments */}
                {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                  <div className="mt-6 pt-6 border-t">
                    <h3 className="text-sm font-semibold mb-3">
                      Attachments ({selectedEmail.attachments.length})
                    </h3>
                    <div className="space-y-2">
                      {selectedEmail.attachments.map((attachment, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 p-3 rounded-lg border bg-muted/50"
                        >
                          <Paperclip className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {attachment.filename}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {(attachment.size / 1024).toFixed(1)} KB
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <a href={attachment.url} download target="_blank" rel="noopener noreferrer">
                              Download
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            /* No Selection */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-muted-foreground">
                <Mail className="h-16 w-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No email selected</p>
                <p className="text-sm">Select an email from the list to view its contents</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
