import { createInterface } from 'node:readline/promises';
import { runCli } from './commands/index.ts';

const code = await runCli(process.argv.slice(2), {
  select: async (message, choices, defaultChoice) => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return;

    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      console.log(message);
      choices.forEach((choice, index) =>
        console.log(
          `${index + 1}. ${choice}${choice === defaultChoice ? ' (default)' : ''}`
        )
      );
      const answer = (await prompt.question('Selection: ')).trim();

      return answer
        ? (choices[Number(answer) - 1] ??
            (choices.includes(answer) ? answer : undefined))
        : defaultChoice;
    } finally {
      prompt.close();
    }
  },
  confirm: async () => {
    if (!process.stdin.isTTY || !process.stdout.isTTY) return;

    const prompt = createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    try {
      return /^(?:y|yes)$/i.test(
        (await prompt.question('Apply these changes? [y/N] ')).trim()
      );
    } finally {
      prompt.close();
    }
  },
});

process.exitCode = code;
