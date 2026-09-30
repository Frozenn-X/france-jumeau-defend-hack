import React, { useEffect, useRef } from 'react';
import * as d3 from 'd3';

export default function CarbonGauge({ carbonData, nationalData }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current) return;

    // Use carbonData if available, otherwise fallback to nationalData taux_co2
    let co2 = 0;
    if (carbonData && carbonData.intensite_emissions_conso) {
      co2 = carbonData.intensite_emissions_conso;
    } else if (nationalData && nationalData.length > 0 && nationalData[0].taux_co2) {
      co2 = nationalData[0].taux_co2;
    }

    const width = 250;
    const height = 150;
    const margin = 10;
    const radius = Math.min(width, height * 2) / 2 - margin;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const g = svg
      .attr("width", width)
      .attr("height", height)
      .append("g")
      .attr("transform", `translate(${width / 2},${height - 20})`);

    // Background arc (max ~150g for France, gauge up to 150)
    const MAX_CO2 = 150;
    const pct = Math.min(co2 / MAX_CO2, 1);

    const arcBg = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(Math.PI / 2);

    g.append("path")
      .attr("d", arcBg)
      .attr("fill", "rgba(255,255,255,0.1)");

    const arcFg = d3.arc()
      .innerRadius(radius * 0.7)
      .outerRadius(radius)
      .startAngle(-Math.PI / 2)
      .endAngle(-Math.PI / 2 + pct * Math.PI);

    let color = '#10b981'; // green
    if (co2 > 50) color = '#f59e0b'; // orange
    if (co2 > 100) color = '#ef4444'; // red

    g.append("path")
      .attr("d", arcFg)
      .attr("fill", color)
      .style("transition", "d 1s ease-out");

    // Text
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", -10)
      .style("fill", "white")
      .style("font-size", "28px")
      .style("font-weight", "bold")
      .text(`${co2}`);
      
    g.append("text")
      .attr("text-anchor", "middle")
      .attr("y", 10)
      .style("fill", "#9ca3af")
      .style("font-size", "12px")
      .text("gCO₂eq/kWh");

  }, [carbonData, nationalData]);

  return (
    <div style={{ position: 'relative' }}>
      <h3 style={{ textAlign: 'center', marginBottom: '5px', color: '#f9fafb' }}>Intensité Carbone</h3>
      <svg ref={svgRef}></svg>
    </div>
  );
}
