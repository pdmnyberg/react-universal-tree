import React from 'react'
import { UniversalTree } from './components/UniversalTree'
import {
  HierarchyContext,
  DragContext,
  EntityStateContext,
  ItemContext,
  useDragManager,
  useBasicHierarchyManager,
  useEntityStateManager,
  useBasicItemManager,
  useBasicEntityManager,
  ActionManager,
  ActionContext,
  ItemManager,
  HierarchyManager,
  EntityStateManager
} from './contexts';
import { Entity, EntityState, HierarchyEntity, Item } from './types';
import "./App.css";

type ItemWithContent = Item & {
  content: (
    {
      type: "node";
    } | {
      type: "text";
      value: string;
    } | {
      type: "layout-group";
      layoutType: "flow" | "grid";
      style: "cards" | "none";
      columns: number;
    }
  )
}

type AppData<T extends Item> = {
  items: T[];
  hierarchy: HierarchyEntity[];
  state: {
    [x: string]: EntityState;
  },
  counter: number,
}

function createItem(entity: Entity, item: Partial<ItemWithContent> = {}): ItemWithContent {
  return {
    label: `<New Entity: ${entity.id}>`,
    content: {
      type: "node",
    },
    ...entity,
    ...item,
  }
}

function getItemActions(item: ItemWithContent) {
  const removeNode = {
    label: "Remove node",
    actionId: "remove-node",
    icon: "x",
  };
  if (["node", "layout-group"].includes(item.content.type)) {
    return [
      {
        label: "Add node",
        actionId: "add-node",
        icon: "n",
      },
      {
        label: "Add text",
        actionId: "add-text",
        icon: "t",
      },
      removeNode
    ]
  }
  return [
    removeNode
  ]
}

function SelectionItem(props: {item: ItemWithContent, updateItem: (item: Entity & Partial<ItemWithContent>) => void}) {
  const {item, updateItem} = props;
  return (
    <div className="selection-item">
      <div className="content-section">
        <label>Label: </label>
        <input type="text" value={item.label} onChange={(event) => updateItem({id: item.id, label: event.target.value})}/>
      </div>
      {(
        function(content: ItemWithContent["content"]) {
          switch(content.type) {
            case "text": return (
              <div className="content-section">
                <label>Text: </label>
                <textarea value={content.value} onChange={(event) => updateItem({id: item.id, content: {...content, value: event.target.value}})}/>
              </div>
            );
            case "layout-group": return (
              <div className="content-section">
                layout-g
              </div>
            );
            default:
              return (
                <div className="content-section">
                  {content.type}
                </div>
              );
          }
        }
      )(item.content)}
    </div>
  )
}

function loadAppData<T extends Item>(appId: string): AppData<T> {
  const rawData = sessionStorage.getItem(appId);
  return rawData ? JSON.parse(rawData) : {
    items: [
      createItem(
        {id: "root"},
        {
          label: "Root",
          content: {type: "node"}
        }
      )
    ],
    hierarchy: [{id: "root", parentId: null}],
    state: {},
    counter: 0,
  };
}

function saveAppData<T extends Item>(
  appId: string,
  itemManager: ItemManager<T>,
  hierarchyManager: HierarchyManager,
  stateManager: EntityStateManager,
  entityCounter: number
) {
  const data: AppData<T> = {
    items: hierarchyManager.entityList.map(e => itemManager.getItem(e)),
    hierarchy: hierarchyManager.entityList,
    state: hierarchyManager.entityList.reduce<AppData<T>["state"]>((acc, e) => {
      acc[e.id] = stateManager.getState(e);
      return acc;
    }, {}),
    counter: entityCounter
  };
  sessionStorage.setItem(appId, JSON.stringify(data));
}

function App() {
  const appId = "app-data";
  const [multiSelect, setMultiSelect] = React.useState(false);
  const appData = React.useMemo(() => loadAppData<ItemWithContent>(appId), []);
  const entityManager = useBasicEntityManager(appData.counter);
  const hierarchyManager = useBasicHierarchyManager(appData.hierarchy);
  const itemManager = useBasicItemManager<ItemWithContent>(
    appData.items,
    getItemActions
  );
  function hasMatchingSlot(_: Entity, target: Entity) {
    const targetItem = itemManager.getItem(target);
    if (["text"].includes(targetItem.content.type)) {
      return false;
    }
    return true;
  }
  const dragManager = useDragManager(hierarchyManager, hasMatchingSlot);
  const stateManager = useEntityStateManager(appData.state, multiSelect);
  const actionManager: ActionManager = {
    triggerAction(entity, actionId) {
      switch (actionId) {
        case "add-node": {
          const newEntity = entityManager.createEntity();
          const item = createItem(newEntity);
          itemManager.addItem(item);
          stateManager.updateState(entity, {isOpen: true});
          hierarchyManager.addEntity(item, {parentId: entity.id, position: 0});
          break;
        }
        case "add-text": {
          const newEntity = entityManager.createEntity();
          const item = createItem(
            newEntity,
            {
              label: `<Text-${newEntity.id}>`,
              content: {type: "text", value: ""},
            }
          );
          itemManager.addItem(item);
          stateManager.updateState(entity, {isOpen: true});
          hierarchyManager.addEntity(item, {parentId: entity.id, position: 0});
          break;
        }
        case "remove-node": {
          hierarchyManager.removeEntity(entity);
          itemManager.removeItem(entity);
          break;
        }
      }
    }
  }
  React.useEffect(() => {
    function shiftListener(event: KeyboardEvent) {
      if (event.key === "Shift") {
        setMultiSelect(event.type === "keydown");
      }
    }
    addEventListener("keydown", shiftListener);
    addEventListener("keyup", shiftListener);
    return () => {
      removeEventListener("keydown", shiftListener);
      removeEventListener("keyup", shiftListener);
    };
  }, [setMultiSelect, multiSelect]);
  React.useEffect(() => {
    saveAppData(
      appId,
      itemManager,
      hierarchyManager,
      stateManager,
      entityManager.counter
    );
  }, [itemManager, hierarchyManager, stateManager, entityManager.counter]);
  const selection = (
    hierarchyManager.entityList
      .filter(e => stateManager.getState(e).isSelected)
      .map(e => itemManager.getItem(e))
  );
  return (
    <div className="app">
      <div className="hierarchy-view">
        {selection.length > 0 ? <>{
          (itemManager.getActions(selection[0]) || []).map(action => (
            <span
              key={action.actionId}
              className="button"
              onClick={() => {actionManager.triggerAction(selection[0], action.actionId)}}>{action.label}</span>
          ))
        }</> : <></>}
        <ActionContext.Provider value={actionManager}>
          <HierarchyContext.Provider value={hierarchyManager}>
            <ItemContext.Provider value={itemManager}>
              <DragContext.Provider value={dragManager}>
                <EntityStateContext.Provider value={stateManager}>
                  <UniversalTree/>
                </EntityStateContext.Provider>
              </DragContext.Provider>
            </ItemContext.Provider>
          </HierarchyContext.Provider>
        </ActionContext.Provider>
      </div>
      <div className="selection-view">
        {selection.map(item => (
          <SelectionItem key={item.id} item={item} updateItem={itemManager.updateItem}/>
        ))}
      </div>
    </div>
  )
}

export default App
