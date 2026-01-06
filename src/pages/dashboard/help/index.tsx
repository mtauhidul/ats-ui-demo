import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import {
  BookOpen,
  Briefcase,
  ChevronDown,
  ChevronUp,
  Clock,
  FileText,
  HelpCircle,
  Mail,
  MessageCircle,
  Search,
  Shield,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

interface FAQItem {
  id: string;
  category: string;
  question: string;
  answer: string;
  tags: string[];
}

const faqData: FAQItem[] = [
  // ==================== GETTING STARTED ====================
  {
    id: "faq-001",
    category: "Getting Started",
    question: "What is Arista ATS?",
    answer:
      "Arista ATS is a recruitment management system that helps you track job applications, manage candidates, organize jobs, and work with clients. Think of it as your complete hiring assistant that keeps everything organized in one place.",
    tags: ["introduction", "overview", "basics"],
  },
  {
    id: "faq-002",
    category: "Getting Started",
    question: "What's the difference between Applications and Candidates?",
    answer:
      "Applications are new resumes waiting for your review - think of them as your inbox. When you approve an application by clicking the green 'Approve & Email' button, that person becomes a Candidate. Candidates can be assigned to jobs, moved through interview stages, and tracked throughout your hiring process. Note: Rejected applications do not become candidates and are automatically deleted after 30 days.",
    tags: ["applications", "candidates", "difference", "workflow"],
  },
  {
    id: "faq-003",
    category: "Getting Started",
    question: "How do I navigate around the system?",
    answer:
      "Use the left sidebar to access main sections: Dashboard (home page with overview), Clients (companies you work with - click any client to see their jobs), Candidates (both approved candidates and pending applications), Emails (communication center), Team (manage your coworkers), and Get Help (this page). Each section has its own tools and filters at the top.",
    tags: ["navigation", "sidebar", "menu", "basics"],
  },

  // ==================== APPLICATIONS ====================
  {
    id: "faq-010",
    category: "Applications",
    question: "How do I review new applications?",
    answer:
      "Go to Candidates page and click the 'Applications' tab. You'll see all new applications in a table. Click any row to view the full resume and details. To approve: click the green 'Approve & Email' button (this creates a candidate and opens an email to contact them). To reject: click the red X button. You can assign applications to team members using the dropdown in each row.",
    tags: ["applications", "review", "approve", "reject"],
  },
  {
    id: "faq-011",
    category: "Applications",
    question: "Can I filter applications?",
    answer:
      "Yes! In the Candidates page, click the 'Applications' tab. At the top you'll see filter options for 'All', 'Pending', 'Approved', and 'Rejected'. Click any of these to see only that type. You can also use the search box to find applications by name, email, or job title.",
    tags: ["applications", "filter", "search"],
  },
  {
    id: "faq-012",
    category: "Applications",
    question: "What happens when I approve an application?",
    answer:
      "Three things happen automatically: 1) A new candidate profile is created and linked to the job they applied for, 2) An email window opens so you can immediately contact them, 3) They appear in the Candidates tab and in the job's pipeline at the first stage. This ensures you never forget to welcome new candidates.",
    tags: ["applications", "approve", "automation"],
  },
  {
    id: "faq-013",
    category: "Applications",
    question: "Can I bulk-select multiple applications?",
    answer:
      "Yes! Each row has a checkbox on the left. Click the checkbox in the table header to select all applications on the current page. Then use the bulk action buttons that appear at the top to approve or reject multiple applications at once.",
    tags: ["applications", "bulk", "selection"],
  },
  {
    id: "faq-014",
    category: "Applications",
    question: "How do applications come into the system?",
    answer:
      "Applications come in three ways: 1) Direct Apply - candidates apply through your website or application form, 2) Manual Entry - your team manually adds someone's information, 3) Email Automation - resumes emailed to your monitored inbox are automatically extracted and added. The 'Source' column in the Applications table shows how each application arrived.",
    tags: ["applications", "source", "automation", "email"],
  },
  {
    id: "faq-015",
    category: "Applications",
    question: "Can I reassign an application to another team member?",
    answer:
      "Yes! In the Applications table, find the 'Assigned To' column. Click the dropdown in any row and select a team member. They'll be notified instantly and can filter to see their assigned applications.",
    tags: ["applications", "assign", "team"],
  },

  {
    id: "faq-016",
    category: "Applications",
    question: "Is a video required for applications?",
    answer:
      "Yes! All applications must include a video introduction. This helps you evaluate communication skills and personality before scheduling interviews. Applications without videos cannot be submitted through the application form.",
    tags: ["applications", "video", "requirement"],
  },
  {
    id: "faq-017",
    category: "Applications",
    question: "What happens to rejected applications?",
    answer:
      "Rejected applications are automatically deleted after 30 days to keep your system clean. The candidate's resume file is also removed from storage. If you think you might reconsider someone, add a note before rejecting or don't reject them yet - once deleted after 30 days, the data cannot be recovered.",
    tags: ["applications", "reject", "cleanup", "automatic"],
  },

  // ==================== CANDIDATES ====================
  {
    id: "faq-020",
    category: "Candidates",
    question: "How do I view all my candidates?",
    answer:
      "Click 'Candidates' in the sidebar. You'll see two tabs: 'Candidates' (approved people actively in your hiring process) and 'Applications' (new resumes waiting for review). The Candidates tab shows everyone you're currently working with, including their name, email, job, current interview stage, client, and status. Click any row to see full details.",
    tags: ["candidates", "view", "list"],
  },
  {
    id: "faq-021",
    category: "Candidates",
    question: "How do I move a candidate through interview stages?",
    answer:
      "Two ways: 1) Quick method - In the Candidates table, click the stage dropdown in any row and select the new stage. 2) Visual method - Go to Clients, select the client, click the job to see the pipeline board, then drag candidate cards between columns. Both update the candidate's status instantly.",
    tags: ["candidates", "stages", "pipeline", "movement"],
  },
  {
    id: "faq-022",
    category: "Candidates",
    question: "What are the different candidate stages?",
    answer:
      "The typical stages are: Screening (initial review), Interview (scheduled or completed interviews), Assessment (skills tests or assignments), Offer (offer extended), Hired (they accepted and started), and Rejected (no longer being considered). Your admin can customize these stages for each job.",
    tags: ["candidates", "stages", "workflow"],
  },
  {
    id: "faq-023",
    category: "Candidates",
    question: "Can I assign a candidate to a different job?",
    answer:
      "Yes! Open the candidate's details (click their row), find the 'Assigned Job' section, click the dropdown, and select a different job. This is helpful when someone isn't right for one position but perfect for another.",
    tags: ["candidates", "reassign", "jobs"],
  },
  {
    id: "faq-024",
    category: "Candidates",
    question: "How do I add notes about a candidate?",
    answer:
      "Click on any candidate to open their profile. Find the 'Notes' section and click 'Add Note'. Write your observations (interview feedback, strengths, concerns, red flags, etc.) and save. All notes show who wrote them and when, creating a complete history.",
    tags: ["candidates", "notes", "feedback"],
  },
  {
    id: "faq-025",
    category: "Candidates",
    question: "Can I see a candidate's interview history?",
    answer:
      "Yes! Open the candidate's profile and look for the 'Interview History' section. You'll see all past interviews, including dates, interviewers, ratings, feedback, and outcomes. This helps avoid submitting the same person to a client twice.",
    tags: ["candidates", "interviews", "history"],
  },
  {
    id: "faq-026",
    category: "Candidates",
    question: "What are candidate tags and how do I use them?",
    answer:
      "Tags are labels you create to organize candidates - like 'JavaScript', 'Senior', 'Remote', 'Bilingual', etc. Open any candidate profile, find the tags field, and type to create or select tags. Use tags to quickly find candidates with specific skills or attributes later.",
    tags: ["candidates", "tags", "organization"],
  },
  {
    id: "faq-027",
    category: "Candidates",
    question: "How do I filter candidates?",
    answer:
      "Use the search box at the top of the Candidates page to search by name, email, or skills. You can also click on column headers to sort (like sorting by stage or client). If you need more specific filters, use the Search page for advanced filtering.",
    tags: ["candidates", "filter", "search"],
  },

  // ==================== JOBS ====================
  {
    id: "faq-030",
    category: "Jobs",
    question: "How do I create a new job posting?",
    answer:
      "Click 'Clients' in the left sidebar, select the client you want to create a job for, then click the 'Add Job' button. Fill in the job title, description, requirements, salary range, location, employment type (full-time, part-time, etc.). Click 'Create Job' when done. The job will immediately be available for applications and appear on that client's job list.",
    tags: ["jobs", "create", "posting"],
  },
  {
    id: "faq-031",
    category: "Jobs",
    question: "Can I edit a job after creating it?",
    answer:
      "Yes! Go to Clients page, click the client that owns the job, find the job in their list, and click on it. You'll see an 'Edit Job' button at the top. You can change the title, description, requirements, salary, status, or any other field. Changes are saved immediately.",
    tags: ["jobs", "edit", "update"],
  },
  {
    id: "faq-032",
    category: "Jobs",
    question: "How do I see all candidates for a specific job?",
    answer:
      "Click 'Clients' in the sidebar, select the client, then click on any job title. You'll see a pipeline view (like a board) with columns for each stage (Screening, Interview, etc.). Each column shows candidates in that stage. You can drag candidates between columns to update their status.",
    tags: ["jobs", "pipeline", "candidates", "view"],
  },
  {
    id: "faq-033",
    category: "Jobs",
    question: "What does 'Job Status' mean?",
    answer:
      "Job Status indicates: Active (currently accepting applications), On Hold (temporarily paused), Closed (position filled or cancelled), or Draft (not published yet). Change the status by editing the job. Only Active jobs accept new applications.",
    tags: ["jobs", "status", "active", "closed"],
  },
  {
    id: "faq-034",
    category: "Jobs",
    question: "How do I schedule an interview for a candidate?",
    answer:
      "Go to Clients, click the client, click on a job to see the pipeline, find the candidate you want to interview, and click on their card. Look for the 'Schedule Interview' button. Fill in the interview details including date, time, type (video, phone, in-person), duration, and optionally create a Zoom meeting link. The candidate will receive an automated email invitation with all the details.",
    tags: ["jobs", "interview", "schedule", "zoom"],
  },
  {
    id: "faq-035",
    category: "Jobs",
    question: "How do I close or archive an old job?",
    answer:
      "Go to Clients, click the client, click on the job you want to close, click 'Edit Job', and change the Status dropdown to 'Closed'. This stops new applications but keeps all historical data and candidate information accessible for future reference.",
    tags: ["jobs", "close", "archive"],
  },
  {
    id: "faq-036",
    category: "Jobs",
    question: "What is the pipeline view?",
    answer:
      "The pipeline is a visual board (like Trello) showing all candidates for a job organized into columns by stage (Screening, Interview, Offer, etc.). Click on any job to see its pipeline. Drag candidate cards between columns to move them through your hiring process. It's the easiest way to see your progress at a glance.",
    tags: ["jobs", "pipeline", "kanban", "workflow"],
  },

  // ==================== CLIENTS ====================
  {
    id: "faq-040",
    category: "Clients",
    question: "How do I add a new client?",
    answer:
      "Go to Clients page and click 'Add Client'. Fill in company name, industry, website, address, and primary contact details. You can also add notes. Click 'Create Client' to save. The new client appears in your list and can be selected when creating jobs.",
    tags: ["clients", "add", "create"],
  },
  {
    id: "faq-041",
    category: "Clients",
    question: "Can I add multiple contacts for one client?",
    answer:
      "Yes! Open a client's details by clicking their name. Go to the 'Contacts' tab and click 'Add Contact'. Enter the contact's name, email, phone, role, and mark if they're the primary contact. You can add as many contacts as needed - helpful for large companies with multiple hiring managers.",
    tags: ["clients", "contacts", "multiple"],
  },
  {
    id: "faq-042",
    category: "Clients",
    question: "How do I see all jobs for a specific client?",
    answer:
      "Click 'Clients' in the sidebar, then click on the client's name. You'll see their profile with tabs for Overview, Jobs, Contacts, and Notes. Click the 'Jobs' tab to see all jobs (active and closed) for that client.",
    tags: ["clients", "jobs", "view"],
  },
  {
    id: "faq-043",
    category: "Clients",
    question: "Can I add notes about a client?",
    answer:
      "Yes! Open the client's profile and go to the 'Notes' tab. Click 'Add Note' to record information like meeting notes, preferences, feedback, or important dates. All notes show who added them and when.",
    tags: ["clients", "notes", "information"],
  },
  {
    id: "faq-044",
    category: "Clients",
    question: "How do I edit client information?",
    answer:
      "Click 'Clients' in the sidebar, find your client, and click on their name. You'll see an 'Edit Client' button at the top. You can update company name, industry, address, website, or any other details. Changes save automatically.",
    tags: ["clients", "edit", "update"],
  },

  // ==================== TEAM ====================
  {
    id: "faq-050",
    category: "Team",
    question: "How do I add a new team member?",
    answer:
      "Go to Team page and click 'Add Member'. Enter their name, email, and select their role (Admin, Recruiter, Hiring Manager, or Viewer). Optionally add department and job title. Click 'Send Invitation' - they'll receive an email to create their account and log in.",
    tags: ["team", "add", "invite"],
  },
  {
    id: "faq-051",
    category: "Team",
    question: "What are the different user roles?",
    answer:
      "Admin - Full control over everything (settings, team, all data). Recruiter - Manages clients, jobs, applications, and candidates. Hiring Manager - Reviews and manages candidates for specific jobs, limited editing. Viewer - Can only view information, cannot make any changes. Choose based on what each person needs to do.",
    tags: ["team", "roles", "permissions"],
  },
  {
    id: "faq-052",
    category: "Team",
    question: "Can I change someone's role or permissions?",
    answer:
      "Yes, but only if you're an Admin. Go to the Team page, click on the team member you want to change, and click 'Edit'. Change their role in the dropdown or toggle specific permissions. Changes take effect immediately and the person will see their new access level.",
    tags: ["team", "permissions", "roles", "edit"],
  },
  {
    id: "faq-053",
    category: "Team",
    question: "How do I deactivate or remove a team member?",
    answer:
      "Go to the Team page, click on the person you want to remove, and click 'Edit'. Look for the 'Status' field and change it to 'Inactive', or click the 'Delete' button if you want to completely remove them. Inactive users can't log in but their data remains. Deleted users are permanently removed.",
    tags: ["team", "remove", "deactivate"],
  },
  {
    id: "faq-054",
    category: "Team",
    question: "Can I see what each team member is working on?",
    answer:
      "Go to the Team page to see a list of all members. You can see how many jobs, candidates, or applications are assigned to each person. For more detail, go to Applications or Candidates page and look at the 'Assigned To' column to see who's handling what.",
    tags: ["team", "activity", "assignments"],
  },

  // ==================== DASHBOARD ====================
  {
    id: "faq-060",
    category: "Dashboard",
    question: "What information is on the Dashboard?",
    answer:
      "The Dashboard is your command center showing: total applications received, approval rate percentage, charts of applications over time by source (direct apply, manual, email automation), recent activity log of all team actions, and quick stats. It gives you a complete snapshot of your recruitment activity at a glance.",
    tags: ["dashboard", "overview", "analytics"],
  },
  {
    id: "faq-061",
    category: "Dashboard",
    question: "What does the chart on the Dashboard show?",
    answer:
      "The main chart shows applications received over time, broken down by source (direct apply in blue, manual in orange, email automation in green). You can change the time range using the dropdown at the top of the chart (7 days, 30 days, 90 days, etc.).",
    tags: ["dashboard", "chart", "analytics"],
  },
  {
    id: "faq-062",
    category: "Dashboard",
    question: "Can I export Dashboard data?",
    answer:
      "Currently, the Dashboard is view-only. Data export features (CSV/Excel) are planned for future updates. If you need specific reports now, contact support and they can help generate them for you.",
    tags: ["dashboard", "export", "reports"],
  },

  // ==================== SEARCH ====================
  {
    id: "faq-070",
    category: "Search",
    question: "How do I use the global search?",
    answer:
      "Click 'Search' in the sidebar or press Cmd+K (Mac) / Ctrl+K (Windows) anywhere in the app. Type what you're looking for - a person's name, company name, job title, skill, or email address. Results appear instantly, grouped by type (Jobs, Candidates, Clients, Applications, Team). Click any result to jump directly to it.",
    tags: ["search", "find", "global"],
  },
  {
    id: "faq-071",
    category: "Search",
    question: "Can I search for candidates with specific skills?",
    answer:
      "Yes! Use the Search page and type the skill name (like 'React', 'Marketing', 'Sales'). The search looks through candidate profiles, resumes, and tags. You can also go to the Candidates page and use the search box there for candidate-specific searches.",
    tags: ["search", "candidates", "skills"],
  },
  {
    id: "faq-072",
    category: "Search",
    question: "Does search remember my recent searches?",
    answer:
      "Yes! Your last 5 searches are saved automatically. You'll see them as quick access buttons at the top of the Search page. Click any recent search to run it again, or click 'Clear' to remove them all.",
    tags: ["search", "history", "recent"],
  },

  // ==================== SETTINGS ====================
  {
    id: "faq-080",
    category: "Settings",
    question: "Where do I find Settings?",
    answer:
      "Click 'Settings' at the bottom of the left sidebar. You'll find sections for: General (company info), Email Automation (automatic resume processing), Email Templates (reusable messages), Pipeline Stages (customize your workflow), Tags & Categories (organize data), and User Settings (your personal preferences and password).",
    tags: ["settings", "configuration", "preferences"],
  },
  {
    id: "faq-081",
    category: "Settings",
    question: "What is Email Automation?",
    answer:
      "Email Automation monitors an email inbox and automatically processes resumes sent to it. When someone emails a resume to your monitoring address, the system extracts their information (name, skills, experience) and creates an application automatically - no manual data entry needed! Set this up in Settings > Email Automation to save hours of work.",
    tags: ["settings", "email", "automation"],
  },
  {
    id: "faq-082",
    category: "Settings",
    question: "How do I pause email automation temporarily?",
    answer:
      "Go to Settings > Email Automation. You'll see a list of all your monitoring email accounts. Find the one you want to pause and click the pause button (two vertical bars icon) next to it. Click it again to resume. This is helpful when you're not actively hiring.",
    tags: ["settings", "email", "pause", "automation"],
  },
  {
    id: "faq-083",
    category: "Settings",
    question: "What are Email Templates?",
    answer:
      "Email Templates are pre-written messages you can reuse for common emails (interview invitations, rejections, offers, follow-ups). Create them in Settings > Email Templates. Use variables like {{candidateName}} or [Candidate Name], {{jobTitle}} or [Job Title], {{companyName}} or [Company Name], {{interviewDate}} or [Interview Date] - the system automatically fills in the actual values when you send.",
    tags: ["settings", "email", "templates", "variables"],
  },
  {
    id: "faq-084",
    category: "Settings",
    question: "Can I customize the pipeline stages?",
    answer:
      "Yes! Go to Settings > Pipeline Stages to add, edit, or remove stages. Common stages are: Screening, Phone Screen, Interview, Assessment, Reference Check, Offer, Hired, and Rejected. Customize to match your process. Changes apply to new jobs automatically.",
    tags: ["settings", "pipeline", "stages", "customize"],
  },
  {
    id: "faq-085",
    category: "Settings",
    question: "What are Tags and how do I manage them?",
    answer:
      "Tags are labels like 'JavaScript', 'Remote', 'Senior' that help organize candidates and jobs. Go to Settings > Tags to see all your tags, create new ones, edit names, or delete unused ones. Tags created here can be used throughout the system when tagging candidates or jobs.",
    tags: ["settings", "tags", "organize"],
  },
  {
    id: "faq-086",
    category: "Settings",
    question: "How do I change my personal information?",
    answer:
      "Go to Settings and find the 'User Settings' or 'Account' section. Update your name, email, phone, profile picture, password, and notification preferences. Your profile changes are visible to other team members.",
    tags: ["settings", "account", "profile"],
  },

  // ==================== COMMON TASKS ====================
  {
    id: "faq-090",
    category: "Common Tasks",
    question: "How do I process a new application start to finish?",
    answer:
      "Step 1: Go to Candidates page and click Applications tab. Step 2: Click on an application to review their resume and details. Step 3: Click the green 'Approve & Email' button to approve (opens email modal) or red X to Reject. Step 4: Send welcome email to approved candidate. Step 5: They become a Candidate in the Candidates tab. Step 6: Move them through stages as you interview them. Step 7: When ready, change their stage to 'Offer' or 'Hired'.",
    tags: ["workflow", "process", "applications", "candidates"],
  },
  {
    id: "faq-091",
    category: "Common Tasks",
    question: "How do I post a new job and track applicants?",
    answer:
      "Step 1: Click 'Clients' in sidebar. Step 2: Select the client. Step 3: Click 'Add Job' button. Step 4: Fill in job details. Step 5: Click 'Create Job'. Step 6: Applications will start appearing in the Candidates page under Applications tab. Step 7: Click the job name in the client's job list to see the pipeline view of all candidates for that job.",
    tags: ["workflow", "jobs", "tracking"],
  },
  {
    id: "faq-092",
    category: "Common Tasks",
    question: "How do I move a candidate through the interview process?",
    answer:
      "Option 1: Go to Candidates page, find the candidate, click the stage dropdown in their row, and select the new stage. Option 2: Go to Clients, click the client, click the job, and drag the candidate's card between stage columns in the pipeline view. Both options update the candidate's status immediately.",
    tags: ["workflow", "candidates", "stages"],
  },
  {
    id: "faq-093",
    category: "Common Tasks",
    question: "How do I assign work to my team members?",
    answer:
      "For Applications: Go to Candidates page > Applications tab and use the 'Assigned To' dropdown in each row. For Candidates: Go to Candidates page > Candidates tab and use the 'Assigned To' field. The assigned person will see it in their list and can filter to see only their assignments.",
    tags: ["workflow", "team", "assignments"],
  },
  {
    id: "faq-094",
    category: "Common Tasks",
    question: "How do I find a specific candidate or application?",
    answer:
      "Quick search: Use the search box at the top of the Candidates page (works in both Candidates and Applications tabs). Global search: Click 'Search' in the sidebar or press Cmd+K / Ctrl+K. Type the person's name, email, or any keyword. Results will show all matches across the system.",
    tags: ["workflow", "search", "finding"],
  },
  {
    id: "faq-095",
    category: "Common Tasks",
    question: "How do I check how many open positions I have?",
    answer:
      "Click 'Clients' in the sidebar, then click on each client to see their jobs. Jobs marked 'Active' are currently accepting applications. You can also see a summary on the Dashboard showing total jobs and applications across all clients.",
    tags: ["workflow", "jobs", "counting"],
  },

  // ==================== TROUBLESHOOTING ====================
  {
    id: "faq-100",
    category: "Troubleshooting",
    question: "I don't see the 'Add Job' or 'Add Client' buttons. Why?",
    answer:
      "This is a permissions issue. Only users with Admin or Recruiter roles can create jobs and clients. If you're a Hiring Manager or Viewer, you can only view information, not create new items. Contact your system admin to adjust your permissions if needed.",
    tags: ["troubleshooting", "permissions", "access"],
  },
  {
    id: "faq-101",
    category: "Troubleshooting",
    question: "Why can't I move a candidate to a different stage?",
    answer:
      "Common reasons: 1) You may not have permission (Viewers cannot edit). 2) The candidate must be assigned to a job first. 3) The job needs a pipeline with stages set up. If everything looks correct, contact your administrator for help.",
    tags: ["troubleshooting", "candidates", "stages"],
  },
  {
    id: "faq-102",
    category: "Troubleshooting",
    question: "Email automation isn't working - no applications are coming in.",
    answer:
      "Troubleshooting steps: 1) Go to Settings > Email Automation and verify the account is active (not paused). 2) Make sure 'Auto Process Resumes' toggle is ON. 3) Confirm people are actually sending resumes to that email address. 4) Check for error messages next to the email account. Contact support if problems continue.",
    tags: ["troubleshooting", "email", "automation"],
  },
  {
    id: "faq-103",
    category: "Troubleshooting",
    question: "The application drawer is showing incomplete information.",
    answer:
      "This usually means the resume couldn't be fully parsed (converted to text). For email automation applications, try asking the sender to send a cleaner resume format (PDF or DOCX). For manual applications, you may need to fill in missing fields manually by editing the candidate profile after approval.",
    tags: ["troubleshooting", "applications", "parsing"],
  },
  {
    id: "faq-104",
    category: "Troubleshooting",
    question: "I approved an application but can't find the candidate.",
    answer:
      "When you approve an application, it becomes a candidate. Stay in the Candidates page and click the 'Candidates' tab (not the Applications tab) and search for their name. They should be there, assigned to the job they applied for, in the first stage of the pipeline.",
    tags: ["troubleshooting", "candidates", "applications"],
  },
  {
    id: "faq-105",
    category: "Troubleshooting",
    question: "Why are some text fields or names cut off in tables?",
    answer:
      "Long names, emails, or job titles are automatically shortened to fit in the table. Hover over any truncated text to see the full content in a tooltip. You can also click the row to open detailed view where all information is shown in full.",
    tags: ["troubleshooting", "display", "ui"],
  },

  // ==================== REAL-TIME & MESSAGING ====================
  {
    id: "faq-106",
    category: "Communication",
    question: "How do I send messages to my team members?",
    answer:
      "Click 'Messages' in the left sidebar to access the internal chat system. Select a team member from the list to start a conversation. All messages are real-time - your teammate will see them immediately without refreshing. You can send text messages and the system shows read receipts and typing indicators.",
    tags: ["messages", "chat", "communication", "team"],
  },
  {
    id: "faq-107",
    category: "Communication",
    question: "Are updates in the system real-time?",
    answer:
      "Yes! The system uses Firestore real-time technology. When someone approves an application, moves a candidate, or makes any change, everyone sees it immediately without refreshing the page. This prevents duplicate work and keeps everyone synchronized.",
    tags: ["realtime", "firestore", "updates", "synchronization"],
  },
  {
    id: "faq-108",
    category: "Notifications",
    question: "How do notifications work?",
    answer:
      "Click the bell icon in the top navigation to see your notifications. You'll be notified when: someone assigns you work, a candidate moves to a new stage, new applications arrive, team members message you, or important system events occur. You can mark notifications as read or delete them (admins only can delete).",
    tags: ["notifications", "alerts", "bell"],
  },
  {
    id: "faq-109",
    category: "Dashboard",
    question: "What is the Activities timeline?",
    answer:
      "The Activities section (visible on Dashboard and Team pages) shows a real-time log of all actions in the system: who created jobs, approved applications, moved candidates, scheduled interviews, etc. Each activity shows the user, action, timestamp, and affected resource. It's useful for tracking team productivity and auditing changes.",
    tags: ["activities", "timeline", "audit", "tracking"],
  },

  // ==================== RESUME PARSING & QUICK IMPORT ====================
  {
    id: "faq-110",
    category: "Resume Parsing",
    question: "What is the Quick Import feature?",
    answer:
      "Quick Import lets you upload a resume file (PDF or DOCX) and the system automatically extracts all the information - name, email, phone, skills, work history, education. Go to Candidates > Quick Import, upload the file, review the extracted data (you can edit anything), and create the candidate. It's much faster than typing everything manually!",
    tags: ["resume", "parsing", "quick-import", "upload"],
  },
  {
    id: "faq-111",
    category: "Resume Parsing",
    question: "What file formats are supported for resume uploads?",
    answer:
      "The system supports PDF and DOCX (Microsoft Word) formats. The parser tries multiple methods to read the file, so even complex resume layouts usually work. If a resume fails to upload, try converting it to a simpler PDF format.",
    tags: ["resume", "formats", "pdf", "docx"],
  },
  {
    id: "faq-112",
    category: "Resume Parsing",
    question: "What information does the resume parser extract?",
    answer:
      "The parser extracts: personal information (first name, last name, email, phone, location), professional summary, current job title and company, years of experience, education level, skills, work experience history, education details, certifications, languages, and LinkedIn/website URLs. After extraction, you can review and edit all fields before creating the candidate.",
    tags: ["resume", "parsing", "extraction", "data"],
  },
  {
    id: "faq-113",
    category: "Resume Parsing",
    question: "Can I edit the parsed resume data before saving?",
    answer:
      "Yes! After uploading a resume, the system shows you all extracted fields in an editable form. You can correct any mistakes, add missing information, or modify any field before clicking 'Create Candidate'. The parsed data is just a starting point to save you time.",
    tags: ["resume", "editing", "review", "validation"],
  },
  {
    id: "faq-114",
    category: "Resume Parsing",
    question: "What if the resume parser makes mistakes?",
    answer:
      "The parser's accuracy depends on resume formatting - clean, standard layouts work best. Complex tables, images, or unusual fonts may cause errors. Always review the extracted data before saving. You can manually correct any field. If a resume consistently fails, ask for it in a simpler format or create the candidate profile manually.",
    tags: ["resume", "errors", "accuracy", "troubleshooting"],
  },

  // ==================== BULK OPERATIONS ====================
  {
    id: "faq-120",
    category: "Bulk Operations",
    question: "Can I approve or reject multiple applications at once?",
    answer:
      "Yes! Go to Candidates page > Applications tab. Use the checkboxes on the left side of each row to select multiple applications. You can also click the checkbox in the table header to select all applications on the current page. Once selected, bulk action buttons appear at the top allowing you to approve or reject multiple applications simultaneously.",
    tags: ["bulk", "applications", "approve", "reject"],
  },
  {
    id: "faq-121",
    category: "Bulk Operations",
    question: "Can I delete multiple applications at once?",
    answer:
      "Yes! Select multiple applications using the checkboxes, then use the bulk delete option. The system will delete the selected applications and their associated files from Cloudinary storage. This action cannot be undone, so a confirmation dialog will appear before deletion.",
    tags: ["bulk", "delete", "applications"],
  },
  {
    id: "faq-122",
    category: "Bulk Operations",
    question: "Can I move multiple candidates to a new stage at once?",
    answer:
      "Yes! The system supports bulk moving of candidates. Select multiple candidates and use the bulk move action to change their pipeline stage simultaneously. You can also add notes that will apply to all selected candidates. This is useful when multiple candidates pass the same interview round.",
    tags: ["bulk", "candidates", "stages", "pipeline"],
  },
  {
    id: "faq-123",
    category: "Bulk Operations",
    question: "What is Bulk Import in Settings?",
    answer:
      "Bulk Import allows you to process multiple applications from email monitoring all at once. Go to Settings > Bulk Import to trigger a manual import of all pending emails in your monitored inbox. This is useful if email automation was paused and you want to catch up on accumulated resumes.",
    tags: ["bulk", "import", "email", "settings"],
  },

  // ==================== EMAIL & COMMUNICATION ====================
  {
    id: "faq-130",
    category: "Email Communication",
    question: "How do I send an email to a candidate?",
    answer:
      "Open the candidate's profile and look for the 'Send Email' or communication section. You can write a new email, use a saved template, or reply to previous messages. All emails are automatically saved in the candidate's communication history so you have a complete record.",
    tags: ["email", "candidates", "communication"],
  },
  {
    id: "faq-131",
    category: "Email Communication",
    question: "What variables can I use in email templates?",
    answer:
      "Email templates support these variables: {{candidateName}} or [Candidate Name], {{jobTitle}} or [Job Title], {{companyName}} or [Company Name], {{interviewDate}} or [Interview Date], {{interviewTime}} or [Interview Time], {{interviewLocation}} or [Interview Location], {{recruiterName}} or [Recruiter Name]. The system automatically replaces these with actual values when sending.",
    tags: ["email", "templates", "variables"],
  },
  {
    id: "faq-132",
    category: "Email Communication",
    question: "How do I view email history with a candidate?",
    answer:
      "Open the candidate's profile and navigate to the communication or email history section. You'll see all emails sent to and received from the candidate, organized by thread. Each email shows the date, subject, sender, and full content. You can also view inbound emails (candidate replies) from the main emails page.",
    tags: ["email", "history", "communication", "tracking"],
  },
  {
    id: "faq-133",
    category: "Email Communication",
    question: "What is email threading?",
    answer:
      "Email threading groups related messages together into conversations, like how Gmail groups emails. When you view emails, you see the entire back-and-forth conversation history in one place. This makes it easy to follow communication without losing context or scrolling through separate messages.",
    tags: ["email", "threading", "conversations"],
  },
  {
    id: "faq-134",
    category: "Email Communication",
    question: "Can I save emails as drafts?",
    answer:
      "Yes! When composing an email to a candidate, you can save it as a draft instead of sending immediately. Go to the emails section, create or update a draft, and send it when ready. Drafts are saved and can be edited or deleted later.",
    tags: ["email", "drafts", "saving"],
  },

  // ==================== INTERVIEWS ====================
  {
    id: "faq-140",
    category: "Interviews",
    question: "How do I schedule an interview?",
    answer:
      "Go to Clients, click the client, click on a job, find the candidate in the pipeline, and click on their card. Look for 'Schedule Interview' button. Fill in details: interview date and time, type (video/phone/in-person), duration, interviewer, and location or meeting link. You can also create Zoom meetings directly from this form.",
    tags: ["interviews", "scheduling", "candidates"],
  },
  {
    id: "faq-141",
    category: "Interviews",
    question: "Can I create Zoom meetings for interviews?",
    answer:
      "Yes! When scheduling an interview, look for the 'Create Zoom Meeting' option. The system will generate a Zoom link and automatically include it in the interview invitation email sent to the candidate. This requires your Zoom integration to be configured in Settings.",
    tags: ["interviews", "zoom", "video", "meetings"],
  },
  {
    id: "faq-142",
    category: "Interviews",
    question: "How do I view upcoming interviews?",
    answer:
      "Go to the Interviews section from the sidebar. The system shows all scheduled interviews with filters for upcoming, today, this week, and past interviews. You can see interview details, candidate information, job title, interview type, date/time, and status.",
    tags: ["interviews", "upcoming", "schedule", "view"],
  },
  {
    id: "faq-143",
    category: "Interviews",
    question: "How do I add feedback after an interview?",
    answer:
      "After conducting an interview, go to the Interviews section, find the interview, and click 'Add Feedback'. You can rate the candidate, add detailed notes, mark strengths and concerns, and make a recommendation (hire, maybe, reject). This feedback is saved to the candidate's profile.",
    tags: ["interviews", "feedback", "evaluation", "notes"],
  },
  {
    id: "faq-144",
    category: "Interviews",
    question: "How do I cancel or reschedule an interview?",
    answer:
      "Find the interview in the Interviews section and click on it. You can either cancel it (which notifies the candidate) or edit the details to reschedule. When rescheduling, the candidate receives an updated invitation with the new date and time.",
    tags: ["interviews", "cancel", "reschedule", "edit"],
  },
  {
    id: "faq-145",
    category: "Interviews",
    question: "What interview types are supported?",
    answer:
      "The system supports three interview types: Video (Zoom, Teams, etc.), Phone (telephone interview), and In-Person (on-site interview). Select the appropriate type when scheduling, as it affects what information you need to provide (meeting link vs. physical location).",
    tags: ["interviews", "types", "video", "phone", "in-person"],
  },

  // ==================== PIPELINE MANAGEMENT ====================
  {
    id: "faq-150",
    category: "Pipeline Management",
    question: "How do I create a custom pipeline for a job?",
    answer:
      "When creating or editing a job, you can select or create a custom pipeline. Pipelines define the stages candidates go through (e.g., Screening, Interview, Assessment, Offer, Hired). You can create pipeline templates in Settings that can be reused across multiple jobs, or create job-specific pipelines.",
    tags: ["pipeline", "custom", "stages", "creation"],
  },
  {
    id: "faq-151",
    category: "Pipeline Management",
    question: "Can I reorder pipeline stages?",
    answer:
      "Yes! In the pipeline builder or pipeline editor, you can drag and drop stages to reorder them. The order affects how stages appear in the Kanban board. Typically, stages should flow from initial screening to final hiring steps.",
    tags: ["pipeline", "reorder", "stages", "organization"],
  },
  {
    id: "faq-152",
    category: "Pipeline Management",
    question: "What is a default pipeline?",
    answer:
      "A default pipeline is a template that automatically applies to new jobs if you don't select a specific pipeline. It includes standard stages like Applied, Screening, Interview, Assessment, Offer, Hired, and Rejected. You can view and modify the default pipeline in Settings.",
    tags: ["pipeline", "default", "template"],
  },
  {
    id: "faq-153",
    category: "Pipeline Management",
    question: "Can I delete a pipeline stage?",
    answer:
      "Yes, but be cautious. If you delete a stage that has candidates currently in it, those candidates will need to be moved to another stage first. The system will warn you if a stage contains candidates before allowing deletion.",
    tags: ["pipeline", "delete", "stages", "warning"],
  },
  {
    id: "faq-154",
    category: "Pipeline Management",
    question: "Can I edit stage names and colors?",
    answer:
      "Yes! Click the edit button on any stage in the pipeline view. You can change the stage name and select a different color. Colors help visually distinguish stages in the Kanban board. Changes apply to the pipeline and affect all jobs using that pipeline.",
    tags: ["pipeline", "edit", "stages", "colors", "customization"],
  },

  // ==================== REAL-TIME FEATURES ====================
  {
    id: "faq-160",
    category: "Real-time Features",
    question: "Why do I see changes without refreshing the page?",
    answer:
      "The system updates in real-time using Firestore technology. When anyone on your team makes a change (approves an application, moves a candidate, creates a job), everyone sees it instantly - no refresh needed. This prevents duplicate work and keeps everyone on the same page.",
    tags: ["realtime", "firestore", "synchronization", "updates"],
  },
  {
    id: "faq-161",
    category: "Real-time Features",
    question: "What is optimistic UI updating?",
    answer:
      "When you drag a candidate to a new stage, the screen updates immediately to feel fast and responsive - even before the server saves it. If something goes wrong (like a connection issue), the system automatically reverts the change and shows an error. This makes the app feel instant while keeping data safe.",
    tags: ["optimistic", "ui", "performance", "ux"],
  },
  {
    id: "faq-162",
    category: "Real-time Features",
    question: "Do multiple team members see the same data?",
    answer:
      "Yes! All team members see the same real-time data. If a recruiter approves an application, hiring managers see that candidate appear immediately. If someone schedules an interview, it shows up in everyone's interview list instantly. This is powered by Firestore's real-time listeners.",
    tags: ["realtime", "team", "collaboration", "synchronization"],
  },

  // ==================== USER ROLES & PERMISSIONS ====================
  {
    id: "faq-170",
    category: "Roles & Permissions",
    question: "What is the difference between Admin and Recruiter roles?",
    answer:
      "Admins have full access to everything including team management, settings, and system configuration. Recruiters can manage clients, jobs, applications, and candidates but cannot modify team members or critical system settings. Both can create jobs and manage the hiring process.",
    tags: ["roles", "permissions", "admin", "recruiter"],
  },
  {
    id: "faq-171",
    category: "Roles & Permissions",
    question: "What can a Hiring Manager do?",
    answer:
      "Hiring Managers can view and manage jobs and candidates, review applications for their specific jobs, schedule interviews, provide feedback, and move candidates through stages. They have limited access to client management and cannot modify system settings or manage team members.",
    tags: ["roles", "permissions", "hiring-manager"],
  },
  {
    id: "faq-172",
    category: "Roles & Permissions",
    question: "What is the Viewer role?",
    answer:
      "Viewers have read-only access. They can view jobs, candidates, applications, and reports but cannot make any changes. This role is useful for stakeholders who need visibility into hiring activities without the ability to modify data.",
    tags: ["roles", "permissions", "viewer", "read-only"],
  },
  {
    id: "faq-173",
    category: "Roles & Permissions",
    question: "Can I have custom permission levels?",
    answer:
      "The system has predefined roles (Admin, Recruiter, Hiring Manager, Viewer), but Admins can toggle specific permissions for individual users. For example, you could give a Hiring Manager permission to create jobs, which is normally a Recruiter privilege.",
    tags: ["roles", "permissions", "custom", "flexibility"],
  },

  // ==================== ANALYTICS & REPORTING ====================
  {
    id: "faq-180",
    category: "Analytics",
    question: "What analytics are shown on the Dashboard?",
    answer:
      "The Dashboard shows: total applications received, approval rate (what % you approve), applications over time chart (color-coded by source: direct apply, manual entry, email automation), status breakdown, recent activity log, and quick counts for jobs, candidates, and clients. Change the time range (7, 30, 90 days) to see different periods.",
    tags: ["analytics", "dashboard", "metrics", "reporting"],
  },
  {
    id: "faq-181",
    category: "Analytics",
    question: "Can I see which application source performs best?",
    answer:
      "Yes! The Dashboard chart shows applications color-coded by source: direct apply (candidates applying through your website), manual (team-added applications), and email automation (resumes from monitored emails). This helps you understand which channels bring in the most candidates.",
    tags: ["analytics", "sources", "tracking", "performance"],
  },
  {
    id: "faq-182",
    category: "Analytics",
    question: "How do I track team member productivity?",
    answer:
      "Go to the Team page to see activity summaries for each member. The Activities timeline (visible on Dashboard and throughout the app) shows who created jobs, approved applications, moved candidates, and scheduled interviews. Each activity is timestamped and attributed to the user who performed it.",
    tags: ["analytics", "team", "productivity", "tracking"],
  },
  {
    id: "faq-183",
    category: "Analytics",
    question: "Can I see candidate statistics?",
    answer:
      "Yes! The Candidates page shows total candidate counts. Individual job pages display candidate statistics including how many candidates are in each pipeline stage, approval rates, and time-in-stage metrics. You can also access candidate stats via the API endpoint for custom reporting.",
    tags: ["analytics", "candidates", "statistics", "metrics"],
  },

  // ==================== SEARCH & FILTERING ====================
  {
    id: "faq-190",
    category: "Search & Filtering",
    question: "How does the global search work?",
    answer:
      "Press Cmd+K (Mac) or Ctrl+K (Windows) from anywhere, or click 'Search' in the sidebar. Type your query to search across all resources: jobs, candidates, clients, applications, and team members. Results appear instantly and are organized by category. Click any result to navigate to that item.",
    tags: ["search", "global", "keyboard-shortcut"],
  },
  {
    id: "faq-191",
    category: "Search & Filtering",
    question: "Can I search by multiple criteria at once?",
    answer:
      "Each page (Jobs, Candidates, Applications) has its own search box and filters. You can combine text search with dropdown filters. For example, on the Candidates page, search for 'JavaScript' and filter by 'Interview' stage and a specific client to narrow results.",
    tags: ["search", "filters", "multiple", "criteria"],
  },
  {
    id: "faq-192",
    category: "Search & Filtering",
    question: "Are my recent searches saved?",
    answer:
      "Yes! The Help page and Search page remember your last 5 searches. These appear as quick-access buttons at the top of the search interface. Click any recent search to run it again, or clear them all if you want to start fresh.",
    tags: ["search", "history", "recent", "saved"],
  },

  // ==================== DATA MANAGEMENT ====================
  {
    id: "faq-200",
    category: "Data Management",
    question: "Where are uploaded files stored?",
    answer:
      "All resumes and documents are securely stored in Cloudinary (a cloud storage service). When you upload a resume, it's automatically saved to Cloudinary and only accessible to logged-in users with proper permissions. Your files are safe and backed up.",
    tags: ["files", "storage", "cloudinary", "resumes"],
  },
  {
    id: "faq-201",
    category: "Data Management",
    question: "What happens to data when I delete a candidate?",
    answer:
      "When you delete a candidate, their Firestore document is removed and their resume file is deleted from Cloudinary storage. Associated data like interview records and email history may be archived or deleted depending on system configuration. This action cannot be undone.",
    tags: ["data", "deletion", "candidates", "permanent"],
  },
  {
    id: "faq-202",
    category: "Data Management",
    question: "Is my data backed up?",
    answer:
      "Yes! Your data is automatically backed up. Firestore (the database) maintains backups and stores data across multiple data centers for safety. Cloudinary also backs up all uploaded files. Your data is protected, but it's still good practice to export important reports periodically for your own records.",
    tags: ["backup", "data", "firestore", "security"],
  },
  {
    id: "faq-203",
    category: "Data Management",
    question: "Can I export data to CSV or Excel?",
    answer:
      "Data export functionality for CSV/Excel is planned for future updates. Currently, you can view and copy data from tables. For bulk exports, contact support who can generate custom reports. The API also provides endpoints for programmatic data access.",
    tags: ["export", "csv", "excel", "data"],
  },

  // ==================== TROUBLESHOOTING (EXPANDED) ====================
  {
    id: "faq-210",
    category: "Troubleshooting",
    question: "The Kanban board is empty but I have candidates. Why?",
    answer:
      "Check these: 1) Ensure candidates are assigned to this specific job (check their jobIds field). 2) Verify the job has a pipeline assigned - if not, create one using Pipeline Builder. 3) Check if candidates have a currentPipelineStageId that matches a stage in the pipeline. 4) Try refreshing the page or checking browser console for errors.",
    tags: ["troubleshooting", "kanban", "pipeline", "candidates"],
  },
  {
    id: "faq-211",
    category: "Troubleshooting",
    question: "I see 'No data' on multiple pages. What should I do?",
    answer:
      "Try these steps: 1) Refresh the page (Cmd+R or Ctrl+R). 2) Log out and log back in. 3) Check if other team members see data (if yes, it's your connection). 4) Try a different browser or clear your browser cache. 5) Press F12 to open developer tools and look for red error messages in the Console tab - take a screenshot and send to support if you see errors.",
    tags: ["troubleshooting", "no-data", "firestore", "connection"],
  },
  {
    id: "faq-212",
    category: "Troubleshooting",
    question: "Resume upload fails or hangs. What's wrong?",
    answer:
      "Common fixes: 1) File too large - keep resumes under 10MB. Compress or recreate the PDF if needed. 2) Check your internet connection. 3) Only PDF and DOCX formats work - convert other formats first. 4) Try a different browser. 5) If it still fails, the file may be corrupted - ask the candidate for a new copy.",
    tags: ["troubleshooting", "upload", "resume", "files"],
  },
  {
    id: "faq-213",
    category: "Troubleshooting",
    question: "Email monitoring stopped working. How do I fix it?",
    answer:
      "Check: 1) Go to Settings > Email Monitoring and ensure the account is not paused (look for pause/play icon). 2) Verify 'Auto Process Resumes' toggle is ON. 3) Check IMAP credentials are still valid (email password may have changed). 4) Look for error messages next to the email account. 5) Check email quota limits. 6) Use Bulk Import to manually process pending emails.",
    tags: ["troubleshooting", "email", "monitoring", "automation"],
  },
  {
    id: "faq-214",
    category: "Troubleshooting",
    question: "Why can't I see the changes I just made?",
    answer:
      "Quick fixes: 1) Check your internet connection. 2) Hard refresh the page (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows). 3) Log out and log back in. 4) Clear your browser cache (Google how for your specific browser). 5) Try a different browser. If none of this works, contact support - there may be a server issue.",
    tags: ["troubleshooting", "realtime", "updates", "sync"],
  },
  {
    id: "faq-215",
    category: "Troubleshooting",
    question: "I get 'Permission Denied' errors. Why?",
    answer:
      "This means: 1) Your user role doesn't allow that action (Viewers can't edit, Hiring Managers have limited access). Ask your admin to adjust your permissions. 2) Your login session expired - log out and log back in. 3) You're trying to access another company's data. Check with your admin if you're unsure about your permissions.",
    tags: ["troubleshooting", "permissions", "access", "firestore-rules"],
  },

  // ==================== BEST PRACTICES ====================
  {
    id: "faq-220",
    category: "Best Practices",
    question: "How often should I review new applications?",
    answer:
      "Review applications at least once daily during active hiring. Responding within 24-48 hours significantly improves candidate experience and acceptance rates. Turn on email notifications in Settings so you're alerted immediately when new applications arrive.",
    tags: ["best-practices", "applications", "workflow"],
  },
  {
    id: "faq-221",
    category: "Best Practices",
    question: "Should I use tags for candidates?",
    answer:
      "Absolutely! Tags save massive amounts of time. Create tags for: Technical Skills (JavaScript, Python, AWS), Experience Level (Junior, Mid, Senior), Work Preferences (Remote, Hybrid, Willing to Relocate), and Specialties (Frontend, Backend, Full-Stack). Spend 10 seconds tagging as you review - save hours when searching later.",
    tags: ["best-practices", "tags", "organization"],
  },
  {
    id: "faq-222",
    category: "Best Practices",
    question: "What's the best way to organize jobs?",
    answer:
      "Use clear, specific job titles (like 'Senior React Developer - Remote' not just 'Developer'). Add detailed descriptions and requirements. Set realistic pipeline stages. Close jobs when filled - don't leave old jobs as 'Active' because it confuses tracking and analytics.",
    tags: ["best-practices", "jobs", "organization"],
  },
  {
    id: "faq-223",
    category: "Best Practices",
    question: "How should I use client notes?",
    answer:
      "Record important details: preferred communication methods, hiring preferences, feedback from past placements, interview style, decision timeline, and any quirks or requirements. This information helps you and your team provide better service and avoid repeating questions.",
    tags: ["best-practices", "clients", "notes"],
  },
  {
    id: "faq-224",
    category: "Best Practices",
    question: "What's the most efficient workflow for my team?",
    answer:
      "1) Assign applications to specific reviewers to avoid duplicate work. 2) Use tags and notes consistently. 3) Move candidates through stages promptly - don't leave them stuck. 4) Review the Dashboard weekly to spot bottlenecks. 5) Use email templates to save time on common communications. 6) Close or archive old jobs regularly. 7) Leverage bulk operations for efficiency.",
    tags: ["best-practices", "workflow", "efficiency", "team"],
  },
];

export default function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedFAQs, setExpandedFAQs] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("help-recent-searches");
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Ignore parse errors
      }
    }
  }, []);

  // Save search to recent searches
  useEffect(() => {
    if (searchQuery.trim() && searchQuery.length > 2) {
      const timer = setTimeout(() => {
        setRecentSearches((prev) => {
          const updated = [
            searchQuery,
            ...prev.filter((s) => s !== searchQuery),
          ].slice(0, 5);
          localStorage.setItem("help-recent-searches", JSON.stringify(updated));
          return updated;
        });
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [searchQuery]);

  const categories = useMemo(
    () => ["all", ...Array.from(new Set(faqData.map((faq) => faq.category)))],
    []
  );

  const filteredFAQs = useMemo(() => {
    return faqData.filter((faq) => {
      const matchesSearch =
        searchQuery === "" ||
        faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
        faq.tags.some((tag) =>
          tag.toLowerCase().includes(searchQuery.toLowerCase())
        );

      const matchesCategory =
        selectedCategory === "all" || faq.category === selectedCategory;

      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, selectedCategory]);

  const getCategoryCount = (category: string) => {
    if (category === "all") return faqData.length;
    return faqData.filter((faq) => faq.category === category).length;
  };

  const toggleFAQ = (id: string) => {
    setExpandedFAQs((prev) =>
      prev.includes(id) ? prev.filter((faqId) => faqId !== id) : [...prev, id]
    );
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "Getting Started":
        return <BookOpen className="h-4 w-4" />;
      case "Candidates":
        return <Users className="h-4 w-4" />;
      case "Clients":
        return <Briefcase className="h-4 w-4" />;
      case "Team & Permissions":
        return <Shield className="h-4 w-4" />;
      case "Communication":
        return <MessageCircle className="h-4 w-4" />;
      case "Dashboard":
        return <FileText className="h-4 w-4" />;
      case "Search":
        return <Search className="h-4 w-4" />;
      case "Notifications":
        return <Mail className="h-4 w-4" />;
      case "Common Tasks":
        return <FileText className="h-4 w-4" />;
      case "Troubleshooting":
        return <HelpCircle className="h-4 w-4" />;
      case "Best Practices":
        return <BookOpen className="h-4 w-4" />;
      case "Settings":
        return <Shield className="h-4 w-4" />;
      case "Applications":
        return <FileText className="h-4 w-4" />;
      case "Jobs":
        return <Briefcase className="h-4 w-4" />;
      case "Team":
        return <Users className="h-4 w-4" />;
      case "Security":
        return <Shield className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-3 py-3 md:gap-4 md:py-4">
          <div className="px-3 lg:px-4">
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                <div className="rounded-lg bg-primary/10 p-1.5 md:p-2 shrink-0">
                  <HelpCircle className="h-4 w-4 md:h-6 md:w-6 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg md:text-2xl font-bold text-foreground">
                    Help Center
                  </h2>
                  <p className="text-xs md:text-sm text-muted-foreground">
                    Find answers to common questions and get support
                  </p>
                </div>
              </div>

              <div className="relative max-w-2xl mb-4 md:mb-6">
                <Search className="absolute left-3 md:left-4 top-1/2 transform -translate-y-1/2 h-4 w-4 md:h-5 md:w-5 text-muted-foreground" />
                <Input
                  placeholder="Search for help..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 md:pl-12 pr-16 md:pr-24 h-10 md:h-12 text-sm md:text-base"
                />
                {searchQuery && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute right-1 md:right-2 top-1/2 transform -translate-y-1/2 h-8 md:h-9 text-xs md:text-sm"
                    onClick={() => setSearchQuery("")}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>

            {/* Recent Searches */}
            {recentSearches.length > 0 && searchQuery === "" && (
              <Card className="mb-4 md:mb-6 bg-accent/50">
                <CardHeader className="p-3 md:p-6">
                  <div className="flex items-center gap-1.5 md:gap-2">
                    <Clock className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                    <CardTitle className="text-sm md:text-lg">
                      Recent Searches
                    </CardTitle>
                  </div>
                </CardHeader>
                <CardContent className="p-3 md:p-6 pt-0">
                  <div className="flex flex-wrap gap-1.5 md:gap-2">
                    {recentSearches.map((search, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        size="sm"
                        onClick={() => setSearchQuery(search)}
                        className="gap-1.5 md:gap-2 h-7 md:h-8 text-xs md:text-sm"
                      >
                        <Search className="h-2.5 w-2.5 md:h-3 md:w-3" />
                        {search}
                      </Button>
                    ))}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setRecentSearches([]);
                        localStorage.removeItem("help-recent-searches");
                        toast.success("Recent searches cleared");
                      }}
                      className="text-muted-foreground h-7 md:h-8 text-xs md:text-sm"
                    >
                      Clear
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            <div className="flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 flex-wrap">
              <span className="text-xs md:text-sm font-medium text-muted-foreground">
                Category:
              </span>
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={
                    selectedCategory === category ? "primary" : "outline"
                  }
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`gap-1 md:gap-2 transition-colors h-7 md:h-8 text-xs md:text-sm ${
                    selectedCategory === category
                      ? "bg-primary text-primary-foreground hover:bg-primary/90"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}
                >
                  {category !== "all" && getCategoryIcon(category)}
                  <span className="hidden sm:inline">
                    {category === "all" ? "All" : category}
                  </span>
                  <span className="sm:hidden">
                    {category === "all" ? "All" : category.split(" ")[0]}
                  </span>
                  <Badge
                    variant={
                      selectedCategory === category ? "secondary" : "outline"
                    }
                    className="ml-0.5 md:ml-1 text-[10px] md:text-xs"
                  >
                    {getCategoryCount(category)}
                  </Badge>
                </Button>
              ))}
            </div>

            <Card>
              <CardHeader className="p-3 md:p-6">
                <div className="flex items-start md:items-center justify-between gap-2 flex-col md:flex-row">
                  <div>
                    <CardTitle className="text-base md:text-lg">
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription className="text-xs md:text-sm">
                      {filteredFAQs.length} question
                      {filteredFAQs.length !== 1 ? "s" : ""} found
                    </CardDescription>
                  </div>
                  {filteredFAQs.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        if (expandedFAQs.length === filteredFAQs.length) {
                          setExpandedFAQs([]);
                        } else {
                          setExpandedFAQs(filteredFAQs.map((faq) => faq.id));
                        }
                      }}
                      className="w-full md:w-auto h-8 md:h-9 text-xs md:text-sm"
                    >
                      {expandedFAQs.length === filteredFAQs.length
                        ? "Collapse All"
                        : "Expand All"}
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-2 p-3 md:p-6 pt-0">
                {filteredFAQs.length === 0 ? (
                  <div className="py-8 md:py-12 text-center text-muted-foreground">
                    <HelpCircle className="h-10 w-10 md:h-12 md:w-12 mx-auto mb-2 md:mb-3 opacity-50" />
                    <p className="text-xs md:text-sm px-4">
                      No FAQs found matching your search
                    </p>
                  </div>
                ) : (
                  filteredFAQs.map((faq, index) => (
                    <div key={faq.id}>
                      <div
                        className={`p-3 md:p-4 rounded-lg hover:bg-accent cursor-pointer transition-all group ${
                          expandedFAQs.includes(faq.id)
                            ? "bg-accent/50 border-2 border-primary/30"
                            : "border-2 border-transparent"
                        }`}
                        onClick={() => toggleFAQ(faq.id)}
                      >
                        <div className="flex items-start justify-between gap-2 md:gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 md:gap-2 mb-1.5 md:mb-2">
                              {getCategoryIcon(faq.category)}
                              <Badge
                                variant="secondary"
                                className="text-[10px] md:text-xs"
                              >
                                {faq.category}
                              </Badge>
                            </div>
                            <h4 className="font-semibold text-foreground mb-1.5 md:mb-2 group-hover:text-primary transition-colors text-sm md:text-base">
                              {faq.question}
                            </h4>
                            {expandedFAQs.includes(faq.id) && (
                              <>
                                <Separator className="my-2 md:my-3" />
                                <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3 leading-relaxed">
                                  {faq.answer}
                                </p>
                                <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                                  {faq.tags.map((tag) => (
                                    <Badge
                                      key={tag}
                                      variant="outline"
                                      className="text-[10px] md:text-xs cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setSearchQuery(tag);
                                      }}
                                    >
                                      #{tag}
                                    </Badge>
                                  ))}
                                </div>
                              </>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`h-7 w-7 md:h-8 md:w-8 p-0 shrink-0 ${
                              expandedFAQs.includes(faq.id)
                                ? "bg-primary text-primary-foreground"
                                : ""
                            }`}
                          >
                            {expandedFAQs.includes(faq.id) ? (
                              <ChevronUp className="h-3 w-3 md:h-4 md:w-4" />
                            ) : (
                              <ChevronDown className="h-3 w-3 md:h-4 md:w-4" />
                            )}
                          </Button>
                        </div>
                      </div>
                      {index < filteredFAQs.length - 1 && (
                        <Separator className="my-1.5 md:my-2" />
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            <Card className="mt-4 md:mt-6 bg-primary/5 border-primary/20">
              <CardContent className="pt-4 md:pt-6 p-3 md:p-6">
                <div className="flex items-start gap-2 md:gap-3">
                  <div className="rounded-lg bg-primary p-1.5 md:p-2 shrink-0">
                    <Mail className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground mb-1 text-sm md:text-lg">
                      Need Technical Support?
                    </p>
                    <p className="text-xs md:text-sm text-muted-foreground mb-2 md:mb-3">
                      Contact the developer for assistance, bug reports, or
                      feature requests.
                    </p>
                    <div className="space-y-1.5 md:space-y-2 mb-3 md:mb-4">
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-foreground p-1.5 md:p-2 rounded-lg">
                        <Mail className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                        <a
                          href="mailto:mislam.tauhidul@gmail.com"
                          className="hover:underline font-medium hover:text-primary break-all"
                        >
                          mislam.tauhidul@gmail.com
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5 md:gap-2 text-xs md:text-sm text-foreground p-1.5 md:p-2 rounded-lg">
                        <Mail className="h-3 w-3 md:h-4 md:w-4 text-primary shrink-0" />
                        <a
                          href="mailto:mislam@aristagroups.com"
                          className="hover:underline font-medium hover:text-primary break-all"
                        >
                          mislam@aristagroups.com
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
