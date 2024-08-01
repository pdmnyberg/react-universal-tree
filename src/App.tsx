import { UniversalTree } from './components/UniversalTree'
import {
  useNodeListManager,
  NodeTreeContext,
  DragContext,
  SelectionContext,
  useDragManager,
  useSelectionManager,
} from './contexts';

function App() {
  const nodeManager = useNodeListManager(
    [
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
    ]
  )
  const dragManager = useDragManager(nodeManager);
  const selectionManager = useSelectionManager([]);
  return (
    <NodeTreeContext.Provider value={nodeManager}>
      <DragContext.Provider value={dragManager}>
        <SelectionContext.Provider value={selectionManager}>
          <UniversalTree/>
        </SelectionContext.Provider>
      </DragContext.Provider>
    </NodeTreeContext.Provider>
  )
}

export default App
