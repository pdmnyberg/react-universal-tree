import React from 'react'
import {Node, NodeId, Slot} from '../types'

export type NodeTreeManager = {
    nodeList: Node[];
    getNode(id: NodeId): Node;
    getChildren(parentId: NodeId): Node[];
    updateNode(node: Partial<Node> & Pick<Node, "id">, position?: number): void;
}

export type SelectionManager = {
    isSelected(node: Pick<Node, "id">): boolean;
    toggleSelect(node: Pick<Node, "id">): void;
}

export const NodeTreeContext = React.createContext<NodeTreeManager>({
    nodeList: [],
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

type DragManager = {
    dragNode: (node: Node | null) => void;
    dropNode: (slot: Slot | null) => void;
    currentNode: Node | null;
}

export const DragContext = React.createContext<DragManager>({
    dragNode(n) {
       console.log(n);
    },
    dropNode(s) {
        console.log(s);
    },
    currentNode: null
})

export const SelectionContext = React.createContext<SelectionManager>({
    isSelected() {return false},
    toggleSelect() {}
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

export function useNodeListManager(initialNodeList: Node[]): NodeTreeManager & {setNodeList(l: Node[]): void} {
    const [nodeList, setNodeList] = React.useState(initialNodeList);
    return {
        nodeList: nodeList,
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
            setNodeList(updatedNodeList);
        },
        setNodeList(nodeList: Node[]) {
            setNodeList(nodeList)
        }
    };
}

export function useDragManager(nodeManager: NodeTreeManager): DragManager {
    const [currentNode, dragNode] = React.useState<Node | null>(null);
    return {
        currentNode,
        dragNode(n: Node | null) {
            dragNode(n);
        },
        dropNode(s: Slot | null) {
            if (s && currentNode) {
                nodeManager.updateNode({id: currentNode.id, parentId: s.parentId}, s.position);
            }
            dragNode(null);
        }
    }
}

export function useSelectionManager(initialSelection: Pick<Node, "id">[]): SelectionManager {
    const [selections, setSelections] = React.useState(initialSelection);
    const isSelected = (node: Pick<Node, "id">) => selections.some(n => n.id === node.id);
    return {
        isSelected,
        toggleSelect(node) {
            if (isSelected(node)) {
                setSelections([])
            } else {
                setSelections([node])
            }
        }
    }
}