import { ProblemDetails } from '../Models/types';

export const Questions: ProblemDetails[] = [
  {
    id: 1,
    problemTitle: 'Two Sum',
    problemDescription: `
          Given a list of integers and a target number, return the <strong>indices</strong> 
          of the two numbers that add up to the target.<br/><br/>
          You may assume that each input would have <strong>exactly one solution</strong>, 
          and you <strong>may not use the same element twice</strong>.
        `,
    problemExample: `
  Input:
      numbers = [2, 7, 11, 15]
      target = 9
  
  Output:
      [0, 1]
        `,
    functionName: 'twoSum',
    inputs: [
      { type: 'number[]', name: 'numbers' },
      { type: 'number', name: 'target' },
    ],
    output: { type: 'number[]', name: 'indices' },
    testCases: [
      {
        input: [[2, 7, 11, 15], 9],
        expectedOutput: [0,1],
      },
      {
        input: [[3, 2, 4], 6],
        expectedOutput: [1,2],
      },
      {
        input: [[3, 3], 6],
        expectedOutput: [0,1],
      },
    ],
  },
  {
    id: 2,
    problemTitle: 'Simple Calculation',
    problemDescription: `
          Implement a function that either sums two numbers or multiplies them 
          based on a boolean flag.
        `,
    problemExample: `
  Input:
      a = 5
      b = 3
      shouldMultiply = true
  
  Output:
      15
        `,
    functionName: 'sumAndMultiply',
    inputs: [
      { type: 'number', name: 'a' },
      { type: 'number', name: 'b' },
      { type: 'boolean', name: 'shouldMultiply' },
    ],
    output: { type: 'number', name: 'calculatedValue' },
    testCases: [
      {
        input: [5, 3, true],
        expectedOutput: 15,
      },
      {
        input: [5, 3, false],
        expectedOutput: 8,
      },
      {
        input: [0, 10, true],
        expectedOutput: 0,
      },
    ],
  },
];
