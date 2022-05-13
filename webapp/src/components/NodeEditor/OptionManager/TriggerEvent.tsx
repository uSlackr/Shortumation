import InputText from "components/Inputs/InputText";
import { OptionManager } from './OptionManager';
import { AutomationTriggerEvent } from '../../../types/automations/triggers';
import InputYaml from "components/Inputs/InputYaml";


export const TriggerEventState: OptionManager<AutomationTriggerEvent> = {
  defaultState: () => ({
    "alias": "",
    "platform": "event",
    "event_type": "",
    "event_data": {},
    "context": {},
  }),
  isReady: ({ alias, event_type }) => {
    return (alias !== '') && (event_type !== "")
  },
  renderOptionList: (state, setState) => {
    return <>
      <InputText
        label="Description"
        value={state.alias ?? ""}
        onChange={alias => setState({ ...state, alias })}
      />
      <InputText
        label="Event Type"
        value={String(state.event_type)}
        onChange={event_type => setState({ ...state, event_type })}
      />
      <InputYaml
        label="Data"
        value={state.event_data ?? {}}
        onChange={event_data => setState({ ...state, event_data })}
      />
      <InputYaml
        label="Context"
        value={state.event_data ?? {}}
        onChange={context => setState({ ...state, context })}
      />
    </>
  }
}