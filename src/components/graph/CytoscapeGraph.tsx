import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import type { Core, EventObject } from 'cytoscape';
import dagre from 'cytoscape-dagre';
import type { ElementsDefinition } from 'cytoscape';
import type { SelectedNodeDetails, GraphLayoutType } from '../../types/graph';
import { ZoomIn, ZoomOut, Maximize2, RotateCcw, GitBranch } from 'lucide-react';

// Register dagre layout plugin once
try {
  cytoscape.use(dagre);
} catch {
  // Plugin already registered
}

interface CytoscapeGraphProps {
  elements: ElementsDefinition;
  onNodeSelect?: (details: SelectedNodeDetails | null) => void;
  onNodeClick?: (nodeId: string) => void;
  selectedNodeId?: string | null;
  className?: string;
}

export const CytoscapeGraph: React.FC<CytoscapeGraphProps> = ({
  elements,
  onNodeSelect,
  onNodeClick,
  selectedNodeId,
  className = '',
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<Core | null>(null);
  const [layoutType, setLayoutType] = useState<GraphLayoutType>('cose');
  const [zoomLevel, setZoomLevel] = useState<number>(100);

  const selectedNodeIdRef = useRef(selectedNodeId);
  const onNodeClickRef = useRef(onNodeClick);
  const onNodeSelectRef = useRef(onNodeSelect);
  const layoutTypeRef = useRef(layoutType);

  useEffect(() => {
    selectedNodeIdRef.current = selectedNodeId;
  }, [selectedNodeId]);

  useEffect(() => {
    onNodeClickRef.current = onNodeClick;
  }, [onNodeClick]);

  useEffect(() => {
    onNodeSelectRef.current = onNodeSelect;
  }, [onNodeSelect]);

  useEffect(() => {
    layoutTypeRef.current = layoutType;
  }, [layoutType]);

  // Apply layout algorithm to graph instance with natural 2D distribution
  const runLayout = useCallback((cy: Core, type: GraphLayoutType) => {
    let layoutOptions: cytoscape.LayoutOptions;

    switch (type) {
      case 'cose':
        layoutOptions = {
          name: 'cose',
          animate: true,
          animationDuration: 400,
          fit: true,
          padding: 36,
          randomize: false,
          componentSpacing: 60,
          nodeRepulsion: () => 550000,
          nodeOverlap: 20,
          idealEdgeLength: () => 90,
          edgeElasticity: () => 100,
          gravity: 0.2,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
          nodeDimensionsIncludeLabels: true,
        };
        break;
      case 'dagre-lr':
        layoutOptions = {
          name: 'dagre',
          // @ts-expect-error cytoscape-dagre layout options
          rankDir: 'LR',
          nodeSep: 24,
          rankSep: 120,
          padding: 36,
          fit: true,
          animate: true,
          animationDuration: 350,
        };
        break;
      case 'dagre-tb':
        layoutOptions = {
          name: 'dagre',
          // @ts-expect-error cytoscape-dagre layout options
          rankDir: 'TB',
          nodeSep: 24,
          rankSep: 100,
          padding: 36,
          fit: true,
          animate: true,
          animationDuration: 350,
        };
        break;
      case 'breadthfirst':
        layoutOptions = {
          name: 'breadthfirst',
          directed: true,
          circle: true, // Concentric circle distribution for tree depths
          spacingFactor: 1.25,
          padding: 36,
          fit: true,
          animate: true,
          animationDuration: 350,
        };
        break;
      default:
        layoutOptions = { name: 'grid', fit: true, padding: 36 };
    }

    const layout = cy.layout(layoutOptions);
    layout.run();
  }, []);

  // Update visual highlighting for selected node and its neighbors
  const applyHighlights = useCallback((cy: Core, targetNodeId: string | null) => {
    // Reset previous classes
    cy.elements().removeClass(
      'selected-node incoming-neighbor outgoing-neighbor incoming-edge outgoing-edge dimmed'
    );

    if (!targetNodeId) {
      return;
    }

    const selectedNode = cy.getElementById(targetNodeId);
    if (!selectedNode || selectedNode.length === 0) {
      return;
    }

    const incomingEdges = selectedNode.incomers('edge');
    const incomingNodes = selectedNode.incomers('node');
    const outgoingEdges = selectedNode.outgoers('edge');
    const outgoingNodes = selectedNode.outgoers('node');

    const connectedElements = selectedNode
      .union(incomingEdges)
      .union(incomingNodes)
      .union(outgoingEdges)
      .union(outgoingNodes);

    // Dim non-connected elements
    cy.elements().not(connectedElements).addClass('dimmed');

    // Add specific highlight classes
    selectedNode.addClass('selected-node');
    incomingEdges.addClass('incoming-edge');
    incomingNodes.addClass('incoming-neighbor');
    outgoingEdges.addClass('outgoing-edge');
    outgoingNodes.addClass('outgoing-neighbor');
  }, []);

  // Initialize Cytoscape core
  useEffect(() => {
    if (!containerRef.current) return;

    const cy = cytoscape({
      container: containerRef.current,
      elements,
      boxSelectionEnabled: false,
      autounselectify: false,
      wheelSensitivity: 0.25,
      minZoom: 0.1,
      maxZoom: 2.0,
      style: [
        // Base Node Style - intelligent label truncation & readable typography
        {
          selector: 'node',
          style: {
            label: 'data(displayLabel)',
            color: '#a1a1aa',
            'font-family': 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
            'font-size': '10px',
            'text-valign': 'bottom',
            'text-margin-y': 5,
            'text-max-width': '64px',
            'text-wrap': 'ellipsis',
            'min-zoomed-font-size': 7,
            width: 32,
            height: 32,
            'background-color': '#52525b',
            'border-width': 1.5,
            'border-color': '#181818',
            'transition-property': 'border-color, border-width, width, height, opacity, underlay-opacity',
            'transition-duration': 0.18,
          },
        },
        // Licit Node Style (Emerald)
        {
          selector: 'node[label = "licit"]',
          style: {
            'background-color': '#10b981',
            'border-color': '#064e3b',
          },
        },
        // Illicit Node Style (Rose)
        {
          selector: 'node[label = "illicit"]',
          style: {
            'background-color': '#f43f5e',
            'border-color': '#881337',
          },
        },
        // Unknown Node Style (Neutral Gray)
        {
          selector: 'node[label = "unknown"]',
          style: {
            'background-color': '#71717a',
            'border-color': '#3f3f46',
          },
        },

        // Base Directed Edge Style - fine, subdued connecting lines
        {
          selector: 'edge',
          style: {
            width: 1.2,
            'line-color': '#333333',
            'target-arrow-color': '#333333',
            'target-arrow-shape': 'triangle',
            'curve-style': 'bezier',
            'arrow-scale': 0.85,
            'transition-property': 'line-color, target-arrow-color, width, opacity',
            'transition-duration': 0.18,
          },
        },

        // Selected Node Highlight - Obsidian violet halo, preserves ground-truth background
        {
          selector: 'node.selected-node',
          style: {
            label: 'data(id)',
            width: 42,
            height: 42,
            'border-width': 3,
            'border-color': '#8b5cf6', // Obsidian violet-500
            'underlay-color': '#8b5cf6',
            'underlay-padding': 5,
            'underlay-opacity': 0.35,
            'underlay-shape': 'ellipse',
            color: '#c4b5fd',
            'font-weight': 'bold',
            'font-size': '11px',
            'text-margin-y': 7,
            'z-index': 999,
          },
        },

        // Incoming Neighbor Nodes (Violet/Indigo ring)
        {
          selector: 'node.incoming-neighbor',
          style: {
            'border-width': 2.5,
            'border-color': '#818cf8', // indigo-400
            'z-index': 990,
          },
        },

        // Outgoing Neighbor Nodes (Amber ring)
        {
          selector: 'node.outgoing-neighbor',
          style: {
            'border-width': 2.5,
            'border-color': '#f59e0b', // amber-500
            'z-index': 990,
          },
        },

        // Incoming Directed Edges
        {
          selector: 'edge.incoming-edge',
          style: {
            width: 2.4,
            'line-color': '#818cf8',
            'target-arrow-color': '#818cf8',
            'arrow-scale': 1.1,
            'z-index': 980,
          },
        },

        // Outgoing Directed Edges
        {
          selector: 'edge.outgoing-edge',
          style: {
            width: 2.4,
            'line-color': '#f59e0b',
            'target-arrow-color': '#f59e0b',
            'arrow-scale': 1.1,
            'z-index': 980,
          },
        },

        // Dimmed Non-connected Elements
        {
          selector: '.dimmed',
          style: {
            opacity: 0.12,
          },
        },
      ],
    });

    cyRef.current = cy;

    // Ensure accurate pixel dimensions before layout calculation
    cy.resize();

    // Run initial layout and apply initial highlights
    runLayout(cy, layoutTypeRef.current);
    if (selectedNodeIdRef.current) {
      applyHighlights(cy, selectedNodeIdRef.current);
    }

    // Track zoom level on zoom events
    cy.on('zoom', () => {
      setZoomLevel(Math.round(cy.zoom() * 100));
    });

    // Node click handler
    cy.on('tap', 'node', (evt: EventObject) => {
      const node = evt.target;
      const nodeId = node.id();
      const nodeData = node.data();

      applyHighlights(cy, nodeId);

      if (onNodeClickRef.current) {
        onNodeClickRef.current(nodeId);
      }

      if (onNodeSelectRef.current) {
        const incomers = node.incomers('node').map((n: cytoscape.NodeSingular) => n.id());
        const outgoers = node.outgoers('node').map((n: cytoscape.NodeSingular) => n.id());

        onNodeSelectRef.current({
          id: nodeId,
          label: nodeData.label,
          incomingCount: incomers.length,
          outgoingCount: outgoers.length,
          incomingNeighbors: incomers,
          outgoingNeighbors: outgoers,
          timestep: nodeData.timestep,
          note: nodeData.note,
          amountBtc: nodeData.amountBtc,
        });
      }
    });

    // Canvas background click handler (deselect)
    cy.on('tap', (evt: EventObject) => {
      if (evt.target === cy) {
        applyHighlights(cy, null);
        if (onNodeClickRef.current) {
          onNodeClickRef.current('');
        }
        if (onNodeSelectRef.current) {
          onNodeSelectRef.current(null);
        }
      }
    });

    // Handle container resize
    const resizeObserver = new ResizeObserver(() => {
      if (cyRef.current) {
        cyRef.current.resize();
      }
    });
    resizeObserver.observe(containerRef.current);

    // Cleanup when component unmounts
    return () => {
      resizeObserver.disconnect();
      cy.destroy();
      cyRef.current = null;
    };
  }, [elements, runLayout, applyHighlights]);

  // Sync external selectedNodeId if updated
  useEffect(() => {
    if (cyRef.current) {
      applyHighlights(cyRef.current, selectedNodeId ?? null);
    }
  }, [selectedNodeId, applyHighlights]);

  // Viewport action handlers
  const handleZoomIn = () => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() * 1.25,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  };

  const handleZoomOut = () => {
    if (cyRef.current) {
      cyRef.current.zoom({
        level: cyRef.current.zoom() * 0.8,
        renderedPosition: {
          x: cyRef.current.width() / 2,
          y: cyRef.current.height() / 2,
        },
      });
    }
  };

  const handleFit = () => {
    if (cyRef.current) {
      cyRef.current.fit(undefined, 36);
    }
  };

  const handleResetLayout = () => {
    if (cyRef.current) {
      runLayout(cyRef.current, layoutType);
    }
  };

  const handleChangeLayout = (newLayout: GraphLayoutType) => {
    setLayoutType(newLayout);
    if (cyRef.current) {
      runLayout(cyRef.current, newLayout);
    }
  };

  return (
    <div className={`relative flex flex-col w-full h-full min-h-[460px] bg-[#101010] ${className}`}>
      {/* Viewport Control Bar */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 p-1 bg-[#181818]/95 backdrop-blur border border-[#2b2b2b] rounded-md shadow-md">
        {/* Layout Selector */}
        <div className="flex items-center gap-1 px-1.5 border-r border-[#2b2b2b] text-xs text-neutral-300">
          <GitBranch className="w-3.5 h-3.5 text-violet-400" />
          <select
            value={layoutType}
            onChange={(e) => handleChangeLayout(e.target.value as GraphLayoutType)}
            className="bg-transparent text-neutral-200 text-xs focus:outline-none cursor-pointer py-0.5 pr-1 font-medium"
            title="Switch graph layout algorithm"
          >
            <option value="cose" className="bg-[#181818] text-neutral-200">
              Force-Directed (CoSE) — Default
            </option>
            <option value="dagre-lr" className="bg-[#181818] text-neutral-200">
              Directed Flow (Left → Right)
            </option>
            <option value="dagre-tb" className="bg-[#181818] text-neutral-200">
              Directed Flow (Top → Down)
            </option>
            <option value="breadthfirst" className="bg-[#181818] text-neutral-200">
              Breadth-First Circular Tree
            </option>
          </select>
        </div>

        {/* Zoom In */}
        <button
          type="button"
          onClick={handleZoomIn}
          className="p-1 rounded hover:bg-[#242424] text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          title="Zoom in"
          aria-label="Zoom in"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>

        {/* Zoom Out */}
        <button
          type="button"
          onClick={handleZoomOut}
          className="p-1 rounded hover:bg-[#242424] text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          title="Zoom out"
          aria-label="Zoom out"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        {/* Zoom percentage */}
        <span className="text-[11px] font-mono text-neutral-400 px-1 select-none">
          {zoomLevel}%
        </span>

        {/* Fit to Screen */}
        <button
          type="button"
          onClick={handleFit}
          className="p-1 rounded hover:bg-[#242424] text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          title="Fit graph to viewport"
          aria-label="Fit to screen"
        >
          <Maximize2 className="w-3.5 h-3.5" />
        </button>

        {/* Reset Layout */}
        <button
          type="button"
          onClick={handleResetLayout}
          className="p-1 rounded hover:bg-[#242424] text-neutral-400 hover:text-neutral-100 transition-colors cursor-pointer"
          title="Reset and recompute layout"
          aria-label="Reset layout"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Background Grid Pattern */}
      <div
        className="absolute inset-0 opacity-15 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.12) 1px, transparent 0)`,
          backgroundSize: '24px 24px',
        }}
      />

      {/* Cytoscape Canvas Container */}
      <div
        ref={containerRef}
        className="w-full flex-1 h-full min-h-[460px] cursor-grab active:cursor-grabbing"
      />
    </div>
  );
};
