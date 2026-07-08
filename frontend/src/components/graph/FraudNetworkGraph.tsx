import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export interface GraphNode {
  id: string;
  label: string;
  phone: string;
  ip: string;
  risk_score: number;
  pagerank: number;
  in_degree: number;
  out_degree: number;
  community_id: number;
  betti_0: number;
  betti_1: number;
  status: 'SAFE' | 'SUSPICIOUS' | 'MULE';
  // D3 physics extensions
  x?: number;
  y?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface GraphEdge {
  source: string | GraphNode;
  target: string | GraphNode;
  weight: number;
  count: number;
}

interface FraudNetworkGraphProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
  onNodeClick: (nodeId: string) => void;
  selectedCommunityId?: number | null;
}

export const FraudNetworkGraph: React.FC<FraudNetworkGraphProps> = ({
  nodes,
  edges,
  onNodeClick,
  selectedCommunityId
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !containerRef.current) return;

    // Clear previous drawing
    d3.select(svgRef.current).selectAll('*').remove();

    if (nodes.length === 0) return;

    const width = containerRef.current.clientWidth || 800;
    const height = containerRef.current.clientHeight || 550;

    const svg = d3.select(svgRef.current)
      .attr('width', '100%')
      .attr('height', '100%')
      .attr('viewBox', `0 0 ${width} ${height}`);

    // Create container group for zoom/pan
    const g = svg.append('g');

    // Setup zoom behavior
    const zoomBehavior = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 8])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });

    svg.call(zoomBehavior);

    // Reset zoom on double click background
    svg.on('dblclick.zoom', () => {
      svg.transition().duration(750).call(
        zoomBehavior.transform,
        d3.zoomIdentity.translate(0, 0).scale(1)
      );
    });

    // Arrow markers for directed links
    svg.append('defs').append('marker')
      .attr('id', 'arrow')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22) // Place arrow near node boundary
      .attr('refY', 0)
      .attr('markerWidth', 6)
      .attr('markerHeight', 6)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', 'rgba(255,255,255,0.25)');

    // Arrow markers for high risk links
    svg.select('defs').append('marker')
      .attr('id', 'arrow-danger')
      .attr('viewBox', '0 -5 10 10')
      .attr('refX', 22)
      .attr('refY', 0)
      .attr('markerWidth', 7)
      .attr('markerHeight', 7)
      .attr('orient', 'auto')
      .append('path')
      .attr('d', 'M0,-4L10,0L0,4')
      .attr('fill', 'rgba(239, 68, 68, 0.7)');

    // Map source/target IDs to object references to prevent D3 mutation errors
    const d3Nodes: GraphNode[] = nodes.map(n => ({ ...n }));
    const d3Edges: GraphEdge[] = edges.map(e => {
      const sourceId = typeof e.source === 'object' ? (e.source as GraphNode).id : e.source;
      const targetId = typeof e.target === 'object' ? (e.target as GraphNode).id : e.target;
      return {
        source: d3Nodes.find(n => n.id === sourceId) || sourceId,
        target: d3Nodes.find(n => n.id === targetId) || targetId,
        weight: e.weight,
        count: e.count
      };
    });

    // Create D3 Force Simulation
    const simulation = d3.forceSimulation<GraphNode>(d3Nodes)
      .force('link', d3.forceLink<GraphNode, GraphEdge>(d3Edges)
        .id((d) => d.id)
        .distance(80)
      )
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collide', d3.forceCollide().radius(30));

    // Draw Links
    const link = g.append('g')
      .selectAll('line')
      .data(d3Edges)
      .enter()
      .append('line')
      .attr('stroke', (d: any) => {
        // Red edge if both source/target are MULE nodes
        const srcMule = d.source.status === 'MULE';
        const dstMule = d.target.status === 'MULE';
        return (srcMule && dstMule) ? 'rgba(239, 68, 68, 0.5)' : 'rgba(255, 255, 255, 0.15)';
      })
      .attr('stroke-width', (d: any) => Math.min(5, Math.max(1, d.count)))
      .attr('marker-end', (d: any) => {
        const srcMule = d.source.status === 'MULE';
        const dstMule = d.target.status === 'MULE';
        return (srcMule && dstMule) ? 'url(#arrow-danger)' : 'url(#arrow)';
      });

    // Tooltip Element
    const tooltip = d3.select(containerRef.current)
      .append('div')
      .style('position', 'absolute')
      .style('visibility', 'hidden')
      .style('background-color', '#111827')
      .style('color', '#F9FAFB')
      .style('border', '1px solid rgba(255,255,255,0.12)')
      .style('border-radius', '8px')
      .style('padding', '8px 12px')
      .style('font-size', '11px')
      .style('font-family', 'monospace')
      .style('pointer-events', 'none')
      .style('box-shadow', '0 10px 15px -3px rgba(0,0,0,0.5)')
      .style('z-index', '10');

    // Draw Node Groups
    const node = g.append('g')
      .selectAll('.node')
      .data(d3Nodes)
      .enter()
      .append('g')
      .attr('class', 'node')
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        onNodeClick(d.id);
      })
      .on('mouseover', (event, d) => {
        tooltip.html(`
          <div style="font-weight: bold; color: #3B82F6">${d.label}</div>
          <div style="margin-top: 4px">ID: ${d.id}</div>
          <div>Risk: <span style="color: ${d.status === 'MULE' ? '#EF4444' : d.status === 'SUSPICIOUS' ? '#F59E0B' : '#10B981'}">${d.risk_score}%</span></div>
          <div>Centrality (PR): ${d.pagerank.toFixed(4)}</div>
          <div>Community: Ring #${d.community_id}</div>
          <div>TDA Cycles (B1): ${d.betti_1}</div>
        `);
        tooltip.style('visibility', 'visible');
      })
      .on('mousemove', (event) => {
        // Position tooltip relative to container boundaries
        const bounds = containerRef.current?.getBoundingClientRect();
        if (bounds) {
          const x = event.clientX - bounds.left + 15;
          const y = event.clientY - bounds.top + 15;
          tooltip.style('left', `${x}px`).style('top', `${y}px`);
        }
      })
      .on('mouseout', () => {
        tooltip.style('visibility', 'hidden');
      })
      .call(d3.drag<any, any>()
        .on('start', dragstarted)
        .on('drag', dragged)
        .on('end', dragended)
      );

    // Node circles
    node.append('circle')
      .attr('class', 'node-circle')
      .attr('r', (d) => {
        // Radius scale 10 to 25 based on risk score
        return 10 + (d.risk_score / 100) * 15;
      })
      .attr('fill', (d) => {
        // Standard color representations
        if (d.status === 'MULE') return '#EF4444';
        if (d.status === 'SUSPICIOUS') return '#F59E0B';
        return '#10B981';
      })
      .attr('stroke', 'rgba(255, 255, 255, 0.2)')
      .attr('stroke-width', 1.5);

    // Node text labels
    node.append('text')
      .attr('dy', (d) => 15 + (d.risk_score / 100) * 15)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9CA3AF')
      .style('font-size', '10px')
      .style('font-family', 'sans-serif')
      .text((d) => d.label);

    // Physics ticks
    simulation.on('tick', () => {
      link
        .attr('x1', (d: any) => d.source.x)
        .attr('y1', (d: any) => d.source.y)
        .attr('x2', (d: any) => d.target.x)
        .attr('y2', (d: any) => d.target.y);

      node.attr('transform', (d: any) => `translate(${d.x}, ${d.y})`);
    });

    // D3 Drag Callbacks
    function dragstarted(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    }

    function dragged(event: any, d: any) {
      d.fx = event.x;
      d.fy = event.y;
    }

    function dragended(event: any, d: any) {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    }

    return () => {
      simulation.stop();
      tooltip.remove();
    };
  }, [nodes, edges]);

  // Update node highlights smoothly when selectedCommunityId changes
  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('.node-circle')
      .transition()
      .duration(200)
      .attr('stroke', (d: any) => {
        if (selectedCommunityId && d.community_id === selectedCommunityId) {
          return '#3B82F6'; // Glow Accent Blue
        }
        return 'rgba(255, 255, 255, 0.2)';
      })
      .attr('stroke-width', (d: any) => {
        if (selectedCommunityId && d.community_id === selectedCommunityId) {
          return 3;
        }
        return 1.5;
      });
  }, [selectedCommunityId, nodes]);

  return (
    <div ref={containerRef} className="w-full h-full relative overflow-hidden bg-[#070b16] rounded-xl border border-border-custom shadow-inner">
      <svg ref={svgRef} className="w-full h-full block" />
      
      {/* Legend layout overlay */}
      <div className="absolute bottom-4 left-4 bg-bg-surface/85 backdrop-blur-sm border border-border-custom rounded-lg p-3 text-[10px] space-y-1.5 z-10 font-mono">
        <div className="font-bold text-text-primary uppercase tracking-wider pb-1 border-b border-border-custom">Risk Code Legend</div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-danger" />
          <span className="text-text-primary font-bold">MULE Account (&gt;75 risk)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-warning" />
          <span className="text-text-secondary">SUSPICIOUS (45-75 risk)</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="w-2.5 h-2.5 rounded-full bg-success" />
          <span className="text-text-secondary">SAFE Account (&lt;45 risk)</span>
        </div>
        {selectedCommunityId && (
          <div className="flex items-center space-x-2 pt-1 border-t border-border-custom text-accent-blue font-bold">
            <span className="w-2.5 h-2.5 rounded-full bg-accent-blue animate-ping" />
            <span>Active Ring #{selectedCommunityId} Selected</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default FraudNetworkGraph;
