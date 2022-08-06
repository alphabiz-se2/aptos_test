const logger = require("./logger");
const moment = require("moment");
function ParallelQueue(num) {
  let started = true;
  const bundle_size = num;
  const queue = [];
  const callbacks = {
    bundle_done: null,
  };
  const loop = async () => {
    while (true) {
      if (!started) return;
      if (queue.length <= 0) {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      } else {
        const createPromise = (task) =>
          new Promise((resolve) => {
            const res = task();
            if (res && res.then) {
              res.then(resolve);
            } else {
              resolve(res);
            }
          });
        const tasks = queue.splice(0, Math.min(bundle_size, queue.length));
        if (callbacks.bundle_start) {
          const res = callbacks.bundle_start(tasks.length);
          if (res && res.then) await res;
        }
        await Promise.all(tasks.map(createPromise));
        if (callbacks.bundle_end) {
          const res = callbacks.bundle_end(tasks.length);
          if (res && res.then) await res;
        }
      }
    }
  };
  const stop = () => (started = false);
  const execute = (asyncFnOrPromise) => {
    if (asyncFnOrPromise.then) {
      return new Promise((resolve, reject) => {
        queue.push(() => asyncFnOrPromise.then(resolve, reject));
      });
    } else {
      return new Promise((resolve, reject) => {
        queue.push(() => asyncFnOrPromise().then(resolve, reject));
      });
    }
  };
  loop();
  return {
    stop,
    execute,
    setCallback: (name, cb) => (callbacks[name] = cb),
  };
}

async function parallelRequests(
  request_handler,
  { request_num, parallel_num, name }
) {
  const parallelExecutor = ParallelQueue(parallel_num);
  useBundleLog(parallelExecutor);
  const createPromise = (i) => {
    return parallelExecutor.execute(() => request_handler(i));
  };
  const arr = Array.from({ length: request_num }, (_, i) => i);
  await Promise.all(arr.map(createPromise));
  parallelExecutor.stop();

  function useBundleLog(parallelExecutor) {
    let done = 0;
    const sum = request_num;
    const startTime = new Date();
    let bundleStartTime;
    name = name || "parallel_requests";

    parallelExecutor.setCallback("bundle_start", (delta) => {
      bundleStartTime = new Date();
      logger.asyncFn(
        `${name}`,
        "start",
        ...[
          `${Math.round(((done + delta) / sum) * 10000) / 100 + "%"}`.padStart(
            6
          ),
          ` [${done + delta} / ${sum}]`,
        ]
      );
    });
    parallelExecutor.setCallback("bundle_end", async (delta) => {
      const time = new Date();
      done += delta;
      const used = time.getTime() - startTime.getTime();
      const used_bundle = time.getTime() - bundleStartTime.getTime();
      const estimated = (used / done) * (sum - done);
      const formatTime = (x) => moment.utc(x).format("HH:mm:ss:SSS");
      logger.asyncFn(
        `${name}`,
        "end",
        ...[
          `${Math.round((done / sum) * 10000) / 100 + "%"}`.padStart(6),
          ` [${done} / ${sum}]`,
        ],
        ...["Total duration:", formatTime(used), "\t"],
        ...["Bundle duration:", formatTime(used_bundle), "\t"],
        ...["Estimated:", formatTime(estimated)]
      );
      // await new Promise((resolve) => setTimeout(resolve, 100));
    });
  }
}

exports.ParallelQueue = ParallelQueue;
exports.parallelRequests = parallelRequests;
