function error(...msg : any[]) {
  console.error(...msg);
}

function info(...msg : any[]) {
  console.log(...msg);
}

function ok(...msg : any[]) {
  console.log(...msg);
}

export default {
  info, ok, error
};