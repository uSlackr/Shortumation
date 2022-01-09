import { ComponentMeta, ComponentStory } from "@storybook/react";
import { usePageTheme } from "styles/page";
import { ConnectedAutmationList } from ".";
import { NODE_HEIGHT, NODE_WIDTH, ADD_HEIGHT, ADD_WIDTH, CIRCLE_SIZE, DISTANCE_FACTOR } from 'components/DAGSvgs/constants';
import { createMockAuto } from "utils/mocks";
import { useMockApiService } from "apiService";

export default {
  title: 'App/ConnectedAutmationList',
  component: ConnectedAutmationList,
  parameters: { actions: { argTypesRegex: '^on.*' } },
  args: {
    dims: {
      nodeHeight: NODE_HEIGHT,
      nodeWidth: NODE_WIDTH,
      addHeight: ADD_HEIGHT,
      addWidth: ADD_WIDTH,
      circleSize: CIRCLE_SIZE,
      distanceFactor: DISTANCE_FACTOR,
    },
    initialAutomations: [],
  }
} as ComponentMeta<typeof ConnectedAutmationList>;


const Template: ComponentStory<any> = args => {
  const { classes } = usePageTheme({});
  const api = useMockApiService(args.initialAutomations);
  return <div className={classes.page}>
    <ConnectedAutmationList
      {...args}
      api={api}
    />
  </div>
}

export const EmptyStart = Template.bind({})


export const FewAutos = Template.bind({})
FewAutos.args = {
  ...FewAutos.args,
  initialAutomations: [
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
    createMockAuto(),
  ],
}