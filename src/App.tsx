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

function createItem(entity: Entity, item: Partial<Item> = {}): Item {
  return {
    label: `<New Entity: ${entity.id}>`,
    actions: [
      {
        label: "Add node",
        actionId: "add-node",
        icon: "",
      }
    ],
    ...entity,
    ...item,
  }
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
  const itemManager = useBasicItemManager(data);
  const dragManager = useDragManager(hierarchyManager);
  const selectionManager = useEntityStateManager({});
  const actionManager: ActionManager = {
    triggerAction(entity, actionId) {
      if (actionId === "add-node") {
        const newEntity = entityManager.createEntity();
        const item = createItem(newEntity);
        itemManager.addItem(item);
        hierarchyManager.addEntity(item, {parentId: entity.id, position: 0});
      }
    }
  }
  return (
    <ActionContext.Provider value={actionManager}>
      <HierarchyContext.Provider value={hierarchyManager}>
        <ItemContext.Provider value={itemManager}>
          <DragContext.Provider value={dragManager}>
            <EntityStateContext.Provider value={selectionManager}>
              <UniversalTree/>
            </EntityStateContext.Provider>
          </DragContext.Provider>
        </ItemContext.Provider>
      </HierarchyContext.Provider>
    </ActionContext.Provider>
  )
}

export default App
