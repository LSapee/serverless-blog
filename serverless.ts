import type { AWS } from '@serverless/typescript';
import * as process from "process";

const MySQLDBInstance = {
  Type:"AWS::RDS::DBInstance",
  Properties:{
    AllocatedStorage: "5",
    DBInstanceClass : "db.t3.micro",
    Engine: "MySQL",
    DBName: "blog",
    MasterUsername : process.env.MYSQL_ROOT_USER,
    MasterUserPassword : process.env.MYSQL_ROOT_PASSWORD,
    PubliclyAccessible: true,
  },
  DeletionPolicy: "Snapshot",
};

const config: AWS = {
  service: 'serverless-blog',
  frameworkVersion: '3',
  plugins: ['serverless-webpack','serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: "ap-northeast-2",
    environment: {
      MYSQL_HOST: {"Fn::GetAtt": ["MySQLDBInstance", "Endpoint.Address"]},
      MYSQL_ROOT_USER: process.env.MYSQL_ROOT_USER!,
      MYSQL_ROOT_PASSWORD: process.env.MYSQL_ROOT_PASSWORD!,
    },
  },
  resources:{
    Resources:{MySQLDBInstance},
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
};

module.exports = config;
