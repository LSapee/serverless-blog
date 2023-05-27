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
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPosts = exports.deletePost = exports.readPost = exports.updatePost = exports.createPost = void 0;
const storage = __importStar(require("./storage"));
//글 작성
const createPost = async (event) => {
    if (!event.body) {
        return { statusCode: 404 };
    }
    const { title, content } = JSON.parse(event.body);
    const created = new Date().toISOString();
    if (!(await storage.insert({ title, content, created }))) {
        return { statusCode: 400 };
    }
    return { title };
};
exports.createPost = createPost;
//글 수정
const updatePost = async (event) => {
    if (!event.body || !event.pathParameters || !event.pathParameters['title']) {
        return { statusCode: 404 };
    }
    const oldTitle = event.pathParameters.title;
    const { title, content } = JSON.parse(event.body);
    const modified = new Date().toISOString();
    if (!(await storage.update(oldTitle, { title, content, modified }))) {
        return { statusCode: 400 };
    }
    return { title };
};
exports.updatePost = updatePost;
//글 조회
const readPost = async (event) => {
    if (!event.pathParameters || !event.pathParameters['title']) {
        return { statusCode: 404 };
    }
    const post = await storage.select(event.pathParameters.title);
    if (!post) {
        return { statusCode: 404 };
    }
    return { post };
};
exports.readPost = readPost;
//글 삭제
const deletePost = async (event) => {
    if (!event.pathParameters || !event.pathParameters['title']) {
        return { statusCode: 404 };
    }
    await storage.remove(event.pathParameters.title);
    return { statusCode: 200 };
};
exports.deletePost = deletePost;
//글 목록 조회
const listPosts = async () => {
    return storage.list();
};
exports.listPosts = listPosts;
