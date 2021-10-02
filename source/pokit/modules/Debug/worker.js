let q = [];
self.addEventListener('message', (e) => {
    q.push(e.data);
});
let log = () => {
    let msg = q.pop();
    if (msg) {
        console.log(`[${msg.level.toString()}]`, ...msg.content, `${msg.url}:${msg.line}:${msg.column}`);
    }
    setTimeout(log, 0);
};
setTimeout(log, 0);
