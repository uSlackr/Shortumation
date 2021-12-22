import { FC, useRef } from "react";
import { SVGBoard } from "./Board";
import { AutomationNode } from '../../types/automations/index';
import { Point, EdgeDirection, BBox } from 'types/graphs';
import { DAGNode } from "./DAGNode";
import { DAGEdge } from "./DAGEdge";
import { AddButton } from "./AddButton";
import { IteratorWrap } from "utils/iter";
import { DAGCircle, AddProps } from "./DAGCircle";
import { getDescriptionFromAutomationNode } from "utils/formatting";
import { minPoints } from "utils/graph";
import { maxPoints } from '../../utils/graph';


export type DAGCircleElm = {
  type: 'circle';
  loc: Point;
} & (
    {
      icon: 'add',
      onAdd: () => void;
    } |
    {
      icon: 'edit',
      onEdit: () => void;
      onRemove?: () => void;
    } |
    {
      icon: 'blank',
      onRemove?: () => void;
    } |
    {
      icon: 'color',
      color: string,
    }
  )
export interface DAGNodeElm {
  type: 'node';
  loc: Point;
  node: AutomationNode;
  onRemove: () => void;
  onAdd?: () => void;
  onOpen?: () => void;
}
export interface DAGEdgeElm {
  type: 'edge';
  p1: Point;
  p2: Point;
  direction: EdgeDirection;
  fromCircle?: boolean;
  onAdd?: () => void;
}
export type DAGElement = DAGEdgeElm | DAGNodeElm | DAGCircleElm;
export interface DAGBoardSettings extends DAGBoardElmDims {
  edgeChildColor: string;
  edgeNextColor: string;
}
export interface DAGBoardElmDims {
  nodeHeight: number;
  nodeWidth: number;
  addHeight: number;
  addWidth: number;
  circleSize: number;
  distanceFactor: number;
}

export interface Props {
  elements: Generator<DAGElement>;
  settings: DAGBoardSettings;
}




export function* mapDataToElements({
  elements,
  settings: st,
}: Props) {
  let bbox: BBox = [[0, 0], [0, 0]];
  const updateBBox = (p: Point) => {
    bbox = [
      [Math.min(bbox[0][0], p[0]), Math.min(bbox[0][1], p[1])],
      [Math.max(bbox[1][0], p[0] + st.nodeWidth), Math.max(bbox[1][1], p[1] + st.nodeHeight)],
    ]
    return p;
  }
  const offsetPoint = (
    [x, y]: Point,
    [ox, oy]: Point = [0, 0]
  ): Point => updateBBox([x + ox, y + oy]);
  const mapWithNode = (
    [x, y]: Point,
    [ox, oy]: Point = [0, 0],
  ): Point => updateBBox([
    x * st.nodeWidth * st.distanceFactor + ox,
    y * st.nodeHeight * st.distanceFactor + oy,
  ])
  for (let elm of elements) {
    switch (elm.type) {
      case 'node':
        const nodeLoc = mapWithNode(elm.loc);
        const addLoc = mapWithNode(elm.loc, [
          st.nodeWidth * st.distanceFactor,
          st.addHeight + st.addHeight / 2
        ])
        yield <DAGNode
          key={`(${elm.loc})-*`}
          height={st.nodeHeight}
          width={st.nodeWidth}
          loc={nodeLoc}
          text={getDescriptionFromAutomationNode(elm.node)}
          color={elm.node.$smType === 'action' ? 'green' : 'blue'}
          onXClick={elm.onRemove}
          onOpenClick={elm.onOpen}
        />
        if (elm.onAdd) {
          yield <DAGEdge
            key={`(${elm.loc})->+`}
            p1={offsetPoint(nodeLoc, [st.nodeWidth, st.nodeHeight / 2])}
            p2={offsetPoint(addLoc, [0, st.addHeight / 2])}
            direction="1->2"
            color={st.edgeNextColor}
          />
          yield <AddButton
            key={`(${elm.loc})-+`}
            loc={addLoc}
            height={st.addHeight}
            width={st.addWidth}
            onClick={elm.onAdd}
          />
        }
        break
      case 'edge':
        const p2 = mapWithNode(elm.p2, [0, st.nodeHeight / 2]);
        let p1: Point;
        if (elm.fromCircle) {
          p1 = mapWithNode(elm.p1, [st.circleSize * 0.95, 1.3 * st.circleSize / 2])
        } else {
          p1 = mapWithNode(elm.p1, [st.nodeWidth, st.nodeHeight / 2])
        }
        yield <DAGEdge
          key={`(${elm.p1})->(${elm.p2})`}
          p1={p1}
          p2={p2}
          direction={elm.direction}
          color={st.edgeNextColor}
        />
        if (elm.onAdd) {
          yield <AddButton
            key={`(${elm.p2})-+`}
            loc={offsetPoint(p2, [0, -st.addHeight / 2])}
            height={st.addHeight}
            width={st.addWidth}
            onClick={elm.onAdd}
          />
        }
        break
      case 'circle':
        const loc = mapWithNode(elm.loc, [0, st.nodeHeight / 2 - st.circleSize / 2]);
        const clickProps: Partial<AddProps> = {}
        if (elm.icon === 'add') {
          clickProps.onAdd = elm.onAdd;
        } else if (elm.icon === 'edit') {
          clickProps.onEdit = elm.onEdit
          clickProps.onRemove = elm.onRemove
        } else if (elm.icon === 'blank') {
          clickProps.onRemove = elm.onRemove
        } else {
          clickProps.backgroundColor = elm.color
        }
        yield <DAGCircle
          key={`(${elm.loc})-o`}
          loc={loc}
          size={st.circleSize}
          {...clickProps}
        />
        break
      default:
        break
    }
  }
  return bbox;
}


export const DAGBoard: FC<Props & { zoomLevel: number }> = props => {
  const graphDims = useRef<BBox>([[0, 0], [0, 0]]);
  const it = new IteratorWrap(mapDataToElements(props));
  const el = it.toArray();
  const [p0, p1] = it.returnValue as BBox;
  const [[x0, y0], [x1, y1]] = graphDims.current = [
    minPoints(p0, graphDims.current[0]),
    maxPoints(p1, graphDims.current[1])
  ];
  return <SVGBoard
    graphHeight={y1 - y0}
    minGraphWidth={Math.max(x1 - x0, props.settings.nodeWidth * 15)}
    nodeHeight={props.settings.nodeHeight}
    nodeWidth={props.settings.nodeWidth}
    zoomLevel={props.zoomLevel}
  >
    {el}
    {props.children}
  </SVGBoard>
}
