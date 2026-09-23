import React, { useState } from 'react';
import { PlusCircle, CheckCircle } from 'lucide-react';
import { useApp, addToast } from '@/context/AppContext';
import { UseCase } from '@/data/types';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

const VERTICALS = ['IGUPT', 'Downstream', 'Renewables', 'Trading', 'Chemicals', 'Projects & Technology', 'Integrated Gas'];
const MODEL_TYPES = ['LLM / GenAI', 'Classical ML', 'Computer Vision', 'NLP', 'Predictive Analytics', 'Optimization'];
const DATA_CLASSIFICATIONS = ['Public', 'Internal', 'Confidential', 'Restricted'];

const stepLabels = ['Basic Info', 'Technical Context', 'Business Case', 'Review'];

export default function SubmitUseCaseWizard({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(0);

  const [title, setTitle] = useState('');
  const [vertical, setVertical] = useState('');
  const [businessLine, setBusinessLine] = useState('');
  const [painPoint, setPainPoint] = useState('');

  const [modelType, setModelType] = useState('');
  const [dataClassification, setDataClassification] = useState('');
  const [dataSources, setDataSources] = useState('');
  const [expectedUsers, setExpectedUsers] = useState('');

  const [estimatedValue, setEstimatedValue] = useState('');
  const [timeToValue, setTimeToValue] = useState('');
  const [sponsor, setSponsor] = useState('');
  const [urgency, setUrgency] = useState('medium');

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!title.trim()) errs.title = 'Use Case Title is required';
      if (!vertical) errs.vertical = 'Business Vertical is required';
      if (!painPoint.trim()) errs.painPoint = 'Pain Point Description is required';
    } else if (s === 1) {
      if (!modelType) errs.modelType = 'Model Type is required';
      if (!dataClassification) errs.dataClassification = 'Data Classification is required';
    } else if (s === 2) {
      if (!estimatedValue.trim()) errs.estimatedValue = 'Estimated annual value is required';
      if (!sponsor.trim()) errs.sponsor = 'Business Sponsor is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const handleSubmit = () => {
    const nextId = `UC-${String(state.useCases.length + 1).padStart(3, '0')}`;
    const newUseCase: UseCase = {
      id: nextId,
      title: title.trim(),
      businessVertical: vertical,
      businessLine: businessLine.trim() || 'General',
      painPoint: painPoint.trim(),
      submittedBy: { personaId: state.currentPersona, name: 'Current User', layer: 'Business' },
      submittedAt: new Date().toISOString(),
      status: 'submitted',
      priorityRank: state.useCases.length + 1,
      priorityScore: 50,
      riskLevel: 'medium',
      idtAdvisor: { id: 'P-004', name: 'Anika Patel' },
      ideManager: { id: 'P-006', name: 'Marcus Johnson' },
      podId: null,
      components: { total: 0, reusable: 0, netNew: 0, reuseRatio: 0, reusableItems: [], netNewItems: [] },
      costs: { poc: 0, deployment: 0, scaling: 0, annualRunMaintain: 0, cloudBreakdown: { compute: 0, gpu: 0, storage: 0, networking: 0 } },
      lifecycle: { currentStage: 'intake', sprintCurrent: 0, sprintTotal: 0, sprintCompletionPct: 0, estimatedGoLive: '', stageHistory: [] },
      approvals: [
        { step: 1, type: 'idtQualification', status: 'pending' },
        { step: 2, type: 'ideAcceptance', status: 'pending' },
        { step: 3, type: 'architectureReview', status: 'pending' },
        { step: 4, type: 'deploymentApproval', status: 'pending' },
      ],
      missingFields: [],
      completenessScore: 80,
      tags: [vertical.toLowerCase(), modelType.toLowerCase()],
      idtNotes: '',
      aiClassification: { category: modelType, confidence: 0.7, suggestedTags: [] },
    };
    dispatch({ type: 'ADD_USE_CASE', payload: newUseCase });
    addToast(dispatch, 'success', 'Use Case Submitted', `${nextId}: ${title.trim()} has been submitted for review.`);
    resetAndClose();
  };

  const resetAndClose = () => {
    setStep(0);
    setTitle(''); setVertical(''); setBusinessLine(''); setPainPoint('');
    setModelType(''); setDataClassification(''); setDataSources(''); setExpectedUsers('');
    setEstimatedValue(''); setTimeToValue(''); setSponsor(''); setUrgency('medium');
    setErrors({});
    onClose();
  };

  const fieldClass = (name: string) =>
    `w-full border rounded-md px-3 py-2.5 text-sm text-foreground bg-surface-card focus:outline-none focus:ring-2 focus:ring-ring ${errors[name] ? 'border-destructive' : 'border-border-subtle'}`;

  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) resetAndClose(); }}>
      <SheetContent side="right-wide" className="flex flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="px-6 py-4 border-b border-border-subtle">
          <SheetTitle className="text-xl font-display text-foreground">Submit New Use Case</SheetTitle>
          <SheetDescription className="sr-only">Submit a new AI use case for review</SheetDescription>
        </SheetHeader>

        {/* Stepper */}
        <div className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            {stepLabels.map((label, i) => (
              <div key={i} className="flex items-center flex-1 last:flex-initial">
                <div className="flex flex-col items-center">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium border-2 transition-colors ${
                    i < step ? 'bg-accent-green border-accent-green text-white' :
                    i === step ? 'border-accent-blue text-accent-blue bg-surface-card' :
                    'border-border-strong text-muted-foreground bg-surface-card'
                  }`}>
                    {i < step ? <CheckCircle className="w-4 h-4" /> : i + 1}
                  </div>
                  <span className={`text-xs mt-1.5 whitespace-nowrap ${i === step ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>{label}</span>
                </div>
                {i < stepLabels.length - 1 && (
                  <div className={`flex-1 h-px mx-3 mt-[-16px] ${i < step ? 'bg-primary' : 'bg-border-strong'}`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
          {step === 0 && (
            <>
              <div>
                <label className={labelClass}>Use Case Title <span className="text-destructive">*</span></label>
                <input value={title} onChange={e => setTitle(e.target.value)} className={fieldClass('title')} maxLength={120} />
                {errors.title && <p className="text-xs text-destructive mt-1">{errors.title}</p>}
              </div>
              <div>
                <label className={labelClass}>Business Vertical <span className="text-destructive">*</span></label>
                <select value={vertical} onChange={e => setVertical(e.target.value)} className={fieldClass('vertical')}>
                  <option value="">Select...</option>
                  {VERTICALS.map(v => <option key={v} value={v}>{v}</option>)}
                </select>
                {errors.vertical && <p className="text-xs text-destructive mt-1">{errors.vertical}</p>}
              </div>
              <div>
                <label className={labelClass}>Business Line</label>
                <input value={businessLine} onChange={e => setBusinessLine(e.target.value)} className={fieldClass('businessLine')} maxLength={100} />
              </div>
              <div>
                <label className={labelClass}>Pain Point Description <span className="text-destructive">*</span></label>
                <textarea value={painPoint} onChange={e => setPainPoint(e.target.value)} rows={4} className={fieldClass('painPoint')} placeholder="Describe the current process and challenges..." maxLength={1000} />
                {errors.painPoint && <p className="text-xs text-destructive mt-1">{errors.painPoint}</p>}
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={labelClass}>AI/ML Model Type <span className="text-destructive">*</span></label>
                <select value={modelType} onChange={e => setModelType(e.target.value)} className={fieldClass('modelType')}>
                  <option value="">Select...</option>
                  {MODEL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.modelType && <p className="text-xs text-destructive mt-1">{errors.modelType}</p>}
              </div>
              <div>
                <label className={labelClass}>Data Classification <span className="text-destructive">*</span></label>
                <select value={dataClassification} onChange={e => setDataClassification(e.target.value)} className={fieldClass('dataClassification')}>
                  <option value="">Select...</option>
                  {DATA_CLASSIFICATIONS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                {errors.dataClassification && <p className="text-xs text-destructive mt-1">{errors.dataClassification}</p>}
              </div>
              <div>
                <label className={labelClass}>Key Data Sources</label>
                <textarea value={dataSources} onChange={e => setDataSources(e.target.value)} rows={3} className={fieldClass('dataSources')} placeholder="List primary data sources (e.g., SAP, OSIsoft PI, internal APIs...)" maxLength={500} />
              </div>
              <div>
                <label className={labelClass}>Expected Number of Users</label>
                <input type="number" value={expectedUsers} onChange={e => setExpectedUsers(e.target.value)} className={fieldClass('expectedUsers')} placeholder="e.g., 50" min={0} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>Estimated Annual Value (USD) <span className="text-destructive">*</span></label>
                <input value={estimatedValue} onChange={e => setEstimatedValue(e.target.value)} className={fieldClass('estimatedValue')} placeholder="e.g., $500,000" maxLength={50} />
                {errors.estimatedValue && <p className="text-xs text-destructive mt-1">{errors.estimatedValue}</p>}
              </div>
              <div>
                <label className={labelClass}>Time to Value</label>
                <select value={timeToValue} onChange={e => setTimeToValue(e.target.value)} className={fieldClass('timeToValue')}>
                  <option value="">Select...</option>
                  <option value="1-3 months">1–3 months</option>
                  <option value="3-6 months">3–6 months</option>
                  <option value="6-12 months">6–12 months</option>
                  <option value="12+ months">12+ months</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>Business Sponsor <span className="text-destructive">*</span></label>
                <input value={sponsor} onChange={e => setSponsor(e.target.value)} className={fieldClass('sponsor')} placeholder="Name of executive sponsor" maxLength={100} />
                {errors.sponsor && <p className="text-xs text-destructive mt-1">{errors.sponsor}</p>}
              </div>
              <div>
                <label className={labelClass}>Urgency Level</label>
                <select value={urgency} onChange={e => setUrgency(e.target.value)} className={fieldClass('urgency')}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-display text-foreground">Review Your Submission</h3>
              <div className="bg-surface-elevated rounded-lg p-4 space-y-3 text-sm">
                <Row label="Title" value={title} />
                <Row label="Vertical" value={vertical} />
                <Row label="Business Line" value={businessLine || '—'} />
                <Row label="Pain Point" value={painPoint} />
              </div>
              <div className="bg-surface-elevated rounded-lg p-4 space-y-3 text-sm">
                <Row label="Model Type" value={modelType} />
                <Row label="Data Classification" value={dataClassification} />
                <Row label="Data Sources" value={dataSources || '—'} />
                <Row label="Expected Users" value={expectedUsers || '—'} />
              </div>
              <div className="bg-surface-elevated rounded-lg p-4 space-y-3 text-sm">
                <Row label="Estimated Value" value={estimatedValue} />
                <Row label="Time to Value" value={timeToValue || '—'} />
                <Row label="Sponsor" value={sponsor} />
                <Row label="Urgency" value={urgency} />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          <button onClick={step === 0 ? resetAndClose : handleBack} className="px-4 py-2 text-sm text-foreground hover:bg-surface-elevated rounded-md transition-colors">
            {step === 0 ? 'Cancel' : 'Back'}
          </button>
          {step < 3 ? (
            <button onClick={handleNext} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Next Step
            </button>
          ) : (
            <button onClick={handleSubmit} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Submit Use Case
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-muted-foreground w-36 shrink-0">{label}</span>
      <span className="text-foreground">{value}</span>
    </div>
  );
}
