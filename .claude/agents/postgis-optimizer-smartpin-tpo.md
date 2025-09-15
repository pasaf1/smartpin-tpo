// src/agents/postgis-optimizer.ts
import { Client } from 'pg';
import { Agent, Task, ReviewResult } from './types';

export class PostGISOptimizer implements Agent {
  public readonly id = 'postgis-optimizer';
  public readonly name = 'PostGIS Performance Optimizer';
  public status: 'idle' | 'busy' | 'error' = 'idle';
  
  public readonly capabilities = {
    domain: ['database', 'postgis', 'sql', 'performance'],
    confidence: 0.94,
    historicalSuccess: 0.91,
    specializations: ['spatial-queries', 'indexing', 'query-optimization']
  };

  private pgClient: Client;
  private performanceTargets = {
    maxQueryTime: 100, // ms
    maxIndexSize: 1024 * 1024 * 100, // 100MB
    minCacheHitRatio: 0.95
  };

  constructor(connectionString: string) {
    this.pgClient = new Client({ connectionString });
    this.pgClient.connect();
  }

  public async execute(task: Task): Promise<any> {
    this.status = 'busy';
    
    try {
      // ניתוח ביצועי queries
      const slowQueries = await this.identifySlowQueries();
      
      // יצירת אינדקסים חכמים
      const indexes = await this.createOptimalIndexes(slowQueries);
      
      // אופטימיזציית queries
      const optimizedQueries = await this.optimizeQueries(slowQueries);
      
      // אימות שיפורים
      const verification = await this.verifyOptimizations(indexes, optimizedQueries);
      
      this.status = 'idle';
      return {
        slowQueries,
        indexes,
        optimizedQueries,
        verification
      };
      
    } catch (error) {
      this.status = 'error';
      throw error;
    }
  }

  public async review(implementation: any): Promise<ReviewResult> {
    // בדיקת השפעות על ביצועי DB
    const dbImpact = await this.assessDatabaseImpact(implementation);
    
    if (dbImpact.degradesPerformance) {
      return {
        approved: false,
        veto: true,
        reason: `Database performance degradation: ${dbImpact.reason}`,
        suggestions: dbImpact.optimizations
      };
    }
    
    return {
      approved: true,
      suggestions: dbImpact.improvements
    };
  }

  private async identifySlowQueries(): Promise<any[]> {
    // שליפת queries איטיות מ-pg_stat_statements
    const query = `
      SELECT 
        query,
        calls,
        total_exec_time,
        mean_exec_time,
        stddev_exec_time,
        rows,
        100.0 * shared_blks_hit / 
          NULLIF(shared_blks_hit + shared_blks_read, 0) AS cache_hit_ratio
      FROM pg_stat_statements
      WHERE mean_exec_time > $1
      ORDER BY mean_exec_time DESC
      LIMIT 20
    `;
    
    const result = await this.pgClient.query(query, [this.performanceTargets.maxQueryTime]);
    
    // ניתוח כל query
    const slowQueries = await Promise.all(
      result.rows.map(row => this.analyzeQuery(row))
    );
    
    return slowQueries;
  }

  private async analyzeQuery(queryInfo: any): Promise<any> {
    // ניתוח EXPLAIN
    const explainResult = await this.getExplainAnalyze(queryInfo.query);
    
    // זיהוי בעיות
    const problems = this.identifyQueryProblems(explainResult);
    
    // הצעת אופטימיזציות
    const suggestions = this.suggestQueryOptimizations(queryInfo, problems);
    
    return {
      query: queryInfo.query,
      stats: {
        calls: queryInfo.calls,
        avgTime: queryInfo.mean_exec_time,
        cacheHitRatio: queryInfo.cache_hit_ratio
      },
      explain: explainResult,
      problems,
      suggestions
    };
  }

  private async getExplainAnalyze(query: string): Promise<any> {
    try {
      // הוספת EXPLAIN ANALYZE
      const explainQuery = `EXPLAIN (ANALYZE, BUFFERS, FORMAT JSON) ${query}`;
      const result = await this.pgClient.query(explainQuery);
      
      return result.rows[0]['QUERY PLAN'][0];
    } catch (error) {
      console.error('Error running EXPLAIN:', error);
      return null;
    }
  }

  private identifyQueryProblems(explain: any): string[] {
    const problems = [];
    
    if (!explain) return problems;
    
    // בדיקת Seq Scans
    if (this.hasSeqScan(explain)) {
      problems.push('Sequential scan detected - missing index');
    }
    
    // בדיקת Nested Loops גדולים
    if (this.hasExpensiveNestedLoop(explain)) {
      problems.push('Expensive nested loop - consider hash join');
    }
    
    // בדיקת sorts בזיכרון
    if (this.hasExternalSort(explain)) {
      problems.push('External sort detected - increase work_mem');
    }
    
    // בדיקת spatial operations לא מאונדקסות
    if (this.hasUnindexedSpatialOp(explain)) {
      problems.push('Unindexed spatial operation detected');
    }
    
    return problems;
  }

  private hasSeqScan(plan: any): boolean {
    if (plan['Node Type'] === 'Seq Scan') return true;
    if (plan.Plans) {
      return plan.Plans.some((p: any) => this.hasSeqScan(p));
    }
    return false;
  }

  private hasExpensiveNestedLoop(plan: any): boolean {
    if (plan['Node Type'] === 'Nested Loop' && plan['Total Cost'] > 10000) {
      return true;
    }
    if (plan.Plans) {
      return plan.Plans.some((p: any) => this.hasExpensiveNestedLoop(p));
    }
    return false;
  }

  private hasExternalSort(plan: any): boolean {
    if (plan['Node Type'] === 'Sort' && plan['Sort Method']?.includes('external')) {
      return true;
    }
    if (plan.Plans) {
      return plan.Plans.some((p: any) => this.hasExternalSort(p));
    }
    return false;
  }

  private hasUnindexedSpatialOp(plan: any): boolean {
    const spatialOps = ['ST_Distance', 'ST_Contains', 'ST_Intersects', 'ST_Within'];
    
    if (plan['Filter'] && spatialOps.some(op => plan['Filter'].includes(op))) {
      return plan['Node Type'] === 'Seq Scan';
    }
    
    if (plan.Plans) {
      return plan.Plans.some((p: any) => this.hasUnindexedSpatialOp(p));
    }
    return false;
  }

  private suggestQueryOptimizations(
    queryInfo: any,
    problems: string[]
  ): string[] {
    const suggestions = [];
    
    // הצעות על בסיס בעיות
    if (problems.includes('Sequential scan detected - missing index')) {
      suggestions.push('Create index on frequently queried columns');
    }
    
    if (problems.includes('Unindexed spatial operation detected')) {
      suggestions.push('Create GiST index for spatial columns');
      suggestions.push('Convert ST_Distance to ST_DWithin for index usage');
    }
    
    // הצעות על בסיס cache hit ratio
    if (queryInfo.cache_hit_ratio < this.performanceTargets.minCacheHitRatio) {
      suggestions.push('Increase shared_buffers');
      suggestions.push('Consider query result caching');
    }
    
    return suggestions;
  }

  private async createOptimalIndexes(slowQueries: any[]): Promise<any[]> {
    const indexes = [];
    
    for (const query of slowQueries) {
      if (query.problems.includes('Sequential scan detected - missing index')) {
        const index = await this.createIndex(query);
        if (index) indexes.push(index);
      }
      
      if (query.problems.includes('Unindexed spatial operation detected')) {
        const spatialIndex = await this.createSpatialIndex(query);
        if (spatialIndex) indexes.push(spatialIndex);
      }
    }
    
    return indexes;
  }

  private async createIndex(queryInfo: any): Promise<any> {
    // ניתוח query לזיהוי עמודות לאינדוקס
    const columns = this.extractIndexColumns(queryInfo.query);
    
    if (columns.length === 0) return null;
    
    const tableName = this.extractTableName(queryInfo.query);
    const indexName = `idx_${tableName}_${columns.join('_')}`;
    
    // יצירת אינדקס
    const createIndexSQL = `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
      ON ${tableName} (${columns.join(', ')})
    `;
    
    try {
      await this.pgClient.query(createIndexSQL);
      
      return {
        name: indexName,
        table: tableName,
        columns,
        type: 'btree',
        created: true
      };
    } catch (error) {
      console.error('Error creating index:', error);
      return null;
    }
  }

  private async createSpatialIndex(queryInfo: any): Promise<any> {
    const tableName = this.extractTableName(queryInfo.query);
    const geomColumn = this.extractGeometryColumn(queryInfo.query);
    
    if (!geomColumn) return null;
    
    const indexName = `idx_${tableName}_${geomColumn}_gist`;
    
    // יצירת GiST index
    const createIndexSQL = `
      CREATE INDEX CONCURRENTLY IF NOT EXISTS ${indexName}
      ON ${tableName} USING GIST (${geomColumn})
    `;
    
    try {
      await this.pgClient.query(createIndexSQL);
      
      return {
        name: indexName,
        table: tableName,
        column: geomColumn,
        type: 'gist',
        created: true
      };
    } catch (error) {
      console.error('Error creating spatial index:', error);
      return null;
    }
  }

  private extractIndexColumns(query: string): string[] {
    const columns = [];
    
    // חילוץ עמודות מ-WHERE clause
    const whereMatch = query.match(/WHERE\s+(.+?)(?:GROUP|ORDER|LIMIT|$)/i);
    if (whereMatch) {
      const whereClause = whereMatch[1];
      const columnMatches = whereClause.match(/(\w+)\s*=|(\w+)\s*IN|(\w+)\s*BETWEEN/gi);
      if (columnMatches) {
        columnMatches.forEach(match => {
          const column = match.replace(/\s*(=|IN|BETWEEN).*/i, '').trim();
          if (!columns.includes(column)) {
            columns.push(column);
          }
        });
      }
    }
    
    return columns;
  }

  private extractTableName(query: string): string {
    const match = query.match(/FROM\s+(\w+)/i);
    return match ? match[1] : 'unknown';
  }

  private extractGeometryColumn(query: string): string | null {
    const spatialFunctions = [
      'ST_Distance', 'ST_Contains', 'ST_Intersects', 
      'ST_Within', 'ST_DWithin', 'ST_Covers'
    ];
    
    for (const func of spatialFunctions) {
      const regex = new RegExp(`${func}\\s*\\(\\s*(\\w+)`, 'i');
      const match = query.match(regex);
      if (match) {
        return match[1];
      }
    }
    
    return null;
  }

  private async optimizeQueries(slowQueries: any[]): Promise<any[]> {
    const optimized = [];
    
    for (const query of slowQueries) {
      const optimizedQuery = await this.optimizeQuery(query);
      optimized.push(optimizedQuery);
    }
    
    return optimized;
  }

  private async optimizeQuery(queryInfo: any): Promise<any> {
    let optimizedSQL = queryInfo.query;
    const optimizations = [];
    
    // אופטימיזציית spatial queries
    if (optimizedSQL.includes('ST_Distance')) {
      const optimizedSpatial = this.optimizeSpatialDistance(optimizedSQL);
      if (optimizedSpatial !== optimizedSQL) {
        optimizedSQL = optimizedSpatial;
        optimizations.push('Converted ST_Distance to ST_DWithin');
      }
    }
    
    // אופטימיזציית JOINs
    if (this.hasInefficient

Join(queryInfo.explain)) {
      const optimizedJoin = this.optimizeJoins(optimizedSQL);
      if (optimizedJoin !== optimizedSQL) {
        optimizedSQL = optimizedJoin;
        optimizations.push('Optimized JOIN order');
      }
    }
    
    // הוספת hints
    if (queryInfo.problems.includes('Expensive nested loop')) {
      optimizedSQL = `/*+ HashJoin(t1 t2) */ ${optimizedSQL}`;
      optimizations.push('Added hash join hint');
    }
    
    return {
      original: queryInfo.query,
      optimized: optimizedSQL,
      optimizations,
      expectedImprovement: this.estimateImprovement(optimizations)
    };
  }

  private optimizeSpatialDistance(query: string): string {
    // המרת ST_Distance < X ל-ST_DWithin
    return query.replace(
      /ST_Distance\(([^,]+),([^)]+)\)\s*<\s*(\d+)/g,
      'ST_DWithin($1, $2, $3)'
    );
  }

  private hasInefficient Join(explain: any): boolean {
    // בדיקת JOIN לא יעיל
    return false; // Placeholder
  }

  private optimizeJoins(query: string): string {
    // אופטימיזציית סדר JOINs
    return query; // Placeholder
  }

  private estimateImprovement(optimizations: string[]): string {
    let improvement = 0;
    
    if (optimizations.includes('Converted ST_Distance to ST_DWithin')) {
      improvement += 50;
    }
    if (optimizations.includes('Optimized JOIN order')) {
      improvement += 30;
    }
    if (optimizations.includes('Added hash join hint')) {
      improvement += 20;
    }
    
    return `${improvement}% expected improvement`;
  }

  private async verifyOptimizations(
    indexes: any[],
    optimizedQueries: any[]
  ): Promise<any> {
    // בדיקת שימוש באינדקסים
    const indexUsage = await this.verifyIndexUsage(indexes);
    
    // בדיקת שיפור בביצועים
    const performanceImprovement = await this.measurePerformanceImprovement(
      optimizedQueries
    );
    
    return {
      indexesCreated: indexes.length,
      indexUsage,
      queriesOptimized: optimizedQueries.length,
      performanceImprovement,
      meetsTargets: this.checkPerformanceTargets(performanceImprovement)
    };
  }

  private async verifyIndexUsage(indexes: any[]): Promise<any> {
    const usage = {};
    
    for (const index of indexes) {
      const query = `
        SELECT 
          schemaname,
          tablename,
          indexname,
          idx_scan,
          idx_tup_read,
          idx_tup_fetch
        FROM pg_stat_user_indexes
        WHERE indexname = $1
      `;
      
      const result = await this.pgClient.query(query, [index.name]);
      
      if (result.rows.length > 0) {
        usage[index.name] = {
          scans: result.rows[0].idx_scan,
          tuplesRead: result.rows[0].idx_tup_read,
          tuplesFetched: result.rows[0].idx_tup_fetch,
          isUsed: result.rows[0].idx_scan > 0
        };
      }
    }
    
    return usage;
  }

  private async measurePerformanceImprovement(
    optimizedQueries: any[]
  ): Promise<any> {
    const improvements = [];
    
    for (const query of optimizedQueries) {
      // מדידת ביצועים לפני ואחרי
      const beforeExplain = await this.getExplainAnalyze(query.original);
      const afterExplain = await this.getExplainAnalyze(query.optimized);
      
      if (beforeExplain && afterExplain) {
        const improvement = {
          query: query.original.substring(0, 50) + '...',
          before: {
            totalCost: beforeExplain['Total Cost'],
            executionTime: beforeExplain['Execution Time']
          },
          after: {
            totalCost: afterExplain['Total Cost'],
            executionTime: afterExplain['Execution Time']
          },
          improvement: {
            cost: `${((beforeExplain['Total Cost'] - afterExplain['Total Cost']) / beforeExplain['Total Cost'] * 100).toFixed(1)}%`,
            time: `${((beforeExplain['Execution Time'] - afterExplain['Execution Time']) / beforeExplain['Execution Time'] * 100).toFixed(1)}%`
          }
        };
        
        improvements.push(improvement);
      }
    }
    
    return improvements;
  }

  private checkPerformanceTargets(improvements: any[]): boolean {
    // בדיקה שכל ה-queries עומדים ביעדי הביצועים
    return improvements.every(imp => 
      imp.after.executionTime < this.performanceTargets.maxQueryTime
    );
  }

  private async assessDatabaseImpact(implementation: any): Promise<any> {
    const impact = {
      degradesPerformance: false,
      reason: '',
      optimizations: [],
      improvements: []
    };
    
    // בדיקת הוספת נתונים גדולים
    if (implementation.addsLargeDataset) {
      impact.improvements.push(
        'Consider partitioning for large tables',
        'Update table statistics after bulk insert'
      );
    }
    
    // בדיקת שינויים בסכמה
    if (implementation.modifiesSchema) {
      const schemaImpact = await this.assessSchemaChangeImpact(implementation);
      if (schemaImpact.requiresReindex) {
        impact.optimizations.push('Rebuild indexes after schema change');
      }
    }
    
    return impact;
  }

  private async assessSchemaChangeImpact(implementation: any): Promise<any> {
    return {
      requiresReindex: false,
      affectedQueries: []
    };
  }
}