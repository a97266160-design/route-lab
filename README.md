# Route Lab

Build a modern React + TypeScript web prototype called Route Ordering Lab.

1. Product goal

This is a research and experimentation prototype for discovering better ways to reorder a fixed set of route points.

The system is NOT a full production routing platform yet.

The main question the prototype must help answer is:

“Given a fixed set of points, what ordering strategy produces the best route?”

The user should be able to:

load or generate static points

visualize the points

choose an ordering strategy

run the strategy

see the resulting ordered route

evaluate the route

compare multiple strategies

inspect weaknesses

create experimental strategies

save experiment results

use the results to formulate new ordering ideas

The application should feel like a routing research laboratory, not a normal delivery-management dashboard.

2. Important product principle

Keep these concepts strictly separated:

Dataset

Cost model

Ordering strategy

Route

Evaluation

Experiment

Visualization

Do not combine all logic into one component or one large function.

The architecture must allow new ordering algorithms to be added without rewriting the rest of the application.

3. Technology

Use:

React

TypeScript

Vite

Tailwind CSS

shadcn/ui

Recharts where charts are useful

Lucide icons

Local browser state/storage only

No authentication

No backend required for V1

No database required for V1

The first version must work entirely with static/generated local data.

4. Main application layout

Create a polished desktop-first application with responsive behavior.

Use a layout similar to:

┌──────────────────────────────────────────────────────────────────┐
│ Route Ordering Lab                                  Run Experiment│
├───────────────┬──────────────────────────────────────┬────────────┤
│               │                                      │            │
│ Dataset       │                                      │ Experiment │
│               │               Route Map              │ Controls   │
│ Points        │                                      │            │
│               │                                      │ Strategy   │
│ Strategies    │                                      │            │
│               │                                      │ Parameters │
│ Experiments   │                                      │            │
│               │                                      │            │
├───────────────┴──────────────────────────────────────┴────────────┤
│ Metrics / Comparison / Experiment Results                         │
└───────────────────────────────────────────────────────────────────┘


Use a clean technical/research aesthetic.

Avoid making it look like a generic admin panel.

5. Navigation

Create a left sidebar with:

Overview

Dataset

Ordering

Experiments

Comparison

Insights

At the bottom:

Current dataset

Prototype version

Local storage status

Navigation can be SPA-style.

6. Overview page

The Overview page should explain the purpose of the system.

Header:

Route Ordering Lab

Subtitle:

Experiment with different ways of ordering route points and discover better strategies.

Show four main cards:

Current Dataset

Example:

Cluster-500-V1
500 points
5 clusters


Best Route

941.3 km
Experimental V3


Baseline

1052.0 km
Nearest Neighbor


Improvement

10.55%
vs baseline


Below this, show:

Research Loop

Visual timeline:

Dataset
→ Baseline
→ Analyze
→ Hypothesis
→ Implement
→ Experiment
→ Compare
→ New Idea


Add a button:

Start New Experiment

7. Dataset system

Create a dataset page where the user can work with static points.

Dataset types

Include a generator with:

Random

Grid

Clustered

Corridor

Circle

Multiple Clusters

Outliers

Inputs:

Dataset name
Point count
Cluster count
Seed
Coordinate spread
Depot position


Provide examples:

Random-100
Cluster-500
Grid-100
Corridor-250
MultipleClusters-500
Outliers-200


The point generator must use a deterministic seed so that the same dataset can be reproduced.

8. Dataset visualization

Show the dataset on a map-like 2D canvas.

Do NOT require a real map API for V1.

A simple coordinate plane is enough.

Each point should be represented by:

small circle

ID label on hover

optional number

The depot should be visually distinct.

Example:

                 P12
            ●
        ● P08

  ● P03                     ● P21

              ★ DEPOT

                       ● P44


Add zoom and pan functionality if practical.

Add controls:

Show IDs

Show route

Show direction arrows

Show clusters

Reset view

9. Data model

Create TypeScript models.

Use structures similar to:

type Point = {
  id: string;
  x: number;
  y: number;
  metadata?: Record<string, unknown>;
};

type Dataset = {
  id: string;
  name: string;
  version: string;
  points: Point[];
  depotId: string;
  description?: string;
  seed?: number;
};

type Route = {
  id: string;
  pointIds: string[];
};

type RouteEvaluation = {
  valid: boolean;
  totalCost: number;
  totalDistance: number;
  averageEdge: number;
  longestEdge: number;
  runtimeMs: number;
  visitedPoints: number;
  uniquePoints: number;
};

type Experiment = {
  id: string;
  datasetId: string;
  strategyName: string;
  strategyVersion: string;
  parameters: Record<string, number | string | boolean>;
  result: RouteEvaluation;
  route: Route;
  notes?: string;
  createdAt: string;
};


Keep the models modular.

10. Cost model

For V1, use a local mathematical distance.

Do not use Google Maps or external routing APIs.

Create a cost provider abstraction:

interface CostProvider {
  getCost(from: Point, to: Point): number;
}


Implement:

EuclideanCostProvider


The rest of the application must depend on the interface rather than directly calculating distance everywhere.

Design it so future providers could be added:

Euclidean
Road Distance
Travel Time
Custom Cost


11. Cost matrix

Create a reusable cost matrix.

Conceptually:

cost[fromId][toId]


Example:

      P1    P2    P3
P1     0   5.2   8.1
P2   5.2     0   4.3
P3   8.1   4.3     0


Create a service:

CostMatrixBuilder


The ordering algorithms should use the cost matrix rather than recalculating distances repeatedly when possible.

12. Ordering strategy architecture

Create an interface:

interface OrderingStrategy {
  name: string;
  version: string;
  description: string;

  order(
    points: Point[],
    depot: Point,
    costMatrix: CostMatrix,
    parameters?: Record<string, unknown>
  ): Route;
}


Create these strategies.

Strategy 1 — Input Order

Return the points in their original order.

Purpose:

Worst/simple baseline reference.

Strategy 2 — Random Order

Randomly shuffle the points.

Allow a seed.

Purpose:

Random baseline.

Strategy 3 — Nearest Neighbor

Starting at the depot:

find the nearest unvisited point

move there

repeat

return to depot

Purpose:

Greedy baseline.

Strategy 4 — Nearest Neighbor + 2-opt

Start with nearest neighbor and improve the route using 2-opt.

Purpose:

Strong baseline.

Strategy 5 — Experimental

Create an explicit experimental strategy component.

The user must be able to modify parameters such as:

lookAhead
lambda
candidateCount


For V1, implement a simple look-ahead heuristic.

For each candidate next point, score something like:

score =
    currentToCandidate
    +
    lambda * candidateToBestNextOption


Use the lowest score.

Make the formula and parameters visible in the UI.

Important:

This is a research prototype. Make the experimental algorithm easy to replace later.

13. Ordering page

Create a page called:

Ordering Playground

Layout:

Left

Strategy selector:

Ordering Strategy

○ Input Order
○ Random
○ Nearest Neighbor
○ NN + 2-opt
○ Experimental V1


Display description for the selected strategy.

Parameters

For Experimental V1:

Look Ahead
[ 2 ]

Lambda
[ 0.35 ]

Candidate Limit
[ 10 ]


Center

Large route visualization.

Show arrows indicating travel direction.

Right

Show:

Route
#  Point

1  DEPOT
2  P034
3  P081
4  P012
5  P092
...


Add:

Run Strategy

button.

14. Route evaluator

Create a separate evaluator service.

It must calculate:

validity

total distance

average edge distance

longest edge

number of visited points

number of unique points

runtime

Validation must check:

correct start

correct end

every point visited

no duplicate points

no missing points

depot exists

Do not allow invalid routes to be treated as successful experiments.

15. Metrics panel

After running a strategy, display:

Route Quality

Total Distance
941.3 km

Average Edge
1.88 km

Longest Edge
7.82 km

Runtime
84 ms

Visited
500 / 500

Valid
✓


Also show:

Improvement vs Baseline

+10.55%


16. Visualization of route weaknesses

This is important for research.

Add optional visual indicators:

Long edges

Highlight unusually long connections.

Crossing lines

Show crossing route segments when detected.

Clusters

Show point clusters if dataset generation created them.

Problem transitions

Let the system identify the largest 5 route edges.

Example:

Largest transitions

1. P103 → P288     8.72 km
2. P401 → P044     7.91 km
3. P288 → P210     7.42 km


This should help the user understand why an ordering performs poorly.

17. Experiments page

Create an experiment management page.

The user chooses:

Dataset:
[Cluster-500-V1]

Strategies:
[x] Nearest Neighbor
[x] NN + 2-opt
[x] Experimental V1

Runs:
[10]


Button:

Run Experiment

For each run, save:

dataset

strategy

strategy version

parameters

route

metrics

runtime

timestamp

notes

18. Experiment results table

Create a professional comparison table.

Columns:

Strategy
Version
Distance
Runtime
Longest Edge
Valid
Improvement


Example:

Nearest Neighbor    V1    1052.0 km   12 ms    10.3 km   ✓   0%
NN + 2-opt          V1     973.2 km   81 ms     8.9 km   ✓   7.49%
Experimental        V1     941.3 km   84 ms     7.8 km   ✓  10.55%


Allow sorting by each metric.

Highlight the current best result.

19. Comparison page

Allow the user to select 2–4 experiments.

Show:

Summary cards

Best Distance
Best Runtime
Best Average Edge
Best Overall


Bar charts

Compare:

total distance

runtime

longest edge

Route comparison

Show multiple strategies side-by-side on the same dataset.

Example:

Strategy A     Strategy B
──────────     ──────────
route map      route map


The purpose is visual pattern recognition.

20. Insights page

Create a section called:

Research Insights

This is not AI-generated yet.

The application should automatically report observations such as:

Experimental V1 reduced total distance by 10.55%
compared with Nearest Neighbor.

The largest route edge decreased from 10.31 km
to 7.82 km.

Performance improved most strongly on Clustered datasets.

Runtime increased by 72 ms compared with the baseline.


Also show:

Potential weaknesses

For example:

• Large transitions between clusters remain.
• Experimental strategy performs worse on Corridor datasets.
• Runtime increases rapidly after 1000 points.


These insights should be rule-based.

21. Hypothesis system

Add a lightweight research-notes system.

The user should be able to create:

Hypothesis

Title:
Look-ahead should reduce bad cluster transitions

Observation:
Nearest Neighbor chooses locally good points but sometimes
creates expensive transitions between clusters.

Expected effect:
Lower longest-edge distance.

Status:
Testing


Statuses:

Idea

Testing

Confirmed

Rejected

Connect hypotheses to experiments.

This makes the application a real research workflow rather than just a benchmark UI.

22. Experiment history

Persist experiments in localStorage.

The user should be able to:

open an experiment

duplicate an experiment

delete an experiment

compare experiments

view parameters

view route

add notes

Use localStorage only for V1.

23. Important reproducibility features

Every experiment must store:

Dataset ID
Dataset version
Random seed
Strategy
Strategy version
Parameters
Timestamp


If a strategy has randomness, use a deterministic seed.

A user should be able to reproduce the same experiment.

24. Performance requirements

The prototype must support at least:

100 points
500 points
1000 points


without freezing the UI for ordinary experiments.

For expensive operations:

avoid unnecessary React re-renders

memoize derived data

use efficient arrays/maps

calculate cost matrix once per dataset/configuration

keep visualization separate from algorithm execution

consider Web Workers for expensive algorithms if necessary

Do not prematurely optimize everything.

Prefer correctness and clear architecture.

25. UI/UX details

Use:

clean cards

subtle borders

compact controls

technical typography

strong information hierarchy

clear metric labels

tooltips explaining unfamiliar concepts

consistent spacing

Use statuses such as:

Baseline
Experimental
Best
Invalid
Improved
Regressed


Add empty states.

Example:

No experiments yet.

Run a strategy to create your first experiment.


26. Error handling

Handle:

invalid dataset

duplicate point IDs

missing depot

missing points

invalid route

failed experiment

empty dataset

unsupported strategy parameters

Show useful errors rather than generic messages.

27. Seeded demo data

Ship the application with demo datasets and demo experiments so that the UI is not empty on first launch.

Include:

Random-100
Cluster-100
Cluster-500
MultipleClusters-500
Outliers-200


Include a few precomputed demo experiment results.

Label them clearly as:

Demo Data

28. Do NOT implement yet

Do not add:

login

payments

user accounts

production backend

delivery scheduling

vehicle management

traffic APIs

Google Maps integration

real GPS tracking

database infrastructure

real-time routing

multi-vehicle optimization

This prototype is specifically for researching point ordering.

29. Suggested source structure

Use a clean structure similar to:

src/
├── components/
│   ├── layout/
│   ├── dataset/
│   ├── ordering/
│   ├── experiments/
│   ├── comparison/
│   ├── visualization/
│   └── insights/
│
├── domain/
│   ├── Point.ts
│   ├── Dataset.ts
│   ├── Route.ts
│   ├── Experiment.ts
│   └── Metrics.ts
│
├── algorithms/
│   ├── OrderingStrategy.ts
│   ├── inputOrder.ts
│   ├── randomOrder.ts
│   ├── nearestNeighbor.ts
│   ├── twoOpt.ts
│   └── experimentalV1.ts
│
├── services/
│   ├── cost/
│   ├── evaluation/
│   ├── experiments/
│   └── storage/
│
├── data/
│   ├── demoDatasets.ts
│   └── demoExperiments.ts
│
├── hooks/
│
├── pages/
│
└── lib/


30. First implementation priority

Implement in this exact order:

Step 1

Dataset generator + static dataset model.

Step 2

2D point visualization.

Step 3

Euclidean cost matrix.

Step 4

Input Order + Random + Nearest Neighbor.

Step 5

Route evaluator.

Step 6

2-opt.

Step 7

Experimental V1 with look-ahead.

Step 8

Experiment runner + localStorage.

Step 9

Comparison dashboard.

Step 10

Research insights + hypothesis notes.

Do not implement future features before these core steps work.

31. Most important architectural rule

The application must make this possible:

Same Dataset
      │
      ├── Strategy A
      ├── Strategy B
      ├── Strategy C
      ├── Experimental V1
      ├── Experimental V2
      └── Experimental V3
              │
              ▼
          Compare
              │
              ▼
        Find weaknesses
              │
              ▼
        Create hypothesis
              │
              ▼
      implement new strategy
              │
              ▼
          run again


The purpose is not simply to find a route once.

The purpose is to create a repeatable system for discovering better ordering methods.

32. Final acceptance criteria

The prototype is successful when a user can do this without changing source code:

Open the app.

Select or generate a static dataset.

See all points and the depot.

Select Nearest Neighbor.

Run it.

See the route.

See route metrics.

Run NN + 2-opt.

Compare the two results.

Run Experimental V1.

Change its parameters.

Run it multiple times.

Save the experiments.

Compare the experiments.

Inspect long/bad route transitions.

Write a hypothesis based on an observation.

Implement the next experimental version later without changing the core application architecture.

The finished prototype should make the research loop visually obvious:

ASK → MODEL → ORDER → MEASURE → COMPARE → UNDERSTAND → HYPOTHESIZE → TEST → REPEAT

Build the UI and architecture around that workflow rather than around generic CRUD screens.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/3e66b266-ad4b-49d7-b286-bcbcf9a2a446).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
