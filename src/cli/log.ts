function color(c: number, ...msg: any[]) {
  return msg.map(
    m => '\x1b[' + c + 'm' + m + '\x1b[0m'
  );
}

function error(...msg : any[]) {
  console.error(color(31, ...msg));
}

function info(...msg : any[]) {
  console.log(...msg);
}

function ok(...msg : any[]) {
  console.log(color(32, ...msg));
}

export default {
  info, ok, error
};