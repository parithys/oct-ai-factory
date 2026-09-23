import React, { useState } from 'react';
import { CheckCircle, FlaskConical } from 'lucide-react';
import { useApp, addToast } from '@/context/AppContext';
import { dataSources } from '@/data/mockData';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';

interface Props {
  open: boolean;
  onClose: () => void;
}

const MODEL_TYPES = [
  'LSTM Time Series', 'XGBoost Classifier', 'GPT-4 Fine-tune', 'Random Forest',
  'Reinforcement Learning', 'Transformer Encoder', 'Gradient Boosted Trees', 'CNN Image Classifier',
] as const;

const OPTIMIZERS = ['Adam', 'AdamW', 'SGD', 'RMSProp'] as const;
const DATA_SPLITS = ['70/15/15', '80/10/10', '75/15/10', '60/20/20'] as const;

const stepLabels = ['Use Case & Model', 'Hyperparameters', 'Dataset', 'Review & Launch'];

export default function NewExperimentWizard({ open, onClose }: Props) {
  const { state, dispatch } = useApp();
  const [step, setStep] = useState(0);

  // Step 1
  const [selectedUseCase, setSelectedUseCase] = useState('');
  const [modelType, setModelType] = useState('');
  const [experimentName, setExperimentName] = useState('');

  // Step 2
  const [learningRate, setLearningRate] = useState('0.001');
  const [batchSize, setBatchSize] = useState('64');
  const [epochs, setEpochs] = useState('50');
  const [optimizer, setOptimizer] = useState('Adam');
  const [dropout, setDropout] = useState('0.2');
  const [hiddenUnits, setHiddenUnits] = useState('128');

  // Step 3
  const [dataSource, setDataSource] = useState('');
  const [dataSplit, setDataSplit] = useState('70/15/15');
  const [featureSelection, setFeatureSelection] = useState<string[]>([]);

  // Step 4
  const [launching, setLaunching] = useState(false);
  const [launchComplete, setLaunchComplete] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const eligibleUseCases = state.useCases.filter(uc =>
    ['approved', 'in-development', 'deployed'].includes(uc.status)
  );

  const selectedUC = eligibleUseCases.find(uc => uc.id === selectedUseCase);
  const selectedDS = dataSources.find(ds => ds.id === dataSource);

  const validateStep = (s: number): boolean => {
    const errs: Record<string, string> = {};
    if (s === 0) {
      if (!selectedUseCase) errs.useCase = 'Please select a use case';
      if (!modelType) errs.modelType = 'Please select a model type';
    }
    if (s === 2) {
      if (!dataSource) errs.dataSource = 'Please select a data source';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (!validateStep(step)) return;
    setStep(s => s + 1);
  };

  const handleBack = () => setStep(s => Math.max(0, s - 1));

  const launchExperiment = () => {
    setLaunching(true);
    const expId = `EXP-${String(Math.floor(Math.random() * 900) + 100).padStart(3, '0')}`;
    setTimeout(() => {
      setLaunching(false);
      setLaunchComplete(true);
      addToast(dispatch, 'success', 'Experiment Launched', `${expId} — ${modelType} on ${selectedUC?.title}`);
    }, 2000);
  };

  const resetAndClose = () => {
    setStep(0);
    setSelectedUseCase('');
    setModelType('');
    setExperimentName('');
    setLearningRate('0.001');
    setBatchSize('64');
    setEpochs('50');
    setOptimizer('Adam');
    setDropout('0.2');
    setHiddenUnits('128');
    setDataSource('');
    setDataSplit('70/15/15');
    setFeatureSelection([]);
    setLaunching(false);
    setLaunchComplete(false);
    setErrors({});
    onClose();
  };

  const fieldClass = (name: string) =>
    `w-full border rounded-md px-3 py-2.5 text-sm text-foreground bg-surface-card focus:outline-none focus:ring-2 focus:ring-ring ${errors[name] ? 'border-destructive' : 'border-border-subtle'}`;

  const labelClass = 'block text-sm font-medium text-foreground mb-1';

  const toggleFeature = (f: string) => {
    setFeatureSelection(prev => prev.includes(f) ? prev.filter(x => x !== f) : [...prev, f]);
  };

  return (
    <Sheet open={open} onOpenChange={(isOpen) => { if (!isOpen) resetAndClose(); }}>
      <SheetContent side="right-wide" className="flex flex-col p-0 sm:max-w-2xl">
        <SheetHeader className="px-6 py-4 border-b border-border-subtle">
          <SheetTitle className="text-xl font-display text-foreground">New Experiment</SheetTitle>
          <SheetDescription className="sr-only">Create and launch a new ML experiment</SheetDescription>
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
                <label className={labelClass}>Use Case</label>
                <select value={selectedUseCase} onChange={e => setSelectedUseCase(e.target.value)} className={fieldClass('useCase')}>
                  <option value="">Select a use case...</option>
                  {eligibleUseCases.map(uc => (
                    <option key={uc.id} value={uc.id}>{uc.id} — {uc.title}</option>
                  ))}
                </select>
                {errors.useCase && <p className="text-xs text-destructive mt-1">{errors.useCase}</p>}
              </div>
              <div>
                <label className={labelClass}>Model Type</label>
                <select value={modelType} onChange={e => setModelType(e.target.value)} className={fieldClass('modelType')}>
                  <option value="">Select model type...</option>
                  {MODEL_TYPES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                {errors.modelType && <p className="text-xs text-destructive mt-1">{errors.modelType}</p>}
              </div>
              <div>
                <label className={labelClass}>Experiment Name <span className="text-muted-foreground font-normal">(optional)</span></label>
                <input value={experimentName} onChange={e => setExperimentName(e.target.value)} placeholder="e.g. Well LSTM v2 with dropout tuning" className={fieldClass('name')} />
              </div>
              {selectedUC && (
                <div className="bg-surface-elevated rounded-lg p-4 space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Selected Use Case</p>
                  <p className="text-sm font-medium text-foreground">{selectedUC.title}</p>
                  <p className="text-xs text-muted-foreground">{selectedUC.businessVertical} · {selectedUC.businessLine} · Risk: {selectedUC.riskLevel}</p>
                </div>
              )}
            </>
          )}

          {step === 1 && (
            <>
              <p className="text-sm text-muted-foreground">Configure hyperparameters for <strong className="text-foreground">{modelType}</strong></p>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Learning Rate</label>
                  <input type="number" step="0.0001" value={learningRate} onChange={e => setLearningRate(e.target.value)} className={fieldClass('lr')} />
                </div>
                <div>
                  <label className={labelClass}>Batch Size</label>
                  <input type="number" value={batchSize} onChange={e => setBatchSize(e.target.value)} className={fieldClass('bs')} />
                </div>
                <div>
                  <label className={labelClass}>Epochs</label>
                  <input type="number" value={epochs} onChange={e => setEpochs(e.target.value)} className={fieldClass('ep')} />
                </div>
                <div>
                  <label className={labelClass}>Optimizer</label>
                  <select value={optimizer} onChange={e => setOptimizer(e.target.value)} className={fieldClass('opt')}>
                    {OPTIMIZERS.map(o => <option key={o} value={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Dropout</label>
                  <input type="number" step="0.05" min="0" max="0.9" value={dropout} onChange={e => setDropout(e.target.value)} className={fieldClass('drop')} />
                </div>
                <div>
                  <label className={labelClass}>Hidden Units</label>
                  <input type="number" value={hiddenUnits} onChange={e => setHiddenUnits(e.target.value)} className={fieldClass('hu')} />
                </div>
              </div>
            </>
          )}

          {step === 2 && (
            <>
              <div>
                <label className={labelClass}>Training Data Source</label>
                <select value={dataSource} onChange={e => setDataSource(e.target.value)} className={fieldClass('dataSource')}>
                  <option value="">Select data source...</option>
                  {dataSources.map(ds => (
                    <option key={ds.id} value={ds.id}>{ds.name} — {ds.type} ({(ds.rowCount / 1000000).toFixed(1)}M rows)</option>
                  ))}
                </select>
                {errors.dataSource && <p className="text-xs text-destructive mt-1">{errors.dataSource}</p>}
              </div>
              <div>
                <label className={labelClass}>Train / Validation / Test Split</label>
                <select value={dataSplit} onChange={e => setDataSplit(e.target.value)} className={fieldClass('split')}>
                  {DATA_SPLITS.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </div>
              {selectedDS && (
                <>
                  <div className="bg-surface-elevated rounded-lg p-4 space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Data Source Details</p>
                    <p className="text-sm font-medium text-foreground">{selectedDS.name}</p>
                    <p className="text-xs text-muted-foreground">{selectedDS.description}</p>
                    <div className="flex gap-3 mt-2">
                      <span className="text-xs bg-accent-green/10 text-accent-green px-2 py-0.5 rounded-full">Quality: {selectedDS.qualityScore}%</span>
                      <span className="text-xs bg-muted text-foreground px-2 py-0.5 rounded-full">{selectedDS.rowCount.toLocaleString()} rows</span>
                    </div>
                  </div>
                  <div>
                    <label className={labelClass}>Feature Selection</label>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedDS.fields.map(f => (
                        <label key={f.name} className="flex items-center gap-2 text-sm text-foreground cursor-pointer bg-surface-elevated rounded-md p-2.5 border border-border-subtle hover:bg-muted transition-colors">
                          <input
                            type="checkbox"
                            checked={featureSelection.includes(f.name)}
                            onChange={() => toggleFeature(f.name)}
                            className="accent-primary w-4 h-4"
                          />
                          <div>
                            <span className="font-mono text-xs">{f.name}</span>
                            <span className="text-xs text-muted-foreground ml-1">({f.type})</span>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </>
          )}

          {step === 3 && (
            <>
              {!launching && !launchComplete && (
                <div className="space-y-4">
                  <h3 className="text-lg font-display text-foreground">Experiment Summary</h3>
                  <div className="border border-border-subtle rounded-lg divide-y divide-border-subtle text-sm">
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Use Case</span>
                      <span className="text-foreground font-medium">{selectedUC?.id} — {selectedUC?.title}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Model Type</span>
                      <span className="text-foreground font-medium">{modelType}</span>
                    </div>
                    {experimentName && (
                      <div className="flex justify-between p-3">
                        <span className="text-muted-foreground">Name</span>
                        <span className="text-foreground font-medium">{experimentName}</span>
                      </div>
                    )}
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Learning Rate</span>
                      <span className="text-foreground font-mono">{learningRate}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Batch Size / Epochs</span>
                      <span className="text-foreground font-mono">{batchSize} / {epochs}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Optimizer / Dropout</span>
                      <span className="text-foreground font-mono">{optimizer} / {dropout}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Data Source</span>
                      <span className="text-foreground font-medium">{selectedDS?.name}</span>
                    </div>
                    <div className="flex justify-between p-3">
                      <span className="text-muted-foreground">Split</span>
                      <span className="text-foreground font-mono">{dataSplit}</span>
                    </div>
                    {featureSelection.length > 0 && (
                      <div className="p-3">
                        <span className="text-muted-foreground block mb-2">Features ({featureSelection.length})</span>
                        <div className="flex flex-wrap gap-1">
                          {featureSelection.map(f => (
                            <span key={f} className="text-xs bg-surface-elevated px-2 py-0.5 rounded-full font-mono text-foreground border border-border-subtle">{f}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {launching && (
                <div className="flex flex-col items-center justify-center py-12 space-y-4" role="status" aria-live="polite">
                  <div className="w-10 h-10 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-foreground">Launching experiment...</p>
                  <p className="text-xs text-muted-foreground">Provisioning GPU compute and loading dataset</p>
                </div>
              )}

              {launchComplete && (
                <div className="mt-4 bg-accent-green/10 border border-accent-green/30 rounded-md p-4 text-sm text-accent-green font-medium">
                  ✓ Experiment launched successfully — {modelType} on {selectedUC?.title}. Training has started and you can monitor progress in the experiment detail view.
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-border-subtle">
          {launchComplete ? (
            <button onClick={resetAndClose} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
              Done
            </button>
          ) : (
            <>
              <button onClick={step === 0 ? resetAndClose : handleBack} disabled={launching} className="px-4 py-2 text-sm text-foreground hover:bg-surface-elevated rounded-md transition-colors disabled:opacity-50">
                {step === 0 ? 'Cancel' : 'Back'}
              </button>
              {step < 3 ? (
                <button onClick={handleNext} className="px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity">
                  Next
                </button>
              ) : (
                <button onClick={launchExperiment} disabled={launching} className="flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50">
                  <FlaskConical className="w-4 h-4" /> Launch Experiment
                </button>
              )}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
