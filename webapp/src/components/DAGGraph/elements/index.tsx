import { DAGDims, ElementMaker, ElementMakerBaseProps } from "./types";
import { AutomationTrigger } from "types/automations/triggers";
import * as distance from "./distance";
import { getDescriptionFromAutomationNode } from "utils/formatting";
import {
  AutomationActionData,
  AutomationSequenceNode,
} from "types/automations";
import { AutomationCondition } from "types/automations/conditions";
import { CollectionNodeMaker } from "../nodes/CollectionNode";
import { ChooseAction, RepeatAction } from "types/automations/actions";
import { XYPosition } from "react-flow-renderer";
import { DAGElementsOutputState } from "./outputState";
import { SequenceNodeMaker } from "../nodes/SequenceNode";
import {
  getNodeType,
  convertScriptConditionFieldToAutomationConditions,
} from "utils/automations";
import { ButtonNodeMaker } from "../nodes/ButtonNode";
import { AddIcon } from "components/Icons";
import { useDAGElementsState } from "./state";
import AddBox from "@mui/icons-material/AddBox";
import { DAGGraphChooseUpdater, DAGGraphUpdater } from "../updater";
import { ReactNode } from "react";
import DeleteForever from "@mui/icons-material/DeleteForever";

export const useAutomationNodes = (
  automation: AutomationActionData,
  args: ElementMakerBaseProps
) => {
  const dims: DAGDims = {
    ...args.dims,
  };
  const state = useDAGElementsState();
  const outputState = new DAGElementsOutputState(dims.position, dims);
  outputState.extend(
    makeTriggerNodes(automation.trigger, {
      ...args,
      state,
      dims,
      position: dims.position,
      nodeId: `${dims.flipped}-trigger`,
      nodeIndex: 0,
    })
  );

  outputState.extend(
    makeConditionNodes(automation.condition, {
      ...args,
      state,
      dims,
      position: distance.moveFromTo(
        "collection",
        "collection",
        outputState.getLastNodePos(),
        dims
      ),
      nodeId: `${dims.flipped}-condition`,
      nodeIndex: 1,
      lastNodeId: outputState.lastNodeId,
    })
  );

  outputState.extend(
    makeSequenceNodes(automation.sequence, {
      ...args,
      state,
      dims,
      position: distance.moveFromTo(
        "collection",
        "node",
        outputState.getLastNodePos(),
        dims
      ),
      nodeId: `${dims.flipped}-sequence`,
      nodeIndex: 2,
      lastNodeId: outputState.lastNodeId,
    })
  );

  return outputState.data;
};

export const makeTriggerNodes: ElementMaker<AutomationTrigger> = (
  nodes,
  { dims, namer, stateUpdater, nodeId, position }
) => {
  const outputState = new DAGElementsOutputState(position, dims);
  outputState.addNode(
    CollectionNodeMaker.makeElement({ id: nodeId, position }, dims, {
      ...dims.collection,
      collectionType: "trigger",
      onAddNode: () => stateUpdater.basic.trigger.addNode(null),
      nodes: nodes.map((node, index) => ({
        enabled: node.enabled ?? true,
        label: getDescriptionFromAutomationNode(node, namer, true),
        ...stateUpdater.createNodeActions("trigger", index, {}),
      })),
    })
  );
  return outputState;
};

export const makeConditionNodes: ElementMaker<AutomationCondition> = (
  nodes,
  { nodeId, stateUpdater, position, dims, namer, lastNodeId }
) => {
  const outputState = new DAGElementsOutputState(position, dims);
  outputState.addNode(
    CollectionNodeMaker.makeElement({ id: nodeId, position }, dims, {
      ...dims.collection,
      collectionType: "condition",
      hasInput: !!lastNodeId,
      onAddNode: () => stateUpdater.basic.condition.addNode(null),
      nodes: nodes.map((node, index) => ({
        enabled: node.enabled ?? true,
        label: getDescriptionFromAutomationNode(node, namer, true),
        ...stateUpdater.createNodeActions("condition", index, {}),
      })),
    })
  );
  if (lastNodeId && outputState.lastNodeId) {
    outputState.addEdge(lastNodeId, outputState.lastNodeId, { animated: true });
  }
  return outputState;
};

export const makeSequenceNodes: ElementMaker<AutomationSequenceNode> = (
  nodes,
  args
) => {
  const { lastNodeId, position, dims, namer, stateUpdater, state } = args;
  const outputState = new DAGElementsOutputState(position, dims);
  nodes.forEach((node, nodeIndex) => {
    // the JSON.stringify is hack to make the edges render nicely
    const nodeId = `${args.nodeId}-${
      args.nodeIndex
    }-${nodeIndex}-${JSON.stringify(node)}`;
    outputState.incNextPos("node");
    const element = outputState.addNode(
      SequenceNodeMaker.makeElement(
        {
          id: nodeId,
          position: outputState.nextPos,
        },
        dims,
        {
          color: getNodeType(node) === "action" ? "green" : "blue",
          enabled: node.enabled ?? true,
          hasInput: true,
          label: getDescriptionFromAutomationNode(node, namer, true),
          ...state.getIsClosedActions(nodeId, node),
          ...stateUpdater.createNodeActions("sequence", nodeIndex, {
            includeAdd: true,
            flipped: dims.flipped,
          }),
        }
      ),
      true
    );
    if (nodeIndex === 0 && lastNodeId) {
      outputState.addEdge(lastNodeId, element.id);
    }
    if ("choose" in node) {
      outputState.extend(
        makeChooseeNodes([node], {
          ...args,
          nodeId,
          lastNodeId: element.id,
          position: outputState.getLastNodePos(),
          nodeIndex,
        }),
        true
      );
    } else if ("repeat" in node) {
      outputState.extend(
        makeRepeatNodes([node], {
          ...args,
          nodeId,
          lastNodeId: element.id,
          position: outputState.getLastNodePos(),
          nodeIndex,
        }),
        true
      );
    }
  });

  const addElement = outputState.addNode(
    ButtonNodeMaker.makeElement(
      {
        id: `${args.nodeId}-add-new`,
        position: distance.moveAlong(
          "node",
          outputState.getLastNodePos(position),
          1,
          dims
        ),
      },
      dims,
      {
        icon: <AddIcon />,
        onClick: () => stateUpdater.basic.sequence.addNode(null),
      }
    ),
    true
  );

  if (nodes.length === 0 && lastNodeId) {
    outputState.addEdge(lastNodeId, addElement.id);
  }

  return outputState;
};

export const makeChooseeNodes: ElementMaker<ChooseAction> = (nodes, args) => {
  const outputState = new DAGElementsOutputState(args.position, args.dims);
  if (nodes.length !== 1) {
    throw new Error("makeChooseNodes only access a list of 1");
  }
  const node = nodes[0];
  if (
    !((node.enabled ?? true) && !args.state.get(args.lastNodeId ?? "").isClosed)
  ) {
    return outputState;
  }
  // offset position
  let offsetPos: XYPosition = distance.offsetBy(
    "node",
    args.position,
    args.dims
  );
  let lastConditionState: DAGElementsOutputState | null = null;
  // functions
  const drawCondition = (
    { stateUpdater, onRemove }: DAGGraphChooseUpdater,
    position: XYPosition,
    lastNodeId: string | undefined,
    nodeIndex: number,
    conditions: AutomationCondition[]
  ) => {
    const conditionState = makeConditionNodes(conditions, {
      ...args,
      stateUpdater,
      position,
      lastNodeId,
      nodeIndex,
      nodeId: `${args.nodeId}-choose-${nodeIndex}-condition`,
    });
    lastConditionState = conditionState;
    (conditionState.data.nodes[0].data as any).title = `Option ${
      nodeIndex + 1
    }`;

    (conditionState.data.nodes[0].data as any).onDelete = onRemove;
    conditionState.data.edges[0].sourceHandle = `side`;
    conditionState.data.edges[0].label = `Option ${nodeIndex + 1}`;
    conditionState.data.edges[0].style = {
      stroke: "var(--mui-info-main)",
    };
    outputState.extend(conditionState);
    return conditionState;
  };
  const drawSequence = (
    { stateUpdater }: DAGGraphChooseUpdater,
    position: XYPosition,
    lastNodeId: string | undefined,
    nodeIndex: number,
    sequence: AutomationSequenceNode[],
    label: "else" | undefined
  ) => {
    const output = makeSequenceNodes(sequence, {
      ...args,
      stateUpdater,
      position,
      lastNodeId: undefined,
      nodeIndex,
      nodeId: `${args.nodeId}-choose-${nodeIndex}-sequence`,
    });
    if (lastNodeId && output.data.nodes.length > 0) {
      outputState.addEdge(lastNodeId, output.data.nodes[0].id, {
        animated: true,
        label,
        sourceHandle: label === "else" ? "side" : undefined,
        style: {
          stroke: "var(--mui-error-main)",
          zIndex: -1,
        },
      });
    }
    return output;
  };

  // process options
  for (let sIndex = 0; sIndex < node.choose.length; sIndex++) {
    const stateUpdater = args.stateUpdater.createChoosNodeUpdater(
      args.nodeIndex,
      sIndex
    );
    let pos = offsetPos;
    let lastNodeId = args.lastNodeId;
    const conditionState = drawCondition(
      stateUpdater,
      pos,
      lastNodeId,
      sIndex,
      node.choose[sIndex].conditions
    );
    pos = distance.moveFromTo("collection", "node", pos, args.dims);
    lastConditionState = conditionState;
    lastNodeId = conditionState.lastNodeId;
    const sequence = node.choose[sIndex].sequence;
    const output = drawSequence(
      stateUpdater,
      pos,
      lastNodeId,
      sIndex,
      sequence,
      undefined
    );
    offsetPos = distance.moveAlongRelativeTo(
      offsetPos,
      output.bbox[1],
      args.dims,
      "collection"
    );
    outputState.extend(output);
  }

  // else
  const stateUpdater = args.stateUpdater.createChoosNodeUpdater(
    args.nodeIndex,
    "else"
  );
  let pos = offsetPos;
  let lastNodeId = args.lastNodeId;
  const elseOutput = drawSequence(
    stateUpdater,
    pos,
    lastNodeId,
    node.choose.length,
    node.default ?? [],
    "else"
  );
  offsetPos = distance.moveAlongRelativeTo(
    offsetPos,
    elseOutput.bbox[1],
    args.dims,
    "node"
  );
  outputState.extend(elseOutput);

  // add btn
  let addPos = distance.moveAlong(
    "node",
    elseOutput.data.nodes[0].position,
    1 / args.dims.distanceFactor.node,
    args.dims,
    true
  );
  console.log({ addPos, lastConditionState });
  if (lastConditionState !== null) {
    addPos = distance.moveFromTo(
      "collection",
      "node",
      (lastConditionState as DAGElementsOutputState).nextPos,
      {
        ...args.dims,
        flipped: !args.dims.flipped,
      }
    );
  }
  const addElement = outputState.addNode(
    ButtonNodeMaker.makeElement(
      {
        id: `${args.nodeId}-choose-add-new`,
        position: addPos,
      },
      args.dims,
      {
        text: "Option",
        icon: <AddBox />,
        onClick: () =>
          args.stateUpdater.basic.sequence.updateNode(
            {
              ...node,
              choose: [
                ...node.choose,
                {
                  conditions: [],
                  sequence: [],
                },
              ],
            },
            args.nodeIndex
          ),
      }
    )
  );
  outputState.addEdge(args.nodeId, addElement.id, {
    animated: true,
    sourceHandle: "side",
  });

  return outputState;
};

export const makeRepeatNodes: ElementMaker<RepeatAction> = (nodes, args) => {
  const outputState = new DAGElementsOutputState(args.position, args.dims);
  if (nodes.length !== 1) {
    throw new Error("makeChooseNodes only access a list of 1");
  }
  const node = nodes[0];
  if (
    (node.enabled ?? true) &&
    !args.state.get(args.lastNodeId ?? "").isClosed
  ) {
    // offset position
    let offsetPos: XYPosition = distance.offsetBy(
      "node",
      args.position,
      args.dims
    );
    let lastNodeId = args.lastNodeId;
    const stateUpdater = args.stateUpdater.createRepeatNodeUpdater(
      args.nodeIndex
    );

    // while
    const whileState = makeConditionNodes(
      convertScriptConditionFieldToAutomationConditions(node.repeat.while),
      {
        ...args,
        stateUpdater: stateUpdater.while,
        position: offsetPos,
        lastNodeId,
        nodeIndex: 0,
        nodeId: `${args.nodeId}-repeat-while`,
      }
    );
    whileState.data.edges[0].sourceHandle = `side`;
    whileState.data.edges[0].label = `While`;
    outputState.extend(whileState);
    offsetPos = distance.moveFromTo("collection", "node", offsetPos, args.dims);
    lastNodeId = whileState.lastNodeId;
    // sequence
    const sequenceState = makeSequenceNodes(node.repeat.sequence, {
      ...args,
      stateUpdater: stateUpdater.sequence,
      position: offsetPos,
      lastNodeId: undefined,
      nodeIndex: 0,
      nodeId: `${args.nodeId}-repeat-sequence`,
    });
    if (lastNodeId && sequenceState.data.nodes.length > 0) {
      outputState.addEdge(lastNodeId, sequenceState.data.nodes[0].id, {
        animated: true,
        label: "do",
      });
    }
    lastNodeId = sequenceState.lastNodeId;
    offsetPos = distance.moveAlongRelativeTo(
      offsetPos,
      sequenceState.bbox[1],
      args.dims,
      "node"
    );
    // until
    const untilState = makeConditionNodes(
      convertScriptConditionFieldToAutomationConditions(node.repeat.until),
      {
        ...args,
        stateUpdater: stateUpdater.until,
        position: offsetPos,
        lastNodeId,
        nodeIndex: 0,
        nodeId: `${args.nodeId}-repeat-until`,
      }
    );
    untilState.data.edges[0].label = `Until`;
    untilState.data.edges[0].targetHandle = `side`;
    outputState.extend(untilState);
    offsetPos = distance.moveFromTo("collection", "node", offsetPos, args.dims);
    lastNodeId = untilState.lastNodeId;
    // loop
    if (untilState.lastNodeId && whileState.lastNodeId) {
      outputState.addEdge(untilState.lastNodeId, whileState.lastNodeId, {
        animated: true,
        label: "repeat",
        sourceHandle: "head",
        targetHandle: "return",
      });
    }
    outputState.extend(sequenceState);
  }

  return outputState;
};
