import chalk from 'chalk';

export function hello(name?: string, options?: { enthusiastic?: boolean }): void {
  const greeting = name ? `Hello, ${name}!` : 'Hello, world!';
  const message = options?.enthusiastic ? greeting + '!!!' : greeting;
  
  console.log(chalk.green(message));
}
