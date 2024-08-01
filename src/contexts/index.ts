import React from 'react'
import {
    Entity,
    EntityId,
    Item,
    ItemAction,
    HierarchyEntity,
    HierarchySlot,
    EntityState
} from '../types'

export type HierarchyManager = {
    entityList: HierarchyEntity[];
    getChildren(entity: Entity): HierarchyEntity[];
    moveEntity(entity: Entity, slot: HierarchySlot): void;
}

export type EntityManager = {
    createEntity(): Entity;
}

export type ActionManager = {
    triggerAction(entity: Entity | null, actionId: string): void;
}

export type ItemManager<T extends Item> = {
    getItem(entity: Entity): T;
    getActions(entity: Entity): ItemAction[] | undefined;
    updateItem(item: Partial<T> & Entity): void;
}

export type EntityStateManager = {
    getState(entity: Entity): EntityState;
    updateState(entity: Entity, state: Partial<EntityState>): void;
}

type DragManager = {
    drag(entity: Entity | null): void;
    drop(slot: HierarchySlot | null): void;
    hasMatchingSlot(sourceEntity: Entity, targetEntity: Entity): boolean;
    currentEntity: Entity | null;
}

export const ActionContext = React.createContext<ActionManager>({
    triggerAction(entity, actionId) {console.log(entity, actionId)},
})

export const HierarchyContext = React.createContext<HierarchyManager>({
    entityList: [],
    getChildren() {return []},
    moveEntity() {},
})

export const ItemContext = React.createContext<ItemManager<Item>>({
    getItem() {return {id: "", label: ""}},
    getActions() {return undefined},
    updateItem() {},
})

export const EntityStateContext = React.createContext<EntityStateManager>({
    getState() {return {isOpen: true, isSelected: false}},
    updateState() {}
})

export const DragContext = React.createContext<DragManager>({
    drag(n) {
       console.log(n);
    },
    drop(s) {
        console.log(s);
    },
    hasMatchingSlot() {
        return false;
    },
    currentEntity: null,
})

export function useBasicEntityManager(initialCounter: number): EntityManager & {counter: number} {
    const [counter, setCounter] = React.useState(initialCounter);
    return {
        createEntity() {
            setCounter(counter + 1);
            return {
                id: `entity-${counter}`
            };
        },
        counter: counter,
    }
}

function _moveEntity(entityList: HierarchyEntity[], entity: Entity, slot: HierarchySlot) {
    const updatedEntityList = entityList.filter(e => e.id !== entity.id);
    const insertIndex = updatedEntityList.findIndex((() => {
        let currentPos = 0;
        return (e: HierarchyEntity) => {
            if (currentPos === slot.position) {
                return true;
            }
            if (e.parentId === slot.parentId) {
                currentPos++;
            }
            return false;
        }
    })())
    updatedEntityList.splice(
        insertIndex,
        0,
        {id: entity.id, parentId: slot.parentId, position: slot.position}
    );
    const positionAcc: {[x: EntityId]: number} = {};
    return updatedEntityList.map(e => {
        const currentPosition = positionAcc[e.id] || 0
        positionAcc[e.id] = currentPosition + 1;
        return {
            ...e,
            position: currentPosition
        }
    });
}

export function useBasicHierarchyManager(initialEntityList: HierarchyEntity[]): (
    HierarchyManager & {
        addEntity(entity: Entity, slot: HierarchySlot): void;
        removeEntity(entity: Entity): void;
    }
) {
    const [entityList, setEntityList] = React.useState(initialEntityList);
    return {
        entityList,
        getChildren(entity: Entity) {return entityList.filter(n => n.parentId === entity.id)},
        moveEntity(entity: Entity, slot: HierarchySlot) {
            setEntityList(_moveEntity(entityList, entity, slot));
        },
        addEntity(entity: Entity, slot: HierarchySlot) {
            setEntityList(_moveEntity(entityList, entity, slot));
        },
        removeEntity(entity: Entity) {
            setEntityList(entityList.filter(e => e.id !== entity.id));
        }
    };
}

export function useDragManager(
    hierarchyManager: HierarchyManager,
    hasMatchingSlot: (s: Entity, t: Entity) => boolean = () => true,
): DragManager {
    const [currentEntity, setCurrentEntity] = React.useState<Entity | null>(null);
    return {
        currentEntity,
        drag(entity: Entity | null) {
            setCurrentEntity(entity);
        },
        drop(slot: HierarchySlot | null) {
            if (slot && currentEntity) {
                hierarchyManager.moveEntity(currentEntity, slot);
            };
            setCurrentEntity(null);
        },
        hasMatchingSlot
    }
}

function _getState(states: {[x: EntityId]: EntityState}, entity: Entity) {
    return states[entity.id] || {
        isSelected: false,
        isOpen: false,
    };
};
function _clearSelection(states: {[x: EntityId]: EntityState}) {
    return Object.keys(states).reduce<{[x: EntityId]: EntityState}>((acc, key) => {
        acc[key] = {..._getState(states, {id: key}), isSelected: false}
        return acc;
    }, {});
}

export function useEntityStateManager(
    initialStates: {[x: EntityId]: EntityState},
    multiSelect: boolean = false
): EntityStateManager {
    const [states, setStates] = React.useState(initialStates);
    return {
        getState(entity) {
            return _getState(states, entity);
        },
        updateState(entity, state) {
            const allStates = (
                multiSelect
                    ? states
                    : "isSelected" in state
                        ? _clearSelection(states)
                        : states
            );
            const currentState = _getState(states, entity);
            setStates({
                ...allStates,
                [entity.id]: {
                    ...currentState,
                    ...state
                }
            });
        },
    }
}

export function useBasicItemManager<T extends Item>(
    initialItemList: T[],
    getActions: (item: T) => ItemAction[] | undefined = () => undefined
): (
    ItemManager<T> & {
        addItem(item: T): void;
        removeItem(entity: Entity): void;
    }
) {
    const [items, setItems] = React.useState(() => {
        return initialItemList.reduce<{[x: EntityId]: T}>((acc, item) => {
            acc[item.id] = item;
            return acc;
        }, {})
    });
    function getItem(entity: Entity) {
        return items[entity.id];
    }

    return {
        addItem(item: T) {
            setItems({...items, [item.id]: item});
        },
        removeItem(entity: Entity) {
            setItems(Object.values(items).reduce<{[x: EntityId]: T}>((acc, i) => {
                if (i.id !== entity.id) {
                    acc[i.id] = i;
                }
                return acc;
            }, {}))
        },
        getItem,
        getActions(entity: Entity) {
            return getActions(getItem(entity));
        },
        updateItem(item) {
            setItems({
                ...items,
                [item.id]: {
                    ...getItem(item),
                    ...item,
                }
            });
        }
    }
}