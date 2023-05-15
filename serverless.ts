import type { AWS } from '@serverless/typescript';

const PostTable = {
  Type: "AWS::DynamoDB::Table",
  Properties: {
    TableName:"post",
    KeySchema: [{ AttributeName: "title", KeyType: "HASH" }],
    AttributeDefinitions: [{ AttributeName: "title", AttributeType: "S" }],
    BillingMode: "PAY_PER_REQUEST",
  },
};

function getVariableName(expression:{[key:string]:unknown}):string{
  return Object.keys(expression)[0];
}
const PostTableRoleStatement = {
  Effect: "Allow",
  Action: [
    "dynamodb:PutItem",
    "dynamodb:GetItem",
    "dynamodb:UpdateItem",
    "dynamodb:DeleteItem",
  ],
  Resource: { "Fn::GetAtt": [getVariableName({ PostTable }), "Arn"] },
};
const dynamodbLocal = {
  stages: ["dev"],
  start: {
    host:"127.0.0.1",
    migrate: true,
  },
};

const config: AWS = {
  service: 'serverless-blog',
  frameworkVersion: '3',
  plugins: ['serverless-webpack','serverless-dynamodb-local','serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region:"ap-northeast-2",
    iam:{role:{statements:[PostTableRoleStatement]}},
  },
  resources:{
    Resources:{PostTable},
  },
  // import the function via paths
  functions: {
    // 글작성 API
    createPost:{
      handler : "handler.createPost",
      events: [{httpApi:{path:"/api/post",method:"post"}}],
    },
    // 글 조회 API
    readPost: {
      handler : "handler.readPost",
      events : [{httpApi:{path:"/api/post/{title}",method:"get"}}],
    },
    // 글 수정 API
    updatePost : {
      handler : "handler.updatePost",
      events : [{httpApi:{path:"/api/post/{title}",method:"put"}}],
    },
    // 글 삭제 API
    deletePost:{
      handler : "handler.deletePost",
      events : [{httpApi:{path:"/api/post/{title}",method :"delete"}}],
    },
    // 글 목록 조회 API
    listPosts:{
      handler:"handler.listPosts",
      events:[{httpApi:{path:"/api/post",method:"get"}}],
    }
  },
  custom: {
    dynamodb: dynamodbLocal,
  },
};

module.exports = config;
