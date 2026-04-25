//```dataviewjs
// Generic Time-Series Chart for Obsidian Daily Notes
//
// ===== CONFIGURATION =====
const PROPERTY_NAME = "weight";        // Change to "bloodPressure", "mood", etc.
const UNIT = "kg";                     // e.g., "kg", "lbs", "mmHg", "score"
const CHART_TITLE = "Weight Tracker";  // Optional chart title
// ===== END CONFIGURATION =====

// 1. Fetch and Filter Data
let pages = dv.pages().where(p => p[PROPERTY_NAME] && p.date).array();  // Convert to real array

if (pages.length === 0) {
    dv.paragraph("*No weight data found. Ensure your daily notes have 'date' and 'weight' in the frontmatter.*");
} else {
    // 2. ROBUST SORTING
    pages.sort((a, b) => {
        let dateA, dateB;
        try {
            dateA = a.date ? DateTime.fromISO(a.date).toMillis() : 0;
            if (!dateA || isNaN(dateA)) dateA = 0;
        } catch (e) {
            dateA = 0;
            console.error(`Failed to parse date for ${a.file?.name}: ${a.date}`, e);
        }
        try {
            dateB = b.date ? DateTime.fromISO(b.date).toMillis() : 0;
            if (!dateB || isNaN(dateB)) dateB = 0;
        } catch (e) {
            dateB = 0;
            console.error(`Failed to parse date for ${b.file?.name}: ${b.date}`, e);
        }
        console.log(`Sorting: ${a.file?.name || 'unknown'} (${a.date}) = ${dateA}, ${b.file?.name || 'unknown'} (${b.date}) = ${dateB}, result: ${dateA - dateB}`);
        return dateA - dateB;
    });

    // 3. Extract Data
    const labels = pages.map(p => p.date.toFormat("MMM d, yyyy"));
    const values = pages.map(p => parseFloat(p[PROPERTY_NAME]));
    console.log("Final sorted data for chart:");
    pages.forEach((p, i) => {
        console.log(`  [${i}] ${labels[i]} = ${values[i]} ${UNIT}`);
    });

    // 4. Create Canvas Element
    const container = dv.el("div");
    container.style.width = "80%";
    container.style.height = "80%";
    container.style.position = "relative";

    // Optional: Add a border to see the bounds clearly while editing
    //container.style.border = "1px dashed #ccc"; 
    
    const canvas = dv.el("canvas", "", {
        style: { 
            width: "100%", 
            height: "100%" 
        }
    });
    container.appendChild(canvas);
    
    // 5. Draw the Chart
    setTimeout(() => {
	    // Use explicit dimensions instead of offsetHeight
	    const width = 800;
	    const height = 500;
	    canvas.width = width;    // drawing resolution
	    canvas.height = height;
    
	    // Remove conflicting CSS dimensions, or make them match
	    canvas.style.width = width + "px";
	    canvas.style.height = height + "px";
    
	    const ctx = canvas.getContext("2d");
	    const padding = 50;
    
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;

        // Helper: Map value to Y coordinate
        const getY = (val) => height - padding - ((val - minVal) / range) * (height - 2 * padding);
        const getX = (i) => padding + (i / (values.length - 1)) * (width - 2 * padding);

        ctx.clearRect(0, 0, width, height);

        // --- Y-AXIS LABELS LOGIC ---
        // Determine a nice step size (e.g., 1kg, 2kg, or 5kg depending on range)
        let step = 1;
        if (range > 10) step = 2;
        if (range > 20) step = 5;
        
        // Find the start and end values aligned with the step
        const startVal = Math.floor(minVal / step) * step;
        const endVal = Math.ceil(maxVal / step) * step;

        // Draw Y-Axis Labels and Grid Lines
        ctx.fillStyle = "#666";
        ctx.font = "11px sans-serif";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        
        ctx.strokeStyle = "#f0f0f0";
        ctx.lineWidth = 1;
        ctx.setLineDash([5, 5]);

        for (let val = startVal; val <= endVal; val += step) {
            const y = getY(val);
            
            // Draw Grid Line
            ctx.beginPath();
            ctx.moveTo(padding, y);
            ctx.lineTo(width - padding, y);
            ctx.stroke();

            // Draw Label (e.g., "80 kg")
            ctx.fillText(val.toFixed(1) + " " + UNIT, padding - 5, y);
        }
        ctx.setLineDash([]);

        // --- DRAW AREA UNDER LINE ---
        if (values.length > 1) {
            ctx.beginPath();
            ctx.moveTo(getX(0), height - padding);
            ctx.lineTo(getX(0), getY(values[0]));
            for (let i = 1; i < values.length; i++) {
                ctx.lineTo(getX(i), getY(values[i]));
            }
            ctx.lineTo(getX(values.length - 1), height - padding);
            ctx.closePath();
            ctx.fillStyle = "rgba(59, 130, 246, 0.1)";
            ctx.fill();
        }

        // --- DRAW THE LINE ---
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        
        ctx.beginPath();
        values.forEach((val, i) => {
            const x = getX(i);
            const y = getY(val);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // --- DRAW POINTS ---
        ctx.fillStyle = "#ffffff";
        ctx.strokeStyle = "#3b82f6";
        ctx.lineWidth = 2;
        
        values.forEach((val, i) => {
            const x = getX(i);
            const y = getY(val);
            
            ctx.beginPath();
            ctx.arc(x, y, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.stroke();
            
            // Draw X-axis Label
            ctx.fillStyle = "#666";
            ctx.font = "11px sans-serif";
            ctx.textAlign = "center";
            ctx.fillText(labels[i], x, height - padding + 30);
            ctx.fillStyle = "#ffffff"; // Reset for next point
        });

        dv.container.appendChild(container);
    }, 100);
}
//```