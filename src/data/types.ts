export type UseCaseStatus = 'draft' | 'submitted' | 'under-review' | 'approved' | 'in-development' | 'deployed' | 'rejected';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type LifecycleStage = 'intake' | 'architecture-review' | 'pod-assignment' | 'development' | 'testing' | 'deployment' | 'live';
export type ApprovalStatus = 'approved' | 'pending' | 'rejected' | 'info-requested';
export type ApprovalType = 'idtQualification' | 'ideAcceptance' | 'architectureReview' | 'deploymentApproval' | 'cisoReview';
export type ExperimentStatus = 'running' | 'completed' | 'failed' | 'queued' | 'archived';
export type ComponentStatus = 'stable' | 'beta' | 'deprecated';
export type DataSourceType = 'Structured' | 'Unstructured' | 'Streaming';
export type AlertSeverity = 'critical' | 'warning' | 'info';
export type DeploymentEnv = 'Development' | 'Staging' | 'Production';
export type DeploymentStatus = 'ready' | 'deploying' | 'deployed' | 'rollback-required';

export type PersonaId = 'business-sponsor' | 'business-sme' | 'idt-gm' | 'idt-advisor' | 'ide-gm' | 'ide-pm' | 'pod-member' | 'wipro-delivery' | 'idso-gm' | 'idso-pm';
export type PersonaLayer = 'Business' | 'IDT' | 'IDE' | 'IDE / Wipro' | 'IDSO';

// ─── RBAC Permission Types ───
export type Permission = 'view' | 'edit' | 'approve' | 'deploy' | 'configure';

export interface PersonaDef {
  id: PersonaId;
  name: string;
  role: string;
  layer: PersonaLayer;
  avatar: string;
  accessModules: string[];
  kpis: string[];
  permissions: Permission[];
}

export interface Person {
  id: string;
  name: string;
  avatar?: string;
  wipro?: boolean;
}

export interface UseCaseApproval {
  step: number;
  type: ApprovalType;
  status: ApprovalStatus;
  approvedBy?: string;
  approvedAt?: string;
  comments?: string;
}

export interface StageHistoryEntry {
  stage: LifecycleStage;
  completedAt: string;
  completedBy: string;
  notes: string;
}

export interface UseCase {
  id: string;
  title: string;
  businessVertical: string;
  businessLine: string;
  painPoint: string;
  submittedBy: { personaId: PersonaId; name: string; layer: PersonaLayer };
  submittedAt: string;
  status: UseCaseStatus;
  priorityRank: number;
  priorityScore: number;
  riskLevel: RiskLevel;
  idtAdvisor: Person;
  ideManager: Person;
  podId: string | null;
  components: {
    total: number;
    reusable: number;
    netNew: number;
    reuseRatio: number;
    reusableItems: string[];
    netNewItems: string[];
  };
  costs: {
    poc: number;
    deployment: number;
    scaling: number;
    annualRunMaintain: number;
    cloudBreakdown: { compute: number; gpu: number; storage: number; networking: number };
  };
  lifecycle: {
    currentStage: LifecycleStage;
    sprintCurrent: number;
    sprintTotal: number;
    sprintCompletionPct: number;
    estimatedGoLive: string;
    stageHistory: StageHistoryEntry[];
  };
  approvals: UseCaseApproval[];
  missingFields: string[];
  completenessScore: number;
  tags: string[];
  idtNotes: string;
  aiClassification: { category: string; confidence: number; suggestedTags: string[] };
}

export interface PodMember extends Person {
  role: string;
}

export interface Pod {
  id: string;
  name: string;
  businessVertical: string;
  assignedUseCases: string[];
  team: {
    architect: Person & { wipro: boolean };
    developers: (Person & { wipro: boolean })[];
    testers: (Person & { wipro: boolean })[];
    scrumMaster: Person & { wipro: boolean };
  };
  wipro_pct: number;
  shell_pct: number;
  sprintVelocity: number;
  currentSprint: {
    number: number;
    startDate: string;
    endDate: string;
    plannedPoints: number;
    completedPoints: number;
    blockers: string[];
  };
  defectRate: number;
  buildSuccessRate: number;
}

export interface ComponentItem {
  id: string;
  name: string;
  category: string;
  version: string;
  owner: string;
  description: string;
  usedInUseCases: string[];
  usageCount: number;
  lastUpdated: string;
  tags: string[];
  status: ComponentStatus;
  buildTimeSaved: string;
  costSaved: number;
}

export interface BuildToTransferSnapshot {
  month: number;
  wipro: number;
  shell: number;
  milestone: string;
  projected?: boolean;
}

export interface BuildToTransfer {
  currentMonth: number;
  snapshots: BuildToTransferSnapshot[];
  target: { month: number; shell_pct: number };
  onTrack: boolean;
  shellCapabilityScore: number;
  trainingMilestones: { milestone: string; targetDate: string; status: string; completedDate?: string }[];
}

export interface CostAggregates {
  totalUseCases: number;
  activeDeliveries: number;
  totalPoCInvestment: number;
  totalDeploymentCost: number;
  totalScalingCost: number;
  totalAnnualRunCost: number;
  reusabilitySavings: number;
  avgReuseRatio: number;
  cloudConsumption: { compute: number; gpu: number; storage: number; networking: number };
}

export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  domain: string;
  owner: string;
  qualityScore: number;
  lastRefreshed: string;
  connectedUseCases: string[];
  status: string;
  rowCount: number;
  description: string;
  fields: { name: string; type: string; sample: string }[];
}

export interface Experiment {
  id: string;
  useCaseId: string;
  useCaseTitle: string;
  modelType: string;
  status: ExperimentStatus;
  metrics: Record<string, number>;
  createdAt: string;
  owner: string;
  hyperparameters: Record<string, string | number>;
  trainingDataset: { source: string; rowCount: number; split: string };
  features: { name: string; type: string; importance: number }[];
  epochs: { current: number; total: number };
  progressPct: number;
  versions: { version: string; accuracy: number; date: string; promoted: boolean }[];
}

export interface DeployedEndpoint {
  id: string;
  useCaseId: string;
  useCaseTitle: string;
  endpoint: string;
  environment: DeploymentEnv;
  version: string;
  status: DeploymentStatus;
  uptime: number;
  avgResponseTime: number;
  requestsPerDay: number;
  deployedAt: string;
}

// ─── Enhanced Alert with Traceability ───
export type AlertSource = 'ai-engine' | 'rule-engine' | 'system-monitor';
export type AlertOwnerRole = 'ide-gm' | 'ide-pm' | 'idso-gm' | 'idso-pm' | 'idt-gm' | 'business-sponsor';

export interface MonitoringAlert {
  id: string;
  endpointId: string;
  useCaseTitle: string;
  type: string;
  severity: AlertSeverity;
  message: string;
  timestamp: string;
  acknowledged: boolean;
  // Phase 2: Traceability & Explainability
  source: AlertSource;
  reason: string;
  ownerRole: AlertOwnerRole;
  impactedEntity: string;
  confidence?: number; // 0-100, for AI-sourced alerts
  suggestedAction?: string;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  persona: string;
  action: string;
  target: string;
  details: string;
  ip: string;
}

// ─── Global Filter Context ───
export type EnvironmentFilter = 'all' | 'Development' | 'Staging' | 'Production';
