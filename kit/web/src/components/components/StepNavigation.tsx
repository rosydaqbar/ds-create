import { Button } from '../parts/Button';
import { Icon } from '@/icons';

/** Ordered workflow navigation. Validation belongs to the caller before advancing. */
export function StepNavigation({ id, steps, current = 0, onStepChange }: {
  id: string;
  steps: string[];
  current?: number;
  onStepChange?: (index: number) => void;
}) {
  return <nav id={id} aria-label="Setup steps">
    <ol className="m-0 flex list-none flex-wrap items-center gap-xs p-0">
      {steps.map((label, index) => <li key={label} id={`${id}-item-${index + 1}`}
        data-state={index < current ? 'complete' : index === current ? 'current' : 'upcoming'}
        className="group/step flex min-w-0 items-center gap-xs">
        <Button size="sm" emphasis="tertiary" data-step-index={index}
          aria-current={index === current ? 'step' : undefined} onClick={() => onStepChange?.(index)}
          leadingVisual={<span aria-hidden className="flex size-(--size-icon-md) shrink-0 items-center justify-center rounded-full bg-fill-neutral-subtle text-text-tertiary group-data-[state=current]/step:bg-fill-brand-solid group-data-[state=current]/step:text-text-on-solid">
              <span className="group-data-[state=complete]/step:hidden">{index + 1}</span>
              <Icon name="general/check" size="sm" className="hidden group-data-[state=complete]/step:block" />
            </span>}
          label={<span className="group-data-[state=current]/step:text-text-primary">{label}</span>} />
        {index < steps.length - 1 && <Icon name="arrows/chevron-right" size="sm" className="text-icon-tertiary" />}
      </li>)}
    </ol>
  </nav>;
}
