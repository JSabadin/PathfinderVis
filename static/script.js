let startNode = null;
let endNode = null;
let cancelRequested = false;
let isRunning = false;
let lastPathfindingAlgorithm = null; // Keep track of the last algorithm run


function createGrid(rows, cols) {
    globalThis.rows = rows;
    globalThis.cols = cols;

    const container = document.getElementById('grid-container');
    container.innerHTML = ''; // Clear the grid container
    container.style.setProperty('--grid-rows', rows);
    container.style.setProperty('--grid-cols', cols);

    let isMouseDown = false; // Track if the mouse button is held down

    // Listen for mouseup globally to reset isMouseDown
    document.addEventListener('mouseup', function(e) {
        if (e.button === 1) { // Reset on middle mouse button release
            isMouseDown = false;
        }
    });

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            let cell = document.createElement("div");
            cell.id = `cell-${row}-${col}`;
            cell.className = "grid-cell";
            container.appendChild(cell);

            // Specific handler for middle-click on each cell to toggle an obstacle immediately
            cell.addEventListener('mousedown', function(e) {
                if (e.button === 1 && !globalThis.isRunning) { // Middle click
                    e.preventDefault(); // Prevent default behavior like scrolling
                    isMouseDown = true;
                    toggleObstacle(row, col); // Toggle obstacle immediately
                }
            });

            cell.addEventListener('click', function(e) {
                if (e.button === 0 && !globalThis.isRunning) { // Left click for start node
                    if (!cell.classList.contains('obstacle')) {
                        setStartNode(row, col);
                    } else {
                        alert("Cannot place the end node on an obstacle.");
                    }
                }
            });

            cell.addEventListener('contextmenu', function(e) {
                e.preventDefault(); // Prevent context menu on right click
                if (!globalThis.isRunning) { // Right click for end node
                    if (!cell.classList.contains('obstacle')) {
                        setEndNode(row, col);
                    } else {
                        alert("Cannot place the end node on an obstacle.");
                    }
                }
            });

            cell.addEventListener('mouseenter', function(e) {
                if (isMouseDown && !globalThis.isRunning) { // Dragging with middle mouse button
                    toggleObstacle(row, col);
                }
            });
        }
    }
}

function setStartNode(row, col) {
    // Clear previous start node styling if it exists
    if (startNode) {
        const prevStartCell = document.getElementById(`cell-${startNode.row}-${startNode.col}`);
        prevStartCell.classList.remove('start-node');
    }

    // Update start node and apply styling
    startNode = { row, col };
    const startCell = document.getElementById(`cell-${row}-${col}`);
    startCell.classList.add('start-node');
}

function setEndNode(row, col) {
    // Clear previous end node styling if it exists
    if (endNode) {
        const prevEndCell = document.getElementById(`cell-${endNode.row}-${endNode.col}`);
        prevEndCell.classList.remove('end-node');
    }

    // Update end node and apply styling
    endNode = { row, col };
    const endCell = document.getElementById(`cell-${row}-${col}`);
    endCell.classList.add('end-node');
}

function toggleObstacle(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    if (!cell.classList.contains('start-node') && !cell.classList.contains('end-node')) {
        // Ensure that start and end nodes cannot be turned into obstacles
        cell.classList.toggle('obstacle');
    }
}


function clearStartAndEndNodes() {
    if (startNode) {
        const startCell = document.getElementById(`cell-${startNode.row}-${startNode.col}`);
        startCell.classList.remove('start-node');
        startNode = null;
    }
    if (endNode) {
        const endCell = document.getElementById(`cell-${endNode.row}-${endNode.col}`);
        endCell.classList.remove('end-node');
        endNode = null;
    }
}

function clearObstacles() {
    const cells = document.getElementsByClassName('grid-cell');
    for (let cell of cells) {
        cell.classList.remove('obstacle');
    }
}

function clearVisitedAndPath() {
    const cells = document.getElementsByClassName('grid-cell');
    for (let cell of cells) {
        cell.classList.remove('visited', 'current', 'path');
    }
}

function resetGrid() {
    clearStartAndEndNodes();
    clearObstacles();
    clearVisitedAndPath();
}

function markVisited(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.classList.add('visited');
}

function markCurrent(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.classList.add('current');
}

function markPath(row, col) {
    const cell = document.getElementById(`cell-${row}-${col}`);
    cell.classList.add('path');
}

function createMaze() {
    cancelRequested = true; // Signal to cancel any ongoing operation
    resetGrid(); // Assuming this clears the grid but does not remove the 'obstacle' class
    const cells = document.getElementsByClassName('grid-cell');
    for (let cell of cells) {
        if (Math.random() < 0.3) {
            // Add both 'obstacle' and 'obstacle-animate' classes for automatic creation
            cell.classList.add('obstacle', 'obstacle-animate');
        }
    }
}





async function startDijkstra(skipDelay = false) {
    lastPathfindingAlgorithm = 'Dijkstra';
    globalThis.isRunning = true;
    try {
        cancelRequested = true; // Signal to cancel any ongoing operation
        await new Promise(resolve => setTimeout(resolve, 100)); // Give a little time for ongoing operations to stop
        cancelRequested = false; // Reset for the new operation

        if (!startNode || !endNode) {
            alert("Please select start and end nodes first.");
            return;
        }

        let distances = {};
        let visited = {};
        let previous = {};
        let pq = [{row: startNode.row, col: startNode.col, distance: 0}]; // Use startNode for the initial node

        // Initialize distances and visited
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = `cell-${row}-${col}`;
                distances[id] = Infinity;
                visited[id] = false;
                previous[id] = null;
            }
        }
        distances[`cell-${startNode.row}-${startNode.col}`] = 0;

        while (pq.length > 0) {
            if (cancelRequested) return; 
            // Sort by distance each time (inefficient for large datasets)
            pq.sort((a, b) => a.distance - b.distance);
            let current = pq.shift();

            if (visited[`cell-${current.row}-${current.col}`]) continue;

            visited[`cell-${current.row}-${current.col}`] = true;
            markVisited(current.row, current.col);
            if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 20)); // Visual delay

            // Target reached
            if (current.row === endNode.row && current.col === endNode.col) {
                while (previous[`cell-${current.row}-${current.col}`]) {
                    markPath(current.row, current.col);
                    current = previous[`cell-${current.row}-${current.col}`];
                    if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 50)); // Visual delay for path
                    if (cancelRequested) return; 
                }
                markPath(startNode.row, startNode.col); // Mark start as part of the path
                return;
            }

            // Check neighbors
            [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dRow, dCol]) => {
                const neighborRow = current.row + dRow;
                const neighborCol = current.col + dCol;
                if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                    const neighborId = `cell-${neighborRow}-${neighborCol}`;
                    const neighborCell = document.getElementById(neighborId);
                    if (!visited[neighborId] && !neighborCell.classList.contains('obstacle')) {
                        const newDistance = distances[`cell-${current.row}-${current.col}`] + 1; // Assuming equal weight
                        if (newDistance < distances[neighborId]) {
                            distances[neighborId] = newDistance;
                            previous[neighborId] = {row: current.row, col: current.col, distance: newDistance};
                            pq.push({row: neighborRow, col: neighborCol, distance: newDistance});
                        }
                    }
                }
            });
        }
    } finally {
    globalThis.isRunning = false;
    }
}


async function startGreedyBestFirst(skipDelay = false){
    lastPathfindingAlgorithm = 'GreedyBestFirstSearch';
    globalThis.isRunning = true;
    try {
        cancelRequested = true; // Signal to cancel any ongoing operation
        await new Promise(resolve => setTimeout(resolve, 100)); // Give a little time for ongoing operations to stop
        cancelRequested = false; // Reset for the new operation
        if (!startNode || !endNode) {
            alert("Please select start and end nodes first.");
            return;
        }

        let distances = {};
        let visited = {};
        let previous = {};
        let pq = [{row: startNode.row, col: startNode.col, distance: 0}]; // Use startNode for the initial node

        // Initialize distances and visited
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = `cell-${row}-${col}`;
                distances[id] = Infinity;
                visited[id] = false;
                previous[id] = null;
            }
        }
        distances[`cell-${startNode.row}-${startNode.col}`] = 0;

        while (pq.length > 0) {
            if (cancelRequested) return;
            // Sort by distance each time (inefficient for large datasets)
            pq.sort((a, b) => a.distance - b.distance);
            let current = pq.shift();

            if (visited[`cell-${current.row}-${current.col}`]) continue;

            visited[`cell-${current.row}-${current.col}`] = true;
            markVisited(current.row, current.col);
            if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 20)); // Visual delay

            // Target reached
            if (current.row === endNode.row && current.col === endNode.col) {
                while (previous[`cell-${current.row}-${current.col}`]) {
                    markPath(current.row, current.col);
                    current = previous[`cell-${current.row}-${current.col}`];
                    if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 50)); // Visual delay
                    if (cancelRequested) return;
                }
                markPath(startNode.row, startNode.col); // Mark start as part of the path
                return;
            }

            // Check neighbors
            [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dRow, dCol]) => {
                const neighborRow = current.row + dRow;
                const neighborCol = current.col + dCol;
                if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                    const neighborId = `cell-${neighborRow}-${neighborCol}`;
                    const neighborCell = document.getElementById(neighborId);
                    if (!visited[neighborId] && !neighborCell.classList.contains('obstacle')) {
                        const newDistance = distances[`cell-${current.row}-${current.col}`] + 1; // Assuming equal weight
                        if (newDistance < distances[neighborId]) {
                            distances[neighborId] = newDistance;
                            previous[neighborId] = {row: current.row, col: current.col, distance: newDistance};
                            const heuristic = Math.abs(neighborRow - endNode.row) + Math.abs(neighborCol - endNode.col);
                            pq.push({row: neighborRow, col: neighborCol, distance: heuristic});
                        }
                    }
                }
            }
            );
        }
    }
    finally {
        globalThis.isRunning = false;
    }
}



async function startAStar(skipDelay = false) {
    lastPathfindingAlgorithm = 'AStar';
    globalThis.isRunning = true;
    try {
        cancelRequested = true; // Signal to cancel any ongoing operation
        await new Promise(resolve => setTimeout(resolve, 100)); // Give a little time for ongoing operations to stop
        cancelRequested = false; // Reset for the new operation
        if (!startNode || !endNode) {
            alert("Please select start and end nodes first.");
            return;
        }

        let distances = {};
        let visited = {};
        let previous = {};
        let pq = [{row: startNode.row, col: startNode.col, distance: 0}]; // Use startNode for the initial node

        // Initialize distances and visited
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = `cell-${row}-${col}`;
                distances[id] = Infinity;
                visited[id] = false;
                previous[id] = null;
            }
        }
        distances[`cell-${startNode.row}-${startNode.col}`] = 0;

        while (pq.length > 0) {
            if (cancelRequested) {
                isRunning = false; // Ensure isRunning reflects the current state
                document.getElementById('startButton').innerText = 'Start'; // Reset button
                return
            };
            // Sort by distance each time (inefficient for large datasets)
            pq.sort((a, b) => a.distance - b.distance);
            let current = pq.shift();

            if (visited[`cell-${current.row}-${current.col}`]) continue;

            visited[`cell-${current.row}-${current.col}`] = true;
            markVisited(current.row, current.col);
            if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 20)); // Visual delay

            // Target reached
            if (current.row === endNode.row && current.col === endNode.col) {
                while (previous[`cell-${current.row}-${current.col}`]) {
                    markPath(current.row, current.col);
                    current = previous[`cell-${current.row}-${current.col}`];
                    if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 50)); // Visual delay
                    if (cancelRequested) {
                        isRunning = false; // Ensure isRunning reflects the current state
                        document.getElementById('startButton').innerText = 'Start'; // Reset button
                        return
                    };
                }
                markPath(startNode.row, startNode.col); // Mark start as part of the path
                return;
            }

            // Check neighbors
            [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dRow, dCol]) => {
                const neighborRow = current.row + dRow;
                const neighborCol = current.col + dCol;
                if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                    const neighborId = `cell-${neighborRow}-${neighborCol}`;
                    const neighborCell = document.getElementById(neighborId);
                    if (!visited[neighborId] && !neighborCell.classList.contains('obstacle')) {
                        const newDistance = distances[`cell-${current.row}-${current.col}`] + 1; // Assuming equal weight
                        if (newDistance < distances[neighborId]) {
                            distances[neighborId] = newDistance;
                            previous[neighborId] = {row: current.row, col: current.col, distance: newDistance};
                            const heuristic = Math.abs(neighborRow - endNode.row) + Math.abs(neighborCol - endNode.col);
                            pq.push({row: neighborRow, col: neighborCol, distance: newDistance + heuristic});
                        }
                    }
                }
            });
        }
    } finally {
        globalThis.isRunning = false;
    }
}

async function startBidirectionalAStar(skipDelay = false) {
    lastPathfindingAlgorithm = 'BidirectionalAStar';
    globalThis.isRunning = true;
    try {
        cancelRequested = true; // Signal to cancel any ongoing operation
        await new Promise(resolve => setTimeout(resolve, 100)); // Give a little time for ongoing operations to stop
        cancelRequested = false; // Reset for the new operation
        if (!startNode || !endNode) {
            alert("Please select start and end nodes first.");
            return;
        }

        let distances = {};
        let visited = {};
        let previous = {};
        let pq = [{row: startNode.row, col: startNode.col, distance: 0}]; // Use startNode for the initial node

        // Initialize distances and visited
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const id = `cell-${row}-${col}`;
                distances[id] = Infinity;
                visited[id] = false;
                previous[id] = null;
            }
        }
        distances[`cell-${startNode.row}-${startNode.col}`] = 0;

        while (pq.length > 0) {
            if (cancelRequested) {
                isRunning = false; // Ensure isRunning reflects the current state
                document.getElementById('startButton').innerText = 'Start'; // Reset button
                return
            };
            // Sort by distance each time (inefficient for large datasets)
            pq.sort((a, b) => a.distance - b.distance);
            let current = pq.shift();

            if (visited[`cell-${current.row}-${current.col}`]) continue;

            visited[`cell-${current.row}-${current.col}`] = true;
            markVisited(current.row, current.col);
            if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 20)); // Visual delay

            // Target reached
            if (current.row === endNode.row && current.col === endNode.col) {
                while (previous[`cell-${current.row}-${current.col}`]) {
                    markPath(current.row, current.col);
                    current = previous[`cell-${current.row}-${current.col}`];
                    if (!skipDelay) await new Promise(resolve => setTimeout(resolve, 50)); // Visual delay
                    if (cancelRequested) {
                        isRunning = false; // Ensure isRunning reflects the current state
                        document.getElementById('startButton').innerText = 'Start'; // Reset button
                        return
                    }
                }
                markPath(startNode.row, startNode.col); // Mark start as part of the path
                return;
            }

            // Check neighbors
            [[1, 0], [0, 1], [-1, 0], [0, -1]].forEach(([dRow, dCol]) => {
                const neighborRow = current.row + dRow;
                const neighborCol = current.col + dCol;
                if (neighborRow >= 0 && neighborRow < rows && neighborCol >= 0 && neighborCol < cols) {
                    const neighborId = `cell-${neighborRow}-${neighborCol}`;
                    const neighborCell = document.getElementById(neighborId);
                    if (!visited[neighborId] && !neighborCell.classList.contains('obstacle')) {
                        const newDistance = distances[`cell-${current.row}-${current.col}`] + 1; // Assuming equal weight
                        if (newDistance < distances[neighborId]) {
                            distances[neighborId] = newDistance;
                            previous[neighborId] = {row: current.row, col: current.col, distance: newDistance};
                            const heuristic = Math.abs(neighborRow - endNode.row) + Math.abs(neighborCol - endNode.col);
                            pq.push({row: neighborRow, col: neighborCol, distance: newDistance + heuristic});
                        }
                    }
                }
            });
        }
    }
    finally {
        globalThis.isRunning = false;
    }
}

// Dragging end node
let isDraggingEndNode = false;
let draggedEndNodePosition = null;

document.addEventListener('DOMContentLoaded', () => {
    const container = document.getElementById('grid-container');

    container.addEventListener('mousedown', function(e) {
        const cell = e.target;
        if (cell.classList.contains('end-node')) {
            isDraggingEndNode = true;
            e.preventDefault(); // Prevent default action but don't visually indicate dragging
        }
    });

    container.addEventListener('mousemove', async function(e) {
        if (!isDraggingEndNode) return;
    
        const rect = container.getBoundingClientRect();
        const cellSize = 30; // Assuming each cell is 30px by 30px
        const adjustedX = Math.max(0, Math.min(e.clientX - rect.left, rect.width - 1));
        const adjustedY = Math.max(0, Math.min(e.clientY - rect.top, rect.height - 1));

        const col = Math.floor(adjustedX / cellSize);
        const row = Math.floor(adjustedY / cellSize);

        // Proceed only if the mouse is over a different cell than the current end node's position
        if (!draggedEndNodePosition || draggedEndNodePosition.row !== row || draggedEndNodePosition.col !== col) {
            draggedEndNodePosition = { row, col };

            // Temporarily update the end node position for path calculation
            setEndNode(row, col);

            // Clear previously visited and path cells immediately before recalculating
            clearVisitedAndPath(); 

            // Recalculate the path instantly, without visual delay
            // Decide which algorithm to run based on the last one executed
            if (lastPathfindingAlgorithm === 'AStar') {
                await startAStar(true);
            } else if (lastPathfindingAlgorithm === 'Dijkstra') {
                await startDijkstra(true);
            } else if (lastPathfindingAlgorithm === 'GreedyBestFirstSearch') {
                await startGreedyBestFirst(true);
            }
        }
    });

    document.addEventListener('mouseup', function(e) {
        if (isDraggingEndNode) {
            isDraggingEndNode = false;
            draggedEndNodePosition = null; // Reset dragged position after dropping
            // The path does not need to be recalculated here since the latest position has already been set and calculated
        }
    });
});



async function startSelectedAlgorithm() {
    const startButton = document.getElementById('startButton');
    const selectedAlgorithm = document.getElementById('algorithmSelector').value;

    if (!isRunning) {
        // Prepare to start the algorithm
        isRunning = true;
        cancelRequested = false;
        startButton.innerText = 'Stop'; // Change button text to 'Stop'
        startButton.style.backgroundColor = 'orange'; // Set button color to orange
        clearVisitedAndPath(); // Clear the grid before starting

        try {
            switch (selectedAlgorithm) {
                case 'dijkstra':
                    await startDijkstra();
                    break;
                case 'aStar':
                    await startAStar();
                    break;
                case 'greedyBestFirst':
                    await startGreedyBestFirst();
                    break;
                default:
                    alert('Please select an algorithm');
                    // Reset since no valid algorithm was selected
                    isRunning = false;
                    startButton.innerText = 'Start';
                    startButton.style.backgroundColor = ''; // Reset button color
                    return; // Exit the function to avoid further execution
            }
        } catch (error) {
            console.error("Error running algorithm:", error);
        }

        // Algorithm has finished or an error occurred
        isRunning = false;
        cancelRequested = false; // Reset cancel request
        startButton.innerText = 'Start'; // Change back to 'Start'
        startButton.style.backgroundColor = ''; // Reset button color to default
    } else {
        // Request to stop the algorithm
        cancelRequested = true;
        clearVisitedAndPath(); // Optionally clear the grid immediately, depending on your app's logic
        // Note: If you want the button to stay orange and only reset when the algorithm actually stops,
        // you might adjust the color change logic outside this else block, where you handle the stopping logic.
    }
}
