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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { authenticatedFetch } from "@/lib/authenticated-fetch";
import { API_BASE_URL } from "@/config/api";
import {
  ArrowLeft,
  CheckCircle2,
  Eye,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Experience {
  company: string;
  title: string;
  duration: string;
  description?: string;
}

interface Education {
  institution: string;
  degree: string;
  field?: string;
  year?: string;
}

interface ParsedCandidate {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  location: string;
  currentTitle: string;
  currentCompany: string;
  yearsOfExperience: number;
  educationLevel: string;
  skills: string[];
  summary: string;
  linkedinUrl: string;
  website?: string;
  experience: Experience[];
  education: Education[];
  certifications: string[];
  languages: string[];
  resumeUrl?: string;
  extractedText?: string; // Full raw text from resume
  aiValidation?: {
    isValid: boolean;
    matchScore: number;
    summary: string;
  };
}

export default function QuickImportPage() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [parsedData, setParsedData] = useState<ParsedCandidate | null>(null);
  const [formData, setFormData] = useState<ParsedCandidate>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    currentTitle: "",
    currentCompany: "",
    yearsOfExperience: 0,
    educationLevel: "",
    skills: [],
    summary: "",
    linkedinUrl: "",
    website: "",
    resumeUrl: "",
    extractedText: "", // Full raw text
    experience: [],
    education: [],
    certifications: [],
    languages: [],
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      setSelectedFile(file);
      setParsedData(null);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        return;
      }
      setSelectedFile(file);
      setParsedData(null);
    }
  };

  const handleUploadAndParse = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setIsUploading(true);
    setIsParsing(true);

    try {
      // Create FormData for file upload
      const formData = new FormData();
      formData.append("resume", selectedFile); // Backend expects 'resume' field name
      // Don't send extractSkills, extractEducation, extractExperience - they default to true

      // Call backend API to parse resume
      const response = await authenticatedFetch(
        `${API_BASE_URL}/resumes/parse`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to parse resume" }));
        throw new Error(error.message || "Failed to parse resume");
      }

      const result = await response.json();
      const data = result.data;

      // Map backend response to frontend format
      const mappedData: ParsedCandidate = {
        firstName: data.personalInfo?.firstName || "",
        lastName: data.personalInfo?.lastName || "",
        email: data.personalInfo?.email || "",
        phone: data.personalInfo?.phone || "",
        location: data.personalInfo?.location || "",
        linkedinUrl: data.personalInfo?.linkedin || "",
        website: data.personalInfo?.website || "",
        currentTitle: data.experience?.[0]?.title || "",
        currentCompany: data.experience?.[0]?.company || "",
        yearsOfExperience: data.experience?.length || 0,
        educationLevel: data.education?.[0]?.degree || "",
        skills: Array.isArray(data.skills) ? data.skills : [],
        summary: data.summary || "",
        experience: Array.isArray(data.experience) ? data.experience : [],
        education: Array.isArray(data.education) ? data.education : [],
        certifications: Array.isArray(data.certifications)
          ? data.certifications
          : [],
        languages: Array.isArray(data.languages) ? data.languages : [],
        resumeUrl: URL.createObjectURL(selectedFile),
        extractedText: data.extractedText || "", // Full raw text for validation
        aiValidation: data.aiValidation,
      };

      setIsUploading(false);
      setParsedData(mappedData);
      setFormData(mappedData);
      setIsParsing(false);
      toast.success(
        "Resume parsed successfully! Review the extracted information below."
      );
    } catch (error) {
      setIsUploading(false);
      setIsParsing(false);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to parse resume. Please try again.";
      toast.error(message);
    }
  };

  const handleSubmit = async () => {
    if (!formData.firstName || !formData.lastName || !formData.email) {
      toast.error(
        "Please fill in all required fields (First Name, Last Name, Email)"
      );
      return;
    }

    if (!selectedFile) {
      toast.error("Please upload a resume");
      return;
    }

    // Show loading toast
    const loadingToast = toast.loading("Importing application...");

    try {
      setIsUploading(true);

      // Step 1: Upload resume to Cloudinary
      toast.loading("Uploading resume...", { id: loadingToast });

      const uploadFormData = new FormData();
      uploadFormData.append("resume", selectedFile);

      const uploadResponse = await authenticatedFetch(
        `${API_BASE_URL}/resumes/upload`,
        {
          method: "POST",
          body: uploadFormData,
        }
      );

      if (!uploadResponse.ok) {
        const error = await uploadResponse
          .json()
          .catch(() => ({ message: "Failed to upload resume" }));
        throw new Error(error.message || "Failed to upload resume");
      }

      const uploadResult = await uploadResponse.json();
      const resumeUrl = uploadResult.data.url;

      // Step 2: Create Application (not Candidate yet - that happens on approval)
      toast.loading("Creating application...", { id: loadingToast });

      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
        resumeUrl: resumeUrl,
        resumeOriginalName: selectedFile.name,
        resumeRawText: parsedData?.extractedText || "", // Full raw text for AI validation
        source: "manual",
        status: "pending",
        parsedData: {
          summary: formData.summary || "",
          skills: formData.skills || [],
          experience: formData.experience || [],
          education: formData.education || [],
          certifications: formData.certifications || [],
          languages: formData.languages || [],
        },
        // jobId and clientId are optional at this stage
        // They will be assigned when recruiter approves the application
      };

      const response = await authenticatedFetch(
        `${API_BASE_URL}/applications`,
        {
          method: "POST",
          body: JSON.stringify(applicationData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to create application");
      }

      await response.json();
      setIsUploading(false);

      // Dismiss loading and show success
      toast.dismiss(loadingToast);
      toast.success(
        "Application created successfully! It will be reviewed and moved to candidates upon approval.",
        {
          duration: 3000,
        }
      );

      // Navigate to candidates list
      setTimeout(() => {
        navigate("/dashboard/candidates");
      }, 1500);
    } catch (error) {
      setIsUploading(false);

      // Dismiss loading and show error
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : "Failed to create application";
      toast.error(message);
    }
  };

  const addSkill = (skill: string) => {
    if (skill.trim() && !formData.skills.includes(skill.trim())) {
      setFormData({ ...formData, skills: [...formData.skills, skill.trim()] });
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter((s) => s !== skillToRemove),
    });
  };

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="@container/main flex flex-1 flex-col gap-2 overflow-hidden">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6 overflow-y-auto">
          <div className="px-4 lg:px-6 max-w-[1600px] mx-auto w-full">
            {/* Header */}
            <div className="mb-4 md:mb-8 hidden md:block">
              <div className="flex items-center gap-4 mb-6">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/dashboard/candidates")}
                  className="hover:bg-primary/10"
                >
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div className="flex-1">
                  <h2 className="text-2xl md:text-3xl font-bold text-foreground">
                    Quick Import Candidate
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground mt-1">
                    Upload a resume and our AI will automatically extract
                    candidate information
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile Back Button */}
            <div className="mb-4 md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard/candidates")}
                className="hover:bg-primary/10"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left Column - Upload Section */}
              <div className="space-y-5">
                <Card className="border-primary/20">
                  <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                    <CardTitle className="flex items-center gap-2">
                      <Upload className="h-5 w-5 text-primary" />
                      Upload Resume
                    </CardTitle>
                    <CardDescription>
                      Upload a PDF or Word document (max 5MB) to automatically
                      extract candidate information
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div
                      onDragOver={handleDragOver}
                      onDrop={handleDrop}
                      className={`border-2 border-dashed rounded-xl p-10 transition-all duration-200 ${
                        selectedFile
                          ? "border-primary bg-linear-to-b from-primary/10 to-primary/5"
                          : "border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50"
                      }`}
                    >
                      {selectedFile ? (
                        <div className="text-center">
                          <div className="relative inline-block">
                            <FileText className="h-24 w-24 text-primary mx-auto mb-4" />
                            <CheckCircle2 className="h-8 w-8 text-primary absolute -top-2 -right-2 bg-background rounded-full" />
                          </div>
                          <p className="font-bold text-foreground text-lg mb-1">
                            {selectedFile.name}
                          </p>
                          <p className="text-sm text-muted-foreground mb-2">
                            {(selectedFile.size / 1024).toFixed(2)} KB
                          </p>
                          <Badge variant="secondary" className="mb-4">
                            {selectedFile.type.includes("pdf")
                              ? "PDF Document"
                              : "Word Document"}
                          </Badge>
                          <div className="flex gap-2 justify-center mt-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedFile(null);
                                setParsedData(null);
                              }}
                              className="hover:bg-destructive hover:text-destructive-foreground"
                            >
                              <X className="h-4 w-4 mr-2" />
                              Remove
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-center">
                          <Upload className="h-24 w-24 text-muted-foreground mx-auto mb-6 opacity-60" />
                          <p className="font-bold text-foreground text-lg mb-6">
                            Drag & drop your resume here
                          </p>
                          <div className="flex justify-center mb-6">
                            <Label htmlFor="resume-upload">
                              <Button
                                variant="primary"
                                size="lg"
                                asChild
                                className="cursor-pointer"
                              >
                                <span>
                                  <Upload className="h-4 w-4 mr-2" />
                                  Browse Files
                                </span>
                              </Button>
                            </Label>
                          </div>
                          <Input
                            id="resume-upload"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            className="hidden"
                            onChange={handleFileSelect}
                          />
                          <p className="text-xs text-muted-foreground">
                            Supported: <strong>PDF, DOC, DOCX</strong> • Max
                            size: <strong>5MB</strong>
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedFile && !parsedData && (
                      <Button
                        onClick={handleUploadAndParse}
                        disabled={isUploading || isParsing}
                        className="w-full mt-6 h-12"
                        size="lg"
                      >
                        {isParsing ? (
                          <>
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                            <Sparkles className="h-4 w-4 mr-2 animate-pulse" />
                            Parsing with AI...
                          </>
                        ) : (
                          <>
                            <Sparkles className="h-4 w-4 mr-2" />
                            Parse Resume with AI
                          </>
                        )}
                      </Button>
                    )}
                  </CardContent>
                </Card>

                {parsedData && (
                  <>
                    <Card className="border-accent/50 bg-linear-to-br from-accent/10 to-accent/5">
                      <CardContent className="pt-6">
                        <div className="flex items-start gap-3">
                          <div className="rounded-full bg-accent/20 p-2">
                            <CheckCircle2 className="h-6 w-6 text-accent" />
                          </div>
                          <div className="flex-1">
                            <p className="font-bold text-accent-foreground text-lg mb-1">
                              Resume Parsed Successfully!
                            </p>
                            <p className="text-sm text-accent-foreground/80 mb-4">
                              We've extracted{" "}
                              <strong>{formData.skills.length} skills</strong>,{" "}
                              <strong>
                                {formData.experience.length} work experiences
                              </strong>
                              , and{" "}
                              <strong>
                                {formData.education.length} education records
                              </strong>{" "}
                              using AI. Review and edit the details before
                              importing.
                            </p>
                            {formData.resumeUrl && (
                              <div className="flex gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="bg-background hover:bg-background/80"
                                  onClick={() =>
                                    window.open(formData.resumeUrl, "_blank")
                                  }
                                >
                                  <Eye className="h-4 w-4 mr-2" />
                                  Preview Resume
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Validation Results */}
                    {formData.aiValidation && (
                      <Card
                        className={`border-2 ${
                          formData.aiValidation.isValid
                            ? "border-green-500/50 bg-linear-to-br from-green-50 to-green-100/50 dark:from-green-950/20 dark:to-green-900/10"
                            : "border-orange-500/50 bg-linear-to-br from-orange-50 to-orange-100/50 dark:from-orange-950/20 dark:to-orange-900/10"
                        }`}
                      >
                        <CardContent className="pt-6">
                          <div className="flex items-start gap-3">
                            <div
                              className={`rounded-full p-2 ${
                                formData.aiValidation.isValid
                                  ? "bg-green-500/20"
                                  : "bg-orange-500/20"
                              }`}
                            >
                              <Sparkles
                                className={`h-6 w-6 ${
                                  formData.aiValidation.isValid
                                    ? "text-green-600 dark:text-green-400"
                                    : "text-orange-600 dark:text-orange-400"
                                }`}
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <p className="font-bold text-lg">
                                  AI Validation
                                </p>
                                <Badge
                                  variant={
                                    formData.aiValidation.isValid
                                      ? "success"
                                      : "secondary"
                                  }
                                  className={
                                    formData.aiValidation.isValid
                                      ? "bg-green-500 hover:bg-green-600"
                                      : "bg-orange-500 hover:bg-orange-600"
                                  }
                                >
                                  {formData.aiValidation.isValid
                                    ? "Valid"
                                    : "Needs Review"}
                                </Badge>
                                <Badge variant="outline" className="ml-2">
                                  Score: {formData.aiValidation.matchScore}/100
                                </Badge>
                              </div>
                              <p className="text-sm mb-3">
                                {formData.aiValidation.summary}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                )}

                {/* AI Info Card */}
                {!parsedData && (
                  <Card className="bg-linear-to-br from-primary/5 to-primary/10 border-primary/20">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-primary" />
                        AI-Powered Extraction
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>
                            Automatically extracts contact information
                          </span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>Identifies skills and technologies</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>Parses work experience and education</span>
                        </li>
                        <li className="flex items-start gap-2">
                          <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                          <span>Generates professional summary</span>
                        </li>
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Right Column - Form Section */}
              <Card className="border-primary/20 min-w-0">
                <CardHeader className="bg-linear-to-r from-primary/5 to-transparent">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Candidate Information
                  </CardTitle>
                  <CardDescription>
                    {parsedData
                      ? "Review and edit the extracted information before importing"
                      : "Upload a resume to see extracted candidate information"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 overflow-hidden">
                  {parsedData ? (
                    <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100">
                      {/* Personal Information */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground mb-4 flex items-center gap-2 pb-2 border-b">
                          Personal Information
                          <span className="text-xs text-red-500 font-normal">
                            (* required)
                          </span>
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="firstName"
                                className="text-sm font-medium"
                              >
                                First Name{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="firstName"
                                value={formData.firstName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    firstName: e.target.value,
                                  })
                                }
                                placeholder="First name"
                                className="mt-1.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="lastName"
                                className="text-sm font-medium"
                              >
                                Last Name{" "}
                                <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="lastName"
                                value={formData.lastName}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    lastName: e.target.value,
                                  })
                                }
                                placeholder="Last name"
                                className="mt-1.5"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="email"
                                className="text-sm font-medium"
                              >
                                Email <span className="text-red-500">*</span>
                              </Label>
                              <Input
                                id="email"
                                type="email"
                                value={formData.email}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    email: e.target.value,
                                  })
                                }
                                placeholder="email@example.com"
                                className="mt-1.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="phone"
                                className="text-sm font-medium"
                              >
                                Phone
                              </Label>
                              <Input
                                id="phone"
                                value={formData.phone}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    phone: e.target.value,
                                  })
                                }
                                placeholder="+1 (555) 123-4567"
                                className="mt-1.5"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="location"
                              className="text-sm font-medium"
                            >
                              Location
                            </Label>
                            <Input
                              id="location"
                              value={formData.location}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  location: e.target.value,
                                })
                              }
                              placeholder="City, State"
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Skills */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground mb-4 pb-2 border-b">
                          Skills
                        </h4>
                        <div className="flex flex-wrap gap-2 mb-3">
                          {formData.skills.map((skill, index) => (
                            <Badge
                              key={index}
                              variant="secondary"
                              className="pl-3 pr-1 py-1 text-sm"
                            >
                              {skill}
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-4 w-4 ml-2 hover:bg-transparent"
                                onClick={() => removeSkill(skill)}
                              >
                                <X className="h-3 w-3" />
                              </Button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Input
                            id="new-skill"
                            placeholder="Add a skill and press Enter"
                            onKeyPress={(e) => {
                              if (e.key === "Enter") {
                                addSkill(e.currentTarget.value);
                                e.currentTarget.value = "";
                              }
                            }}
                          />
                        </div>
                      </div>

                      {/* Additional Information */}
                      <div className="space-y-4">
                        <h4 className="text-sm font-bold text-foreground mb-4 pb-2 border-b">
                          Additional Information
                        </h4>
                        <div className="space-y-4">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label
                                htmlFor="linkedin"
                                className="text-sm font-medium"
                              >
                                LinkedIn URL
                              </Label>
                              <Input
                                id="linkedin"
                                value={formData.linkedinUrl}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    linkedinUrl: e.target.value,
                                  })
                                }
                                placeholder="https://linkedin.com/in/username"
                                className="mt-1.5"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label
                                htmlFor="website"
                                className="text-sm font-medium"
                              >
                                Personal Website
                              </Label>
                              <Input
                                id="website"
                                value={formData.website || ""}
                                onChange={(e) =>
                                  setFormData({
                                    ...formData,
                                    website: e.target.value,
                                  })
                                }
                                placeholder="https://yourwebsite.com"
                                className="mt-1.5"
                              />
                            </div>
                          </div>

                          <div className="space-y-2">
                            <Label
                              htmlFor="summary"
                              className="text-sm font-medium"
                            >
                              Professional Summary
                            </Label>
                            <Textarea
                              id="summary"
                              value={formData.summary}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  summary: e.target.value,
                                })
                              }
                              placeholder="Brief professional summary"
                              rows={5}
                              className="mt-1.5"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Work Experience */}
                      {formData.experience &&
                        formData.experience.length > 0 && (
                          <div>
                            <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">
                              Work Experience
                            </h4>
                            <div className="space-y-2 md:space-y-3">
                              {formData.experience.map((exp, index) => (
                                <div
                                  key={index}
                                  className="p-2.5 md:p-3 border rounded-lg bg-muted/20"
                                >
                                  <div className="font-semibold text-xs md:text-sm">
                                    {exp.title}
                                  </div>
                                  <div className="text-xs md:text-sm text-muted-foreground">
                                    {exp.company}
                                  </div>
                                  <div className="text-[10px] md:text-xs text-muted-foreground">
                                    {exp.duration}
                                  </div>
                                  {exp.description && (
                                    <div className="text-[10px] md:text-xs mt-1.5 md:mt-2 text-muted-foreground">
                                      {exp.description}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Education */}
                      {formData.education && formData.education.length > 0 && (
                        <div>
                          <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">
                            Education
                          </h4>
                          <div className="space-y-2 md:space-y-3">
                            {formData.education.map((edu, index) => (
                              <div
                                key={index}
                                className="p-2.5 md:p-3 border rounded-lg bg-muted/20"
                              >
                                <div className="font-semibold text-xs md:text-sm">
                                  {edu.degree}
                                </div>
                                <div className="text-xs md:text-sm text-muted-foreground">
                                  {edu.institution}
                                </div>
                                {edu.field && (
                                  <div className="text-[10px] md:text-xs text-muted-foreground">
                                    Field: {edu.field}
                                  </div>
                                )}
                                {edu.year && (
                                  <div className="text-[10px] md:text-xs text-muted-foreground">
                                    Year: {edu.year}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Certifications */}
                      {formData.certifications &&
                        formData.certifications.length > 0 && (
                          <div className="w-full overflow-hidden">
                            <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">
                              Certifications
                            </h4>
                            <div className="flex flex-wrap gap-1.5 md:gap-2">
                              {formData.certifications.map((cert, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="text-xs md:text-sm max-w-full wrap-break-word"
                                >
                                  <span className="line-clamp-2" title={cert}>
                                    {cert}
                                  </span>
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                      {/* Languages */}
                      {formData.languages && formData.languages.length > 0 && (
                        <div className="w-full overflow-hidden">
                          <h4 className="text-xs md:text-sm font-semibold text-foreground mb-2 md:mb-3">
                            Languages
                          </h4>
                          <div className="flex flex-wrap gap-1.5 md:gap-2">
                            {formData.languages.map((lang, index) => (
                              <Badge
                                key={index}
                                variant="outline"
                                className="text-xs md:text-sm max-w-full wrap-break-word"
                              >
                                <span className="line-clamp-1" title={lang}>
                                  {lang}
                                </span>
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-96 border-2 border-dashed rounded-lg">
                      <div className="text-center text-muted-foreground">
                        <FileText className="h-20 w-20 mx-auto mb-4 opacity-50" />
                        <p className="font-semibold text-lg mb-2">
                          No Resume Uploaded
                        </p>
                        <p className="text-sm">
                          Upload a resume on the left to see extracted
                          information here
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Footer Actions */}
            {parsedData && (
              <div className="flex justify-end gap-3 mt-6 p-4 border-t bg-muted/30 rounded-lg">
                <Button
                  variant="outline"
                  onClick={() => navigate("/dashboard/candidates")}
                >
                  Cancel
                </Button>
                <Button onClick={handleSubmit} size="lg">
                  <CheckCircle2 className="h-4 w-4 mr-2" />
                  Import Candidate
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
