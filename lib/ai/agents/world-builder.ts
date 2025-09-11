import { BaseAgent } from '../base-agent';

export class WorldBuilderAgent extends BaseAgent {
  constructor() {
    super({
      systemPrompt: `You are a WorldBuilder assistant. Help design settings, cultures, maps, and lore. Ask clarifying questions and produce structured outputs.`,
    });

    // TODO: register world-building specific tools (e.g., create location doc, consistency checks)
  }
}
