# Influence Propagation Visualization

An interactive visualization demonstrating how influence spreads through social networks using two fundamental diffusion models from network science research.

## Overview

This visualization implements the concepts introduced in the seminal paper on influence maximization in social networks. It demonstrates two core models:

### 1. Linear Threshold Model
- Each node has a random threshold value (0-1)
- Nodes are influenced by neighbors according to weighted edges
- A node becomes active when the total weighted influence from active neighbors exceeds its threshold
- Models scenarios where adoption requires sufficient peer pressure

### 2. Independent Cascade Model
- When a node becomes active, it gets one chance to activate each inactive neighbor
- Activation succeeds with a probability specific to each edge
- Models viral spreading and word-of-mouth effects
- Each activation attempt is independent

### 3. Marketing Strategy Model (Advanced)
- Implements multiple marketing actions with budget allocation
- Each action has different effectiveness and targeting strategies
- **Diminishing Returns**: Investment effectiveness decreases as more is spent (h_v(x + a) - h_v(x) ≤ h_v(y + a) - h_v(y) for x ≥ y)
- **Hill-Climbing Optimization**: Implements gradient ascent algorithm from Theorem 6.1
- **Budget Optimization**: Finds approximately optimal allocation across actions
- Models realistic marketing scenarios with limited budgets

## How to Use

1. **Open the visualization**: Simply open `index.html` in a modern web browser
2. **Select a model**: Choose between Linear Threshold, Independent Cascade, or Marketing Strategy
3. **Configure the network**:
   - Adjust number of nodes (10-100)
   - Set network density (how connected nodes are)
   - Choose number of initial seed nodes
4. **Adjust model parameters**:
   - Linear Threshold: Set the mean threshold value
   - Independent Cascade: Set the activation probability
   - Marketing Strategy: Set budget and number of marketing actions
5. **Generate Network**: Click to create a new random network
6. **For Marketing Strategy Model**: Click "Run Hill-Climbing Optimizer" to find optimal budget allocation
7. **Run Simulation**:
   - Click "Start Propagation" to watch influence spread automatically
   - Use "Step Forward" to advance one step at a time
   - Click "Reset" to return to initial state

## Features

- **Real-time Statistics**: Track active nodes, current step, and overall influence percentage
- **Force-Directed Layout**: Nodes arrange themselves naturally with physics simulation
- **Interactive Controls**: Fine-tune all parameters in real-time
- **Visual Feedback**: 
  - Orange nodes = Initial seeds
  - Green nodes = Activated nodes
  - Gray nodes = Inactive nodes
  - Blue edges = Connections between active nodes
- **Responsive Design**: Works on desktop and mobile devices

## Technical Implementation

- Pure JavaScript with HTML5 Canvas for high-performance rendering
- Force-directed graph layout for natural node positioning
- Implements both diffusion models with accurate mathematical formulations
- Smooth animations and transitions for better understanding

## Applications

This visualization helps understand:
- Viral marketing strategies
- Information diffusion in social networks
- Disease spread modeling
- Innovation adoption patterns
- Influence maximization problems

## References

Based on research in:
- Network diffusion processes
- Influence maximization algorithms
- Mathematical sociology models
- Interacting particle systems

---

**Note**: The visualization uses randomization for network generation and threshold/probability assignments, so each run will produce different results even with the same parameters.
