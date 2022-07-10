import {
  Bbox,
  ElementMaker,
  ElementMakerBaseProps,
  ElementMakerOutput,
  LastNode,
} from "./types";
import { AutomationTrigger } from "types/automations/triggers";
import * as distance from "./distance";
import { getDescriptionFromAutomationNode } from "utils/formatting";
import {
  AutomationActionData,
  AutomationSequenceNode,
} from "types/automations";
import { AutomationCondition } from "types/automations/conditions";
import { CollectionNodeMaker } from "../nodes/CollectionNode";
import { SequenceNodeMaker } from "../nodes/SequenceNode";
import { getNodeType } from "utils/automations";

export const makeAutomationNodes = (
  automation: AutomationActionData,
  args: ElementMakerBaseProps
) => {
  let state: ElementMakerOutput = makeTriggerNodes(automation.trigger, {
    ...args,
    elementData: {
      nodes: [],
      edges: [],
    },
    position: args.dims.position,
    nodeId: `${args.dims.flipped}-trigger`,
    nodeIndex: 0,
  });

  state = makeConditionNodes(automation.condition, {
    ...args,
    elementData: state.elementData,
    position: distance.moveFromTo(
      "trigger",
      "condition",
      state.lastNode.pos,
      args.dims
    ),
    nodeId: `${args.dims.flipped}-condition`,
    nodeIndex: 1,
    lastNodeId: state.lastNode.nodeId,
  });

  state = makeSequenceNodes(automation.sequence, {
    ...args,
    elementData: state.elementData,
    position: distance.moveFromTo(
      "condition",
      "node",
      state.lastNode.pos,
      args.dims
    ),
    nodeId: `${args.dims.flipped}-sequence`,
    nodeIndex: 2,
    lastNodeId: state.lastNode.nodeId,
  });

  return state.elementData;
};

export const makeTriggerNodes: ElementMaker<AutomationTrigger> = (
  nodes,
  { elementData, dims, namer, openModal, stateUpdater, nodeId, position }
) => {
  elementData.nodes.push(
    CollectionNodeMaker.makeElement({ id: nodeId, position }, dims, {
      ...dims.trigger,
      color: "red",
      onAddNode: () => stateUpdater.basic.trigger.addNode(null),
      nodes: nodes.map((node, index) => ({
        enabled: node.enabled ?? true,
        label: getDescriptionFromAutomationNode(node, namer, true),
        ...stateUpdater.createNodeActions("trigger", index, {}),
      })),
    })
  );
  return {
    elementData,
    lastNode: {
      nodeId,
      pos: elementData.nodes[elementData.nodes.length - 1].position,
      size: dims.trigger,
    },
  };
};

export const makeConditionNodes: ElementMaker<AutomationCondition> = (
  nodes,
  { elementData, nodeId, stateUpdater, position, dims, namer, lastNodeId }
) => {
  elementData.nodes.push(
    CollectionNodeMaker.makeElement({ id: nodeId, position }, dims, {
      ...dims.condition,
      color: "blue",
      hasInput: !!lastNodeId,
      onAddNode: () => stateUpdater.basic.condition.addNode(null),
      nodes: nodes.map((node, index) => ({
        enabled: node.enabled ?? true,
        label: getDescriptionFromAutomationNode(node, namer, true),
        ...stateUpdater.createNodeActions("condition", index, {}),
      })),
    })
  );
  if (lastNodeId) {
    elementData.edges.push({
      source: lastNodeId,
      target: elementData.nodes[elementData.nodes.length - 1].id,
      animated: true,
      id: `${lastNodeId}->${
        elementData.nodes[elementData.nodes.length - 1].id
      }`,
    });
  }
  return {
    elementData,
    lastNode: {
      nodeId,
      pos: elementData.nodes[elementData.nodes.length - 1].position,
      size: dims.condition,
    },
  };
};

export const makeSequenceNodes: ElementMaker<AutomationSequenceNode> = (
  nodes,
  { nodeId, lastNodeId, elementData, dims, position, namer, stateUpdater }
) => {
  let lastNode: LastNode = {
    nodeId: lastNodeId ?? nodeId,
    pos: elementData.nodes[elementData.nodes.length - 1].position,
    size: dims.node,
  };
  nodes.forEach((node, nodeIndex) => {
    const element = SequenceNodeMaker.makeElement(
      {
        id: `${nodeId}-${nodeIndex}`,
        position: distance.moveAlong("node", position, nodeIndex, dims),
      },
      dims,
      {
        color: getNodeType(node) === "action" ? "green" : "blue",
        enabled: node.enabled ?? true,
        hasInput: true,
        label: getDescriptionFromAutomationNode(node, namer, true),
        ...stateUpdater.createNodeActions("sequence", nodeIndex, {
          includeAdd: true,
          flipped: dims.flipped,
        }),
      }
    );
    elementData.nodes.push(element);
    elementData.edges.push({
      id: `${lastNode.nodeId}->${element.id}`,
      target: element.id,
      source: lastNode.nodeId,
    });
    lastNode = {
      nodeId: element.id,
      pos: element.position,
      size: dims.node,
    };
  });

  return {
    elementData,
    lastNode,
  };
};
