/**
 * Builds a random puzzle slice from a protocol by extracting a random section
 * @param {Object} protocol - The protocol object
 * @param {string} startNodeId - Starting node ID
 * @param {number} difficulty - Number of blocks to remove (1=easy, 2=medium, 3+=hard)
 * @returns {Object} Puzzle slice with removed nodes and choices
 */
export function buildPuzzleSlice(protocol, startNodeId, difficulty = 1) {
  const { nodes } = protocol;
  
  // Build all possible paths from the protocol
  function getAllPaths(nodeId, currentPath = [], allPaths = []) {
    if (!nodeId || !nodes[nodeId]) return allPaths;
    
    const node = nodes[nodeId];
    const newPath = [...currentPath, nodeId];
    
    // If it's a terminal node, save this path
    if (node.type === 'terminal' || node.type === 'end' || node.type === 'jump') {
      allPaths.push(newPath);
      return allPaths;
    }
    
    // Handle different node types
    if (node.next) {
      getAllPaths(node.next, newPath, allPaths);
    }
    
    if (node.yesNext) {
      getAllPaths(node.yesNext, newPath, allPaths);
    }
    
    if (node.noNext) {
      getAllPaths(node.noNext, newPath, allPaths);
    }
    
    // If no next nodes, this is a path end
    if (!node.next && !node.yesNext && !node.noNext) {
      allPaths.push(newPath);
    }
    
    return allPaths;
  }
  
  // Get all possible paths
  const allPaths = getAllPaths(startNodeId);
  
  // Filter paths that are long enough (at least 3 nodes)
  const validPaths = allPaths.filter(path => path.length >= 3);
  
  if (validPaths.length === 0) {
    // Fallback: use simple traversal
    const path = [];
    const visited = new Set();
    
    function traverse(nodeId) {
      if (!nodeId || visited.has(nodeId) || !nodes[nodeId]) return;
      visited.add(nodeId);
      path.push(nodeId);
      
      const node = nodes[nodeId];
      if (node.next) traverse(node.next);
      else if (node.yesNext) traverse(node.yesNext);
      else if (node.noNext) traverse(node.noNext);
    }
    
    traverse(startNodeId);
    
    if (path.length < 3) {
      // If still too short, just use what we have
      const puzzlePath = path.map(nodeId => ({ type: 'node', nodeId, node: nodes[nodeId] }));
      return {
        puzzlePath,
        choices: [],
        removed: [],
        startNodeId,
        protocolId: protocol.protocolId,
        title: protocol.title
      };
    }
    
    // Extract a random section of 4-6 nodes
    const sectionLength = Math.min(4 + difficulty, path.length);
    const startIdx = Math.floor(Math.random() * Math.max(1, path.length - sectionLength + 1));
    const section = path.slice(startIdx, startIdx + sectionLength);
    
    // Filter removable nodes
    const removableIndices = section
      .map((nodeId, idx) => ({ nodeId, idx }))
      .filter(({ nodeId }) => {
        const node = nodes[nodeId];
        return node.type !== 'terminal' && 
               node.type !== 'loop' && 
               node.type !== 'event' &&
               node.type !== 'end';
      });
    
    // Randomly select nodes to remove
    const numToRemove = Math.min(difficulty, removableIndices.length - 1);
    const removed = [];
    const indicesToRemove = new Set();
    
    while (indicesToRemove.size < numToRemove && removableIndices.length > 0) {
      const randomIdx = Math.floor(Math.random() * removableIndices.length);
      const selected = removableIndices.splice(randomIdx, 1)[0];
      indicesToRemove.add(selected.idx);
      removed.push({
        nodeId: selected.nodeId,
        node: nodes[selected.nodeId]
      });
    }
    
    // Build puzzle path with gaps
    const puzzlePath = section.map((nodeId, idx) => {
      if (indicesToRemove.has(idx)) {
        return { type: 'gap', expectedId: nodeId };
      }
      return { type: 'node', nodeId, node: nodes[nodeId] };
    });
    
    // Build choices: removed nodes + distractors from other parts of protocol
    const allNodeIds = Object.keys(nodes);
    const distractorCount = Math.max(2, difficulty);
    const distractors = allNodeIds
      .filter(id => !section.includes(id) && nodes[id].type !== 'terminal')
      .sort(() => Math.random() - 0.5)
      .slice(0, distractorCount)
      .map(id => ({ nodeId: id, node: nodes[id] }));
    
    const choices = [
      ...removed.map(r => ({ nodeId: r.nodeId, node: r.node, isCorrect: true })),
      ...distractors.map(d => ({ nodeId: d.nodeId, node: d.node, isCorrect: false }))
    ].sort(() => Math.random() - 0.5);
    
    return {
      puzzlePath,
      choices,
      removed: removed.map(r => r.nodeId),
      startNodeId,
      protocolId: protocol.protocolId,
      title: protocol.title
    };
  }
  
  // Select a random valid path
  const selectedPath = validPaths[Math.floor(Math.random() * validPaths.length)];
  
  // Extract a random section of 4-6 nodes from this path
  const sectionLength = Math.min(4 + difficulty, selectedPath.length);
  const startIdx = Math.floor(Math.random() * Math.max(1, selectedPath.length - sectionLength + 1));
  const section = selectedPath.slice(startIdx, startIdx + sectionLength);
  
  // Filter removable nodes
  const removableIndices = section
    .map((nodeId, idx) => ({ nodeId, idx }))
    .filter(({ nodeId }) => {
      const node = nodes[nodeId];
      return node.type !== 'terminal' && 
             node.type !== 'loop' && 
             node.type !== 'event' &&
             node.type !== 'end';
    });
  
  // Randomly select nodes to remove
  const numToRemove = Math.min(difficulty, removableIndices.length - 1);
  const removed = [];
  const indicesToRemove = new Set();
  
  while (indicesToRemove.size < numToRemove && removableIndices.length > 0) {
    const randomIdx = Math.floor(Math.random() * removableIndices.length);
    const selected = removableIndices.splice(randomIdx, 1)[0];
    indicesToRemove.add(selected.idx);
    removed.push({
      nodeId: selected.nodeId,
      node: nodes[selected.nodeId]
    });
  }
  
  // Build puzzle path with gaps, preserving decision context
  const puzzlePath = section.map((nodeId, idx) => {
    const node = nodes[nodeId];
    const isGap = indicesToRemove.has(idx);
    
    if (isGap) {
      return { 
        type: 'gap', 
        expectedId: nodeId,
        // Preserve decision context if previous node was a decision
        decisionContext: idx > 0 && nodes[section[idx - 1]]?.type === 'decision' 
          ? { 
              previousNode: nodes[section[idx - 1]],
              isYesPath: nodes[section[idx - 1]]?.yesNext === nodeId,
              isNoPath: nodes[section[idx - 1]]?.noNext === nodeId
            }
          : null
      };
    }
    
    return { 
      type: 'node', 
      nodeId, 
      node,
      // Add decision info for display
      isDecision: node.type === 'decision',
      hasYesPath: !!node.yesNext,
      hasNoPath: !!node.noNext
    };
  });
  
  // Build choices: removed nodes + distractors from other parts of protocol
  const allNodeIds = Object.keys(nodes);
  const distractorCount = Math.max(2, difficulty);
  const distractors = allNodeIds
    .filter(id => !section.includes(id) && nodes[id].type !== 'terminal')
    .sort(() => Math.random() - 0.5)
    .slice(0, distractorCount)
    .map(id => ({ nodeId: id, node: nodes[id] }));
  
  const choices = [
    ...removed.map(r => ({ nodeId: r.nodeId, node: r.node, isCorrect: true })),
    ...distractors.map(d => ({ nodeId: d.nodeId, node: d.node, isCorrect: false }))
  ].sort(() => Math.random() - 0.5);
  
  return {
    puzzlePath,
    choices,
    removed: removed.map(r => r.nodeId),
    startNodeId,
    protocolId: protocol.protocolId,
    title: protocol.title
  };
}
