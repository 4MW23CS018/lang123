export class SceneEngine {
  constructor(chapter, saved = {}) {
    this.chapter = chapter;
    this.state = {
      sceneId: saved.sceneId || chapter.startingSceneId,
      nodeId: saved.nodeId || "start",
      flags: saved.flags || {},
      completedQuests: saved.completedQuests || [],
      claimedRewards: saved.claimedRewards || [],
      xp: saved.xp || 0,
      gems: saved.gems || 0
    };
    this.validate();
  }
  get scene() { return this.chapter.scenes[this.state.sceneId]; }
  get node() { return this.scene.nodes[this.state.nodeId]; }
  snapshot() { return JSON.parse(JSON.stringify(this.state)); }
  validate() {
    if (!this.chapter.scenes[this.state.sceneId]) throw new Error(`Unknown scene ${this.state.sceneId}`);
    if (!this.scene.nodes[this.state.nodeId]) throw new Error(`Unknown node ${this.state.nodeId}`);
    for (const [sid, scene] of Object.entries(this.chapter.scenes)) {
      for (const [nid, node] of Object.entries(scene.nodes)) {
        if (node.next && !scene.nodes[node.next]) throw new Error(`Broken transition ${sid}.${nid} -> ${node.next}`);
        for (const choice of node.choices || []) {
          if (choice.next && !scene.nodes[choice.next]) throw new Error(`Broken choice ${sid}.${nid}.${choice.id}`);
        }
      }
    }
  }
  continue() {
    if (this.node.next) this.state.nodeId = this.node.next;
    this.applyEffects();
    return this.snapshot();
  }
  choose(id) {
    const choice = (this.node.choices || []).find(c => c.id === id);
    if (!choice) throw new Error(`Invalid choice: ${id}`);
    if (choice.intent) this.state.flags[`intent:${choice.intent}`] = true;
    if (choice.next) this.state.nodeId = choice.next;
    this.applyEffects();
    return this.snapshot();
  }
  applyEffects() {
    const node = this.node;
    if (node.completeQuest) this.state.completedQuests = [...new Set([...this.state.completedQuests, `${this.chapter.id}:first_conversation`])];
    if (node.reward) {
      const key = `${this.state.sceneId}:${this.state.nodeId}`;
      if (!this.state.claimedRewards.includes(key)) {
        this.state.claimedRewards.push(key);
        this.state.xp += node.reward.xp || 0;
        this.state.gems += node.reward.gems || 0;
      }
    }
  }
}
export function validateChapter(chapter) {
  const issues = [];
  for (const [sid, scene] of Object.entries(chapter.scenes || {})) {
    if (!scene.nodes?.start) issues.push(`${sid}: missing start node`);
    for (const [nid, node] of Object.entries(scene.nodes || {})) {
      if (node.next && !scene.nodes[node.next]) issues.push(`${sid}.${nid}: missing target ${node.next}`);
      for (const c of node.choices || []) if (c.next && !scene.nodes[c.next]) issues.push(`${sid}.${nid}.${c.id}: missing target ${c.next}`);
      if (!node.next && !node.choices && !node.end) issues.push(`${sid}.${nid}: dead end`);
    }
  }
  return issues;
}
