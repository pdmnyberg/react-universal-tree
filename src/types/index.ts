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