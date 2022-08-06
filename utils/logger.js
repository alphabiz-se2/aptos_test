const LINE_LENGTH = 120;
const STATUS_LENGTH = 8;
const FUNC_LENGTH = 25;

const title = (...args) => {
  const x = args.join(" ");
  console.log(
    x
      .padStart(Math.floor((LINE_LENGTH + x.length) / 2), "-")
      .padEnd(LINE_LENGTH, "-")
  );
};

const line = (...args) => console.log(args.join("\t"));

const asyncFn = (fnName, status, ...args) => {
  const fnStr = `[${status.padStart(STATUS_LENGTH)}] ${fnName.padEnd(
    FUNC_LENGTH
  )}`.padStart(STATUS_LENGTH + FUNC_LENGTH + 3);
  console.log(fnStr, "\t", ...args);
};
const syncFn = (fnName, ...args) => {
  const fnStr = fnName
    .padEnd(FUNC_LENGTH)
    .padStart(STATUS_LENGTH + FUNC_LENGTH + 3);
  console.log(fnStr, "\t", ...args);
};

module.exports = {
  title,
  line,
  asyncFn,
  syncFn,
};
