import { FC } from "react";
import {
  InputAutoComplete,
  InputAutoCompletePropsBase,
} from "./InputAutoComplete";
import { useHAAreas } from "haService/AreaRegistry";
import { useLang } from "lang";

export type InputAreaProps = InputAutoCompletePropsBase & {
  restrictToDomain?: string[];
  restrictedIntegrations?: string[];
};

export const InputArea: FC<InputAreaProps> = (props) => {
  const lang = useLang();
  // state
  const areas = useHAAreas();
  return (
    <InputAutoComplete
      {...props}
      label={props.label ?? lang.get("AREA")}
      getID={areas.getID}
      getLabel={areas.getLabel}
      options={areas.getOptions()}
      onlyShowLabel
    />
  );
};
