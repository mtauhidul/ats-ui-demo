import { BackgroundRippleEffect } from "@/components/ui/background-ripple-effect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";
import { API_BASE_URL } from "@/config/api";
import { useJob } from "@/hooks/firestore";

interface Experience {
  title: string;
  company: string;
  startDate: string;
  endDate: string;
  description: string;
}

interface Education {
  degree: string;
  institution: string;
  graduationDate: string;
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
  resumeUrl?: string;
  extractedText?: string;
  experience?: Experience[];
  education?: Education[];
  certifications?: string[];
  languages?: string[];
}

export default function PublicApplyPage() {
  const navigate = useNavigate();
  const { jobId } = useParams<{ jobId: string }>();
  
  // 🔥 REALTIME: Direct Firestore subscription for job data
  const { job, loading: loadingJob } = useJob(jobId!);
  
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isUploadingVideo, setIsUploadingVideo] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [videoLink, setVideoLink] = useState<string>("");
  const [videoInputMethod, setVideoInputMethod] = useState<"upload" | "link">("upload");
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
    extractedText: "",
    experience: [],
    education: [],
    certifications: [],
    languages: [],
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Check for video files first
      const videoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/x-matroska",
      ];
      if (
        videoTypes.includes(file.type) ||
        /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)
      ) {
        toast.error(
          "Video files should be uploaded in the 'Video Introduction' section below, not here"
        );
        e.target.value = ""; // Clear the input
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        e.target.value = ""; // Clear the input
        return;
      }
      const validTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error("Please upload a PDF or Word document");
        e.target.value = ""; // Clear the input
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
      // Check for video files first
      const videoTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/x-matroska",
      ];
      if (
        videoTypes.includes(file.type) ||
        /\.(mp4|mov|avi|webm|mkv)$/i.test(file.name)
      ) {
        toast.error(
          "Video files should be uploaded in the 'Video Introduction' section below, not here"
        );
        return;
      }

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

  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file size (max 100MB)
      if (file.size > 100 * 1024 * 1024) {
        toast.error("Video size must be less than 100MB");
        return;
      }
      const validTypes = [
        "video/mp4",
        "video/quicktime",
        "video/x-msvideo",
        "video/webm",
        "video/x-matroska",
      ];
      if (!validTypes.includes(file.type)) {
        toast.error(
          "Please upload a valid video file (MP4, MOV, AVI, WEBM, MKV)"
        );
        return;
      }
      setSelectedVideo(file);
      // Clear any previously uploaded video URL
      setVideoUrl("");
    }
  };

  const handleUploadVideo = async () => {
    if (!selectedVideo) {
      toast.error("Please select a video first");
      return;
    }

    setIsUploadingVideo(true);
    const loadingToast = toast.loading("Uploading video introduction...");

    try {
      const formData = new FormData();
      formData.append("video", selectedVideo);

      const response = await fetch(
        `${API_BASE_URL}/resumes/public/upload-video`,
        {
          method: "POST",
          body: formData,
        }
      );

      if (!response.ok) {
        const error = await response
          .json()
          .catch(() => ({ message: "Failed to upload video" }));
        throw new Error(error.message || "Failed to upload video");
      }

      const result = await response.json();
      setVideoUrl(result.data.url);

      toast.dismiss(loadingToast);
      toast.success("Video uploaded successfully!");
    } catch (error) {
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : "Failed to upload video";
      toast.error(message);
    } finally {
      setIsUploadingVideo(false);
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
      formData.append("resume", selectedFile);

      // Call PUBLIC API endpoint to parse resume
      const response = await fetch(`${API_BASE_URL}/resumes/public/parse`, {
        method: "POST",
        body: formData,
      });

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
        skills:
          data.skills?.map((s: string | { name: string }) =>
            typeof s === "string" ? s : s.name
          ) || [],
        summary: data.summary || "",
        extractedText: data.extractedText || "",
        experience: data.experience || [],
        education: data.education || [],
        certifications: data.certifications || [],
        languages: data.languages || [],
      };

      setParsedData(mappedData);
      setFormData(mappedData);
      setIsUploading(false);
      setIsParsing(false);
      toast.success(
        "Resume parsed successfully! Review and edit your information below."
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
    // Prevent duplicate submissions
    if (isSubmitted || isUploading) {
      return;
    }

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

    setIsSubmitted(true);
    const loadingToast = toast.loading("Submitting your application...");

    try {
      setIsUploading(true);

      // Step 1: Upload resume to Cloudinary using PUBLIC endpoint
      toast.loading("Uploading resume...", { id: loadingToast });

      const uploadFormData = new FormData();
      uploadFormData.append("resume", selectedFile);

      const uploadResponse = await fetch(
        `${API_BASE_URL}/resumes/public/upload`,
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

      // Step 2: Upload video if provided (optional) or use video link
      let finalVideoUrl = videoUrl || videoLink;
      if (selectedVideo && !videoUrl && !videoLink) {
        toast.loading("Uploading video introduction...", { id: loadingToast });

        const videoFormData = new FormData();
        videoFormData.append("video", selectedVideo);

        const videoResponse = await fetch(
          `${API_BASE_URL}/resumes/public/upload-video`,
          {
            method: "POST",
            body: videoFormData,
          }
        );

        if (videoResponse.ok) {
          const videoResult = await videoResponse.json();
          finalVideoUrl = videoResult.data.url;
        } else {
          // Video upload failed but continue with application (it's optional)
          }
      }

      // Step 3: Create Application using PUBLIC endpoint
      toast.loading("Submitting application...", { id: loadingToast });

      const applicationData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone || "",
        resumeUrl: resumeUrl,
        resumeOriginalName: selectedFile.name,
        resumeRawText: parsedData?.extractedText || "",
        videoIntroUrl: finalVideoUrl || undefined,
        source: "direct_apply",
        status: "pending",
        jobId: jobId, // Job ID from URL
        parsedData: {
          summary: formData.summary || "",
          skills: formData.skills || "",
          experience: formData.experience || [],
          education: formData.education || [],
          certifications: formData.certifications || [],
          languages: formData.languages || [],
        },
      };

      const response = await fetch(
        `${API_BASE_URL}/applications/public/apply`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(applicationData),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to submit application");
      }

      setIsUploading(false);

      toast.dismiss(loadingToast);
      toast.success("Application submitted successfully!");

      // Navigate to success page
      setTimeout(() => {
        navigate(`/apply/success?job=${job?.title || "position"}`);
      }, 1000);
    } catch (error) {
      setIsUploading(false);
      setIsSubmitted(false); // Reset on error to allow retry
      toast.dismiss(loadingToast);
      const message =
        error instanceof Error ? error.message : "Failed to submit application";
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

  if (loadingJob) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 [--cell-border-color:hsl(var(--primary)/0.3)] [--cell-fill-color:hsl(var(--primary)/0.15)] [--cell-shadow-color:hsl(var(--primary)/0.4)]">
          <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
        </div>
        <div className="relative z-10">
          <Loader size="lg" text="Loading job details..." />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 [--cell-border-color:hsl(var(--primary)/0.3)] [--cell-fill-color:hsl(var(--primary)/0.15)] [--cell-shadow-color:hsl(var(--primary)/0.4)]">
          <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
        </div>
        <div className="relative z-10 text-center space-y-4">
          <h2 className="text-2xl font-bold">Job not found</h2>
          <Button asChild>
            <Link to="/jobs">Browse Jobs</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Ripple Effect */}
      <div className="absolute inset-0 [--cell-border-color:hsl(var(--primary)/0.3)] [--cell-fill-color:hsl(var(--primary)/0.15)] [--cell-shadow-color:hsl(var(--primary)/0.4)]">
        <BackgroundRippleEffect rows={10} cols={30} cellSize={48} />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <Link
              to={`/jobs/${jobId}`}
              className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Job Details
            </Link>

            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                Apply for {job.title}
              </h1>
              <p className="text-lg text-muted-foreground">
                Upload your resume and let AI extract your information
              </p>
            </div>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Upload Section */}
            <div className="space-y-5">
              <div className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg overflow-hidden">
                <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                  <h3 className="font-semibold text-lg flex items-center gap-2">
                    <Upload className="h-5 w-5 text-primary" />
                    Upload Resume
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Upload a PDF or Word document (max 5MB) to automatically
                    extract your information
                  </p>
                </div>
                <div className="p-6">
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
                              variant="outline"
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
                          Supported: <strong>PDF, DOC, DOCX</strong> • Max size:{" "}
                          <strong>5MB</strong>
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
                </div>
              </div>

              {/* Video Introduction Card (Optional) */}
              {parsedData && (
                <div className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg overflow-hidden">
                  <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                    <h3 className="font-semibold text-lg flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      Video Introduction (Optional)
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Some employers prefer a video introduction. Upload a short
                      video (max 100MB)
                    </p>
                  </div>
                  <div className="p-6">
                    {!selectedVideo && !videoUrl && !videoLink ? (
                      <div className="space-y-4">
                        {/* Toggle between upload and link */}
                        <div className="flex gap-2 p-1 bg-muted rounded-lg">
                          <Button
                            type="button"
                            variant={videoInputMethod === "upload" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setVideoInputMethod("upload")}
                          >
                            <Upload className="h-4 w-4 mr-2" />
                            Upload Video
                          </Button>
                          <Button
                            type="button"
                            variant={videoInputMethod === "link" ? "secondary" : "ghost"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setVideoInputMethod("link")}
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Paste Link
                          </Button>
                        </div>

                        {videoInputMethod === "upload" ? (
                          <div className="border-2 border-dashed rounded-xl p-8 transition-all duration-200 border-muted-foreground/25 hover:border-primary/50 hover:bg-accent/50">
                            <div className="text-center">
                              <Upload className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-60" />
                              <p className="font-medium text-foreground mb-4">
                                Upload your video introduction
                              </p>
                              <div className="flex justify-center mb-4">
                                <Label htmlFor="video-upload">
                                  <Button
                                    variant="outline"
                                    size="md"
                                    asChild
                                    className="cursor-pointer"
                                  >
                                    <span>
                                      <Upload className="h-4 w-4 mr-2" />
                                      Choose Video
                                    </span>
                                  </Button>
                                </Label>
                              </div>
                              <Input
                                id="video-upload"
                                type="file"
                                accept="video/mp4,video/quicktime,video/x-msvideo,video/webm,video/x-matroska,.mp4,.mov,.avi,.webm,.mkv"
                                className="hidden"
                                onChange={handleVideoSelect}
                              />
                              <p className="text-xs text-muted-foreground">
                                Supported: <strong>MP4, MOV, AVI, WEBM, MKV</strong>{" "}
                                • Max size: <strong>100MB</strong>
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <Label htmlFor="video-link" className="text-sm font-medium">
                              Video Link (Loom, YouTube, Vimeo, etc.)
                            </Label>
                            <Input
                              id="video-link"
                              type="url"
                              placeholder="https://www.loom.com/share/..."
                              value={videoLink}
                              onChange={(e) => setVideoLink(e.target.value)}
                              className="w-full"
                            />
                            <p className="text-xs text-muted-foreground">
                              Paste your video link from Loom, YouTube, Vimeo, or any other platform
                            </p>
                            {videoLink && (
                              <Button
                                type="button"
                                onClick={() => {
                                  if (videoLink.trim()) {
                                    setVideoUrl(videoLink.trim());
                                    toast.success("Video link added successfully!");
                                  }
                                }}
                                className="w-full"
                                size="lg"
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Add Video Link
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    ) : videoUrl || videoLink ? (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-primary/5 rounded-lg border border-primary/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                            <span className="text-sm font-medium text-foreground">
                              {videoLink ? "Video link added successfully" : "Video uploaded successfully"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setVideoUrl("");
                              setVideoLink("");
                              setSelectedVideo(null);
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {videoLink ? (
                          <div className="p-4 bg-accent/30 rounded-lg border">
                            <p className="text-sm font-medium text-foreground mb-2">Video Link:</p>
                            <a 
                              href={videoLink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary hover:underline break-all"
                            >
                              {videoLink}
                            </a>
                          </div>
                        ) : (
                          <video
                            src={videoUrl}
                            controls
                            className="w-full rounded-lg border"
                            style={{ maxHeight: "300px" }}
                          >
                            Your browser does not support the video tag.
                          </video>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between p-3 bg-accent/50 rounded-lg border">
                          <div className="flex items-center gap-3">
                            <FileText className="h-5 w-5 text-primary" />
                            <div>
                              <p className="text-sm font-medium text-foreground">
                                {selectedVideo?.name}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                {selectedVideo
                                  ? (
                                      selectedVideo.size /
                                      (1024 * 1024)
                                    ).toFixed(2)
                                  : "0"}{" "}
                                MB
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setSelectedVideo(null)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        <Button
                          onClick={handleUploadVideo}
                          disabled={isUploadingVideo}
                          className="w-full"
                          size="lg"
                        >
                          {isUploadingVideo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading Video...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Video
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Form Section */}
            <div className="bg-background/80 backdrop-blur-sm border border-primary/20 rounded-xl shadow-lg overflow-hidden min-w-0">
              <div className="bg-linear-to-r from-primary/10 via-primary/5 to-transparent p-6 border-b">
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Your Information
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {parsedData
                    ? "Review and edit your information before submitting"
                    : "Upload a resume to see extracted information"}
                </p>
              </div>
              <div className="p-6 overflow-hidden">
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
                              First Name <span className="text-red-500">*</span>
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
                              Last Name <span className="text-red-500">*</span>
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
                      <div className="flex flex-wrap gap-2">
                        {formData.skills.map((skill, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="cursor-pointer hover:bg-destructive hover:text-destructive-foreground transition-colors"
                            onClick={() => removeSkill(skill)}
                          >
                            {skill}
                            <X className="h-3 w-3 ml-1" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <Input
                          id="newSkill"
                          placeholder="Add a skill"
                          onKeyPress={(e) => {
                            if (e.key === "Enter") {
                              const target = e.target as HTMLInputElement;
                              addSkill(target.value);
                              target.value = "";
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
                  </div>
                ) : (
                  <div className="flex-1 flex items-center justify-center min-h-[400px] border-2 border-dashed rounded-lg">
                    <div className="text-center text-muted-foreground">
                      <FileText className="h-16 w-16 mx-auto mb-4 opacity-50" />
                      <p className="font-medium">No data parsed yet</p>
                      <p className="text-sm mt-1">
                        Upload a resume to see extracted information
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          {parsedData && (
            <div className="flex justify-center gap-3 mt-8">
              <Button
                variant="outline"
                size="lg"
                onClick={() => navigate(`/jobs/${jobId}`)}
                disabled={isUploading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                size="lg"
                disabled={isUploading || isSubmitted}
                className="min-w-[200px]"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Submit Application
                  </>
                )}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
