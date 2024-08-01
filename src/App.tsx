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
  ActionContext
} from './contexts';
import { Entity, Item } from './types';
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
    label: `<New Entity: ${entity.id}>`,
    actions: [
      {
        label: "Add node",
        actionId: "add-node",
        icon: "",
      },
      {
        label: "Add text",
        actionId: "add-text",
        icon: "",
      }
    ],
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

function App() {
  const entityManager = useBasicEntityManager(0);
  const data = [
    {
      id: "a",
      parentId: null,
      label: "Root node A",
    },
    {
      id: "a.a",
      parentId: "a",
      label: "AA",
    },
    {
      id: "a.b",
      parentId: "a",
      label: "AB",
    },
    {
      id: "b",
      parentId: null,
      label: "Root node B",
    },
    {
      id: "b.a",
      parentId: "b",
      label: "BA",
    },
    {
      id: "b.b",
      parentId: "b",
      label: "BB",
    },
    {
      id: "a.b.a",
      parentId: "a.b",
      label: "ABA",
    }
  ].map((d, index) => ({
    ...createItem(d, d),
    parentId: d.parentId,
    position: index,
  }));
  const hierarchyManager = useBasicHierarchyManager(data);
  const itemManager = useBasicItemManager<ItemWithContent>(data);
  const dragManager = useDragManager(hierarchyManager);
  const stateManager = useEntityStateManager({});
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
              actions: undefined,
            }
          );
          itemManager.addItem(item);
          stateManager.updateState(entity, {isOpen: true});
          hierarchyManager.addEntity(item, {parentId: entity.id, position: 0});
          break;
        }
      }
    }
  }
  const selection = (
    hierarchyManager.entityList
      .filter(e => stateManager.getState(e).isSelected)
      .map(e => itemManager.getItem(e))
  );
  return (
    <div className="app">
      <div className="hierarchy-view">
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
