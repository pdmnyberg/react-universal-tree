export type EntityId = string;

export type Entity = {
    id: EntityId;
}

export type ItemDescriptor = {
    icon?: string;
    label: string;
}

export type Item = ItemDescriptor & Entity & {
    actions?: (
        ItemDescriptor & {
            actionId: string;
        }
    )[]
}

export type HierarchySlot = {
    parentId: EntityId | null;
    position: number;
}

export type HierarchyEntity = Entity & HierarchySlot

export type EntityState = {
    isSelected: boolean;
    isOpen: boolean;
}