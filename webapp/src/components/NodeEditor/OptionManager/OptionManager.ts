import { HAEntitiesState } from 'haService';
import { FC } from 'react';
import { AutomationAction } from 'types/automations/actions';
import { AutomationCondition } from 'types/automations/conditions';
export type OptionManager<T> = {
  defaultState(): T;
  isReady(s: T): boolean;
} & ({
  renderOptionList(s: T, set: (s: T) => void, entities: HAEntitiesState): JSX.Element;
} | {
  Component: FC<{
    state: T,
    setState: (s: T) => void,
    entities: HAEntitiesState,
  }>
})


export const updateConditionData = <T extends AutomationCondition>(
  setState: (s: T) => void
) => (
  state: T,
  data: Partial<T>,
) => setState({
  ...state,
  ...data,
})

export const updateActionData = <T extends AutomationAction>(
  state: T,
  setState: (s: T) => void
) => (
  data: Partial<T>,
) => setState({
  ...state,
  ...data,
})
