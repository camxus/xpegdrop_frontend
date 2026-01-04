import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cn } from "@/lib/utils"

interface MasonryGridProps {
  children: React.ReactNode
  columns?: number
  gap?: number
  asChild?: boolean
  className?: string
}

export function MasonryGrid({
  children,
  columns,
  gap = 12,
  asChild = false,
  className,
}: MasonryGridProps) {
  const Comp = asChild ? Slot : "div"

  const autoRows = 8

  return (
    <Comp
      className={cn("grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5", className)}
      style={{
        gridTemplateColumns: columns && `repeat(${columns}, minmax(0, 1fr))`,
        gridAutoRows: autoRows,
        gap,
        ["--masonry-row" as any]: `${autoRows}px`,
        ["--masonry-gap" as any]: `${gap}px`,
      }}
    >
      {React.Children.map(children, (child, i) => (
        <MasonryItem key={i}>{child}</MasonryItem>
      ))}
    </Comp>
  )
}

function MasonryItem({ children }: { children: React.ReactNode }) {
  const containerRef = React.useRef<HTMLDivElement>(null)
  const contentRef = React.useRef<HTMLDivElement>(null)
  const lastSpan = React.useRef<number>(0)

  React.useLayoutEffect(() => {
    if (!containerRef.current || !contentRef.current) return

    const styles = getComputedStyle(containerRef.current)
    const row = parseFloat(styles.getPropertyValue("--masonry-row")) || 0
    const gap = parseFloat(styles.getPropertyValue("--masonry-gap"))
    const rowUnit = row + gap

    const ro = new ResizeObserver(() => {
      const height = contentRef.current!.offsetHeight
      const span = Math.ceil((height + gap) / rowUnit)

      if (span !== lastSpan.current) {
        lastSpan.current = span
        containerRef.current!.style.gridRowEnd = `span ${span}`
      }
    })

    ro.observe(contentRef.current)

    return () => ro.disconnect()
  }, [])

  return (
    <div ref={containerRef}>
      <div ref={contentRef}>{children}</div>
    </div>
  )
}
