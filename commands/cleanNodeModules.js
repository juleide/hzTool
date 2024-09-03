import { promises as fs } from 'fs';
import path from 'path';

const MAX_CONCURRENT_OPERATIONS = 10;
let activeOperations = 0;
let pendingOperations = 0;
const queue = [];

async function processQueue() {
    while (queue.length > 0 && activeOperations < MAX_CONCURRENT_OPERATIONS) {
        const dir = queue.shift();
        activeOperations++;
        pendingOperations++;
        deleteNodeModules(dir).finally(() => {
            activeOperations--;
            pendingOperations--;
            processQueue();
            if (pendingOperations === 0 && queue.length === 0) {
                console.log('所有 node_modules 文件夹已成功删除。');
            }
        });
    }
}

function enqueue(dir) {
    queue.push(dir);
    processQueue();
}

async function deleteNodeModules(dir) {
    let files;
    try {
        files = await fs.readdir(dir);
    } catch (err) {
        console.error(`读取文件夹失败: ${dir}`, err);
        return;
    }

    for (const file of files) {
        const fullPath = path.join(dir, file);

        let stats;
        try {
            stats = await fs.stat(fullPath);
        } catch (err) {
            console.error(`读取文件属性失败: ${fullPath}`, err);
            continue;
        }

        if (stats.isDirectory()) {
            if (file === 'node_modules') {
                try {
                    await fs.rm(fullPath, { recursive: true, force: true });
                    console.log(`已删除: ${fullPath}`);
                } catch (err) {
                    console.error(`删除文件夹失败: ${fullPath}`, err);
                }
            } else {
                enqueue(fullPath);
            }
        }
    }
}

export default function cleanNodeModules () {
    const rootDir = process.cwd();
    enqueue(rootDir);
};