"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.list = exports.remove = exports.update = exports.select = exports.insert = void 0;
const AWS = __importStar(require("aws-sdk"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const path = __importStar(require("path"));
const client_1 = require("@redis/client");
const better_sqlite3_1 = __importDefault(require("better-sqlite3"));
const s3 = process.env.IS_OFFLINE
    ? new AWS.S3({
        s3ForcePathStyle: true,
        accessKeyId: "S3RVER",
        secretAccessKey: "S3RVER",
        endpoint: "http://localhost:4569",
    })
    : new AWS.S3();
const s3BucketName = process.env.BUCKET_NAME;
const dbS3ObjectKey = "simple-blog.db";
const localDbFile = path.join(os.tmpdir(), dbS3ObjectKey);
async function insert(post) {
    try {
        await doWrite((db) => db
            .prepare(`INSERT INTO post (title, content, created, modified) VALUES (@title, @content, @created, NULL)`)
            .run(post));
    }
    catch (error) {
        if (/UNIQUE constraint failed: post.title/.test(error.message)) {
            return false;
        }
        throw error;
    }
    return true;
}
exports.insert = insert;
async function select(title) {
    var _a;
    const row = await doRead((db) => db.prepare(`SELECT * FROM post WHERE title = @title`).get({ title }));
    return (_a = row) !== null && _a !== void 0 ? _a : null;
}
exports.select = select;
async function update(oldTitle, post) {
    const result = await doWrite((db) => db
        .prepare(`UPDATE post SET title = @title, content = @content, modified = @modified WHERE title = @oldTitle`)
        .run({ ...post, oldTitle }));
    return result.changes === 1;
}
exports.update = update;
async function remove(title) {
    await doWrite((db) => db.prepare(`DELETE FROM post WHERE title = @title`).run({ title }));
}
exports.remove = remove;
async function list() {
    var _a;
    const rows = await doRead((db) => db.prepare(`SELECT title, created FROM post ORDER BY created DESC`).all());
    return (_a = rows) !== null && _a !== void 0 ? _a : [];
}
exports.list = list;
async function s3Exists(bucketName, key) {
    try {
        await s3
            .headObject({
            Bucket: bucketName,
            Key: key,
        })
            .promise();
        return true;
    }
    catch (error) {
        console.info("error.code", error.code);
        if (error.code === "Forbidden" || error.code === "NotFound" || error.code === "Not Found") {
            return false;
        }
        throw error;
    }
}
async function s3Download(bucketName, key, localFile) {
    return new Promise((resolve, reject) => s3
        .getObject({
        Bucket: bucketName,
        Key: key,
    })
        .createReadStream()
        .on("error", reject)
        .pipe(fs.createWriteStream(localFile).on("close", resolve).on("error", reject)));
}
async function s3Upload(bucketName, key, localFile) {
    await s3
        .putObject({
        Bucket: bucketName,
        Key: key,
        Body: fs.createReadStream(localFile),
    })
        .promise();
}
async function doRead(work) {
    if (!(await s3Exists(s3BucketName, dbS3ObjectKey))) {
        return null;
    }
    await s3Download(s3BucketName, dbS3ObjectKey, localDbFile);
    try {
        const db = new better_sqlite3_1.default(localDbFile);
        return work(db);
    }
    finally {
        fs.unlinkSync(localDbFile);
    }
}
const createTableSQL = `CREATE TABLE post (
                                              title TEXT NOT NULL PRIMARY KEY,
                                              content TEXT NOT NULL,
                                              created TEXT NOT NULL,
                                              modified TEXT NULL
                        );
`;
async function makeTmp() {
    await fs.createWriteStream(os.tmpdir() + "/" + dbS3ObjectKey);
}
async function doWrite(work) {
    return await doInLock(async () => {
        let db;
        try {
            if (!(await s3Exists(s3BucketName, dbS3ObjectKey))) {
                db = new better_sqlite3_1.default(localDbFile);
                db.exec(createTableSQL);
            }
            else {
                await s3Download(s3BucketName, dbS3ObjectKey, localDbFile);
                db = new better_sqlite3_1.default(localDbFile);
            }
            const result = work(db);
            await s3Upload(s3BucketName, dbS3ObjectKey, localDbFile);
            return result;
        }
        finally {
            fs.unlinkSync(localDbFile);
        }
    });
}
const redisUrl = `redis://${process.env.IS_OFFLINE ? "127.0.0.1" : process.env.REDIS_HOST}:6379`;
const waitTimeoutMillis = 3000;
const lockTimeoutMillis = 5000;
const lockRedisKey = "simple-blog-redis-lock";
async function doInLock(work) {
    const client = (0, client_1.createClient)({ url: redisUrl });
    await client.connect();
    if (!(await acquireLock(client, lockRedisKey))) {
        throw new Error("잠금을 획득할 수 없습니다");
    }
    try {
        return await work();
    }
    finally {
        await client.del(lockRedisKey);
        await client.quit();
    }
}
async function sleep(millis) {
    return new Promise((resolve) => setTimeout(resolve, millis));
}
async function acquireLock(client, lockRedisKey) {
    const acquireStart = Date.now();
    while (Date.now() - acquireStart < waitTimeoutMillis) {
        const ret = await client.set(lockRedisKey, Date.now().toString(), {
            NX: true,
            PX: lockTimeoutMillis,
        });
        if (ret === "OK") {
            return true;
        }
        await sleep(Math.random() * 30);
    }
    return false;
}
