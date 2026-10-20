import { useEffect, useState } from "react";
import { authenticatedFetch, analyzeResume, getResumeQualityScore, matchResumeToJob,} from "./api";
import  type { JobMatchResult } from "./api";

type Job = {
  id: number;
  company: string;
  jobTitle: string;
  location: string | null;
  jobUrl: string | null;
  status: string;
  notes: string | null;
  appliedDate: string | null;
  followUpAt: string | null;
};

type JobForm = {
  company: string;
  jobTitle: string;
  location: string;
  jobUrl: string;
  status: string;
  notes: string;
  appliedDate: string;
  followUpAt: string;
};


function JobDashboard({
  onLogout,
}: {
  onLogout: () => void;
}) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [resumeText, setResumeText] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [uploadError, setUploadError] = useState("");
  type ResumeAnalysis = {
  professionalSummary: string;
  strengths: string[];
  improvementsSuggestions: string[];
  missingSections: string[];
  overallFeedback: string;
};

  const [analysis, setAnalysis] = useState<ResumeAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState("");

  const [qualityScore, setQualityScore] = useState<{
  score: number;
  maxScore: number;
  checks: {
    name: string;
    passed: boolean;
    points: number;
    suggestion: string | null;
  }[];
  disclaimer: string;
} | null>(null);

const [jobDescription, setJobDescription] = useState("");
const [jobMatch, setJobMatch] = useState<JobMatchResult | null>(null);
const [matchingJob, setMatchingJob] = useState(false);
const [jobMatchError, setJobMatchError] = useState("");

  const [form, setForm] = useState<JobForm>({
    company: "",
    jobTitle: "",
    location: "",
    jobUrl: "",
    status: "SAVED",
    notes: "",
    appliedDate: "",
    followUpAt: "",
  });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); 
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("newest"); // "newest" or "oldest" 

  // pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const jobsPerPage = 5;
 


  // Filter jobs by search term and status
const filteredJobs = jobs.filter((job) => {
  const search = searchTerm.toLowerCase().trim();

  const matchesSearch =
    job.company.toLowerCase().includes(search) ||
    job.jobTitle.toLowerCase().includes(search);

  const matchesStatus =
    statusFilter === "" || job.status === statusFilter;

  return matchesSearch && matchesStatus;
});

const sortedJobs = [...filteredJobs].sort((a, b) => {
  if (sortBy === "company") {
    return a.company.localeCompare(b.company);
  }

  if (sortBy === "jobTitle") {
    return a.jobTitle.localeCompare(b.jobTitle);
  }

  const dateA = a.appliedDate ? new Date(a.appliedDate).getTime() : 0;
  const dateB = b.appliedDate ? new Date(b.appliedDate).getTime() : 0;

  return sortBy === "oldest" ? dateA - dateB : dateB - dateA;
});

// Pagination calculations
const totalPages = Math.max(
  1,
  Math.ceil(sortedJobs.length / jobsPerPage)
);

const safeCurrentPage = Math.min(currentPage, totalPages);

const startIndex = (safeCurrentPage - 1) * jobsPerPage;

const paginatedJobs = sortedJobs.slice(
  startIndex,
  startIndex + jobsPerPage
);

// Export filtered job applications to CSV
const handleExportCSV = () => {
  if (filteredJobs.length === 0) {
    setMessage("No job applications available to export.");
    return;
  }

  const headers = [
    "Company",
    "Job Title",
    "Location",
    "Status",
    "Applied Date",
    "Job URL",
    "Notes",
  ];

  const escapeCSV = (value: string | null | undefined) =>
    `"${String(value ?? "").replace(/"/g, '""')}"`;

  const rows = filteredJobs.map((job) => [
    job.company,
    job.jobTitle,
    job.location,
    job.status,
    job.appliedDate,
    job.jobUrl,
    job.notes,
  ]);

  const csvContent = [
    headers.map(escapeCSV).join(","),
    ...rows.map((row) => row.map(escapeCSV).join(",")),
  ].join("\r\n");

  const blob = new Blob(["\uFEFF", csvContent], {
    type: "text/csv;charset=utf-8;",
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "job-applications.csv";
  link.click();

  URL.revokeObjectURL(url);

  setMessage("Job applications exported successfully!"); 
};

// Dashboard statistics
const totalApplications = jobs.length;

const appliedCount = jobs.filter(
  (job) => job.status === "APPLIED"
).length;

const interviewCount = jobs.filter(
  (job) => job.status === "INTERVIEW"
).length;

const offerCount = jobs.filter(
  (job) => job.status === "OFFER"
).length;

const rejectedCount = jobs.filter(
  (job) => job.status === "REJECTED"
).length;

// Load jobs
const loadJobs = async () => {
  const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first.");
    return;
  }

  try {
    setLoading(true);

    const response = await authenticatedFetch("/jobs", {
      method: "GET",
    });

    const result = await response.json();

    if (!response.ok) {
      setMessage(result.message || "Failed to load jobs.");
      return;
    }

    if (result.success) {
      setJobs(result.jobs || []);
    } else {
      setMessage(result.message || "Failed to load jobs.");
    }
  } catch (error) {
    console.error("Fetch jobs error:", error);
    setMessage("Unable to connect to the server.");
  } finally {
    setLoading(false);
  }
};

useEffect(() => {
  const timer = setTimeout(() => {
    void loadJobs();
  }, 0);

  return () => clearTimeout(timer);
}, []);

async function handleAnalyzeResume() {
  setAnalysisError("");
  setAnalysis(null);

  if (!resumeText.trim()) {
    setAnalysisError("Please enter your resume text first.");
    return;
  }

  setAnalyzing(true);

  try {
   const result = await analyzeResume(resumeText);
setAnalysis(result.analysis);

try {
  const quality = await getResumeQualityScore(resumeText);
  setQualityScore(quality);
} catch (error) {
  console.error("Resume quality check failed:", error);
  setQualityScore(null);
}
// Clear previous analysis 
  } catch (error) {
    setAnalysisError(
      error instanceof Error
        ? error.message
        : "Unable to analyze resume. Please try again."
    );
  } finally {
    setAnalyzing(false);
  }
}

async function handleMatchResumeToJob() {
  setJobMatchError("");
  setJobMatch(null);

  if (!resumeText.trim()) {
    setJobMatchError("Upload a resume or paste your resume text first.");
    return;
  }

  if (!jobDescription.trim()) {
    setJobMatchError("Paste the job description first.");
    return;
  }

  setMatchingJob(true);

  try {
    const result = await matchResumeToJob(
      resumeText,
      jobDescription
    );

    setJobMatch(result);
  } catch (error) {
    setJobMatchError(
      error instanceof Error
        ? error.message
        : "Unable to match this resume to the job."
    );
  } finally {
    setMatchingJob(false);
  }
}


async function handleResumeUpload() {
  if (!resumeFile) {
    setUploadError("Please select a PDF resume first.");
    return;
  }

  const formData = new FormData();
  formData.append("resume", resumeFile);

  setUploadingResume(true);
  setUploadError("");
  setAnalysisError("");
  setAnalysis(null);

  try {
    const response = await authenticatedFetch(
      "/resume/upload",
      {
        method: "POST",
        body: formData,
      }
    );

    const data = await response.json();

    if (!response.ok || !data.success) {
      throw new Error(
        data.message || "Resume upload failed."
      );
    }

    if (typeof data.resumeText !== "string" ||
        !data.resumeText.trim()) {
      throw new Error(
        "No readable text was found in this PDF."
      );
    }

    setResumeText(data.resumeText);
  } catch (error) {
    setUploadError(
      error instanceof Error
        ? error.message
        : "Unable to upload resume."
    );
  } finally {
    setUploadingResume(false);
  }
}


  // Handle form input
  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setForm((currentForm) => ({
      ...currentForm,
      [name]: value,
    }));
  };

  const handleDeleteJob = async (id: number) => {
  const confirmed = window.confirm(
    "Are you sure you want to delete this job application?"
  );

  if (!confirmed) return;

  setDeletingId(id);

  try {
    const response = await authenticatedFetch(`/jobs/${id}`, {
      method: "DELETE",
    });

    if(response.status === 401) {
      setMessage("You are not authenticated. Please login again.");
      return;
    }

    if (!response.ok) {
      throw new Error("Failed to delete job application");
    }

    setMessage("Job application deleted successfully!");
    await loadJobs();
  } catch (error) {
    console.error("Delete error:", error);
    setMessage("Failed to delete job application");
  } finally {
    setDeletingId(null);
  }   
};

  const handleAddJob = async (e: React.FormEvent) => {
  e.preventDefault();

  if (saving) return; // Prevent multiple submissions

  setMessage("");

  const token = localStorage.getItem("token");

  if (!token) {
    setMessage("Please login first.");
    return;
  }

  if (!form.company.trim() || !form.jobTitle.trim()) {
    setMessage("Company and Job Title are required.");
    return;
  }

  try {
    setSaving(true);

 

  const method = editingId ? "PUT" : "POST";

  const response = await authenticatedFetch(
    editingId ? `/jobs/${editingId}` : "/jobs",
  {
    method,
    body: JSON.stringify({
      company: form.company,
      jobTitle: form.jobTitle,
      location: form.location || null,
      jobUrl: form.jobUrl || null,
      status: form.status,
      notes: form.notes || null,
      appliedDate: form.appliedDate || null,
    }),
  }
);

    const result = await response.json();

    if (!response.ok) {
      setMessage(
        result.message ||
          (editingId
            ? "Failed to update job."
            : "Failed to add job.")
      );
      return;
    }

    if (result.success && result.job) {
      if (editingId) {
        // Replace the edited job
        setJobs((currentJobs) =>
          currentJobs.map((job) =>
            job.id === editingId ? result.job : job
          )
        );

        setMessage("Job application updated successfully 🎉");
      } else {
        // Add new job to the beginning
        setJobs((currentJobs) => [
          result.job,
          ...currentJobs,
        ]);

        setMessage("Job application added successfully 🎉");
      }
    }

    // Reset form
    setForm({
      company: "",
      jobTitle: "",
      location: "",
      jobUrl: "",
      status: "SAVED",
      notes: "",
      appliedDate: "",
      followUpAt: "",
    });

    // Exit edit mode
    setEditingId(null);

  } catch (error) {
    console.error("Delete error:", error);
    setMessage("Unable to connect to the server.");
  } finally {
    setSaving(false);
  }
};


  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundColor: "#111",
        color: "white",
        padding: "40px 20px",
      }}
    >
      <div
        style={{
          maxWidth: "1100px",
          margin: "0 auto",
        }}
      >
        <h1
          style={{
            textAlign: "center",
            marginBottom: "10px",
          }}
        >
          AI Job Tracker
        </h1>

{/* Resume Analyzer */}
<div
  style={{
    backgroundColor: "#1e293b",
    padding: "24px",
    borderRadius: "12px",
    margin: "24px 0",
  }}
>
  <h2>AI Resume Analyzer</h2>

  <p>
    Paste your resume text below to receive feedback
    on your skills and professional profile.
  </p>

  
<div style={{ marginBottom: "16px" }}>
  <label
    htmlFor="resume-file"
    style={{ display: "block", marginBottom: "8px" }}
  >
    Upload your resume (PDF, maximum 5 MB)
  </label>

  <input
    id="resume-file"
    type="file"
    accept=".pdf,application/pdf"
    onChange={(event) => {
      const file = event.target.files?.[0] ?? null;
      setResumeFile(file);
      setUploadError("");
    }}
  />

  <button
    type="button"
    onClick={handleResumeUpload}
    disabled={!resumeFile || uploadingResume}
    style={{
      display: "block",
      marginTop: "10px",
      padding: "10px 16px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    {uploadingResume ? "Uploading..." : "Upload Resume"}
  </button>

  {uploadError && (
    <p style={{ color: "#f87171" }}>{uploadError}</p>
  )}

  {uploadingResume && <p>Extracting resume text...</p>}
</div>


  <textarea
    value={resumeText}
    onChange={(e) => setResumeText(e.target.value)}
    placeholder="Paste your resume text here..."
    rows={8}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      boxSizing: "border-box",
      marginBottom: "12px",
    }}
  />

  <button
    onClick={handleAnalyzeResume}
    disabled={analyzing || !resumeText.trim()}
    style={{
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    {analyzing ? "Analyzing..." : "Analyze Resume"}
  </button>

  {analysisError && (
    <p style={{ color: "#f87171" }}>{analysisError}</p>
  )}
   
<section
  style={{
    marginTop: "24px",
    padding: "20px",
    backgroundColor: "#202b40",
    borderRadius: "12px",
  }}
>
  <h3 style={{ color: "#a78bfa", marginTop: 0 }}>
    Match Resume to Job Description
  </h3>

  <p>
    Paste the job description to compare its requirements
    with the skills and evidence found in your resume.
  </p>

  <textarea
    value={jobDescription}
    onChange={(e) => setJobDescription(e.target.value)}
    placeholder="Paste the complete job description here..."
    rows={8}
    style={{
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      boxSizing: "border-box",
      marginBottom: "12px",
    }}
  />

  <button
    onClick={handleMatchResumeToJob}
    disabled={matchingJob || !resumeText.trim() || !jobDescription.trim()}
    style={{
      padding: "12px 20px",
      borderRadius: "8px",
      cursor: "pointer",
    }}
  >
    {matchingJob ? "Matching..." : "Match Resume to Job"}
  </button>

  {jobMatchError && (
    <p style={{ color: "#f87171" }}>{jobMatchError}</p>
  )}

 
      {jobMatch && (
        <div
          style={{
            marginTop: "20px",
            padding: "24px",
            backgroundColor: "#202b40",
            color: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #3b4961",
          }}
        >
          <h3 style={{ color: "#a78bfa", marginTop: 0 }}>
            Job Match Report
          </h3>

          <div
            style={{
              padding: "16px",
              backgroundColor: "#293548",
              borderRadius: "10px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <strong>Estimated keyword match</strong>
              <strong style={{ fontSize: "24px", color: "#a78bfa" }}>
                {jobMatch.matchScore}/100
              </strong>
            </div>

            <div
              role="progressbar"
              aria-label="Estimated keyword match"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.max(
                0,
                Math.min(100, jobMatch.matchScore)
              )}
              style={{
                height: "12px",
                backgroundColor: "#475569",
                borderRadius: "999px",
                overflow: "hidden",
                marginTop: "12px",
              }}
            >
              <div
                style={{
                  width: `${Math.max(
                    0,
                    Math.min(100, jobMatch.matchScore)
                  )}%`,
                  height: "100%",
                  backgroundColor: "#a78bfa",
                  borderRadius: "999px",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            <p style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: 0 }}>
              This score measures keyword overlap between the resume text and
              the job description. It is not an official ATS score and does
              not measure skill proficiency or predict hiring outcomes.
            </p>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
              gap: "12px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                backgroundColor: "#293548",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px" }}>Matched keywords</p>
              <strong style={{ fontSize: "24px" }}>
                {jobMatch.matchedSkills.length}
              </strong>
            </div>

            <div
              style={{
                backgroundColor: "#293548",
                padding: "14px",
                borderRadius: "8px",
              }}
            >
              <p style={{ margin: 0, fontSize: "13px" }}>
                Not found in resume
              </p>
              <strong style={{ fontSize: "24px" }}>
                {jobMatch.missingSkills.length}
              </strong>
            </div>
          </div>

          <section style={{ marginBottom: "20px" }}>
            <h4>Matched Skills</h4>
            {jobMatch.matchedSkills.length > 0 ? (
              <ul>
                {jobMatch.matchedSkills.map((skill, index) => (
                  <li key={`matched-${index}`}>{skill}</li>
                ))}
              </ul>
            ) : (
              <p>
                No listed skill keywords were found in both texts. This does
                not necessarily mean you lack the skills.
              </p>
            )}
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h4>Skills Not Found in Resume Text</h4>
            {jobMatch.missingSkills.length > 0 ? (
              <>
                <p>
                  These keywords appear in the job description but were not
                  detected in your resume text.
                </p>
                <ul>
                  {jobMatch.missingSkills.map((skill, index) => (
                    <li key={`missing-${index}`}>{skill}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p>
                No missing keywords were identified by this check. Review the
                job requirements to confirm that all relevant qualifications
                are covered.
              </p>
            )}
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h4>Resume Evidence</h4>
            {jobMatch.relevantEvidence.length > 0 ? (
              <ul>
                {jobMatch.relevantEvidence.map((item, index) => (
                  <li key={`evidence-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>
                No matching keyword evidence was identified. Review your resume
                against the job requirements.
              </p>
            )}
          </section>

          <section style={{ marginBottom: "20px" }}>
            <h4>Recommended Next Steps</h4>
            {jobMatch.suggestions.length > 0 ? (
              <ul>
                {jobMatch.suggestions.map((item, index) => (
                  <li key={`suggestion-${index}`}>{item}</li>
                ))}
              </ul>
            ) : (
              <p>
                No additional suggestions were returned. Review the job
                description for requirements that may not be covered by this
                keyword check.
              </p>
            )}
          </section>

          <small style={{ display: "block", lineHeight: 1.6, opacity: 0.85 }}>
            {jobMatch.disclaimer}
          </small>
        </div>
      )}


</section>

{analysis && (
  <div
    style={{
      marginTop: "20px",
      display: "grid",
      gap: "16px",
    }}
  >
    <h3 style={{ margin: 0, color: "#a78bfa" }}>
      Resume Analysis Results
    </h3>

    <section
      style={{
        backgroundColor: "#293548",
        padding: "18px",
        borderRadius: "10px",
      }}
    >
      <h4>Professional Summary</h4>
      <p>{analysis.professionalSummary}</p>
    </section>

    <section
      style={{
        backgroundColor: "#293548",
        padding: "18px",
        borderRadius: "10px",
      }}
    >
      <h4>Strengths</h4>
      <ul>
        {(analysis.strengths ?? []).map((item, index) => (
  <li key={index}>{item}</li>
))}
      </ul>
    </section>

    <section
  style={{
    backgroundColor: "#293548",
    padding: "18px",
    borderRadius: "10px",
  }}
>
  <h4>Areas to Improve</h4>
  <ul>
    {(analysis.improvementsSuggestions ?? []).length > 0 ? (
      (analysis.improvementsSuggestions ?? []).map((item, index) => (
        <li key={index}>{item}</li>
      ))
    ) : (
      <li>No improvement suggestions were returned.</li>
    )}
  </ul>
</section>

    <section
      style={{
        backgroundColor: "#293548",
        padding: "18px",
        borderRadius: "10px",
      }}
    >
      <h4>Missing Sections</h4>
      {(analysis.missingSections ?? []).length > 0 ? (
  <ul>
    {(analysis.missingSections ?? []).map((item, index) => (
      <li key={index}>{item}</li>
    ))}
  </ul>
) : (
  <p>No missing sections were identified.</p>
)}
    </section>

    <section
      style={{
        backgroundColor: "#293548",
        padding: "18px",
        borderRadius: "10px",
      }}
    >
      <h4>Overall Feedback</h4>
      <p>{analysis.overallFeedback}</p>
    </section>

    
{qualityScore && (
  <section
    style={{
      backgroundColor: "#293548",
      padding: "18px",
      borderRadius: "10px",
      marginTop: "16px",
      color: "#ffffff",
    }}
  >
    <h3>Resume Quality Score</h3>

    <p>
      <strong>
        {qualityScore.score}/{qualityScore.maxScore}
      </strong>
    </p>

    <p>{qualityScore.disclaimer}</p>

    <h4>Checklist</h4>

    {qualityScore.checks.map((check) => (
      <div key={check.name} style={{ marginBottom: "10px" }}>
        <p>
          {check.passed ? "✓" : "○"} {check.name} —{" "}
          {check.passed ? "Passed" : "Needs attention"}
          {" "}({check.points} points)
        </p>

        {!check.passed && check.suggestion && (
          <p>{check.suggestion}</p>
        )}
      </div>
    ))}
  </section>
)}
 

  </div>
)}

</div>

{/* Dashboard Statistics */}
<div
  style={{
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
    gap: "16px",
    margin: "24px 0",
    textAlign: "center",
  }}
>
  <div
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Total Applications
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {totalApplications}
  </p>
</div>

<div
    onClick={() => setStatusFilter("SAVED")}
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Saved
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {jobs.filter((job) => job.status === "SAVED").length}
  </p>
</div>

  <div
    onClick={() => setStatusFilter("APPLIED")}
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Applied
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {appliedCount}
  </p>
</div>

  <div
    onClick={() => setStatusFilter("INTERVIEW")}
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Interviews
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {interviewCount}
  </p>
</div>

  <div
    onClick={() => setStatusFilter("OFFER")}
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Offers
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {offerCount}
  </p>
</div>


<div
    onClick={() => setStatusFilter("REJECTED")}
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "20px",
  }}
>
  <h3 style={{ fontSize: "16px", color: "#94a3b8" }}>
    Rejected
  </h3>
  <p style={{ fontSize: "32px", fontWeight: "bold", margin: "10px 0" }}>
    {rejectedCount}
  </p>
</div>
</div>

{/* Application Status Overview */}
<div
  style={{
    backgroundColor: "#1e293b",
    border: "1px solid #334155",
    borderRadius: "12px",
    padding: "24px",
    marginBottom: "30px",
  }}
>
  <h2 style={{ marginTop: 0, textAlign: "center" }}>
    Application Status Overview
  </h2>

  {[
    {
      name: "Saved",
      count: jobs.filter((job) => job.status === "SAVED").length,
    },
    {
      name: "Applied",
      count: appliedCount,
    },
    {
      name: "Interviews",
      count: interviewCount,
    },
    {
      name: "Offers",
      count: offerCount,
    },
    {
      name: "Rejected",
      count: rejectedCount,
    },
  ].map((item) => {
    const percentage =
      totalApplications > 0
        ? (item.count / totalApplications) * 100
        : 0;

    return (
      <div key={item.name} style={{ marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            marginBottom: "8px",
          }}
        >
          <span>{item.name}</span>
          <strong>
            {item.count} ({Math.round(percentage)}%)
          </strong>
        </div>

        <div
          style={{
            height: "10px",
            backgroundColor: "#334155",
            borderRadius: "10px",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${percentage}%`,
              height: "100%",
              backgroundColor: "#818cf8",
              borderRadius: "10px",
              transition: "width 0.3s ease",
            }}
          />
        </div>
      </div>
    );
  })}
</div>
        <h2
          style={{
            textAlign: "center",
            marginBottom: "30px",
          }}
        >
          My Job Applications
        </h2>


<button
  type="button"
  onClick={handleExportCSV}
  style={{
    display: "block",
    margin: "0 auto 20px",
    padding: "12px 20px",
    backgroundColor: "#7c3aed",
    color: "white",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  📥 Export Applications to CSV
</button>
      
        {/* Search and Filter */}
<div
  style={{
    display: "flex",
    gap: "12px",
    marginBottom: "24px",
    flexWrap: "wrap",
  }}
>
  <input
    type="text"
    placeholder="Search company or job title..."
    value={searchTerm}
    onChange={(e) => {
      setSearchTerm(e.target.value);
      setCurrentPage(1); // Reset to first page on search
    }}
    style={{
      flex: 1,
      minWidth: "220px",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #555",
      backgroundColor: "#222",
      color: "white",
    }}
  />

  <select
    value={statusFilter}
    onChange={(e) => {
      setStatusFilter(e.target.value);
      setCurrentPage(1); // Reset to first page on filter change
    }}
    style={{
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid #555",
      backgroundColor: "#222",
      color: "white",
    }}
  >
    <option value="">All Statuses</option>
    <option value="SAVED">Saved</option>
    <option value="APPLIED">Applied</option>
    <option value="INTERVIEW">Interview</option>
    <option value="OFFER">Offer</option>
    <option value="REJECTED">Rejected</option>
  </select>

  <select
  value={sortBy}
  onChange={(e) => {
    setSortBy(e.target.value);
    setCurrentPage(1); // Reset to first page on sort change
  }}
  style={{
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid #555",
    backgroundColor: "#222",
    color: "white",
  }}
>
  <option value="newest">Newest First</option>
  <option value="oldest">Oldest First</option>
  <option value="company">Company (A–Z)</option>
  <option value="jobTitle">Job Title (A–Z)</option>
</select>

  <button
  type="button"
  onClick={() => {
    setSearchTerm("");
    setStatusFilter("");
    setSortBy("newest");
    setCurrentPage(1); // Reset to first page on filter clear
  }}
  style={{
    padding: "12px 18px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#8b5cf6",
    color: "white",
    cursor: "pointer",
    fontWeight: "bold",
  }}
>
  Clear Filters
</button>
</div>

        {message && (
          <div
            style={{
              backgroundColor: "#222",
              border: "1px solid #555",
              padding: "12px",
              borderRadius: "8px",
              marginBottom: "25px",
              textAlign: "center",
            }}
          >
            {message}
          </div>
        )}

        {/* Add Job Form */}
        <div
          style={{
            border: "1px solid #555",
            borderRadius: "12px",
            padding: "25px",
            marginBottom: "35px",
          }}
        >
          <h2>Add Job Application</h2>

          <form onSubmit={handleAddJob}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
              }}
            >
              <div>
                <label>Company *</label>
                <input
                  type="text"
                  name="company"
                  placeholder="e.g. Microsoft"
                  value={form.company}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Job Title *</label>
                <input
                  type="text"
                  name="jobTitle"
                  placeholder="e.g. Software Engineer"
                  value={form.jobTitle}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label>Location</label>
                <input
                  type="text"
                  name="location"
                  placeholder="e.g. Hyderabad"
                  value={form.location}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Job URL</label>
                <input
                  type="url"
                  name="jobUrl"
                  placeholder="https://..."
                  value={form.jobUrl}
                  onChange={handleChange}
                />
              </div>

              <div>
                <label>Status</label>
                <select
                  name="status"
                  value={form.status}
                  onChange={handleChange}
                >
                  <option value="SAVED">Saved</option>
                  <option value="APPLIED">Applied</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="REJECTED">Rejected</option>
                  <option value="OFFER">Offer</option>
                </select>
              </div>

              <div>
                <label>Applied Date</label>
                <input
                  type="date"
                  name="appliedDate"
                  value={form.appliedDate}
                  onChange={handleChange}
                />
              </div>
            </div>

            <div style={{ gridColumn: "1 / -1", marginTop: "15px", display: "flex", flexDirection: "column", gap: "8px" }}>
              <label>Notes</label>

              <textarea
                name="notes"
                placeholder="Add notes about this application..."
                value={form.notes}
                onChange={handleChange}
                rows={4}
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              style={{
                marginTop: "20px",
                padding: "12px 25px",
                cursor: saving ? "not-allowed" : "pointer",
              }}
            >
              {saving ? "Saving..." : editingId ? "Update Job Application" : "Add Job Application"}
            </button>
          </form>
        </div>

      {/* Job List */}
<div>
  <button
    type="button"
    onClick={onLogout}
    style={{
      display: "block",
      marginLeft: "auto",
      marginBottom: "20px",
      padding: "10px 18px",
      backgroundColor: "#7c3aed",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      fontWeight: "bold",
    }}
  >
    Logout
  </button>
     <h2>Recent Applications</h2>

          {loading ? (
            <p>Loading applications...</p>
          ) : filteredJobs.length === 0 ? (
  <div
    style={{
      textAlign: "center",
      padding: "40px 20px",
      border: "1px dashed #64748b",
      borderRadius: "12px",
      backgroundColor: "#1e293b",
      color: "#cbd5e1",
    }}
  >
    <h3>
      {jobs.length === 0
        ? "📭 No job applications yet"
        : "🔍 No matching applications found"}
    </h3>

    <p>
      {jobs.length === 0
        ? "Add your first job application using the form above."
        : "Try changing your search or status filter."}
    </p>
  </div>
) : (
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >

              {paginatedJobs.map((job) => (
                <div
                  key={job.id}
                  style={{
                    border: "1px solid #555",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px",
                    backgroundColor: "#171725",
                    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.2)",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  <h3
  style={{
    fontSize: "20px",
    fontWeight: "700",
    marginTop: "0",
    marginBottom: "16px",
    color: "#c4b5fd",
  }}
>
  {job.jobTitle}
</h3>

                  <p style={{ margin: "8px 0", color: "#e5e7eb" }}>
  <strong>Company:</strong> {job.company}
</p>

                  {job.location && (
  <p style={{ margin: "8px 0", color: "#e5e7eb" }}>
    <strong>Location:</strong> {job.location}
  </p>
)}

                  <p>
  <strong>Status:</strong>{" "}
  <span
    style={{
      display: "inline-block",
      padding: "5px 12px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: "bold",
      backgroundColor:
        job.status === "OFFER"
          ? "#14532d"
          : job.status === "INTERVIEW"
          ? "#1e3a8a"
          : job.status === "REJECTED"
          ? "#7f1d1d"
          : job.status === "APPLIED"
          ? "#6b21a8"
          : "#374151",
      color: "#ffffff",
    }}
  >
    {job.status}
  </span>
</p>

                  {job.appliedDate && (
                    <p>
                      <strong>Applied Date:</strong>{" "}
                      {new Date(job.appliedDate).toLocaleDateString()}
                    </p>
                  )}

                  {job.jobUrl && (
                    <p>
                      <strong>Job URL:</strong>{" "}
                      <a
                        href={job.jobUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        View Job
                      </a>
                    </p>
                  )}

                  {job.notes && (
                    <p>
                      <strong>Notes:</strong> {job.notes}
                    </p>
                  )}
                   
                   <button
                     type="button"
                      onClick={() => {
                        setEditingId(job.id);

                        setForm({
                            company: job.company,
                            jobTitle: job.jobTitle,
                            location: job.location || "",
                            jobUrl: job.jobUrl || "",
                            status: job.status,
                            notes: job.notes || "",
                            
                            appliedDate: job.appliedDate
                            ? job.appliedDate.slice(0, 10)
                            : "",
                            followUpAt: job.followUpAt
                            ? job.followUpAt.slice(0, 10)
                            : "",
                        });
                        window.scrollTo({
                          top: 0,
                          behavior: "smooth",
                          
                        });
                        setMessage("Editing job application ...");
                      }}
                      style={{
                        marginTop: "10px",
                        marginRight: "10px",
                        padding: "8px 16px",
                        cursor: "pointer",
                      }}
                    >
                      Edit
                    </button>
                  <button
                    type="button"
                    disabled={deletingId === job.id}
                    onClick={() => handleDeleteJob(job.id)}
                    style={{
                      marginTop: "10px",
                      padding: "8px 16px",
                      cursor: "pointer",
                    }}
                  >
                    {deletingId === job.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Pagination Controls */}
<div
  style={{
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    gap: "16px",
    margin: "24px 0",
  }}
>
  <button
    type="button"
    onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
    disabled={currentPage === 1}
  >
    Previous
  </button>

  <span>
    Page {currentPage} of {Math.max(1, totalPages)}
  </span>

  <button
    type="button"
    onClick={() =>
      setCurrentPage((page) => Math.min(totalPages, page + 1))
    }
    disabled={currentPage >= totalPages || totalPages === 0}
  >
    Next
  </button>
</div>
    </div>
  );
}


export default JobDashboard;