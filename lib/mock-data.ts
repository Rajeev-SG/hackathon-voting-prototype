import type {
  AssetDraft,
  Project,
  RubricCriterion,
  ScoreboardEntry,
  TieBreakCase
} from "@/types";

export const judgeNavItems = [
  { href: "/projects", label: "Projects" },
  { href: "/results", label: "Scoreboard" },
  { href: "/submission/assets", label: "Upload Project" }
];

export const participantNavItems = [
  { href: "/projects", label: "Projects" },
  { href: "/results", label: "Scoreboard" },
  { href: "/submission/assets", label: "Upload Project" }
];

export const filterOptions = {
  tracks: ["All Tracks", "AI & ML", "Sustainability", "Fintech", "Healthtech"],
  stacks: ["All Stacks", "Next.js", "Python", "Solidity", "React Native", "Computer Vision"]
};

export const rubricCriteria: RubricCriterion[] = [
  {
    id: "innovation",
    title: "Innovation",
    description: "Originality of the concept and the quality of the insight.",
    benchmark:
      "Novel application of AI that clearly moves beyond a basic API wrapper and shows a differentiated point of view.",
    defaultScore: "4"
  },
  {
    id: "execution",
    title: "Execution",
    description: "Technical depth, product completeness, and stability.",
    benchmark:
      "The prototype works end to end, data flows reliably, and the architecture shows evidence of strong engineering discipline.",
    defaultScore: "3"
  },
  {
    id: "uiux",
    title: "UI / UX",
    description: "Visual polish, usability, and accessibility of the journey.",
    benchmark:
      "Clear information hierarchy, coherent interactions, strong accessibility fundamentals, and a flow judges can understand without narration.",
    defaultScore: ""
  },
  {
    id: "business-value",
    title: "Business Value",
    description: "Real-world impact, adoption potential, and relevance.",
    benchmark:
      "There is a credible path to deployment, measurable impact, and a user segment with a strong reason to adopt.",
    defaultScore: ""
  }
];

export const quickNotes = [
  "Great story",
  "Needs clarity",
  "Solid tech",
  "Polished demo",
  "Strong accessibility",
  "Market-ready"
];

export const projects: Project[] = [
  {
    slug: "eco-track-ai",
    name: "EcoTrack AI",
    teamName: "Team GreenHorizon",
    track: "Sustainability",
    booth: "Booth 204",
    boothLocation: "Level 2, Hall B",
    status: "in-progress",
    score: 88.5,
    judgingProgress: 30,
    pitch:
      "Real-time carbon footprint analysis using satellite imagery and computer vision to empower sustainable urban planning.",
    summary:
      "An AI-powered dashboard for tracking local carbon footprints with actionable insights for city operators.",
    heroImage:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["OpenAI GPT-4V", "Next.js", "Tailwind CSS", "Planet API", "Python", "FastAPI"],
    description: [
      "Climate goals are typically defined at the regional level, but local governments still lack high-resolution data they can act on block by block.",
      "EcoTrack AI combines satellite imagery, permit metadata, and large vision models to create a living carbon signal for the built environment.",
      "The team designed the interface to make pattern recognition immediate for judges and future city planners alike."
    ],
    links: {
      github: "https://github.com/example/eco-track-ai",
      demo: "https://demo.example.com/eco-track-ai"
    },
    team: [
      {
        name: "Alex Rivera",
        role: "ML Engineer",
        initials: "AR",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
      },
      {
        name: "Sarah Chen",
        role: "Frontend Architect",
        initials: "SC",
        avatar:
          "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=240&q=80"
      },
      {
        name: "David Okafor",
        role: "Data Scientist",
        initials: "DO",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Finalist",
    tags: ["Prototype", "Satellite", "Climate"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Updated 18 minutes ago"
  },
  {
    slug: "neural-health-assistant",
    name: "NeuralHealth Assistant",
    teamName: "CyberFlow",
    track: "AI & ML",
    booth: "Booth 104",
    boothLocation: "Level 1, Hall A",
    status: "scored",
    score: 94.1,
    judgingProgress: 100,
    pitch:
      "A real-time AI diagnostic tool that flags early neurodegenerative signals using a standard mobile camera.",
    summary:
      "Mobile-first assessments and clinician-ready reports for earlier intervention.",
    heroImage:
      "https://images.unsplash.com/photo-1532187643603-ba119ca4109e?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=900&q=80",
      "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["PyTorch", "React Native", "Supabase", "Vision AI"],
    description: [
      "The app converts subtle movement and speech markers into structured evidence clinicians can review quickly.",
      "It is designed for low-friction screening in community health settings with limited specialist access."
    ],
    links: {
      github: "https://github.com/example/neural-health-assistant",
      demo: "https://demo.example.com/neural-health-assistant"
    },
    team: [
      {
        name: "Mina Patel",
        role: "Research Lead",
        initials: "MP",
        avatar:
          "https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?auto=format&fit=crop&w=240&q=80"
      },
      {
        name: "Ethan Brooks",
        role: "Mobile Engineer",
        initials: "EB",
        avatar:
          "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Scored",
    tags: ["Healthcare", "Mobile", "Diagnostics"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Updated 2 hours ago"
  },
  {
    slug: "micro-lend-dao",
    name: "MicroLend DAO",
    teamName: "Decentral",
    track: "Fintech",
    booth: "Booth 205",
    boothLocation: "Level 2, Hall A",
    status: "not-started",
    score: 0,
    judgingProgress: 0,
    pitch:
      "Peer-to-peer micro-lending for underbanked founders using transparent algorithmic risk scoring.",
    summary:
      "Smart-contract lending pools and borrower trust signals designed for emerging markets.",
    heroImage:
      "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1556740749-887f6717d7e4?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["Solidity", "Rust", "GraphQL", "Next.js"],
    description: [
      "The team created auditable borrower reputation layers and community-backed underwriting experiments.",
      "The judging flow focuses on how clearly the risk model is explained and whether the prototype demonstrates actual borrower journeys."
    ],
    links: {
      github: "https://github.com/example/micro-lend-dao",
      demo: "https://demo.example.com/micro-lend-dao"
    },
    team: [
      {
        name: "Jonah Vale",
        role: "Protocol Engineer",
        initials: "JV",
        avatar:
          "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=240&q=80"
      },
      {
        name: "Priya Rao",
        role: "Product Strategist",
        initials: "PR",
        avatar:
          "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Queued",
    tags: ["DeFi", "Lending", "Risk"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Awaiting first review"
  },
  {
    slug: "sync-med-vr",
    name: "SyncMed VR",
    teamName: "RealityCheck",
    track: "Healthtech",
    booth: "Booth 411",
    boothLocation: "Level 4, Demo Arena",
    status: "scored",
    score: 88.0,
    judgingProgress: 100,
    pitch:
      "VR surgery drills that adapt training difficulty in real time based on precision, pace, and recovery behavior.",
    summary:
      "Immersive practice sessions for teams training on rare but high-risk procedures.",
    heroImage:
      "https://images.unsplash.com/photo-1581091870622-9e7ecdbd70b5?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["Unity", "Meta SDK", "C#", "Firebase"],
    description: [
      "SyncMed VR combines performance telemetry with procedural checkpoints so mentors can review progress without attending every session."
    ],
    links: {
      github: "https://github.com/example/sync-med-vr",
      demo: "https://demo.example.com/sync-med-vr"
    },
    team: [
      {
        name: "Lena Ortiz",
        role: "XR Designer",
        initials: "LO",
        avatar:
          "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Scored",
    tags: ["XR", "Training", "Simulation"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Submitted final notes"
  },
  {
    slug: "insightflow-ai",
    name: "InsightFlow AI",
    teamName: "Neural Wizards",
    track: "AI & ML",
    booth: "Booth 110",
    boothLocation: "Level 1, Hall A",
    status: "scored",
    score: 92.0,
    judgingProgress: 100,
    pitch:
      "Board-ready analytics that summarize multi-source product telemetry into decision-focused insights.",
    summary:
      "An executive signal layer for product teams buried in dashboards.",
    heroImage:
      "https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["Next.js", "Python", "Snowflake", "OpenAI"],
    description: [
      "The product reframes analytics as narrative decision prompts and explains uncertainty directly inside the dashboard."
    ],
    links: {
      github: "https://github.com/example/insightflow-ai",
      demo: "https://demo.example.com/insightflow-ai"
    },
    team: [
      {
        name: "Noah Kim",
        role: "Data Platform",
        initials: "NK",
        avatar:
          "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Finalist",
    tags: ["Analytics", "B2B", "Narrative"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Published to finalists board"
  },
  {
    slug: "nebula-wallet",
    name: "Nebula Wallet",
    teamName: "Stardust Devs",
    track: "Fintech",
    booth: "Booth 302",
    boothLocation: "Level 3, Hall C",
    status: "scored",
    score: 96.5,
    judgingProgress: 100,
    pitch:
      "A self-custody wallet that coaches users through safe transactions with contextual AI prompts.",
    summary:
      "Security education and transaction guidance without sacrificing speed.",
    heroImage:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["Next.js", "Wagmi", "TypeScript", "Solidity"],
    description: [
      "Nebula Wallet pairs transaction previews, risk explanations, and clear fallback paths for new web3 users."
    ],
    links: {
      github: "https://github.com/example/nebula-wallet",
      demo: "https://demo.example.com/nebula-wallet"
    },
    team: [
      {
        name: "Aisha Bell",
        role: "Security Lead",
        initials: "AB",
        avatar:
          "https://images.unsplash.com/photo-1545239351-1141bd82e8a6?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Finalist",
    tags: ["Wallet", "Security", "Onboarding"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Locked for awards"
  },
  {
    slug: "project-alpha",
    name: "Project Alpha",
    teamName: "Alpha Squadron",
    track: "AI & ML",
    booth: "Booth 119",
    boothLocation: "Level 1, Hall B",
    status: "scored",
    score: 88.5,
    judgingProgress: 100,
    pitch:
      "Context-aware copilots for industrial maintenance teams working across mixed hardware fleets.",
    summary:
      "A field technician assistant with multimodal inspection guidance.",
    heroImage:
      "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1520607162513-77705c0f0d4a?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["React", "Python", "Whisper", "Neo4j"],
    description: [
      "Alpha reduces the time it takes new technicians to handle uncommon repair sequences."
    ],
    links: {
      github: "https://github.com/example/project-alpha",
      demo: "https://demo.example.com/project-alpha"
    },
    team: [
      {
        name: "Samir Shah",
        role: "Product Lead",
        initials: "SS",
        avatar:
          "https://images.unsplash.com/photo-1504593811423-6dd665756598?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Tie-break",
    tags: ["Industrial", "Copilot", "Operations"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Needs tie-break decision"
  },
  {
    slug: "project-delta",
    name: "Project Delta",
    teamName: "Delta Force",
    track: "Sustainability",
    booth: "Booth 122",
    boothLocation: "Level 1, Hall B",
    status: "scored",
    score: 88.5,
    judgingProgress: 100,
    pitch:
      "IoT-linked community energy trading for apartment buildings with dynamic pricing recommendations.",
    summary:
      "Resident-level energy balancing with transparent incentives.",
    heroImage:
      "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=1400&q=80",
    gallery: [
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=900&q=80"
    ],
    techStack: ["Next.js", "Solidity", "IoT", "Postgres"],
    description: [
      "Delta makes trading excess building energy understandable for non-technical residents."
    ],
    links: {
      github: "https://github.com/example/project-delta",
      demo: "https://demo.example.com/project-delta"
    },
    team: [
      {
        name: "Tara Morgan",
        role: "Energy Systems",
        initials: "TM",
        avatar:
          "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=240&q=80"
      }
    ],
    submissionStatus: "Tie-break",
    tags: ["Energy", "IoT", "Marketplace"],
    assignedJudge: "Rajeev Gill",
    lastUpdated: "Needs tie-break decision"
  }
];

export const scoreboard: ScoreboardEntry[] = [
  { slug: "nebula-wallet", rank: 1, status: "finalist", score: 96.5, label: "Finalist" },
  { slug: "insightflow-ai", rank: 2, status: "finalist", score: 92.0, label: "Finalist" },
  { slug: "project-alpha", rank: 3, status: "tied", score: 88.5, label: "Tied (3rd)" },
  { slug: "project-delta", rank: 4, status: "tied", score: 88.5, label: "Tied (3rd)" },
  { slug: "eco-track-ai", rank: 5, status: "qualified", score: 88.5, label: "Qualified" },
  { slug: "sync-med-vr", rank: 6, status: "qualified", score: 88.0, label: "Qualified" },
  {
    slug: "neural-health-assistant",
    rank: 7,
    status: "qualified",
    score: 87.4,
    label: "Qualified"
  }
];

export const tieBreakCases: TieBreakCase[] = [
  {
    id: "third-place",
    label: "3rd Place Tie",
    leftProject: "Project Alpha",
    rightProject: "Project Delta",
    score: 88.5,
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=700&q=80"
  },
  {
    id: "fifth-place",
    label: "5th Place Tie",
    leftProject: "EcoTrack AI",
    rightProject: "SyncMed VR",
    score: 88.0,
    image:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=700&q=80"
  }
];

export const assetDraft: AssetDraft = {
  projectSlug: "eco-track-ai",
  videoDemo: "https://youtube.com/watch?v=eco-track-demo",
  screenshots: projects[0].gallery.slice(0, 2),
  hasHeroImage: false,
  readinessTip:
    "Projects with a clear video demo and at least 3 screenshots consistently rank higher in the technical review phase."
};

const projectMap = new Map(projects.map((project) => [project.slug, project]));

export function getProjectBySlug(slug: string) {
  return projectMap.get(slug);
}
