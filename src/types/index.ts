export type EntityId = string;

export type Entity = {
    id: EntityId;
}

export type ItemDescriptor = {
    icon?: string;
    label: string;
}

export type ItemAction = (
    ItemDescriptor & {
        actionId: string;
    }
)

export type Item = ItemDescriptor & Entity;

export type HierarchySlot = {
    parentId: EntityId | null;
    position: number;
}

export type HierarchyEntity = Entity & HierarchySlot

export type EntityState = {
    isSelected: boolean;
    isOpen: boolean;
}