import chalk from 'chalk';

function error(...msg : any[]) {
  console.error(chalk.red(...msg));
}

function info(...msg : any[]) {
  console.log(...msg);
}

function ok(...msg : any[]) {
  console.log(chalk.green(...msg));
}

export default {
  info, ok, error
};