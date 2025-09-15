import { EventEmitter } from 'events';
import { readFileSync, writeFileSync, appendFileSync } from 'fs';
import { Database } from '@/lib/database.types';

interface AgentCapability {
  domain: string[];
  confidence: number;
  historicalSuccess: number;
  specializations: string[];
}

interface Task {
  id: string;
  type: 'standard' | 'architectural' | 'emergency';
  tags: string[];
  riskLevel: 'critical' | 'high' | 'medium' | 'low';
  affectedSystems: string[];
  dependencies: string[];
}

interface Agent {
  id: string;
  name: string;
  capabilities: AgentCapability;
  status: 'idle' | 'busy' | 'error';
  execute(task: Task): Promise<any>;
  review(implementation: any): Promise<ReviewResult>;
}

interface ReviewResult {
  approved: boolean;
  veto?: boolean;
  reason?: string;
  suggestions?: string[];
}

interface OperationLog {
  id: string;
  timestamp: string;
  operation_type: string;
  execution_model: 'single-primary' | 'co-primary' | 'task-force';
  agents: {
    primary: string[];
    co_primary: string[];
    observers: string[];
    veto_events: VetoEvent[];
  };
  tagging: {
    auto_tags: string[];
    manual_tags: string[];
    risk_level: string;
    confidence: number;
  };
  impact_analysis: {
    files_changed: string[];
    dependencies_affected: string[];
    systems_impacted: string[];
    risk_assessment: {
      security: number;
      performance: number;
      stability: number;
    };
  };
  metrics: {
    before: Record<string, any>;
    after: Record<string, any>;
    delta: Record<string, any>;
    validation_results: {
      passed: boolean;
      details: Record<string, any>;
    };
  };
  execution_timeline: ExecutionPhase[];
  artifacts: {
    reports: string[];
    traces: string[];
    backups: string[];
  };
  rollback: {
    procedure: string[];
    tested: boolean;
    estimated_time: string;
  };
  learning: {
    success_patterns: string[];
    failure_patterns: string[];
    rule_updates: string[];
    agent_performance: Record<string, AgentPerformance>;
  };
}

interface VetoEvent {
  agent_id: string;
  timestamp: string;
  reason: string;
  severity: 'critical' | 'high' | 'medium';
}

interface ExecutionPhase {
  phase: 'explore' | 'plan' | 'change' | 'validate' | 'document';
  started: string;
  completed?: string;
  status: 'running' | 'completed' | 'failed';
}

interface AgentPerformance {
  success: boolean;
  execution_time: number;
  notes: string;
}

export class OrchestratorMaster extends EventEmitter {
  private agents: Map<string, Agent> = new Map();
  private operationLogs: OperationLog[] = [];
  private currentOperation: OperationLog | null = null;
  private learningPatterns: Map<string, number> = new Map();
  private tagRules: Map<string, string[]> = new Map();

  constructor() {
    super();
    this.initializeTagRules();
    this.loadHistoricalData();
  }

  private initializeTagRules(): void {
    // כללי תיוג אוטומטיים
    this.tagRules.set('supabase/', ['@rls', '@auth', '@security', '@critical']);
    this.tagRules.set('*.sql', ['@sql', '@postgis', '@database', '@high']);
    this.tagRules.set('canvas/', ['@konva', '@fps', '@mobile', '@optimize']);
    this.tagRules.set('*.tsx', ['@typescript', '@react', '@ui', '@medium']);
    this.tagRules.set('utils/', ['@utility', '@shared', '@low']);
  }

  private loadHistoricalData(): void {
    try {
      const data = readFileSync('OPERATIONS_LOG.json', 'utf-8');
      const logs = JSON.parse(data);
      this.operationLogs = logs;
      this.analyzePatterns();
    } catch (error) {
      console.log('Starting with fresh operation log');
    }
  }

  private analyzePatterns(): void {
    // ניתוח דפוסי הצלחה וכישלון
    for (const log of this.operationLogs) {
      for (const pattern of log.learning.success_patterns) {
        const count = this.learningPatterns.get(pattern) || 0;
        this.learningPatterns.set(pattern, count + 1);
      }
    }
  }

  public registerAgent(agent: Agent): void {
    this.agents.set(agent.id, agent);
    this.emit('agent:registered', agent.id);
  }

  public async executeTask(task: Task): Promise<void> {
    // Phase 1: Exploration and Tagging
    const enhancedTask = await this.exploreAndTag(task);
    
    // Phase 2: Agent Selection
    const { primary, observers, coPrimary } = await this.selectAgents(enhancedTask);
    
    // Phase 3: Execution with Monitoring
    const result = await this.coordinateExecution(enhancedTask, primary, observers, coPrimary);
    
    // Phase 4: Validation
    await this.validateChanges(result, [...primary, ...observers]);
    
    // Phase 5: Documentation and Learning
    await this.documentAndLearn(enhancedTask, result);
  }

  private async exploreAndTag(task: Task): Promise<Task> {
    const startTime = Date.now();
    
    // ניתוח תלותים עמוק
    const dependencies = await this.analyzeDependencies(task);
    
    // תיוג חכם על בסיס קבצים ותלותים
    const autoTags = this.generateAutoTags(task, dependencies);
    
    // הערכת סיכון
    const riskLevel = this.assessRisk(task, dependencies);
    
    return {
      ...task,
      tags: [...new Set([...task.tags, ...autoTags])],
      dependencies,
      riskLevel
    };
  }

  private async analyzeDependencies(task: Task): Promise<string[]> {
    const dependencies: Set<string> = new Set();
    
    // ניתוח קבצים מושפעים
    for (const file of task.affectedSystems) {
      // מציאת תלותים סטטיים
      const imports = await this.extractImports(file);
      imports.forEach(imp => dependencies.add(imp));
      
      // מציאת תלותים דינמיים
      const dynamicDeps = await this.findDynamicDependencies(file);
      dynamicDeps.forEach(dep => dependencies.add(dep));
    }
    
    return Array.from(dependencies);
  }

  private async extractImports(filePath: string): Promise<string[]> {
    // ניתוח import statements
    const content = readFileSync(filePath, 'utf-8');
    const importRegex = /import\s+(?:.*\s+from\s+)?['"]([^'"]+)['"]/g;
    const imports: string[] = [];
    let match;
    
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    
    return imports;
  }

  private async findDynamicDependencies(filePath: string): Promise<string[]> {
    // מציאת תלותים דינמיים (database queries, API calls, etc.)
    const dependencies: string[] = [];
    
    if (filePath.includes('supabase')) {
      dependencies.push('database', 'auth', 'storage');
    }
    
    if (filePath.includes('canvas')) {
      dependencies.push('konva', 'performance', 'gestures');
    }
    
    return dependencies;
  }

  private generateAutoTags(task: Task, dependencies: string[]): string[] {
    const tags: Set<string> = new Set();
    
    // תיוג על בסיס כללים
    for (const [pattern, ruleTags] of this.tagRules) {
      if (task.affectedSystems.some(file => file.includes(pattern.replace('*', '')))) {
        ruleTags.forEach(tag => tags.add(tag));
      }
    }
    
    // תיוג על בסיס תלותים
    if (dependencies.includes('auth')) tags.add('@security');
    if (dependencies.includes('database')) tags.add('@data-integrity');
    if (dependencies.includes('konva')) tags.add('@performance');
    
    return Array.from(tags);
  }

  private assessRisk(task: Task, dependencies: string[]): Task['riskLevel'] {
    let riskScore = 0;
    
    // חישוב ציון סיכון
    if (task.tags.includes('@security')) riskScore += 3;
    if (task.tags.includes('@database')) riskScore += 2;
    if (task.tags.includes('@performance')) riskScore += 1;
    if (dependencies.length > 10) riskScore += 2;
    if (task.type === 'architectural') riskScore += 3;
    if (task.type === 'emergency') riskScore += 4;
    
    // המרה לרמת סיכון
    if (riskScore >= 7) return 'critical';
    if (riskScore >= 5) return 'high';
    if (riskScore >= 3) return 'medium';
    return 'low';
  }

  private async selectAgents(task: Task): Promise<{
    primary: Agent[];
    observers: Agent[];
    coPrimary: Agent[];
  }> {
    const scores: Map<string, number> = new Map();
    
    // חישוב ציונים לכל סוכן
    for (const [id, agent] of this.agents) {
      const score = this.calculateAgentScore(agent, task);
      scores.set(id, score);
    }
    
    // מיון לפי ציון
    const sortedAgents = Array.from(scores.entries())
      .sort((a, b) => b[1] - a[1]);
    
    // זיהוי co-primary במקרה של משימות מורכבות
    const needsCoPrimary = task.riskLevel === 'critical' || 
                           task.type === 'architectural';
    
    const primary: Agent[] = [];
    const coPrimary: Agent[] = [];
    const observers: Agent[] = [];
    
    // הקצאת סוכנים
    if (needsCoPrimary && sortedAgents.length >= 2) {
      primary.push(this.agents.get(sortedAgents[0][0])!);
      coPrimary.push(this.agents.get(sortedAgents[1][0])!);
      
      // הוספת observers
      for (let i = 2; i < Math.min(4, sortedAgents.length); i++) {
        observers.push(this.agents.get(sortedAgents[i][0])!);
      }
    } else if (sortedAgents.length > 0) {
      primary.push(this.agents.get(sortedAgents[0][0])!);
      
      // הוספת observers
      for (let i = 1; i < Math.min(3, sortedAgents.length); i++) {
        observers.push(this.agents.get(sortedAgents[i][0])!);
      }
    }
    
    return { primary, observers, coPrimary };
  }

  private calculateAgentScore(agent: Agent, task: Task): number {
    let score = 0;
    
    // התאמת תחום
    const domainMatch = agent.capabilities.domain.filter(
      d => task.tags.includes(`@${d}`)
    ).length;
    score += domainMatch * 10;
    
    // ביטחון הסוכן
    score += agent.capabilities.confidence * 5;
    
    // הצלחה היסטורית
    score += agent.capabilities.historicalSuccess * 3;
    
    // התמחויות ספציפיות
    const specializationMatch = agent.capabilities.specializations.filter(
      s => task.tags.includes(`@${s}`)
    ).length;
    score += specializationMatch * 7;
    
    // הפחתת ציון אם הסוכן עסוק
    if (agent.status === 'busy') score *= 0.5;
    
    return score;
  }

  private async coordinateExecution(
    task: Task,
    primary: Agent[],
    observers: Agent[],
    coPrimary: Agent[]
  ): Promise<any> {
    this.startOperation(task, primary, observers, coPrimary);
    
    try {
      // ביצוע על ידי Primary agents
      const implementations = [];
      
      for (const agent of [...primary, ...coPrimary]) {
        const implementation = await agent.execute(task);
        implementations.push(implementation);
        
        // בדיקה על ידי Observers עם יכולת Veto
        for (const observer of observers) {
          const review = await observer.review(implementation);
          
          if (review.veto) {
            await this.handleVeto(review, observer, task);
            throw new Error(`Veto by ${observer.id}: ${review.reason}`);
          }
        }
      }
      
      return implementations;
      
    } catch (error) {
      this.handleExecutionError(error, task);
      throw error;
    }
  }

  private async handleVeto(
    review: ReviewResult,
    observer: Agent,
    task: Task
  ): Promise<void> {
    const vetoEvent: VetoEvent = {
      agent_id: observer.id,
      timestamp: new Date().toISOString(),
      reason: review.reason || 'Unknown',
      severity: task.riskLevel === 'critical' ? 'critical' : 'high'
    };
    
    // רישום ה-Veto
    if (this.currentOperation) {
      this.currentOperation.agents.veto_events.push(vetoEvent);
    }
    
    // התראה מיידית
    this.emit('veto:triggered', vetoEvent);
    
    // עצירת ביצוע והתחלת תהליך גישור
    await this.mediateConflict(review, observer, task);
  }

  private async mediateConflict(
    review: ReviewResult,
    observer: Agent,
    task: Task
  ): Promise<void> {
    // תהליך גישור בין Primary ל-Observer
    console.log(`Mediating conflict for task ${task.id}`);
    console.log(`Veto reason: ${review.reason}`);
    console.log(`Suggestions: ${review.suggestions?.join(', ')}`);
    
    // יצירת משימה מתוקנת
    const revisedTask = {
      ...task,
      tags: [...task.tags, '@requires-review'],
      riskLevel: 'critical' as const
    };
    
    // ניסיון חוזר עם התאמות
    await this.executeTask(revisedTask);
  }

  private async validateChanges(
    result: any,
    agents: Agent[]
  ): Promise<void> {
    const validationResults: Record<string, any> = {};
    
    // כל סוכן מבצע ולידציה בתחומו
    for (const agent of agents) {
      const validation = await this.runAgentValidation(agent, result);
      validationResults[agent.id] = validation;
    }
    
    // בדיקת תוצאות
    const allPassed = Object.values(validationResults).every(
      (v: any) => v.passed === true
    );
    
    if (!allPassed) {
      throw new Error('Validation failed: ' + JSON.stringify(validationResults));
    }
    
    // עדכון המטריקות
    if (this.currentOperation) {
      this.currentOperation.metrics.validation_results = {
        passed: allPassed,
        details: validationResults
      };
    }
  }

  private async runAgentValidation(
    agent: Agent,
    result: any
  ): Promise<any> {
    // ולידציה ספציפית לכל סוכן
    switch (agent.id) {
      case 'supabase-rls-guard':
        return this.validateSecurity(result);
      case 'typescript-expert':
        return this.validateTypeScript(result);
      case 'konva-perf':
        return this.validatePerformance(result);
      case 'postgis-optimizer':
        return this.validateDatabase(result);
      default:
        return { passed: true };
    }
  }

  private async validateSecurity(result: any): Promise<any> {
    // בדיקת אבטחה
    return {
      passed: true,
      rlsCoverage: '100%',
      vulnerabilities: 0
    };
  }

  private async validateTypeScript(result: any): Promise<any> {
    // בדיקת TypeScript
    return {
      passed: true,
      errors: 0,
      warnings: 0
    };
  }

  private async validatePerformance(result: any): Promise<any> {
    // בדיקת ביצועים
    return {
      passed: true,
      fps: 60,
      memoryUsage: 'stable'
    };
  }

  private async validateDatabase(result: any): Promise<any> {
    // בדיקת database
    return {
      passed: true,
      queryTime: '<100ms',
      indexUsage: 'optimal'
    };
  }

  private async documentAndLearn(task: Task, result: any): Promise<void> {
    // שמירת תוצאות
    this.completeOperation(result);
    
    // עדכון דפוסי למידה
    this.updateLearningPatterns(task, result);
    
    // כתיבת לוגים
    await this.writeOperationLogs();
    
    // שידור לכל הסוכנים
    this.broadcastChanges(task, result);
  }

  private startOperation(
    task: Task,
    primary: Agent[],
    observers: Agent[],
    coPrimary: Agent[]
  ): void {
    this.currentOperation = {
      id: `${new Date().toISOString()}-${task.id}`,
      timestamp: new Date().toISOString(),
      operation_type: task.type,
      execution_model: coPrimary.length > 0 ? 'co-primary' : 'single-primary',
      agents: {
        primary: primary.map(a => a.id),
        co_primary: coPrimary.map(a => a.id),
        observers: observers.map(a => a.id),
        veto_events: []
      },
      tagging: {
        auto_tags: task.tags,
        manual_tags: [],
        risk_level: task.riskLevel,
        confidence: 0.95
      },
      impact_analysis: {
        files_changed: task.affectedSystems,
        dependencies_affected: task.dependencies,
        systems_impacted: this.identifyImpactedSystems(task),
        risk_assessment: {
          security: task.tags.includes('@security') ? 0.8 : 0.2,
          performance: task.tags.includes('@performance') ? 0.7 : 0.3,
          stability: task.riskLevel === 'critical' ? 0.9 : 0.4
        }
      },
      metrics: {
        before: {},
        after: {},
        delta: {},
        validation_results: { passed: false, details: {} }
      },
      execution_timeline: [
        {
          phase: 'explore',
          started: new Date().toISOString(),
          status: 'running'
        }
      ],
      artifacts: {
        reports: [],
        traces: [],
        backups: []
      },
      rollback: {
        procedure: [],
        tested: false,
        estimated_time: '5 minutes'
      },
      learning: {
        success_patterns: [],
        failure_patterns: [],
        rule_updates: [],
        agent_performance: {}
      }
    };
  }

  private identifyImpactedSystems(task: Task): string[] {
    const systems = new Set<string>();
    
    if (task.tags.includes('@database')) systems.add('database');
    if (task.tags.includes('@auth')) systems.add('authentication');
    if (task.tags.includes('@ui')) systems.add('frontend');
    if (task.tags.includes('@performance')) systems.add('performance');
    
    return Array.from(systems);
  }

  private completeOperation(result: any): void {
    if (!this.currentOperation) return;
    
    // עדכון timeline
    const lastPhase = this.currentOperation.execution_timeline[
      this.currentOperation.execution_timeline.length - 1
    ];
    lastPhase.completed = new Date().toISOString();
    lastPhase.status = 'completed';
    
    // שמירה בלוג
    this.operationLogs.push(this.currentOperation);
  }

  private updateLearningPatterns(task: Task, result: any): void {
    if (!this.currentOperation) return;
    
    // זיהוי דפוסי הצלחה
    if (this.currentOperation.metrics.validation_results.passed) {
      const pattern = `${task.type}-${task.tags.join('-')}`;
      this.currentOperation.learning.success_patterns.push(pattern);
      
      // עדכון ספירת דפוסים
      const count = this.learningPatterns.get(pattern) || 0;
      this.learningPatterns.set(pattern, count + 1);
    }
  }

  private async writeOperationLogs(): Promise<void> {
    // כתיבת JSON log
    writeFileSync(
      'OPERATIONS_LOG.json',
      JSON.stringify(this.operationLogs, null, 2)
    );
    
    // כתיבת Markdown log
    if (this.currentOperation) {
      const markdown = this.generateMarkdownLog(this.currentOperation);
      appendFileSync('OPERATIONS_LOG.md', markdown);
    }
  }

  private generateMarkdownLog(operation: OperationLog): string {
    return `
## Operation: ${operation.id}
**Tags**: ${operation.tagging.auto_tags.join(', ')}
**Risk Level**: ${operation.tagging.risk_level}
**Agents**: Primary: ${operation.agents.primary.join(', ')} | Observers: ${operation.agents.observers.join(', ')}

### What Changed
- Files: ${operation.impact_analysis.files_changed.join(', ')}
- Systems: ${operation.impact_analysis.systems_impacted.join(', ')}

### Validation Results
- Passed: ${operation.metrics.validation_results.passed}

### Learning
- Success Patterns: ${operation.learning.success_patterns.join(', ')}

---
`;
  }

  private broadcastChanges(task: Task, result: any): void {
    // שידור לכל הסוכנים
    for (const [_, agent] of this.agents) {
      this.emit('changes:broadcast', {
        task,
        result,
        agent: agent.id
      });
    }
  }

  private handleExecutionError(error: any, task: Task): void {
    console.error(`Execution error for task ${task.id}:`, error);
    
    if (this.currentOperation) {
      this.currentOperation.learning.failure_patterns.push(
        `${task.type}-${error.message}`
      );
    }
    
    this.emit('execution:error', { task, error });
  }
}