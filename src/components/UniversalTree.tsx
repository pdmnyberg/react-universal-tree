import React, { Fragment } from 'react'
import { Node, NodeId, Slot } from '../types'
import { NodeTreeContext,  DragContext, SelectionContext } from '../contexts';
import './UniversalTree.css'

export function UniversalTree() {
    const nodeManager = React.useContext(NodeTreeContext);
    const {dropNode, currentNode} = React.useContext(DragContext);
    const rootNodes = nodeManager.nodeList.filter(n => n.parentId === null);
    const showSlots = !!currentNode;

    return (
        <div className="universal-tree">
            {rootNodes.map((node, index) => (
                <Fragment key={node.id}>
                    {showSlots ? <TreeSlot
                        slot={{parentId: null, position: index}}
                        onDrop={dropNode}
                    /> : <></>}
                    <BoundTreeNode id={node.id} showSlots={true}/>
                </Fragment>
            ))}
            {showSlots ? <TreeSlot
                slot={{parentId: null, position: rootNodes.length}}
                onDrop={dropNode}
            /> : <></>}
        </div>
    )
}

export function BoundTreeNode({id, showSlots}: {id: NodeId, showSlots: boolean}) {
    const {isSelected, toggleSelect} = React.useContext(SelectionContext);
    const nodeManager = React.useContext(NodeTreeContext);
    const {dragNode, dropNode, currentNode} = React.useContext(DragContext);
    const node = nodeManager.getNode(id);
    const nodeList = nodeManager.getChildren(id);
    const toggleNodeOpen = (id: NodeId, isOpen: boolean) => {
        nodeManager.updateNode({id, isOpen});
    }
    const isCurrentNode = currentNode && currentNode.id === node.id;
    showSlots = showSlots && !!currentNode && !isCurrentNode;
    return (
        <TreeNode
            node={node}
            isSelected={isSelected(node)}
            onSelect={() => toggleSelect(node)}
            onDragChange={dragNode}
            onToggleOpen={(isOpen) => toggleNodeOpen(node.id, isOpen)}
            insertSlot={
                showSlots ? <TreeSlot
                    slot={{position: nodeList.length, parentId: node.id}}
                    onDrop={dropNode}
                /> : undefined
            }
        >
            {nodeList.map((n, index) => {
                return (
                    <Fragment key={n.id}>
                        {showSlots
                            ? <TreeSlot
                                slot={{parentId: node.id, position: index}}
                                onDrop={dropNode}
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
        onDragChange?: (node: Node | null) => void;
        onSelect?: () => void;
        isSelected?: boolean;
        children?: JSX.Element[];
        insertSlot?: JSX.Element;
    }
) {
    const {
        node,
        children,
        insertSlot,
        isSelected,
        onDragChange,
        onToggleOpen,
        onSelect,
    } = {
        isSelected: false,
        onDragChange: () => {},
        onToggleOpen: () => {},
        onSelect: () => {},
        ...props
    };
    const isOpen = !!node.isOpen;
    const useChildren = React.Children.toArray(children);
    const hasChildren = useChildren.length > 0;
    return (
        <div className="tree-node" data-selected={isSelected}>
            <div
                className="node-view"
                draggable="true"
                onClick={(event) => {
                    event.stopPropagation();
                    event.preventDefault();
                    onSelect();
                }}
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
                    onClick={(event) => {
                        event.stopPropagation();
                        event.preventDefault();
                        onToggleOpen(!isOpen)
                    }}
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
