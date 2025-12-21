// Network Graph Class
class NetworkGraph {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.nodes = [];
        this.edges = [];
        this.animationFrame = null;
        this.isRunning = false;
        this.currentStep = 0;
        this.model = 'triggering'; // 'triggering', 'general-cascade', or 'general-threshold'
        this.hoveredNode = null; // For hover tooltips
        this.setupCanvas();
        this.setupMouseHandlers();
    }

    setupCanvas() {
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        this.width = rect.width;
        this.height = rect.height;
    }

    setupMouseHandlers() {
        // Track mouse movement for hover tooltips
        this.canvas.addEventListener('mousemove', (e) => {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const node = this.getNodeAtPosition(x, y);
            this.hoveredNode = node;
        });

        this.canvas.addEventListener('mouseleave', () => {
            this.hoveredNode = null;
        });
    }

    generateNetwork(nodeCount, connectivity, initialSeeds) {
        this.nodes = [];
        this.edges = [];
        this.currentStep = 0;

        // Create nodes with random positions spread across the canvas
        const padding = 60; // Padding from edges
        for (let i = 0; i < nodeCount; i++) {
            const x = padding + Math.random() * (this.width - 2 * padding);
            const y = padding + Math.random() * (this.height - 2 * padding);

            this.nodes.push({
                id: i,
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                active: false,
                isSeed: false,
                isOptimalSeed: false, // For optimization visualization
                threshold: Math.random(), // Random threshold for threshold models
                activatedAt: -1,
                neighbors: [],
                triggeringSet: [], // For Triggering Model
                overlapScore: 0,
                influenceScore: 0
            });
        }

        // Create edges based on connectivity
        for (let i = 0; i < nodeCount; i++) {
            for (let j = i + 1; j < nodeCount; j++) {
                if (Math.random() < connectivity) {
                    const weight = Math.random() * 0.5 + 0.1; // Random weight between 0.1 and 0.6
                    this.edges.push({
                        source: i,
                        target: j,
                        weight: weight,
                        isLive: false, // For Triggering Model
                        activationProb: Math.random() * 0.5 + 0.2, // For cascade models
                        attempted: false,
                        attemptOrder: [] // Track order of attempts for General Cascade
                    });
                    this.nodes[i].neighbors.push(j);
                    this.nodes[j].neighbors.push(i);
                }
            }
        }

        // Initialize model-specific data
        this.initializeModelData();

        // Calculate overlap scores for all nodes
        this.calculateOverlapScores();

        // Calculate overlap scores for all nodes
        this.calculateOverlapScores();

        // Note: No initial seeds are selected here.
        // User must click "Highest Degree" or "Greedy Algorithm" to select seeds.

        this.updateStats();
    }

    // Initialize model-specific data structures
    initializeModelData() {
        if (this.model === 'triggering') {
            // For each node, randomly select triggering set from neighbors
            // Each edge has probability liveEdgeProb of being "live"
            this.nodes.forEach(node => {
                node.triggeringSet = [];
                node.neighbors.forEach(neighborId => {
                    if (Math.random() < this.liveEdgeProb) {
                        node.triggeringSet.push(neighborId);
                    }
                });
            });

            // Mark edges as live if they're in the triggering set
            this.edges.forEach(edge => {
                const sourceNode = this.nodes[edge.source];
                const targetNode = this.nodes[edge.target];
                edge.isLive = sourceNode.triggeringSet.includes(edge.target) ||
                    targetNode.triggeringSet.includes(edge.source);
            });
        } else if (this.model === 'general-threshold') {
            // Normalize weights for threshold calculation
            this.normalizeWeights();
        }
    }

    normalizeWeights() {
        // For each node, normalize incoming edge weights to sum <= 1
        for (let i = 0; i < this.nodes.length; i++) {
            const incomingEdges = this.edges.filter(e => e.target === i || e.source === i);
            const totalWeight = incomingEdges.reduce((sum, e) => sum + e.weight, 0);

            if (totalWeight > 1) {
                incomingEdges.forEach(edge => {
                    edge.weight /= totalWeight;
                });
            }
        }
    }

    // Calculate overlap scores for all nodes
    // Overlap score: 1 - (shared neighbors / total unique neighbors)
    // Higher score = less overlap = better for influence maximization
    calculateOverlapScores() {
        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            const nodeNeighbors = new Set(node.neighbors);

            if (nodeNeighbors.size === 0) {
                node.overlapScore = 0;
                node.influenceScore = 0;
                continue;
            }

            let totalOverlap = 0;
            let comparisons = 0;

            // Compare with all other nodes
            for (let j = 0; j < this.nodes.length; j++) {
                if (i === j) continue;

                const otherNeighbors = new Set(this.nodes[j].neighbors);
                if (otherNeighbors.size === 0) continue;

                // Calculate Jaccard similarity (overlap)
                const intersection = new Set([...nodeNeighbors].filter(x => otherNeighbors.has(x)));
                const union = new Set([...nodeNeighbors, ...otherNeighbors]);

                const overlap = intersection.size / union.size;
                totalOverlap += overlap;
                comparisons++;
            }

            // Average overlap with all other nodes
            const avgOverlap = comparisons > 0 ? totalOverlap / comparisons : 0;

            // Overlap score: 1 means no overlap (good), 0 means complete overlap (bad)
            node.overlapScore = 1 - avgOverlap;

            // Influence score: edges × overlap score
            node.influenceScore = node.neighbors.length * node.overlapScore;
        }
    }

    // Triggering Model: Nodes activate when any neighbor in their triggering set becomes active
    stepTriggeringModel() {
        let activated = false;
        const newActivations = [];

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (node.active) continue;

            // Check if any neighbor in the triggering set is active
            for (const neighborIdx of node.triggeringSet) {
                if (this.nodes[neighborIdx].active) {
                    newActivations.push(i);
                    activated = true;
                    break;
                }
            }
        }

        // Apply activations
        newActivations.forEach(idx => {
            this.nodes[idx].active = true;
            this.nodes[idx].activatedAt = this.currentStep + 1;
        });

        if (activated) {
            this.currentStep++;
        }

        return activated;
    }

    // General Cascade Model: Order-independent probabilistic activation
    stepGeneralCascade() {
        let activated = false;
        const newActivations = [];
        const justActivated = this.nodes.filter(n => n.activatedAt === this.currentStep);

        for (const node of justActivated) {
            for (const neighborIdx of node.neighbors) {
                const neighbor = this.nodes[neighborIdx];
                if (neighbor.active) continue;

                const edge = this.edges.find(e =>
                    (e.source === node.id && e.target === neighborIdx) ||
                    (e.target === node.id && e.source === neighborIdx)
                );

                if (edge && !edge.attemptOrder.includes(node.id)) {
                    // Record this attempt
                    edge.attemptOrder.push(node.id);

                    // Calculate incremental activation probability
                    // pv(u, S) where S is the set of nodes that already tried
                    const S = edge.attemptOrder.slice(0, -1); // All previous attempts
                    const prob = this.calculateIncrementalProb(neighborIdx, node.id, S);

                    // Attempt activation with calculated probability
                    if (Math.random() < prob) {
                        if (!newActivations.includes(neighborIdx)) {
                            newActivations.push(neighborIdx);
                            activated = true;
                        }
                    }
                }
            }
        }

        // Apply activations
        newActivations.forEach(idx => {
            this.nodes[idx].active = true;
            this.nodes[idx].activatedAt = this.currentStep + 1;
        });

        if (activated) {
            this.currentStep++;
        }

        return activated;
    }

    // Calculate incremental probability for General Cascade
    // pv(u, S) - probability that u activates v given S already tried and failed
    calculateIncrementalProb(targetIdx, sourceIdx, previousAttempts) {
        // Implement diminishing returns: probability decreases as more nodes have tried
        // Base probability from edge, reduced by number of previous attempts
        const edge = this.edges.find(e =>
            (e.source === sourceIdx && e.target === targetIdx) ||
            (e.target === sourceIdx && e.source === targetIdx)
        );

        if (!edge) return 0;

        // Diminishing returns: each failed attempt reduces future success probability
        const baseProb = edge.activationProb * this.baseActivationProb;
        const reductionFactor = Math.pow(0.8, previousAttempts.length);
        return baseProb * reductionFactor;
    }

    // General Threshold Model: Monotone threshold functions over neighbor subsets
    stepGeneralThreshold() {
        let activated = false;
        const newActivations = [];

        for (let i = 0; i < this.nodes.length; i++) {
            const node = this.nodes[i];
            if (node.active) continue;

            // Get set of active neighbors
            const activeNeighbors = node.neighbors.filter(nIdx => this.nodes[nIdx].active);

            // Calculate threshold function fv(S) for active neighbor set S
            const thresholdValue = this.calculateThresholdFunction(i, activeNeighbors);

            // Activate if threshold function exceeds node's random threshold
            if (thresholdValue >= node.threshold) {
                newActivations.push(i);
                activated = true;
            }
        }

        // Apply activations
        newActivations.forEach(idx => {
            this.nodes[idx].active = true;
            this.nodes[idx].activatedAt = this.currentStep + 1;
        });

        if (activated) {
            this.currentStep++;
        }

        return activated;
    }

    // Calculate monotone threshold function fv(S)
    // Returns value in [0, 1] based on active neighbor set S
    calculateThresholdFunction(nodeIdx, activeNeighbors) {
        if (activeNeighbors.length === 0) return 0;

        const node = this.nodes[nodeIdx];

        // Weighted sum of influences from active neighbors (monotone and submodular)
        let totalInfluence = 0;
        for (const neighborIdx of activeNeighbors) {
            const edge = this.edges.find(e =>
                (e.source === nodeIdx && e.target === neighborIdx) ||
                (e.target === nodeIdx && e.source === neighborIdx)
            );
            if (edge) {
                totalInfluence += edge.weight;
            }
        }
        // Return normalized value in [0, 1]
        return Math.min(1, totalInfluence);
    }

    step() {
        if (this.model === 'triggering') {
            return this.stepTriggeringModel();
        } else if (this.model === 'general-cascade') {
            return this.stepGeneralCascade();
        } else if (this.model === 'general-threshold') {
            return this.stepGeneralThreshold();
        }
    }

    // Greedy algorithm for influence maximization
    // Returns optimal seed set achieving (1 - 1/e) approximation
    optimizeInfluence(numSeeds, numSimulations = 50) {
        const optimalSeeds = [];

        // Reset all nodes
        this.nodes.forEach(n => n.isOptimalSeed = false);

        // Greedy selection: iteratively add node with maximum marginal gain
        for (let k = 0; k < numSeeds; k++) {
            let bestNode = -1;
            let bestGain = -1;

            // Evaluate marginal gain for each non-selected node
            for (let i = 0; i < this.nodes.length; i++) {
                if (optimalSeeds.includes(i)) continue;

                // Calculate marginal gain: σ(S ∪ {v}) - σ(S)
                const currentInfluence = this.simulateInfluence(optimalSeeds, numSimulations);
                const newInfluence = this.simulateInfluence([...optimalSeeds, i], numSimulations);
                const marginalGain = newInfluence - currentInfluence;

                if (marginalGain > bestGain) {
                    bestGain = marginalGain;
                    bestNode = i;
                }
            }

            if (bestNode !== -1) {
                optimalSeeds.push(bestNode);
                this.nodes[bestNode].isOptimalSeed = true;
            }
        }

        return optimalSeeds;
    }

    // Monte Carlo simulation to estimate influence spread
    // Returns average number of activated nodes
    simulateInfluence(seedSet, numSimulations) {
        if (seedSet.length === 0) return 0;

        let totalInfluence = 0;

        for (let sim = 0; sim < numSimulations; sim++) {
            // Save current state
            const savedState = this.nodes.map(n => ({
                active: n.active,
                activatedAt: n.activatedAt
            }));
            const savedStep = this.currentStep;
            const savedEdgeState = this.edges.map(e => ({
                attempted: e.attempted,
                attemptOrder: [...(e.attemptOrder || [])]
            }));

            // Reset and set seeds
            this.nodes.forEach(n => {
                n.active = false;
                n.activatedAt = -1;
            });
            this.edges.forEach(e => {
                e.attempted = false;
                e.attemptOrder = [];
            });
            this.currentStep = 0;

            // Activate seed nodes
            seedSet.forEach(idx => {
                this.nodes[idx].active = true;
                this.nodes[idx].activatedAt = 0;
            });

            // Run propagation until no more activations
            let maxSteps = 50; // Prevent infinite loops
            for (let step = 0; step < maxSteps; step++) {
                const continued = this.step();
                if (!continued) break;
            }

            // Count activated nodes
            const activatedCount = this.nodes.filter(n => n.active).length;
            totalInfluence += activatedCount;

            // Restore state
            this.nodes.forEach((n, idx) => {
                n.active = savedState[idx].active;
                n.activatedAt = savedState[idx].activatedAt;
            });
            this.edges.forEach((e, idx) => {
                e.attempted = savedEdgeState[idx].attempted;
                e.attemptOrder = savedEdgeState[idx].attemptOrder;
            });
            this.currentStep = savedStep;
        }

        return totalInfluence / numSimulations;
    }

    clearSeeds() {
        this.nodes.forEach(node => {
            node.active = false;
            node.isSeed = false;
            node.activatedAt = -1;
            // Note: we don't clear isOptimalSeed here so we can still see what was optimal
            // even if we switch to heuristic view, or vice versa? 
            // Actually, let's clear isOptimalSeed only when re-running optimization.
        });
        this.currentStep = 0;
    }

    applyHighestDegreeSeeds(count) {
        this.clearSeeds();

        const nodesByDegree = this.nodes
            .map((node, idx) => ({ idx, degree: node.neighbors.length }))
            .sort((a, b) => b.degree - a.degree);

        for (let i = 0; i < Math.min(count, this.nodes.length); i++) {
            const nodeIdx = nodesByDegree[i].idx;
            this.nodes[nodeIdx].active = true;
            this.nodes[nodeIdx].isSeed = true;
            this.nodes[nodeIdx].activatedAt = 0;
        }

        this.updateStats();
    }

    applyGreedySeeds(count) {
        this.clearSeeds();

        // Use existing optimization logic to find seeds
        // Note: optimizeInfluence updates isOptimalSeed property
        const optimalSeeds = this.optimizeInfluence(count);

        optimalSeeds.forEach(nodeIdx => {
            this.nodes[nodeIdx].active = true;
            this.nodes[nodeIdx].isSeed = true;
            this.nodes[nodeIdx].activatedAt = 0;
        });

        this.updateStats();
        return optimalSeeds;
    }

    reset() {
        this.currentStep = 0;
        this.isRunning = false;

        this.nodes.forEach(node => {
            if (!node.isSeed) {
                node.active = false;
                node.activatedAt = -1;
            } else {
                node.activatedAt = 0;
            }
        });

        this.edges.forEach(edge => {
            edge.attempted = false;
        });

        this.updateStats();
    }

    updateStats() {
        const activeCount = this.nodes.filter(n => n.active).length;
        const influencePercent = ((activeCount / this.nodes.length) * 100).toFixed(1);

        document.getElementById('activeCount').textContent = activeCount;
        document.getElementById('stepCount').textContent = this.currentStep;
        document.getElementById('influencePercent').textContent = influencePercent + '%';
    }

    applyForces() {
        const repulsionStrength = 20;
        const attractionStrength = 0.0005;
        const damping = 0.98;

        // Reset forces
        this.nodes.forEach(node => {
            node.vx *= damping;
            node.vy *= damping;
        });

        // Repulsion between all nodes
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const dx = this.nodes[j].x - this.nodes[i].x;
                const dy = this.nodes[j].y - this.nodes[i].y;
                const distance = Math.sqrt(dx * dx + dy * dy) || 1;
                const force = repulsionStrength / (distance * distance);

                this.nodes[i].vx -= (dx / distance) * force;
                this.nodes[i].vy -= (dy / distance) * force;
                this.nodes[j].vx += (dx / distance) * force;
                this.nodes[j].vy += (dy / distance) * force;
            }
        }

        // Attraction along edges
        this.edges.forEach(edge => {
            const source = this.nodes[edge.source];
            const target = this.nodes[edge.target];
            const dx = target.x - source.x;
            const dy = target.y - source.y;
            const distance = Math.sqrt(dx * dx + dy * dy) || 1;

            source.vx += dx * attractionStrength;
            source.vy += dy * attractionStrength;
            target.vx -= dx * attractionStrength;
            target.vy -= dy * attractionStrength;
        });

        // Apply velocities and boundary constraints
        this.nodes.forEach(node => {
            node.x += node.vx;
            node.y += node.vy;

            const margin = 30;
            node.x = Math.max(margin, Math.min(this.width - margin, node.x));
            node.y = Math.max(margin, Math.min(this.height - margin, node.y));
        });
    }

    draw() {
        this.ctx.clearRect(0, 0, this.width, this.height);

        // Draw edges
        this.edges.forEach(edge => {
            const source = this.nodes[edge.source];
            const target = this.nodes[edge.target];

            this.ctx.beginPath();
            this.ctx.moveTo(source.x, source.y);
            this.ctx.lineTo(target.x, target.y);

            // Highlight edges connected to hovered node
            const isHoveredEdge = this.hoveredNode &&
                (edge.source === this.hoveredNode.id || edge.target === this.hoveredNode.id);

            if (isHoveredEdge) {
                // Bright highlight for hovered node's edges
                this.ctx.strokeStyle = '#3b82f6';
                this.ctx.lineWidth = 3;
                this.ctx.globalAlpha = 1.0;
            } else if (source.active && target.active) {
                // Highlight edges between active nodes
                this.ctx.strokeStyle = '#3b82f6';
                this.ctx.lineWidth = 2;
                this.ctx.globalAlpha = 0.8;
            } else {
                this.ctx.strokeStyle = '#cbd5e1';
                this.ctx.lineWidth = 1;
                this.ctx.globalAlpha = 0.6;
            }

            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });

        // Draw nodes
        this.nodes.forEach(node => {
            // Calculate node size based on number of edges (degree)
            // Min radius: 4px, Max radius: 16px
            const minRadius = 4;
            const maxRadius = 16;
            const maxDegree = Math.max(...this.nodes.map(n => n.neighbors.length), 1);
            const baseRadius = minRadius + (node.neighbors.length / maxDegree) * (maxRadius - minRadius);

            // Determine node size and color
            let nodeRadius = baseRadius;
            let fillColor, shadowColor, shadowBlur;

            if (node.isSeed) {
                fillColor = '#f59e0b';
                shadowColor = '#f59e0b';
                shadowBlur = 10;
            } else if (node.active) {
                fillColor = '#10b981';
                shadowColor = '#10b981';
                shadowBlur = 10;
            } else {
                fillColor = '#94a3b8';
                shadowColor = null;
                shadowBlur = 0;
            }

            // Draw node
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, nodeRadius, 0, Math.PI * 2);
            this.ctx.fillStyle = fillColor;

            if (shadowBlur > 0) {
                this.ctx.shadowBlur = shadowBlur;
                this.ctx.shadowColor = shadowColor;
            }

            this.ctx.fill();
            this.ctx.shadowBlur = 0;

            // Draw node border
            this.ctx.strokeStyle = '#ffffff';
            this.ctx.lineWidth = 2;
            this.ctx.stroke();

            // Draw dotted border for optimal seeds
            if (node.isOptimalSeed) {
                this.ctx.beginPath();
                this.ctx.arc(node.x, node.y, nodeRadius + 3, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#f59e0b';
                this.ctx.lineWidth = 3;
                this.ctx.setLineDash([5, 5]); // Dotted pattern
                this.ctx.globalAlpha = 0.8;
                this.ctx.stroke();
                this.ctx.setLineDash([]); // Reset to solid
                this.ctx.globalAlpha = 1;
            }
        });

        // Draw hover tooltip if hovering over a node
        if (this.hoveredNode !== null) {
            this.drawTooltip(this.hoveredNode);
        }
    }

    drawTooltip(node) {
        const padding = 10;
        const lineHeight = 18;
        const lines = [
            `Node ${node.id}`,
            `Edges: ${node.neighbors.length}`,
            `Overlap Score: ${node.overlapScore.toFixed(3)}`,
            `Influence Score: ${node.influenceScore.toFixed(2)}`
        ];

        // Calculate tooltip dimensions
        this.ctx.font = '12px Inter, sans-serif';
        const maxWidth = Math.max(...lines.map(l => this.ctx.measureText(l).width));
        const tooltipWidth = maxWidth + padding * 2;
        const tooltipHeight = lines.length * lineHeight + padding * 2;

        // Position tooltip near node, but keep it on screen
        let tooltipX = node.x + 15;
        let tooltipY = node.y - tooltipHeight / 2;

        // Keep tooltip on screen
        if (tooltipX + tooltipWidth > this.width - 10) {
            tooltipX = node.x - tooltipWidth - 15;
        }
        if (tooltipY < 10) tooltipY = 10;
        if (tooltipY + tooltipHeight > this.height - 10) {
            tooltipY = this.height - tooltipHeight - 10;
        }

        // Draw tooltip background
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 1;
        this.ctx.beginPath();
        this.ctx.roundRect(tooltipX, tooltipY, tooltipWidth, tooltipHeight, 8);
        this.ctx.fill();
        this.ctx.stroke();

        // Draw tooltip text
        this.ctx.fillStyle = '#1e293b';
        this.ctx.font = 'bold 12px Inter, sans-serif';
        this.ctx.fillText(lines[0], tooltipX + padding, tooltipY + padding + 12);

        this.ctx.font = '12px Inter, sans-serif';
        for (let i = 1; i < lines.length; i++) {
            this.ctx.fillText(lines[i], tooltipX + padding, tooltipY + padding + 12 + i * lineHeight);
        }
    }

    // Find node at given coordinates
    getNodeAtPosition(x, y) {
        // Calculate max degree for radius calculation
        const maxDegree = Math.max(...this.nodes.map(n => n.neighbors.length), 1);
        const minRadius = 4;
        const maxRadius = 16;

        for (let i = this.nodes.length - 1; i >= 0; i--) {
            const node = this.nodes[i];
            const dx = x - node.x;
            const dy = y - node.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Calculate the actual radius used for this node
            const baseRadius = minRadius + (node.neighbors.length / maxDegree) * (maxRadius - minRadius);
            const radius = node.isOptimalTarget ? Math.max(baseRadius, 10) : baseRadius;

            if (distance <= radius + 5) { // 5px tolerance
                return node;
            }
        }
        return null;
    }

    animate() {
        // Disabled force animation - nodes stay in fixed positions
        // this.applyForces();
        this.draw();
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    startAnimation() {
        if (!this.animationFrame) {
            this.animate();
        }
    }

    stopAnimation() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
            this.animationFrame = null;
        }
    }
}

// Application Controller
class App {
    constructor() {
        this.canvas = document.getElementById('networkCanvas');
        this.graph = new NetworkGraph(this.canvas);
        this.propagationInterval = null;
        this.animationSpeed = 1.0;

        this.setupEventListeners();
        this.graph.startAnimation();
    }

    setupEventListeners() {
        // Model selection
        document.querySelectorAll('.model-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.model-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                const model = btn.dataset.model;
                this.graph.model = model;

                // Toggle parameter visibility
                document.getElementById('triggeringParams').classList.add('hidden');
                document.getElementById('generalCascadeParams').classList.add('hidden');
                document.getElementById('generalThresholdParams').classList.add('hidden');

                if (model === 'triggering') {
                    document.getElementById('triggeringParams').classList.remove('hidden');
                } else if (model === 'general-cascade') {
                    document.getElementById('generalCascadeParams').classList.remove('hidden');
                } else if (model === 'general-threshold') {
                    document.getElementById('generalThresholdParams').classList.remove('hidden');
                }
            });
        });

        // Sliders
        this.setupSlider('nodeCount', (value) => {
            document.getElementById('nodeCountValue').textContent = value;
        });

        this.setupSlider('connectivity', (value) => {
            document.getElementById('connectivityValue').textContent = value;
        });

        this.setupSlider('initialSeeds', (value) => {
            document.getElementById('initialSeedsValue').textContent = value;
        });

        this.setupSlider('liveEdgeProb', (value) => {
            document.getElementById('liveEdgeProbValue').textContent = value;
        });

        this.setupSlider('baseActivationProb', (value) => {
            document.getElementById('baseActivationProbValue').textContent = value;
        });

        this.setupSlider('animationSpeed', (value) => {
            document.getElementById('animationSpeedValue').textContent = value + 'x';
            this.animationSpeed = parseFloat(value);
        });

        // Buttons
        document.getElementById('generateBtn').addEventListener('click', () => {
            this.generateNetwork();
        });

        document.getElementById('startBtn').addEventListener('click', () => {
            this.startPropagation();
        });

        document.getElementById('stepBtn').addEventListener('click', () => {
            this.stepPropagation();
        });

        document.getElementById('resetBtn').addEventListener('click', () => {
            this.resetSimulation();
        });

        document.getElementById('heuristicBtn').addEventListener('click', () => {
            this.applyHeuristicSeeds();
        });

        document.getElementById('greedyBtn').addEventListener('click', () => {
            this.applyGreedySeeds();
        });

        // Window resize
        window.addEventListener('resize', () => {
            this.graph.setupCanvas();
        });
    }

    setupSlider(id, callback) {
        const slider = document.getElementById(id);
        slider.addEventListener('input', (e) => {
            callback(e.target.value);
        });
    }

    generateNetwork() {
        const nodeCount = parseInt(document.getElementById('nodeCount').value);
        const connectivity = parseFloat(document.getElementById('connectivity').value);
        const initialSeeds = parseInt(document.getElementById('initialSeeds').value);
        const liveEdgeProb = parseFloat(document.getElementById('liveEdgeProb').value);
        const baseActivationProb = parseFloat(document.getElementById('baseActivationProb').value);
        const thresholdMean = parseFloat(document.getElementById('thresholdMean').value);

        // Set model parameters
        this.graph.liveEdgeProb = liveEdgeProb;
        this.graph.baseActivationProb = baseActivationProb;

        this.graph.generateNetwork(nodeCount, connectivity, initialSeeds);

        // Adjust thresholds based on mean for General Threshold model
        if (this.graph.model === 'general-threshold') {
            this.graph.nodes.forEach(node => {
                node.threshold = Math.max(0, Math.min(1, thresholdMean + (Math.random() - 0.5) * 0.4));
            });
        }

        // Enable buttons
        document.getElementById('startBtn').disabled = false;
        document.getElementById('stepBtn').disabled = false;
        document.getElementById('resetBtn').disabled = false;

        this.stopPropagation();
    }

    startPropagation() {
        if (this.propagationInterval) {
            this.stopPropagation();
            document.getElementById('startBtn').innerHTML = '<span class="btn-icon">▶️</span> Start Propagation';
            return;
        }

        document.getElementById('startBtn').innerHTML = '<span class="btn-icon">⏸️</span> Pause';

        const baseDelay = 1000;
        const delay = baseDelay / this.animationSpeed;

        this.propagationInterval = setInterval(() => {
            const continued = this.graph.step();
            this.graph.updateStats();

            if (!continued) {
                this.stopPropagation();
                document.getElementById('startBtn').innerHTML = '<span class="btn-icon">▶️</span> Start Propagation';
            }
        }, delay);
    }

    stopPropagation() {
        if (this.propagationInterval) {
            clearInterval(this.propagationInterval);
            this.propagationInterval = null;
        }
    }

    stepPropagation() {
        this.stopPropagation();
        document.getElementById('startBtn').innerHTML = '<span class="btn-icon">▶️</span> Start Propagation';
        this.graph.step();
        this.graph.updateStats();
    }

    resetSimulation() {
        this.stopPropagation();
        document.getElementById('startBtn').innerHTML = '<span class="btn-icon">▶️</span> Start Propagation';
        this.graph.reset();
    }

    applyHeuristicSeeds() {
        if (!this.graph.nodes || this.graph.nodes.length === 0) {
            alert('Please generate a network first!');
            return;
        }

        const numSeeds = parseInt(document.getElementById('initialSeeds').value);
        this.graph.applyHighestDegreeSeeds(numSeeds);
        this.graph.draw();
    }

    applyGreedySeeds() {
        if (!this.graph.nodes || this.graph.nodes.length === 0) {
            alert('Please generate a network first!');
            return;
        }

        const numSeeds = parseInt(document.getElementById('initialSeeds').value);

        // Show loading state
        const btn = document.getElementById('greedyBtn');
        const originalText = btn.innerHTML;
        btn.innerHTML = '<span class="btn-icon">⏳</span> ...';
        btn.disabled = true;
        document.getElementById('heuristicBtn').disabled = true;

        // Run optimization asynchronously
        setTimeout(() => {
            this.graph.applyGreedySeeds(numSeeds);

            // Restore buttons
            btn.innerHTML = originalText;
            btn.disabled = false;
            document.getElementById('heuristicBtn').disabled = false;

            this.graph.draw();
        }, 50);
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    new App();
});
