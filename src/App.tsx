import { useState } from 'react'
import { UniversalTree } from './components/UniversalTree'

function App() {
  const nodeList: Node[] = [
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
  return (
    <>
      <UniversalTree nodeList={nodeList} />
    </>
  )
}

export default App
