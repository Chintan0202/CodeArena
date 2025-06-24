import { Injectable } from '@angular/core';
import { ProblemMetadata } from '../Models/types';

@Injectable({
  providedIn: 'root',
})
export class CodeGenerationService {
  constructor() {}
  generate(languageId: number, metadata: ProblemMetadata): string {
    if (
      !metadata ||
      !metadata.functionName ||
      !metadata.inputs ||
      !metadata.output
    ) {
      console.error(
        'Invalid problem metadata provided: Missing functionName, inputs, or output.'
      );
      return '// Error: Invalid problem metadata. Please ensure functionName, inputs, and output are defined.';
    }

    switch (languageId) {
      case 54:
        return this.generateCpp(metadata); // C++
      case 50:
        return this.generateC(metadata); // C
      case 62:
        return this.generateJava(metadata); // Java
      case 71:
        return this.generatePython(metadata); // Python
      case 63:
        return this.generateJavaScript(metadata); // JavaScript
      case 51:
        return this.generateCSharp(metadata); // C#
      default:
        return '// Language not supported. Please choose from the available languages.';
    }
  }

  /**
   * Generates C++ boilerplate code.
   */
  private generateCpp(meta: ProblemMetadata): string {
    const params = meta.inputs
      .map((i) => `${this.mapCppType(i.type)} ${i.name}`)
      .join(', ');

    const inputsRead = meta.inputs
      .map((i) => {
        if (i.type === 'string') {
          return (
            `    // For single-word string input, use cin >> ${i.name};\n` +
            `    // For multi-word string input:\n` +
            `    // getline(cin >> ws, ${i.name});`
          );
        } else if (i.type === 'array<number>') {
          return (
            `    string line_${i.name};\n` +
            `    getline(cin, line_${i.name});\n` +
            `    istringstream iss_${i.name}(line_${i.name});\n` +
            `    int val;\n` +
            `    while (iss_${i.name} >> val) ${i.name}.push_back(val);`
          );
        } else {
          return `    cin >> ${i.name};`;
        }
      })
      .join('\n');

    const args = meta.inputs.map((i) => i.name).join(', ');

    return `
  #include <iostream>
  #include <vector>
  #include <string>
  #include <sstream>
  using namespace std;
  
  class Solution {
  public:
      ${this.mapCppType(meta.output.type)} ${meta.functionName}(${params}) {
          // Write your code here
          return ${this.getDefaultCppValue(meta.output.type)};
      }
  };
  
  int main() {
      ios_base::sync_with_stdio(false);
      cin.tie(NULL);
  
  ${meta.inputs
    .map((i) => `    ${this.mapCppType(i.type)} ${i.name};`)
    .join('\n')}
  ${inputsRead}
  
      Solution sol;
      auto result = sol.${meta.functionName}(${args});
  
      // Print result
      ${
        meta.output.type === 'array<number>'
          ? `
      cout << "[";
      for (int i = 0; i < result.size(); ++i) {
          cout << result[i];
          if (i != result.size() - 1) cout << ", ";
      }
      cout << "]";`
          : 'cout << result;'
      }
  
      cout << endl;
      return 0;
  }`.trim();
  }

  /**
   * Generates C boilerplate code.
   */
  private generateC(meta: ProblemMetadata): string {
    const inputsDeclaration = meta.inputs
      .map((i) => {
        if (i.type === 'string') {
          return `char ${i.name}[100];`;
        }
        return `    ${this.mapCType(i.type)} ${i.name};`;
      })
      .join('\n');

    const scans = meta.inputs
      .map((i) => {
        const formatSpecifier = this.getCFormat(i.type);
        if (i.type === 'string') {
          return `    scanf("${formatSpecifier}", ${i.name});`;
        }
        return `    scanf("${formatSpecifier}", &${i.name});`;
      })
      .join('\n');

    const args = meta.inputs.map((i) => i.name).join(', ');
    const outputFormat = this.getCFormat(meta.output.type);

    return `
#include <stdio.h>
#include <stdlib.h> 
#include <string.h> 

${this.mapCType(meta.output.type)} ${meta.functionName}(${meta.inputs
      .map((i) => `${this.mapCType(i.type)} ${i.name}`)
      .join(', ')}) {
    // Write your code here
}

int main() {
${inputsDeclaration}
${scans}
    
    printf("${outputFormat}\\n", ${meta.functionName}(${args})); 
    
    return 0;
}`.trim();
  }

  /**
   * Generates Java boilerplate code.
   */
  generateJava(meta: ProblemMetadata): string {
    const params = meta.inputs
      .map((i) => `${this.mapJavaType(i.type)} ${i.name}`)
      .join(', ');
    const args = meta.inputs.map((i) => i.name).join(', ');
    const returnType = this.mapJavaType(meta.output.type);
    const defaultReturn = this.getDefaultJavaValue(meta.output.type);

    const parseCode = meta.inputs
      .map((input, index) => {
        const name = input.name;
        const type = input.type.toLowerCase();

        if (type === 'number[]') {
          return `
          String line${index} = scanner.nextLine().replaceAll("[\\[\\]\\s]", "");
          String[] parts${index} = line${index}.split(",");
          int[] ${name} = new int[parts${index}.length];
          for (int i = 0; i < parts${index}.length; i++) {
              ${name}[i] = Integer.parseInt(parts${index}[i]);
          }`.trim();
        }

        if (type === 'string[]') {
          return `
          String line${index} = scanner.nextLine().replaceAll("[\\[\\]\\s]", "");
          ${this.mapJavaType(
            input.type
          )} ${name} = line${index}.split(",");`.trim();
        }

        if (type === 'string') {
          return `String ${name} = scanner.nextLine();`;
        }

        if (type === 'number') {
          return `int ${name} = Integer.parseInt(scanner.nextLine().trim());`;
        }

        if (type === 'boolean') {
          return `boolean ${name} = Boolean.parseBoolean(scanner.nextLine().trim());`;
        }

        return `/* Unknown type for ${name} */`;
      })
      .join('\n\n');

    return `
  import java.util.Scanner;
  import java.util.Arrays;
  
  class Solution {
      public ${returnType} ${meta.functionName}(${params}) {
          // Write your code here
          return ${defaultReturn};
      }
  }
  
  class Main {
      public static void main(String[] args) {
          Scanner scanner = new Scanner(System.in);
  
  ${parseCode}
  
          scanner.close();
  
          Solution sol = new Solution();
          ${returnType} result = sol.${meta.functionName}(${args});
          ${
            meta.output.type.toLowerCase().includes('[]')
              ? 'System.out.println(Arrays.toString(result));'
              : 'System.out.println(result);'
          }
      }
  }`.trim();
  }

  /**
   * Generates Python boilerplate code.
   */
  private generatePython(meta: ProblemMetadata): string {
    const functionSignature = meta.inputs.map((i) => i.name).join(', ');
    const readInputs = meta.inputs
      .map((i) => {
        let readCode = `# Read input for ${i.name} (${i.type})`;
        readCode += `\n    ${i.name}_raw = input()`;
        switch (i.type.toLowerCase()) {
          case 'number':
            readCode += `\n    ${i.name} = int(${i.name}_raw)`;
            break;
          case 'boolean':
            readCode += `\n    ${i.name} = ${i.name}_raw.lower() == 'true'`;
            break;
          case 'string':
          default:
            readCode += `\n    ${i.name} = ${i.name}_raw`;
            break;
        }
        return readCode;
      })
      .join('\n');
    const functionCallArgs = meta.inputs.map((i) => i.name).join(', ');

    return `
def ${meta.functionName}(${functionSignature}):
    # Write your code here
    pass

if __name__ == '__main__':
${readInputs}

    result = ${meta.functionName}(${functionCallArgs})
    print(result)`.trim();
  }

  /**
   * Generates JavaScript boilerplate code.
   */
  private generateJavaScript(meta: ProblemMetadata): string {
    const params = meta.inputs.map((i) => i.name).join(', ');
    const reads = meta.inputs
      .map((i) => {
        let declaration = `// For input ${i.name} (${i.type}):`;
        declaration += `\nlet ${i.name}_raw = prompt("Enter ${i.name}:");`;
        switch (i.type.toLowerCase()) {
          case 'number':
            declaration += `\nconst ${i.name} = parseInt(${i.name}_raw);`;
            declaration += `\nif (isNaN(${i.name})) { console.error("Invalid number input for ${i.name}."); }`;
            break;
          case 'boolean':
            declaration += `\nconst ${i.name} = ${i.name}_raw.toLowerCase() === 'true';`;
            break;
          case 'string':
          default:
            declaration += `\nconst ${i.name} = ${i.name}_raw;`;
            break;
        }
        return declaration;
      })
      .join('\n\n');

    const functionCallArgs = meta.inputs.map((i) => i.name).join(', ');

    return `
const readline = require('readline');
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

function readLineAsync(prompt) {
    return new Promise(resolve => {
        rl.question(prompt, input => {
            resolve(input);
        });
    });
}

async function main() {
    // Example: let num1_raw = await readLineAsync("Enter num1: ");
    //          const num1 = parseInt(num1_raw);
    // Call your function here
    // console.log(yourFunction(num1));
    rl.close();
}
main();

function ${meta.functionName}(${params}) {
    // Write your code here
}

${reads}

console.log(${meta.functionName}(${functionCallArgs}));`.trim();
  }

  /**
   * Generates C# boilerplate code.
   */
  private generateCSharp(meta: ProblemMetadata): string {
    const args = meta.inputs.map((i) => i.name).join(', ');
    const reads = meta.inputs
      .map((i) => {
        const csharpType = this.mapCSharpType(i.type);
        let readCode = `        Console.Write("Enter ${i.name} (${csharpType}): ");`;
        readCode += `\n        string ${i.name}_raw = Console.ReadLine();`;
        switch (i.type.toLowerCase()) {
          case 'number':
            readCode += `\n        ${csharpType} ${i.name};`;
            readCode += `\n        if (!int.TryParse(${i.name}_raw, out ${i.name})) { Console.WriteLine("Invalid number input for ${i.name}. Using default value."); }`;
            break;
          case 'boolean':
            readCode += `\n        ${csharpType} ${i.name};`;
            readCode += `\n        if (!bool.TryParse(${i.name}_raw, out ${i.name})) { Console.WriteLine("Invalid boolean input for ${i.name}. Using default value."); }`;
            break;
          case 'string':
          default:
            readCode += `\n        ${csharpType} ${i.name} = ${i.name}_raw;`;
            break;
        }
        return readCode;
      })
      .join('\n');

    return `
using System;

class Solution {
    public static ${this.mapCSharpType(meta.output.type)} ${
      meta.functionName
    }(${meta.inputs
      .map((i) => `${this.mapCSharpType(i.type)} ${i.name}`)
      .join(', ')}) {
        // Write your code here
    }

    public static void Main() {
${reads}
        Console.WriteLine(${meta.functionName}(${args}));
    }
}`.trim();
  }

  /**
   * Maps a generic type string to a C++ specific type.
   */
  private mapCppType(type: string): string {
    const normalized = type.toLowerCase().replace(/\s/g, '');

    if (normalized === 'string') return 'string';
    if (normalized === 'boolean') return 'bool';
    if (normalized === 'number') return 'int';

    // Handle array types
    if (normalized === 'number[]' || normalized === 'array<number>')
      return 'vector<int>';
    if (normalized === 'string[]' || normalized === 'array<string>')
      return 'vector<string>';
    if (normalized === 'boolean[]' || normalized === 'array<boolean>')
      return 'vector<bool>';

    return 'auto'; // fallback (should not be used if types are defined properly)
  }

  /**
   * Maps a generic type string to a C specific type.
   */
  private mapCType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return 'char*';
      case 'boolean':
        return 'int';
      case 'number':
        return 'int';
      default:
        return 'void*';
    }
  }

  /**
   * Provides the format specifier for printf/scanf in C.
   */
  private getCFormat(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return '%s';
      case 'boolean':
      case 'number':
        return '%d';
      default:
        return '%s';
    }
  }

  /**
   * Maps a generic type string to a Java specific type.
   */
  private mapJavaType(type: string): string {
    const t = type.toLowerCase();
    if (t === 'string') return 'String';
    if (t === 'boolean') return 'boolean';
    if (t === 'number') return 'int';
    if (t === 'string[]') return 'String[]';
    if (t === 'number[]') return 'int[]';
    if (t === 'boolean[]') return 'boolean[]';
    return 'Object'; // Fallback
  }

  /**
   * Provides the Scanner method for reading input in Java.
   */
  private getJavaScanMethod(type: string, variableName: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return 'nextLine()';
      case 'boolean':
        return 'nextBoolean()';
      case 'number':
        return 'nextInt()';
      case 'string[]':
        // Reads a line, removes brackets, splits by comma, trims, converts to array
        return `
    String[] ${variableName}Str = scanner.nextLine().replace("[", "").replace("]", "").split(",");
    String[] ${variableName} = new String[${variableName}Str.length];
    for (int i = 0; i < ${variableName}Str.length; i++) {
        ${variableName}[i] = ${variableName}Str[i].trim();
    }
            `.trim();
      case 'number[]':
        // Reads a line, removes brackets, splits by comma, parses to int
        return `
    String[] ${variableName}Str = scanner.nextLine().replace("[", "").replace("]", "").split(",");
    int[] ${variableName} = new int[${variableName}Str.length];
    for (int i = 0; i < ${variableName}Str.length; i++) {
        ${variableName}[i] = Integer.parseInt(${variableName}Str[i].trim());
    }
            `.trim();
      case 'boolean[]':
        // Reads a line, removes brackets, splits by comma, parses to boolean
        return `
    String[] ${variableName}Str = scanner.nextLine().replace("[", "").replace("]", "").split(",");
    boolean[] ${variableName} = new boolean[${variableName}Str.length];
    for (int i = 0; i < ${variableName}Str.length; i++) {
        ${variableName}[i] = Boolean.parseBoolean(${variableName}Str[i].trim());
    }
            `.trim();
      default:
        return 'next()'; // Fallback for unknown types
    }
  }
  // Helper to provide a default return value for the function to compile
  private getDefaultJavaValue(type: string): string {
    const t = type.toLowerCase();
    if (t === 'string') return '""';
    if (t === 'number') return '0';
    if (t === 'boolean') return 'false';
    if (t === 'string[]') return 'new String[0]';
    if (t === 'number[]') return 'new int[0]';
    if (t === 'boolean[]') return 'new boolean[0]';
    return 'null';
  }

  private formatJavaOutput(varName: string, type: string): string {
    if (type === 'number[]' || type === 'int[]') {
      return `Arrays.toString(${varName})`;
    }
    return varName;
  }

  private getDefaultCppValue(type: string): string {
    const normalized = type.toLowerCase().replace(/\s/g, '');

    if (normalized === 'string') return '""';
    if (normalized === 'number') return '0';
    if (normalized === 'boolean') return 'false';

    // Default for arrays
    if (
      normalized === 'number[]' ||
      normalized === 'array<number>' ||
      normalized === 'string[]' ||
      normalized === 'array<string>' ||
      normalized === 'boolean[]' ||
      normalized === 'array<boolean>'
    ) {
      return '{}';
    }

    return '{}'; // fallback
  }

  /**
   * Maps a generic type string to a C# specific type.
   */
  private mapCSharpType(type: string): string {
    switch (type.toLowerCase()) {
      case 'string':
        return 'string';
      case 'boolean':
        return 'bool';
      case 'number':
        return 'int';
      default:
        return 'object';
    }
  }

  private formatInputValue(type: string, value: any): string {
    switch (type.toLowerCase()) {
      case 'string':
      case 'number':
      case 'boolean':
        return value.toString();
      case 'string[]':
        return `[${value.map((v: string) => `"${v}"`).join(',')}]`;
      case 'number[]':
      case 'boolean[]':
        return `[${value.join(',')}]`;
      default:
        return value.toString(); // fallback
    }
  }

  public generateStdin(meta: ProblemMetadata, testCaseInput: any[]): string {
    const lines: string[] = [];

    for (let i = 0; i < meta.inputs.length; i++) {
      const type = meta.inputs[i].type;
      const val = testCaseInput[i];
      lines.push(this.formatInputValue(type, val));
    }

    return lines.join('\n');
  }

  generateJudge0PayloadBase64(
    sourceCode: string,
    languageId: number,
    testCases: { input: any[]; expectedOutput: any }[],
    meta: ProblemMetadata
  ) {
    return testCases.map((testCase) => ({
      source_code: btoa(sourceCode),
      language_id: languageId,
      stdin: btoa(this.generateStdin(meta, testCase.input)),
    }));
  }
}
