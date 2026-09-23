import React, { useState } from 'react';
import { AlertTriangle, CheckCircle, Rocket } from 'lucide-react';
import { useApp, addToast } from '@/context/AppContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

const ENVIRONMENTS = ['Development', 'Staging', 'Production'] as const;
const AUTH_METHODS = ['OAuth', 'API Key', 'mTLS', 'Service Account'] as const;
const stepLabels = ['Select Model', 'Config', 'IDSO Notification', 'Deploy'];

export default function DeployModelWizard({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(0);

  // Step 1
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [environment, setEnvironment] = useState('Production');

  // Step 2
  const [endpointName, setEndpointName] = useState('api.shell-ai.internal/v1/uc-auto');
  const [authMethod, setAuthMethod] = useState('OAuth');
  const [rateLimit, setRateLimit] = useState(1000);
  const [slaTarget, setSlaTarget] = useState('250');

  // Step 3
  const [idsoEmail, setIdsoEmail] = useState('jessica.opsgm@shell.com');
  const [idsoAccepted, setIdsoAccepted] = useState(true);
  const [notifyTeams, setNotifyTeams] = useState({ cyberDefense: true, sreTier1: true });

  // Step 4
  const [deploying, setDeploying] = useState(false);
  const [deployComplete, setDeployComplete] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const approvedUseCases = state.useCases.filter(uc =>
    ['approved', 'in-development', 'deployed'].includes(uc.status)
  );

  const selectedUC = approvedUseCases.find(uc => uc.id === selectedUseCase);
  const isProd = environment === 'Production';

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!selectedUseCase) errs.useCase = 'Please select a use case / model';
    }
    if (s === 1) {
      if (!endpointName.trim()) errs.endpoint = 'Endpoint name is required';
    }
    if (s === 2 && isProd && !idsoAccepted) {
      errs.idso = 'IDSO acceptance is required for Production deployments';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const startDeploy = () => {
    setDeploying(true);
    setTimeout(() => {
      setDeploying(false);
      setDeployComplete(true);
      addToast(dispatch, 'success', 'Deployment Successful', `${selectedUC?.title} deployed to ${environment}`);
    }, 2500);
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedUseCase('');
    setEnvironment('Production');
    setEndpointName('api.shell-ai.internal/v1/uc-auto');
    setAuthMethod('OAuth');
    setRateLimit(1000);
    setSlaTarget('250');
    setIdsoEmail('jessica.opsgm@shell.com');
    setIdsoAccepted(true);
    setNotifyTeams({ cyberDefense: true, sreTier1: true });
    setDeploying(false);
    setDeployComplete(false);
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
          <SheetTitle className="text-xl font-display text-foreground">Deploy Model</SheetTitle>
          <SheetDescription className="sr-only">Deploy an AI model to an environment</SheetDescription>
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
                  <div className={`flex-1 h-px mx-3 mt-[-16px] ${i < step ? 'bg-accent-green' : 'bg-border-strong'}`} />
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
                <label className={labelClass}>Select Use Case / Model</label>
                <select value={selectedUseCase} onChange={e => setSelectedUseCase(e.target.value)} className={fieldClass('useCase')}>
                  <option value="">Select...</option>
                  {approvedUseCases.map(uc => (
                    <option key={uc.id} value={uc.id}>{uc.id} - {uc.title}</option>
                  ))}
                </select>
                {errors.useCase && <p className="text-xs text-destructive mt-1">{errors.useCase}</p>}
              </div>
              <div>
                <label className={labelClass}>Environment</label>
                <select value={environment} onChange={e => setEnvironment(e.target.value)} className={fieldClass('env')}>
                  {ENVIRONMENTS.map(env => <option key={env} value={env}>{env}</option>)}
                </select>
              </div>
              {isProd && (
                <div className="flex items-start gap-3 bg-accent-amber/10 border-l-4 border-accent-amber rounded-md p-4">
                  <AlertTriangle className="w-5 h-5 text-accent-amber shrink-0 mt-0.5" />
                  <p className="text-sm text-foreground">Deploying to Production requires IDSO Acceptance and will trigger alerts upon SLA mismatch.</p>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <div>
                <label className={labelClass}>Endpoint Name</label>
                <input value={endpointName} onChange={e => setEndpointName(e.target.value)} className={fieldClass('endpoint')} />
                {errors.endpoint && <p className="text-xs text-destructive mt-1">{errors.endpoint}</p>}
              </div>
              <div>
                <label className={labelClass}>Authentication Method</label>
                <select value={authMethod} onChange={e => setAuthMethod(e.target.value)} className={fieldClass('auth')}>
                  {AUTH_METHODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>Rate Limit (requests/min): {rateLimit}</label>
                <input
                  type="range"
                  min={100}
                  max={10000}
                  step={100}
                  value={rateLimit}
                  onChange={e => setRateLimit(Number(e.target.value))}
                  className="w-full accent-primary"
                />
              </div>
              <div>
                <label className={labelClass}>SLA Target Response Time (ms)</label>
                <input type="number" value={slaTarget} onChange={e => setSlaTarget(e.target.value)} className={fieldClass('sla')} min={50} max={5000} />
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>IDSO GM Notification Email</label>
                <input value={idsoEmail} onChange={e => setIdsoEmail(e.target.value)} className={fieldClass('idsoEmail')} />
              </div>
              <div className="bg-surface-elevated rounded-lg p-4 border-l-4 border-border-strong space-y-1">
                <p className="text-sm font-medium text-foreground"><strong>Run &amp; Maintain Projected Cost:</strong> $18,000 / yr</p>
                <p className="text-sm text-muted-foreground">This budget has been confirmed and locked.</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  role="switch"
                  aria-checked={idsoAccepted}
                  aria-label="Toggle IDSO acceptance"
                  onClick={() => setIdsoAccepted(!idsoAccepted)}
                  className={`w-12 h-6 rounded-full transition-colors ${idsoAccepted ? 'bg-accent-green' : 'bg-border-strong'}`}
                >
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${idsoAccepted ? 'translate-x-6' : 'translate-x-0.5'}`} />
                </button>
                <span className="text-sm text-foreground">IDSO Acceptance Required?</span>
              </div>
              {errors.idso && <p className="text-xs text-destructive">{errors.idso}</p>}
              <div className="space-y-2">
                <p className="text-sm font-medium text-foreground">Notify following Teams:</p>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={notifyTeams.cyberDefense} onChange={e => setNotifyTeams(t => ({ ...t, cyberDefense: e.target.checked }))} className="accent-primary w-4 h-4" />
                  Cyber Defense
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground cursor-pointer">
                  <input type="checkbox" checked={notifyTeams.sreTier1} onChange={e => setNotifyTeams(t => ({ ...t, sreTier1: e.target.checked }))} className="accent-primary w-4 h-4" />
                  SRE Tier 1 Support
                </label>
              </div>
            </>
          )}

          {step === 3 && (
            <>
              {!deploying && !deployComplete && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display text-foreground">Ready to Deploy to {environment}</h3>
                  <p className="text-sm text-muted-foreground font-mono">All pre-flight checks passed. Architecture approved.</p>
                  <div className="border border-border-subtle rounded-lg p-4 space-y-2 text-sm">
                    <p><strong className="text-foreground">Target:</strong> <span className="text-foreground">{environment} (Cluster A)</span></p>
                    <p><strong className="text-foreground">Endpoint:</strong> <span className="text-foreground">{endpointName}</span></p>
                  </div>
                </div>
              )}

              {deploying && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-live="polite">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-foreground">Deploying to {environment}...</p>
                </div>
              )}

              {deployComplete && (
                <div className="mt-4 bg-accent-green/10 border border-accent-green/30 rounded-md p-4 text-sm text-accent-green font-medium">
                  ✓ {selectedUC?.title} successfully deployed to {environment}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          {deployComplete ? (
            <button onClick={resetAndClose} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Done
            </button>
          ) : (
            <>
              <button onClick={step === 0 ? resetAndClose : handleBack} disabled={deploying} className="px-4 py-2 text-sm text-foreground hover:bg-surface-elevated rounded-md transition-colors disabled:opacity-50">
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 ? (
                <button onClick={handleNext} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  Next
                </button>
              ) : (
                <button onClick={startDeploy} disabled={deploying} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  <Rocket className="w-4 h-4" /> Start Deployment
                </button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
