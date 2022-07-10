import "./CollectionNode.css";

import Add from "@mui/icons-material/Add";
import { ButtonIcon } from "components/Icons/ButtonIcons";
import { FC } from "react";
import { SequenceNodeElement } from "../SequenceNode/SequenceNodeElement";
import { CollectionNodeProps } from "./types";
import { Handle, Position } from "react-flow-renderer";
import { useSequenceNodeColor } from "../SequenceNode/util";

export const CollectionNode: FC<CollectionNodeProps> = ({
  onAddNode,
  nodes,
  sequenceNode,
  height,
  width,
  flipped,
  color,
  hasInput = false,
}) => {
  const nodeColor = useSequenceNodeColor(color);

  return (
    <div
      className="collection-nodes--wrap"
      style={
        {
          "--node-color": nodeColor,
          "--node-height": `calc(${height}px - 2*var(--padding))`,
          "--node-width": `calc(${width}px - 2*var(--padding))`,
        } as any
      }
    >
      <div className="collection-nodes">
        {nodes.map((n, i) => (
          <SequenceNodeElement
            {...n}
            {...sequenceNode}
            key={i}
            color={color}
            flipped={flipped}
          />
        ))}
        <ButtonIcon icon={<Add />} onClick={onAddNode} />
        <Handle
          type="source"
          position={flipped ? Position.Bottom : Position.Right}
        />
        {hasInput && (
          <Handle
            type="target"
            position={flipped ? Position.Top : Position.Left}
          />
        )}
      </div>
    </div>
  );
};