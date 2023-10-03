import chalk from 'chalk';

function error(...msg : string[]) {
  console.error(chalk.red(...msg));
}

function info(...msg : string[]) {
  console.log(...msg);
}

function ok(...msg : string[]) {
  console.log(chalk.green(...msg));
}

export default {
  info, ok, error
};