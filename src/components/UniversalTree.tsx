import React, { Fragment } from 'react'
import './UniversalTree.css'

export type NodeId = string;

type ItemDescriptor = {
    icon?: string;
    label: string;
}

export type Node = ItemDescriptor & {
    id: NodeId;
    parentId: NodeId | null;
    isOpen?: boolean;
    actions?: (
        ItemDescriptor & {
            actionId: string;
        }
    )[]
}

export type Slot = {
    parentId: NodeId | null;
    position: number;
}

type NodeTreeManager = {
    getNode(id: NodeId): Node;
    getChildren(parentId: NodeId): Node[];
    updateNode(node: Partial<Node> & Pick<Node, "id">, position?: number): void;
}

export const NodeTreeContext = React.createContext<NodeTreeManager>({
    getNode(id: NodeId): Node {
        return {
            id: id,
            label: id,
            parentId: null,
        }
    },
    getChildren(_: NodeId): Node[] {
        return [];
    },
    updateNode(_: Partial<Node> & Pick<Node, "id">) {}
})

export const DragContext = React.createContext<{
    dragNode: (node: Node | null) => void;
    currentNode: Node | null;
}>({
    dragNode(n) {
       console.log(n);
    },
    currentNode: null
})


function moveNode(nodeList: Node[], node: Node, position: number) {
    const nodeIndex = nodeList.findIndex((n) => n.id === node.id);
    const newIndex = nodeList.findIndex((() => {
        let currentPos = 0;
        return (n: Node) => {
            if (currentPos === position) {
                return true;
            }
            if (n.parentId === node.parentId) {
                currentPos++;
            }
            return false;
        }
    })())
    const insertIndex = newIndex === -1 ? nodeList.length - 1 : (
        newIndex > nodeIndex ? newIndex - 1 : newIndex
    )
    nodeList.splice(nodeIndex, 1);
    nodeList.splice(insertIndex, 0, node);
}

export function UniversalTree(props: {nodeList: Node[]}) {
    const [nodeList, setNodes] = React.useState(props.nodeList);
    const [currentNode, dragNode] = React.useState<Node | null>(null);
    const rootNodes = nodeList.filter(n => n.parentId === null);
    const context: NodeTreeManager = {
        getNode(id: NodeId) {return nodeList.filter(n => n.id === id)[0]},
        getChildren(parentId: NodeId) {return nodeList.filter(n => n.parentId === parentId)},
        updateNode(node: Partial<Node> & Pick<Node, "id">, position?: number) {
            const nodeIndex = nodeList.findIndex(n => n.id === node.id);
            const updatedNode = {...nodeList[nodeIndex], ...node};
            const updatedNodeList = [...nodeList];
            if (position !== undefined) {
                moveNode(updatedNodeList, updatedNode, position);
            } else {
                updatedNodeList[nodeIndex] = updatedNode;
            }
            setNodes(updatedNodeList);
        },
    }
    const dragContext = {
        currentNode,
        dragNode: (n: Node | null) => {
            dragNode(n);
        }
    }
    const handleDrop = (s: Slot, n: Node) => {
        context.updateNode({id: n.id, parentId: s.parentId}, s.position);
        dragNode(null);
    };
    return (
        <div className="universal-tree">
            <DragContext.Provider value={dragContext}>
                <NodeTreeContext.Provider value={context}>
                    {rootNodes.map((node, index) => (
                        <Fragment key={node.id}>
                            <TreeSlot
                                slot={{parentId: null, position: index}}
                                onDrop={(s) => currentNode && handleDrop(s, currentNode)}
                            />
                            <BoundTreeNode id={node.id} showSlots={true}/>
                        </Fragment>
                    ))}
                    <TreeSlot
                        slot={{parentId: null, position: rootNodes.length}}
                        onDrop={(s) => currentNode && handleDrop(s, currentNode)}
                    />
                </NodeTreeContext.Provider>
            </DragContext.Provider>
        </div>
    )
}

export function BoundTreeNode({id, showSlots}: {id: NodeId, showSlots: boolean}) {
    const context = React.useContext(NodeTreeContext);
    const {dragNode, currentNode} = React.useContext(DragContext);
    const node = context.getNode(id);
    const nodeList = context.getChildren(id);
    const toggleNodeOpen = (id: NodeId, isOpen: boolean) => {
        context.updateNode({id, isOpen});
    }
    const handleDrop = (s: Slot, n: Node) => {
        context.updateNode({id: n.id, parentId: s.parentId}, s.position);
        dragNode(null);
    };
    const isCurrentNode = currentNode && currentNode.id === node.id;
    showSlots = showSlots && !!currentNode && !isCurrentNode;
    return (
        <TreeNode
            node={node}
            onDragChange={dragNode}
            onToggleOpen={(isOpen) => toggleNodeOpen(node.id, isOpen)}
            insertSlot={
                showSlots ? <TreeSlot
                    slot={{position: nodeList.length, parentId: node.id}}
                    onDrop={(s) => currentNode && handleDrop(s, currentNode)}
                /> : undefined
            }
        >
            {nodeList.map((n, index) => {
                return (
                    <Fragment key={n.id}>
                        {showSlots
                            ? <TreeSlot
                                slot={{parentId: node.id, position: index}}
                                onDrop={(s) => currentNode && handleDrop(s, currentNode)}
                            />
                            : <></>}
                        <BoundTreeNode id={n.id} showSlots={showSlots}/>
                    </Fragment>
                );
            })}
        </TreeNode>
    )
}

export function TreeSlot(props: {slot: Slot, onDrop?: (slot: Slot) => void}) {
    const [isActive, setIsActive] = React.useState(false);
    const {onDrop, slot} = {
        onDrop: () => {},
        ...props,
    }
    return (
        <div
            className="tree-slot"
            data-is-active={isActive}
            onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                onDrop(slot);
                setIsActive(false);
            }}
            onDragEnter={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsActive(true);
            }}
            onDragExit={(event) => {
                event.preventDefault();
                event.stopPropagation();
                setIsActive(false);
            }}
            onDragOver={(event) => {
                event.preventDefault();
                event.stopPropagation();
            }}
        ></div>
    )
}

export function TreeNode(
    props: {
        node: Node;
        onToggleOpen?: (isOpen: boolean) => void;
        onDragChange?: (node: Node | null) => void
        children?: JSX.Element[];
        insertSlot?: JSX.Element;
    }
) {
    const {
        node,
        children,
        insertSlot,
        onDragChange,
        onToggleOpen
    } = {
        onDragChange: () => {},
        onToggleOpen: () => {},
        ...props
    };
    const isOpen = !!node.isOpen;
    const useChildren = React.Children.toArray(children);
    const hasChildren = useChildren.length > 0;
    return (
        <div className="tree-node">
            <div
                className="node-view"
                draggable="true"
                onDragStart={(event) => {
                    event.stopPropagation();
                    onDragChange(node);
                }}
                onDragEnd={(event) => {
                    event.stopPropagation();
                    onDragChange(null);
                }}
            >
                {insertSlot ? insertSlot : <></>}
                <span
                    className="open"
                    data-has-children={hasChildren}
                    data-is-open={isOpen}
                    onClick={() => onToggleOpen(!isOpen)}
                />
                {node.icon ? <span className="icon" data-icon={node.icon}></span> : <></>}
                <span className="label">{node.label}</span>
            </div>
            {isOpen ? (
                <div className="sub-nodes">
                    {useChildren}
                </div>
            ): <></>}
        </div>
    )
}
