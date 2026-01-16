"use client"

import * as React from "react"
import { GripVerticalIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface ResizablePanelGroupProps extends React.HTMLAttributes<HTMLDivElement> {
  direction?: "horizontal" | "vertical"
  children: React.ReactNode
}

function ResizablePanelGroup({
  className,
  direction = "horizontal",
  children,
  ...props
}: ResizablePanelGroupProps) {
  return (
    <div
      data-panel-group-direction={direction}
      className={cn(
        "flex h-full w-full",
        direction === "vertical" ? "flex-col" : "flex-row",
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

interface ResizablePanelProps extends React.HTMLAttributes<HTMLDivElement> {
  defaultSize?: number
  minSize?: number
  maxSize?: number
  children: React.ReactNode
}

const ResizablePanelContext = React.createContext<{
  setSize: (size: number) => void
  size: number
} | null>(null)

function ResizablePanel({
  defaultSize = 50,
  minSize = 10,
  maxSize = 90,
  className,
  children,
  style,
  ...props
}: ResizablePanelProps) {
  const [size, setSize] = React.useState(defaultSize)

  return (
    <ResizablePanelContext.Provider value={{ size, setSize }}>
      <div
        className={cn("overflow-hidden", className)}
        style={{
          flexBasis: `${size}%`,
          flexGrow: 0,
          flexShrink: 0,
          minWidth: `${minSize}%`,
          maxWidth: `${maxSize}%`,
          ...style
        }}
        data-min-size={minSize}
        data-max-size={maxSize}
        {...props}
      >
        {children}
      </div>
    </ResizablePanelContext.Provider>
  )
}

interface ResizableHandleProps extends React.HTMLAttributes<HTMLDivElement> {
  withHandle?: boolean
}

function ResizableHandle({
  withHandle,
  className,
  ...props
}: ResizableHandleProps) {
  const handleRef = React.useRef<HTMLDivElement>(null)
  const [isDragging, setIsDragging] = React.useState(false)

  React.useEffect(() => {
    const handle = handleRef.current
    if (!handle) return

    const onMouseDown = (e: MouseEvent) => {
      e.preventDefault()
      setIsDragging(true)

      const parent = handle.parentElement
      if (!parent) return

      const panels = Array.from(parent.children).filter(
        child => child !== handle && !child.hasAttribute('data-slot')
      ) as HTMLElement[]

      const handleIndex = Array.from(parent.children).indexOf(handle)
      const leftPanel = panels.find((_, i) => {
        const panelIndex = Array.from(parent.children).indexOf(panels[i])
        return panelIndex < handleIndex
      })
      const rightPanel = panels.find((_, i) => {
        const panelIndex = Array.from(parent.children).indexOf(panels[i])
        return panelIndex > handleIndex
      })

      if (!leftPanel || !rightPanel) return

      const startX = e.clientX
      const parentRect = parent.getBoundingClientRect()
      const leftStartWidth = leftPanel.getBoundingClientRect().width
      const rightStartWidth = rightPanel.getBoundingClientRect().width

      const leftMinSize = parseFloat(leftPanel.dataset.minSize || '10')
      const leftMaxSize = parseFloat(leftPanel.dataset.maxSize || '90')
      const rightMinSize = parseFloat(rightPanel.dataset.minSize || '10')
      const rightMaxSize = parseFloat(rightPanel.dataset.maxSize || '90')

      const onMouseMove = (e: MouseEvent) => {
        const deltaX = e.clientX - startX
        const parentWidth = parentRect.width
        const deltaPercent = (deltaX / parentWidth) * 100

        const leftStartPercent = (leftStartWidth / parentWidth) * 100
        const rightStartPercent = (rightStartWidth / parentWidth) * 100

        let newLeftPercent = leftStartPercent + deltaPercent
        let newRightPercent = rightStartPercent - deltaPercent

        // Apply constraints
        if (newLeftPercent < leftMinSize) {
          newLeftPercent = leftMinSize
          newRightPercent = leftStartPercent + rightStartPercent - leftMinSize
        }
        if (newLeftPercent > leftMaxSize) {
          newLeftPercent = leftMaxSize
          newRightPercent = leftStartPercent + rightStartPercent - leftMaxSize
        }
        if (newRightPercent < rightMinSize) {
          newRightPercent = rightMinSize
          newLeftPercent = leftStartPercent + rightStartPercent - rightMinSize
        }
        if (newRightPercent > rightMaxSize) {
          newRightPercent = rightMaxSize
          newLeftPercent = leftStartPercent + rightStartPercent - rightMaxSize
        }

        leftPanel.style.flexBasis = `${newLeftPercent}%`
        rightPanel.style.flexBasis = `${newRightPercent}%`
      }

      const onMouseUp = () => {
        setIsDragging(false)
        document.removeEventListener('mousemove', onMouseMove)
        document.removeEventListener('mouseup', onMouseUp)
      }

      document.addEventListener('mousemove', onMouseMove)
      document.addEventListener('mouseup', onMouseUp)
    }

    handle.addEventListener('mousedown', onMouseDown)
    return () => handle.removeEventListener('mousedown', onMouseDown)
  }, [])

  return (
    <div
      ref={handleRef}
      data-slot="resizable-handle"
      className={cn(
        "relative flex w-1 cursor-col-resize items-center justify-center bg-border hover:bg-primary/20 transition-colors",
        isDragging && "bg-primary/30",
        className
      )}
      {...props}
    >
      {withHandle && (
        <div className="z-10 flex h-6 w-4 items-center justify-center rounded-sm border bg-border hover:bg-muted">
          <GripVerticalIcon className="h-3 w-3" />
        </div>
      )}
    </div>
  )
}

export { ResizablePanelGroup, ResizablePanel, ResizableHandle }
