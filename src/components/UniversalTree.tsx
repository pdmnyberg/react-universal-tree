import React, { Fragment } from 'react'
import { Entity, HierarchySlot, Item, ItemAction } from '../types'
import { HierarchyContext, DragContext, EntityStateContext, ItemContext, ActionContext } from '../contexts';
import './UniversalTree.css'

export function UniversalTree() {
    const hierarchyManager = React.useContext(HierarchyContext);
    const { drop, currentEntity } = React.useContext(DragContext);
    const rootEntities = hierarchyManager.entityList.filter(n => n.parentId === null);
    const showSlots = !!currentEntity;

    return (
        <div className="universal-tree">
            {rootEntities.map((entity, index) => (
                <Fragment key={entity.id}>
                    {showSlots ? <TreeSlot
                        slot={{ parentId: null, position: index }}
                        onDrop={drop}
                    /> : <></>}
                    <BoundTreeNode entity={entity} showSlots={true} />
                </Fragment>
            ))}
            {showSlots ? <TreeSlot
                slot={{ parentId: null, position: rootEntities.length }}
                onDrop={drop}
            /> : <></>}
        </div>
    )
}

export function BoundTreeNode({ entity, showSlots }: { entity: Entity, showSlots: boolean }) {
    const { getState, updateState } = React.useContext(EntityStateContext);
    const hierarchyManager = React.useContext(HierarchyContext);
    const itemManager = React.useContext(ItemContext);
    const { triggerAction } = React.useContext(ActionContext);
    const { drag, drop, hasMatchingSlot, currentEntity } = React.useContext(DragContext);
    const nodeList = hierarchyManager.getChildren(entity);
    const isCurrentNode = currentEntity && currentEntity.id === entity.id;
    showSlots = showSlots && !!currentEntity && hasMatchingSlot(currentEntity, entity) && !isCurrentNode;
    const state = getState(entity);
    const item = itemManager.getItem(entity);
    const actions = itemManager.getActions(entity);
    return (
        <TreeNode
            item={item}
            actions={actions}
            isOpen={state.isOpen}
            isSelected={state.isSelected}
            onSelect={(isSelected) => updateState(entity, { isSelected })}
            onDragChange={drag}
            onOpen={(isOpen) => updateState(entity, { isOpen })}
            insertSlot={
                showSlots ? <TreeSlot
                    slot={{ position: nodeList.length, parentId: entity.id }}
                    onDrop={drop}
                /> : undefined
            }
            onAction={triggerAction}
        >
            {nodeList.map((e, index) => {
                return (
                    <Fragment key={e.id}>
                        {showSlots
                            ? <TreeSlot
                                slot={{ parentId: entity.id, position: index }}
                                onDrop={drop}
                            />
                            : <></>}
                        <BoundTreeNode entity={e} showSlots={showSlots} />
                    </Fragment>
                );
            })}
        </TreeNode>
    )
}

export function TreeSlot(props: { slot: HierarchySlot, onDrop?: (slot: HierarchySlot) => void }) {
    const [isActive, setIsActive] = React.useState(false);
    const { onDrop, slot } = {
        onDrop: () => { },
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
            onDragLeave={(event) => {
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
        item: Item;
        actions?: ItemAction[],
        onOpen?: (isOpen: boolean) => void;
        onDragChange?: (entity: Entity | null) => void;
        onSelect?: (isSelected: boolean) => void;
        onAction?: (entity: Entity, actionId: string) => void;
        isSelected?: boolean;
        isOpen?: boolean;
        children?: JSX.Element[];
        insertSlot?: JSX.Element;
    }
) {
    const {
        item,
        actions,
        children,
        insertSlot,
        isSelected,
        isOpen,
        onDragChange,
        onOpen,
        onSelect,
        onAction,
    } = {
        isSelected: false,
        isOpen: true,
        onDragChange: () => { },
        onOpen: () => { },
        onSelect: () => { },
        onAction: () => { },
        ...props
    };
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
                    onSelect(!isSelected);
                }}
                onDragStart={(event) => {
                    event.stopPropagation();
                    onDragChange(item);
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
                        onOpen(!isOpen);
                    }}
                />
                {item.icon ? <span className="icon" data-icon={item.icon}></span> : <></>}
                <span className="label">{item.label || "<Unnamed node>"}</span>
                {actions ? <>{actions.map(action => (
                    <span
                        key={action.actionId}
                        className="action"
                        aria-label={action.label}
                        data-icon={action.icon}
                        onClick={(event) => {
                            event.preventDefault();
                            event.stopPropagation();
                            onAction(item, action.actionId);
                        }}></span>
                ))}</> : <></>}
            </div>
            {isOpen ? (
                <div className="sub-nodes">
                    {useChildren}
                </div>
            ) : <></>}
        </div>
    )
}
