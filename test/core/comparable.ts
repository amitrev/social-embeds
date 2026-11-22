import type { Plan, PlanError } from '../../src/core/plan';

/** Flickr's plan builds its `sizeInSrc.src` per call: compare what it returns instead. */
export function comparable(plan: Plan | PlanError): unknown {
  if (plan.kind !== 'iframe' || !plan.sizeInSrc) return plan;
  const { watch, src } = plan.sizeInSrc;
  return { ...plan, sizeInSrc: { watch, at600: src(600) } };
}
