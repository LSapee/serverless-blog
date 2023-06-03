import * as storage from "./storage";
import {APIGatewayProxyHandler} from "aws-lambda";
import {Post,PostListItem} from "./models";

//글 작성
export const createPost: APIGatewayProxyHandler = async (event) =>{
    if(!event.body){
        return {statusCode:404, body:"Not Found"};
    }
    const {title,content } =  JSON.parse(event.body);
    const created = new Date().toISOString();

    if(!(await storage.insert({title,content,created}))){
        return { statusCode: 400, body:"Bad Request" };
    }
    return { statusCode: 200, body: JSON.stringify({ title }) };
};
//글 수정
export const updatePost: APIGatewayProxyHandler = async (event) =>{
    if(!event.body|| !event.pathParameters || !event.pathParameters['title']){
        return {statusCode:404, body:"Not Found"};
    }
    const oldTitle = event.pathParameters.title;
    const {title,content } =  JSON.parse(event.body);
    const modified = new Date().toISOString();

    if(!(await storage.update(oldTitle,{title,content,modified}))){
        return { statusCode: 400, body: "Bad Request" };
    }
    return { statusCode: 200, body: JSON.stringify(title) };
};
//글 조회
export const readPost: APIGatewayProxyHandler=async (event)=>{
    if(!event.pathParameters||!event.pathParameters['title']){
        return {statusCode:404,body:"Not Found"};
    }
    const post = await storage.select(decodeURIComponent(event.pathParameters.title));
    if(!post){
        return {statusCode:404 , body:"Not Found"};
    }
    return {statusCode : 200 , body:JSON.stringify(post)};
}

//글 삭제
export const deletePost:APIGatewayProxyHandler=async (event)=>{
    if(!event.pathParameters||!event.pathParameters['title']){
        return {statusCode:404, body:"Not Found"};
    }
    await storage.remove(event.pathParameters.title);
    return {statusCode:200, body:"true"};
}

//글 목록 조회
export const listPosts:APIGatewayProxyHandler =async ()=>{
    return {statusCode:200, body:JSON.stringify(await storage.list())};
}