function error(...msg : any[]) {
  console.error('\x1b[31m', ...msg, '\x1b[0m');
}

function info(...msg : any[]) {
  console.log('\x1b[32m',...msg, '\x1b[0m');
}

function warn(...msg : any[]) {
  console.log('\x1b[33m',...msg, '\x1b[0m');
}

function ok(...msg : any[]) {
  console.log(...msg);
}

export default {
  info, ok, error, warn
};