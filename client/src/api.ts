const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

export async function registerUser(
  name: string,
  email: string,
  password: string
) {
  const response = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      email,
      password,
    }),
  });

  return response.json();
}

export async function loginUser(
  email: string,
  password: string
) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  return response.json();
}

export async function authenticatedFetch(
  endpoint: string,
  options: RequestInit = {}
) {
  const token = localStorage.getItem("token");

 let response: Response;

try {
  response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
   headers: {
  ...(options.body instanceof FormData
    ? {}
    : { "Content-Type": "application/json" }),
  ...options.headers,
  ...(token ? { Authorization: `Bearer ${token}` } : {}),
},
  });
} catch {
  throw new Error(
    "Unable to connect to the server. Please check your connection and try again."
  );
}

  if (response.status === 401) {
    localStorage.removeItem("token");
    window.location.reload();
    throw new Error("Session expired. Please log in again.");
  }

  return response;
}


export async function analyzeResume(resumeText: string) {
  const response = await authenticatedFetch("/resume/analyze", {
    method: "POST",
    body: JSON.stringify({ resumeText }),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data.message || "Failed to analyze resume."
    );
  }

  return data;
}


export async function uploadResume(file: File) {
  const formData = new FormData();
  formData.append("resume", file);

  const response = await authenticatedFetch("/resume/upload", {
    method: "POST",
    body: formData,
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to upload resume.");
  }

  return data;
}


export async function getResumeQualityScore(resumeText: string) {
  const response = await authenticatedFetch("/resume/quality-score", {
    method: "POST",
    body: JSON.stringify({ resumeText }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Failed to calculate resume quality.");
  }

  return data.quality;
}


export type JobMatchResult = {
  matchScore: number;
  matchedSkills: string[];
  missingSkills: string[];
  relevantEvidence: string[];
  suggestions: string[];
  disclaimer: string;
};

export async function matchResumeToJob(
  resumeText: string,
  jobDescription: string
): Promise<JobMatchResult> {
  if (!resumeText.trim()) {
    throw new Error("Please provide your resume text.");
  }

  if (!jobDescription.trim()) {
    throw new Error("Please provide a job description.");
  }

  const response = await authenticatedFetch("/resume/job-match", {
    method: "POST",
    body: JSON.stringify({
      resumeText,
      jobDescription,
    }),
  });

  const data = await response.json();

  if (!response.ok || !data.success) {
    throw new Error(data.message || "Unable to match your resume to this job.");
  }

  return data.match as JobMatchResult;
}

