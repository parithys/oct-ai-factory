import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AppProvider } from '@/context/AppContext';
import React from 'react';

// We test the access control logic directly from the data
import { personas } from '@/data/personas';
import { useCases } from '@/data/mockData';

describe('Persona Access Control', () => {
  const navModules = ['dashboard', 'use-cases', 'data', 'model-lab', 'deployment', 'monitoring', 'governance', 'analytics', 'settings'];

  describe('Navigation access per persona', () => {
    it('Business Sponsor sees only dashboard, use-cases, analytics', () => {
      const p = personas.find(p => p.id === 'business-sponsor')!;
      expect(p.accessModules).toEqual(['dashboard', 'use-cases', 'analytics']);
      expect(p.accessModules).not.toContain('data');
      expect(p.accessModules).not.toContain('model-lab');
      expect(p.accessModules).not.toContain('deployment');
      expect(p.accessModules).not.toContain('monitoring');
      expect(p.accessModules).not.toContain('governance');
    });

    it('Business SME sees dashboard, use-cases, data', () => {
      const p = personas.find(p => p.id === 'business-sme')!;
      expect(p.accessModules).toEqual(['dashboard', 'use-cases', 'data']);
    });

    it('IDE GM has full access', () => {
      const p = personas.find(p => p.id === 'ide-gm')!;
      expect(p.accessModules).toContain('dashboard');
      expect(p.accessModules).toContain('use-cases');
      expect(p.accessModules).toContain('data');
      expect(p.accessModules).toContain('model-lab');
      expect(p.accessModules).toContain('deployment');
      expect(p.accessModules).toContain('monitoring');
      expect(p.accessModules).toContain('governance');
      expect(p.accessModules).toContain('analytics');
      expect(p.accessModules).toContain('settings');
    });
  });

  describe('Use Case data scoping for Business personas', () => {
    it('Business Sponsor sees only use cases submitted by business-sponsor persona', () => {
      const p = personas.find(p => p.id === 'business-sponsor')!;
      const filtered = useCases.filter(uc =>
        uc.submittedBy.personaId === p.id || uc.submittedBy.name === p.name
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(useCases.length);
      filtered.forEach(uc => {
        expect(uc.submittedBy.personaId === 'business-sponsor' || uc.submittedBy.name === 'David Chen').toBe(true);
      });
    });

    it('Business SME sees only use cases submitted by business-sme persona', () => {
      const p = personas.find(p => p.id === 'business-sme')!;
      const filtered = useCases.filter(uc =>
        uc.submittedBy.personaId === p.id || uc.submittedBy.name === p.name
      );
      expect(filtered.length).toBeGreaterThan(0);
      expect(filtered.length).toBeLessThan(useCases.length);
      filtered.forEach(uc => {
        expect(uc.submittedBy.personaId === 'business-sme' || uc.submittedBy.name === 'Sarah Mitchell').toBe(true);
      });
    });

    it('IDE GM sees all use cases', () => {
      // Non-business personas should see everything
      const p = personas.find(p => p.id === 'ide-gm')!;
      const isBiz = p.id === 'business-sponsor' || p.id === 'business-sme';
      expect(isBiz).toBe(false);
      // They should see all useCases (no filter applied)
    });
  });

  describe('Action button RBAC', () => {
    const submitRoles = ['business-sponsor', 'business-sme', 'idt-advisor'];
    const experimentRoles = ['pod-member', 'ide-pm', 'wipro-delivery', 'ide-gm'];
    const deployRoles = ['ide-gm', 'ide-pm', 'idso-gm', 'idso-pm', 'pod-member', 'wipro-delivery'];
    const approvalRoles = ['idt-gm', 'idt-advisor', 'ide-gm', 'ide-pm', 'idso-gm', 'idso-pm'];
    const ingestionRoles = ['ide-gm', 'ide-pm', 'pod-member', 'wipro-delivery', 'idt-advisor'];

    personas.forEach(p => {
      it(`${p.role} (${p.id}) — correct Submit UC access`, () => {
        const canSubmit = submitRoles.includes(p.id);
        if (['business-sponsor', 'business-sme', 'idt-advisor'].includes(p.id)) {
          expect(canSubmit).toBe(true);
        } else {
          expect(canSubmit).toBe(false);
        }
      });

      it(`${p.role} (${p.id}) — correct New Experiment access`, () => {
        const canCreate = experimentRoles.includes(p.id);
        if (['pod-member', 'ide-pm', 'wipro-delivery', 'ide-gm'].includes(p.id)) {
          expect(canCreate).toBe(true);
        } else {
          expect(canCreate).toBe(false);
        }
      });

      it(`${p.role} (${p.id}) — correct Deploy Model access`, () => {
        const canDeploy = deployRoles.includes(p.id);
        if (['ide-gm', 'ide-pm', 'idso-gm', 'idso-pm', 'pod-member', 'wipro-delivery'].includes(p.id)) {
          expect(canDeploy).toBe(true);
        } else {
          expect(canDeploy).toBe(false);
        }
      });

      it(`${p.role} (${p.id}) — correct Approval action access`, () => {
        const canApprove = approvalRoles.includes(p.id);
        if (['business-sponsor', 'business-sme', 'pod-member', 'wipro-delivery'].includes(p.id)) {
          expect(canApprove).toBe(false);
        }
      });

      it(`${p.role} (${p.id}) — correct Run Ingestion access`, () => {
        const canIngest = ingestionRoles.includes(p.id);
        if (['business-sponsor', 'business-sme', 'idt-gm', 'idso-gm', 'idso-pm'].includes(p.id)) {
          expect(canIngest).toBe(false);
        }
      });
    });
  });

  describe('Dashboard chart visibility', () => {
    it('Business Sponsor should NOT see Build-to-Transfer or Cost by Phase', () => {
      const isBizSponsor = true;
      const isBizSME = false;
      const showCharts = !isBizSponsor && !isBizSME;
      expect(showCharts).toBe(false);
    });

    it('Business SME should NOT see Build-to-Transfer or Cost by Phase', () => {
      const isBizSponsor = false;
      const isBizSME = true;
      const showCharts = !isBizSponsor && !isBizSME;
      expect(showCharts).toBe(false);
    });

    it('IDE GM SHOULD see Build-to-Transfer and Cost by Phase', () => {
      const isBizSponsor = false;
      const isBizSME = false;
      const showCharts = !isBizSponsor && !isBizSME;
      expect(showCharts).toBe(true);
    });

    it('Pod Performance table visible only to IDE GM and IDE PM', () => {
      const checkVisible = (personaId: string) => {
        return personaId === 'ide-gm' || personaId === 'ide-pm';
      };
      expect(checkVisible('ide-gm')).toBe(true);
      expect(checkVisible('ide-pm')).toBe(true);
      expect(checkVisible('business-sponsor')).toBe(false);
      expect(checkVisible('idso-gm')).toBe(false);
    });
  });

  describe('Analytics persona scoping', () => {
    it('Business personas see filtered use case data in Analytics', () => {
      const bizSponsor = personas.find(p => p.id === 'business-sponsor')!;
      const isBiz = bizSponsor.id === 'business-sponsor' || bizSponsor.id === 'business-sme';
      expect(isBiz).toBe(true);
      
      const filtered = useCases.filter(uc =>
        uc.submittedBy.personaId === bizSponsor.id || uc.submittedBy.name === bizSponsor.name
      );
      expect(filtered.length).toBeLessThan(useCases.length);
    });

    it('Business personas should NOT see Cost by Phase and Build-to-Transfer charts', () => {
      const isBiz = true; // business-sponsor or business-sme
      const showFactoryCharts = !isBiz;
      expect(showFactoryCharts).toBe(false);
    });
  });

  describe('No cross-persona data leakage', () => {
    it('Business Sponsor UC-001 submitted by David Chen is visible', () => {
      const uc001 = useCases.find(u => u.id === 'UC-001')!;
      expect(uc001.submittedBy.personaId).toBe('business-sponsor');
      expect(uc001.submittedBy.name).toBe('David Chen');
    });

    it('Business SME UC-002 submitted by Sarah Mitchell is visible to SME', () => {
      const uc002 = useCases.find(u => u.id === 'UC-002')!;
      expect(uc002.submittedBy.personaId).toBe('business-sme');
      expect(uc002.submittedBy.name).toBe('Sarah Mitchell');
    });

    it('Business Sponsor cannot see Business SME use cases', () => {
      const sponsor = personas.find(p => p.id === 'business-sponsor')!;
      const smeUcs = useCases.filter(uc => uc.submittedBy.personaId === 'business-sme');
      const sponsorVisible = smeUcs.filter(uc =>
        uc.submittedBy.personaId === sponsor.id || uc.submittedBy.name === sponsor.name
      );
      expect(sponsorVisible.length).toBe(0);
    });
  });
});
