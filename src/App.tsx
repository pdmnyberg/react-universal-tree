import { UniversalTree } from './components/UniversalTree'
import {
  HierarchyContext,
  DragContext,
  EntityStateContext,
  ItemContext,
  ActionContext,
  useBasicManagers
} from './contexts';
import { Entity, HierarchySlot, Item } from './types';
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

function createItem(entity: Entity, item: Partial<ItemWithContent> = {}): ItemWithContent {
  return {
    label: `<Node>`,
    content: {
      type: "node",
    },
    ...entity,
    ...item,
  }
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

function itemHasSlots(_: ItemWithContent, target: ItemWithContent) {
    if (["text"].includes(target.content.type)) {
      return false;
    }
    return true;
}

function handleAction(
  item: ItemWithContent | null, actionId: string,
  addItem: (item: ItemWithContent, slot: HierarchySlot) => void,
  removeItem: (item: Pick<ItemWithContent, "id">) => void
) {
  const slot = {parentId: item ? item.id : null, position: 0};
  switch (actionId) {
    case "add-node": {
      const item = createItem({id: ""});
      addItem(item, slot);
      break;
    }
    case "add-text": {
      const item = createItem(
        {id: ""},
        {
          label: `<Text>`,
          content: {type: "text", value: ""},
        }
      );
      addItem(item, slot);
      break;
    }
    case "remove-node": {
      if (item) {
        removeItem(item);
      }
      break;
    }
  }
}

function App() {
  const [
    dragManager,
    actionManager,
    itemManager,
    hierarchyManager,
    stateManager,
    selection
  ] = useBasicManagers<ItemWithContent>(
    itemHasSlots,
    getItemActions,
    handleAction,
  );
  return (
    <div className="app">
      <div className="hierarchy-view">
        <span
            className="button"
            onClick={() => {actionManager.triggerAction(null, "add-node")}}>Add root</span>
        {selection.length > 0 ? <>
          {
            (itemManager.getActions(selection[0]) || []).map(action => (
              <span
                key={action.actionId}
                className="button"
                onClick={() => {actionManager.triggerAction(selection[0], action.actionId)}}>{action.label}</span>
            ))
          }
        </> : <></>}
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
