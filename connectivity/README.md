# Graph Connectivity Visualization

Interactive visualization of the Erdős–Rényi $G(n, p)$ random graph model, demonstrating phase transitions in graph connectivity.

## Features

- **Interactive Simulation**: Adjust the number of nodes ($n$) and average degree ($k$) to see real-time changes in the graph structure.
- **Phase Transitions**: Visual indicators for key thresholds:
  - **Giant Component**: Emerges when $k > 1$.
  - **Connected Graph**: The entire graph becomes connected when $k > \ln n$.
- **Mathematical Context**: Explanations of the underlying theorems provided directly in the interface using KaTeX.
- **Single File**: Self-contained `index.html` with no external file dependencies (aside from CDNs).

## Launching the Application

Since this is a static project, you can simply open the `index.html` file in any modern web browser.

No installation or build step is required.

## How it Works

The visualization generates a random graph where:
- **$n$** is the total number of nodes.
- **$p$** is the probability of an edge existing between any two nodes.
- **$k$** (Average Degree) is related to $p$ by $k = p(n-1) \approx pn$.

As you increase $k$:
1. Small isolated components start to merge.
2. At $k=1$, a "Giant Component" forms, containing a significant fraction of the nodes.
3. As $k$ approaches $\ln n$, isolated nodes disappear, and the graph becomes fully connected.

## Technologies Used

- **Vanilla JavaScript & CSS**: Core logic and styling.
- **Canvas API**: For high-performance graph rendering.
- **KaTeX**: For rendering mathematical notation (via CDN).
- **Google Fonts**: Inter and Outfit families.
