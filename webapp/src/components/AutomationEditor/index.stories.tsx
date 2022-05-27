import React from "react";
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { AutomationEditor } from './index';
import { useState } from 'react';
import * as dgconst from 'components/DAGFlow/constants';
import { Page } from "components/Page";
import { makeTagDB } from "components/AutomationList/TagDB";


export default {
  title: 'App/AutomationList/Editor',
  component: AutomationEditor,
  parameters: { actions: { argTypesRegex: '^on.*' } },
  args: {
    dims: dgconst.DEFAULT_DIMS,
  }
} as ComponentMeta<typeof AutomationEditor>

const Template: ComponentStory<typeof AutomationEditor> = args => {
  const [state, setState] = useState(args.automation)
  return <Page>
    <AutomationEditor
      {...args}
      tagDB={makeTagDB([state as any])}
      automation={state}
      onUpdate={s => {
        window.setTimeout(() => setState(s), 3000)
      }}
    />
  </Page>
}

export const Loading = Template.bind({});


export const Simple = Template.bind({})
Simple.args = {
  ...Simple.args,
  automation: {
    condition: [],
    tags: {
      "Room": "Bathroom",
      "For": "Toliet",
      "Type": "Smell",
      "Use": "Flushing"
    },
    metadata: {
      id: "random",
      alias: "Random",
      description: "Example Metadata",
      trigger_variables: {
        'wowo': '!'
      },
      mode: 'single',
    },
    trigger: [
      {
        "platform": "numeric_state",
        "entity_id": "test",
      },
      {
        "platform": "homeassistant",
        "event": "start",
      }
    ],
    sequence: [
      {
        condition: 'and',
        conditions: [
          {
            condition: 'numeric_state',
            entity_id: 'sensor.temperature_kitchen',
            below: '15',
          },
          {
            condition: 'template',
            value_template: 'states(switch.kitchen_light) == "on"'
          }
        ]
      },
      {
        alias: "Start Music In Kitchen",
        service: 'media_player.play_media',
        target: {
          entity_id: "media_player.kitchen_dot"
        },
        data: {
          media_content_id: "Good Morning",
          media_content_type: "SPOTIFY",
        }
      }
    ]
  }
}


export const EmptyStart = Template.bind({})
EmptyStart.args = {
  ...EmptyStart.args,
  automation: {
    condition: [],
    tags: {},
    metadata: {
      id: "random",
      alias: "Random",
      description: "Example Metadata",
      trigger_variables: {
        'wowo': '!'
      },
      mode: 'single',
    },
    trigger: [
    ],
    sequence: []
  }
}

export const BadAutomationInvalidMetadata = Template.bind({})
BadAutomationInvalidMetadata.args = {
  ...BadAutomationInvalidMetadata.args,
  automation: {
    condition: [],
    tags: {},
    metadata: {
    } as any,
    trigger: [
    ],
    sequence: []
  }
}

export const BadAutomationInvalidTriggers = Template.bind({})
BadAutomationInvalidTriggers.args = {
  ...BadAutomationInvalidTriggers.args,
  automation: {
    condition: [],
    tags: {},
    metadata: {
      id: "random",
      alias: "Random",
      description: "Example Metadata",
      trigger_variables: {
        'wowo': '!'
      },
      mode: 'single',
    },
    trigger: [
      "haha I am a string"
    ] as any,
    sequence: []
  }
}

export const BadAutomationInvalidSequence = Template.bind({})
BadAutomationInvalidSequence.args = {
  ...BadAutomationInvalidSequence.args,
  automation: {
    condition: [],
    tags: {},
    metadata: {
      id: "random",
      alias: "Bad Choose Sequence",
      description: "Example Metadata",
      trigger_variables: {
        'wowo': '!'
      },
      mode: 'single',
    },
    trigger: [],
    sequence: [
      {
        choose: {}
      }
    ] as any
  }
}
