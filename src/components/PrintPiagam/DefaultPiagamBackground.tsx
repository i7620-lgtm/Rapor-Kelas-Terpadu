import React from 'react';

export const DefaultPiagamBackground = ({ PIAGAM_WIDTH, PIAGAM_HEIGHT }) => {
    const width = PIAGAM_WIDTH;
    const height = PIAGAM_HEIGHT;
    // Reduced from 20 to 10 to push borders closer to the viewbox edge
    const margin = 10; 

    const ornamentGradientId = "ornamentGradient";

    // Design sudut yang lebih tegas dan tebal
    const cornerPath = "M 0,120 L 0,30 Q 0,0 30,0 L 120,0 M 80,0 Q 100,0 100,20 L 100,60 M 0,80 Q 0,100 20,100 L 60,100";
    
    return React.createElement('g', { 'data-name': "default-background" },
        // Define gradients
        React.createElement('defs', null,
            React.createElement('linearGradient', { id: ornamentGradientId, x1: "0%", y1: "0%", x2: "100%", y2: "100%" },
                React.createElement('stop', { offset: "0%", style: { stopColor: '#FCD34D', stopOpacity: 1 } }), // Amber 300 (Gold Light)
                React.createElement('stop', { offset: "50%", style: { stopColor: '#D97706', stopOpacity: 1 } }), // Amber 600 (Gold Medium)
                React.createElement('stop', { offset: "100%", style: { stopColor: '#B45309', stopOpacity: 1 } }) // Amber 700 (Gold Dark)
            )
        ),

        // Background fill - WHITE
        React.createElement('rect', {
            x: 0, y: 0, width: width, height: height,
            fill: "white"
        }),

        // Main outer border - Dark Blue & Thick
        React.createElement('rect', {
            x: margin, y: margin,
            width: width - margin * 2,
            height: height - margin * 2,
            fill: "none",
            stroke: '#1E3A8A', // Blue 900
            strokeWidth: "15" // Very Thick
        }),
        // Inner decorative border - Light Gold & Thick
        React.createElement('rect', {
            x: margin + 15, y: margin + 15, // Offset slightly more due to thick outer border
            width: width - (margin + 15) * 2,
            height: height - (margin + 15) * 2,
            fill: "none",
            stroke: '#FBBF24', // Amber 400 (Gold)
            strokeWidth: "8" // Thick
        }),

        // Corner Ornaments - Gold Gradient & Very Thick
        // Top-Left
        React.createElement('g', { transform: `translate(${margin}, ${margin})` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Top-Right
        React.createElement('g', { transform: `translate(${width - margin}, ${margin}) scale(-1, 1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Bottom-Left
        React.createElement('g', { transform: `translate(${margin}, ${height - margin}) scale(1, -1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        ),
        // Bottom-Right
        React.createElement('g', { transform: `translate(${width - margin}, ${height - margin}) scale(-1, -1)` },
            React.createElement('path', {
                d: cornerPath,
                fill: "none",
                stroke: `url(#${ornamentGradientId})`,
                strokeWidth: "12",
                strokeLinecap: "round"
            })
        )
    );
};
