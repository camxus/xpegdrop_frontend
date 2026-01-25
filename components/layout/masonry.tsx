import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface MasonryGridProps {
  children: React.ReactNode
  gap?: number
  asChild?: boolean
  className?: string
}

export function MasonryGrid({
  children,
  gap = 12,
  asChild = false,
  className,
}: MasonryGridProps) {
  const Comp = asChild ? Slot : "div"
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [columns, setColumns] = React.useState(2)

  // Function to compute columns based on breakpoints
  const updateColumns = () => {
    if (!containerRef.current) return
    const width = containerRef.current.offsetWidth
    let newCols = 2
    if (width >= 1024) newCols = 5      // lg:grid-cols-5
    else if (width >= 768) newCols = 4  // md:grid-cols-4
    else if (width >= 640) newCols = 3  // sm:grid-cols-3
    else newCols = 2                     // default grid-cols-2
    setColumns(newCols)
  }

  // Update columns on mount and on resize
  React.useEffect(() => {
    updateColumns()
    window.addEventListener("resize", updateColumns)
    return () => window.removeEventListener("resize", updateColumns)
  }, [])

  // Convert children to array and distribute sequentially
  const items = React.Children.toArray(children)
  const columnsArray: React.ReactNode[][] = Array.from({ length: columns }, () => [])
  items.forEach((item, i) => {
    const colIndex = i % columns
    columnsArray[colIndex].push(item)
  })

  return (
    <Comp
      ref={containerRef}
      className={cn("flex", className)}
      style={{ gap }}
    >
      {columnsArray.map((colItems, colIndex) => (
        <div
          key={colIndex}
          className="flex flex-col"
          style={{ gap, flex: 1 }}
        >
          {colItems.map((child, i) => (
            <div key={i}>{child}</div>
          ))}
        </div>
      ))}
    </Comp>
  )
}
