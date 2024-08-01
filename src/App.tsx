import { UniversalTree } from './components/UniversalTree'
import {
  HierarchyContext,
  DragContext,
  EntityStateContext,
  ItemContext,
  useDragManager,
  useBasicHierarchyManager,
  useEntityStateManager,
  useBasicItemManager
} from './contexts';

function App() {
  const data = [
    {
      id: "a",
      parentId: null,
      label: "Root node A",
      isOpen: true,
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
  ].map((d, index) => ({...d, position: index}));
  const hierarchyManager = useBasicHierarchyManager(data);
  const itemManager = useBasicItemManager(data)
  const dragManager = useDragManager(hierarchyManager);
  const selectionManager = useEntityStateManager({});
  return (
    <HierarchyContext.Provider value={hierarchyManager}>
      <ItemContext.Provider value={itemManager}>
        <DragContext.Provider value={dragManager}>
          <EntityStateContext.Provider value={selectionManager}>
            <UniversalTree/>
          </EntityStateContext.Provider>
        </DragContext.Provider>
      </ItemContext.Provider>
    </HierarchyContext.Provider>
  )
}

export default App
