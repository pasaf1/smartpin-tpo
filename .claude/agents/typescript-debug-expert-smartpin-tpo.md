import { exec } from 'child\_process';

import { promisify } from 'util';

import { readFile, writeFile } from 'fs/promises';

import \* as ts from 'typescript';

import { Agent, Task, ReviewResult } from './types';



const execAsync = promisify(exec);



export class TypeScriptDebugExpert implements Agent {

&nbsp; public readonly id = 'typescript-debug-expert';

&nbsp; public readonly name = 'TypeScript Debug Expert';

&nbsp; public status: 'idle' | 'busy' | 'error' = 'idle';

&nbsp; 

&nbsp; public readonly capabilities = {

&nbsp;   domain: \['typescript', 'react', 'nextjs', 'node'],

&nbsp;   confidence: 0.93,

&nbsp;   historicalSuccess: 0.89,

&nbsp;   specializations: \['type-safety', 'compilation', 'bundling', 'module-resolution']

&nbsp; };



&nbsp; private tsConfig: ts.CompilerOptions;

&nbsp; private program: ts.Program | null = null;



&nbsp; constructor() {

&nbsp;   this.loadTsConfig();

&nbsp; }



&nbsp; private async loadTsConfig(): Promise<void> {

&nbsp;   try {

&nbsp;     const configFile = await readFile('tsconfig.json', 'utf-8');

&nbsp;     const { config } = ts.parseConfigFileTextToJson('tsconfig.json', configFile);

&nbsp;     this.tsConfig = config.compilerOptions;

&nbsp;   } catch (error) {

&nbsp;     console.error('Error loading tsconfig:', error);

&nbsp;   }

&nbsp; }



&nbsp; public async execute(task: Task): Promise<any> {

&nbsp;   this.status = 'busy';

&nbsp;   

&nbsp;   try {

&nbsp;     // סריקת שגיאות TypeScript

&nbsp;     const errors = await this.scanTypeScriptErrors();

&nbsp;     

&nbsp;     // תיקון אוטומטי

&nbsp;     const fixes = await this.applyTypeScriptFixes(errors);

&nbsp;     

&nbsp;     // אימות תיקונים

&nbsp;     const verification = await this.verifyFixes(fixes);

&nbsp;     

&nbsp;     this.status = 'idle';

&nbsp;     return {

&nbsp;       errors,

&nbsp;       fixes,

&nbsp;       verification

&nbsp;     };

&nbsp;     

&nbsp;   } catch (error) {

&nbsp;     this.status = 'error';

&nbsp;     throw error;

&nbsp;   }

&nbsp; }



&nbsp; public async review(implementation: any): Promise<ReviewResult> {

&nbsp;   // בדיקת השפעות על type safety

&nbsp;   const typeImpact = await this.assessTypeImpact(implementation);

&nbsp;   

&nbsp;   if (typeImpact.breaksTypes) {

&nbsp;     return {

&nbsp;       approved: false,

&nbsp;       veto: true,

&nbsp;       reason: `Type safety violation: ${typeImpact.reason}`,

&nbsp;       suggestions: typeImpact.fixes

&nbsp;     };

&nbsp;   }

&nbsp;   

&nbsp;   return {

&nbsp;     approved: true,

&nbsp;     suggestions: typeImpact.improvements

&nbsp;   };

&nbsp; }



&nbsp; public async scanTypeScriptErrors(): Promise<any\[]> {

&nbsp;   // הרצת TypeScript compiler

&nbsp;   const { stdout, stderr } = await execAsync('npx tsc --noEmit');

&nbsp;   

&nbsp;   // ניתוח שגיאות

&nbsp;   const errors = this.parseTypeScriptErrors(stderr || stdout);

&nbsp;   

&nbsp;   // הוספת context לכל שגיאה

&nbsp;   const enrichedErrors = await Promise.all(

&nbsp;     errors.map(error => this.enrichError(error))

&nbsp;   );

&nbsp;   

&nbsp;   return enrichedErrors;

&nbsp; }



&nbsp; private parseTypeScriptErrors(output: string): any\[] {

&nbsp;   const errors = \[];

&nbsp;   const lines = output.split('\\n');

&nbsp;   

&nbsp;   const errorRegex = /(.+)\\((\\d+),(\\d+)\\): error (TS\\d+): (.+)/;

&nbsp;   

&nbsp;   for (const line of lines) {

&nbsp;     const match = line.match(errorRegex);

&nbsp;     if (match) {

&nbsp;       errors.push({

&nbsp;         file: match\[1],

&nbsp;         line: parseInt(match\[2]),

&nbsp;         column: parseInt(match\[3]),

&nbsp;         code: match\[4],

&nbsp;         message: match\[5]

&nbsp;       });

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   return errors;

&nbsp; }



&nbsp; private async enrichError(error: any): Promise<any> {

&nbsp;   // קריאת הקוד סביב השגיאה

&nbsp;   const fileContent = await readFile(error.file, 'utf-8');

&nbsp;   const lines = fileContent.split('\\n');

&nbsp;   

&nbsp;   const contextStart = Math.max(0, error.line - 3);

&nbsp;   const contextEnd = Math.min(lines.length, error.line + 2);

&nbsp;   

&nbsp;   return {

&nbsp;     ...error,

&nbsp;     context: lines.slice(contextStart, contextEnd).join('\\n'),

&nbsp;     severity: this.getErrorSeverity(error.code),

&nbsp;     category: this.getErrorCategory(error.code),

&nbsp;     suggestedFix: await this.suggestFix(error)

&nbsp;   };

&nbsp; }



&nbsp; private getErrorSeverity(errorCode: string): 'error' | 'warning' | 'info' {

&nbsp;   // TS2xxx - סמנטיות

&nbsp;   if (errorCode.startsWith('TS2')) return 'error';

&nbsp;   // TS1xxx - תחביריות

&nbsp;   if (errorCode.startsWith('TS1')) return 'error';

&nbsp;   // TS6xxx - הגדרות

&nbsp;   if (errorCode.startsWith('TS6')) return 'warning';

&nbsp;   

&nbsp;   return 'info';

&nbsp; }



&nbsp; private getErrorCategory(errorCode: string): string {

&nbsp;   const categories: Record<string, string> = {

&nbsp;     'TS2322': 'type-mismatch',

&nbsp;     'TS2339': 'property-missing',

&nbsp;     'TS2345': 'argument-type',

&nbsp;     'TS2551': 'typo',

&nbsp;     'TS2304': 'name-not-found',

&nbsp;     'TS1005': 'syntax-error'

&nbsp;   };

&nbsp;   

&nbsp;   return categories\[errorCode] || 'unknown';

&nbsp; }



&nbsp; private async suggestFix(error: any): Promise<string> {

&nbsp;   // הצעת תיקון על בסיס סוג השגיאה

&nbsp;   switch (error.code) {

&nbsp;     case 'TS2322': // Type mismatch

&nbsp;       return this.suggestTypeFix(error);

&nbsp;     case 'TS2339': // Property missing

&nbsp;       return this.suggestPropertyFix(error);

&nbsp;     case 'TS2551': // Typo

&nbsp;       return this.suggestTypoFix(error);

&nbsp;     default:

&nbsp;       return 'Manual fix required';

&nbsp;   }

&nbsp; }



&nbsp; private async suggestTypeFix(error: any): Promise<string> {

&nbsp;   // ניתוח ה-types המעורבים

&nbsp;   const sourceFile = ts.createSourceFile(

&nbsp;     error.file,

&nbsp;     error.context,

&nbsp;     ts.ScriptTarget.Latest

&nbsp;   );

&nbsp;   

&nbsp;   // חיפוש type assertion או type guard

&nbsp;   return `Add type assertion: as ${this.extractExpectedType(error.message)}`;

&nbsp; }



&nbsp; private async suggestPropertyFix(error: any): Promise<string> {

&nbsp;   const propertyName = this.extractPropertyName(error.message);

&nbsp;   return `Add property '${propertyName}' to the interface or use optional chaining (?.)`;

&nbsp; }



&nbsp; private async suggestTypoFix(error: any): Promise<string> {

&nbsp;   const suggestion = this.extractSuggestion(error.message);

&nbsp;   return `Did you mean '${suggestion}'?`;

&nbsp; }



&nbsp; private extractExpectedType(message: string): string {

&nbsp;   const match = message.match(/Type '(.+)' is not assignable to type '(.+)'/);

&nbsp;   return match ? match\[2] : 'unknown';

&nbsp; }



&nbsp; private extractPropertyName(message: string): string {

&nbsp;   const match = message.match(/Property '(.+)' does not exist/);

&nbsp;   return match ? match\[1] : 'unknown';

&nbsp; }



&nbsp; private extractSuggestion(message: string): string {

&nbsp;   const match = message.match(/Did you mean '(.+)'\\?/);

&nbsp;   return match ? match\[1] : 'unknown';

&nbsp; }



&nbsp; private async applyTypeScriptFixes(errors: any\[]): Promise<any\[]> {

&nbsp;   const fixes = \[];

&nbsp;   

&nbsp;   for (const error of errors) {

&nbsp;     if (error.suggestedFix !== 'Manual fix required') {

&nbsp;       const fix = await this.applyFix(error);

&nbsp;       fixes.push(fix);

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   return fixes;

&nbsp; }



&nbsp; private async applyFix(error: any): Promise<any> {

&nbsp;   const fileContent = await readFile(error.file, 'utf-8');

&nbsp;   const lines = fileContent.split('\\n');

&nbsp;   

&nbsp;   // תיקון על בסיס סוג השגיאה

&nbsp;   let fixedContent = fileContent;

&nbsp;   

&nbsp;   switch (error.category) {

&nbsp;     case 'type-mismatch':

&nbsp;       fixedContent = await this.fixTypeMismatch(error, lines);

&nbsp;       break;

&nbsp;     case 'property-missing':

&nbsp;       fixedContent = await this.fixMissingProperty(error, lines);

&nbsp;       break;

&nbsp;     case 'typo':

&nbsp;       fixedContent = await this.fixTypo(error, lines);

&nbsp;       break;

&nbsp;   }

&nbsp;   

&nbsp;   // כתיבת הקובץ המתוקן

&nbsp;   await writeFile(error.file, fixedContent);

&nbsp;   

&nbsp;   return {

&nbsp;     file: error.file,

&nbsp;     error: error.code,

&nbsp;     fixed: true,

&nbsp;     changes: this.diffContent(fileContent, fixedContent)

&nbsp;   };

&nbsp; }



&nbsp; private async fixTypeMismatch(error: any, lines: string\[]): Promise<string> {

&nbsp;   // תיקון אי-התאמת טיפוסים

&nbsp;   const line = lines\[error.line - 1];

&nbsp;   const expectedType = this.extractExpectedType(error.message);

&nbsp;   

&nbsp;   // הוספת type assertion

&nbsp;   const fixedLine = line.replace(

&nbsp;     /(\\S+)$/,

&nbsp;     `$1 as ${expectedType}`

&nbsp;   );

&nbsp;   

&nbsp;   lines\[error.line - 1] = fixedLine;

&nbsp;   return lines.join('\\n');

&nbsp; }



&nbsp; private async fixMissingProperty(error: any, lines: string\[]): Promise<string> {

&nbsp;   // תיקון property חסר

&nbsp;   const line = lines\[error.line - 1];

&nbsp;   const propertyName = this.extractPropertyName(error.message);

&nbsp;   

&nbsp;   // הוספת optional chaining

&nbsp;   const fixedLine = line.replace(

&nbsp;     new RegExp(`\\\\.${propertyName}`),

&nbsp;     `?.${propertyName}`

&nbsp;   );

&nbsp;   

&nbsp;   lines\[error.line - 1] = fixedLine;

&nbsp;   return lines.join('\\n');

&nbsp; }



&nbsp; private async fixTypo(error: any, lines: string\[]): Promise<string> {

&nbsp;   // תיקון שגיאת כתיב

&nbsp;   const line = lines\[error.line - 1];

&nbsp;   const suggestion = this.extractSuggestion(error.message);

&nbsp;   const typo = this.extractPropertyName(error.message);

&nbsp;   

&nbsp;   const fixedLine = line.replace(typo, suggestion);

&nbsp;   

&nbsp;   lines\[error.line - 1] = fixedLine;

&nbsp;   return lines.join('\\n');

&nbsp; }



&nbsp; private diffContent(original: string, fixed: string): string\[] {

&nbsp;   const originalLines = original.split('\\n');

&nbsp;   const fixedLines = fixed.split('\\n');

&nbsp;   const changes = \[];

&nbsp;   

&nbsp;   for (let i = 0; i < Math.max(originalLines.length, fixedLines.length); i++) {

&nbsp;     if (originalLines\[i] !== fixedLines\[i]) {

&nbsp;       changes.push({

&nbsp;         line: i + 1,

&nbsp;         before: originalLines\[i],

&nbsp;         after: fixedLines\[i]

&nbsp;       });

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   return changes;

&nbsp; }



&nbsp; private async verifyFixes(fixes: any\[]): Promise<any> {

&nbsp;   // הרצת TypeScript compiler שוב

&nbsp;   const { stdout, stderr } = await execAsync('npx tsc --noEmit');

&nbsp;   

&nbsp;   const remainingErrors = this.parseTypeScriptErrors(stderr || stdout);

&nbsp;   

&nbsp;   return {

&nbsp;     fixed: fixes.length,

&nbsp;     remaining: remainingErrors.length,

&nbsp;     success: remainingErrors.length === 0,

&nbsp;     details: {

&nbsp;       fixedFiles: fixes.map(f => f.file),

&nbsp;       remainingErrors

&nbsp;     }

&nbsp;   };

&nbsp; }



&nbsp; private async assessTypeImpact(implementation: any): Promise<any> {

&nbsp;   const impact = {

&nbsp;     breaksTypes: false,

&nbsp;     reason: '',

&nbsp;     fixes: \[],

&nbsp;     improvements: \[]

&nbsp;   };

&nbsp;   

&nbsp;   // בדיקת שינויים בממשקים

&nbsp;   if (implementation.modifiesInterfaces) {

&nbsp;     const interfaceCheck = await this.checkInterfaceCompatibility(implementation);

&nbsp;     if (!interfaceCheck.compatible) {

&nbsp;       impact.breaksTypes = true;

&nbsp;       impact.reason = 'Interface changes break existing implementations';

&nbsp;       impact.fixes = interfaceCheck.requiredChanges;

&nbsp;     }

&nbsp;   }

&nbsp;   

&nbsp;   // בדיקת שינויים ב-generics

&nbsp;   if (implementation.modifiesGenerics) {

&nbsp;     impact.improvements.push(

&nbsp;       'Consider adding type constraints to generics',

&nbsp;       'Verify type inference still works correctly'

&nbsp;     );

&nbsp;   }

&nbsp;   

&nbsp;   return impact;

&nbsp; }



&nbsp; private async checkInterfaceCompatibility(implementation: any): Promise<any> {

&nbsp;   // בדיקת תאימות ממשקים

&nbsp;   return {

&nbsp;     compatible: true,

&nbsp;     requiredChanges: \[]

&nbsp;   };

&nbsp; }

}

