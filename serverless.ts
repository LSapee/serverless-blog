import type { AWS } from '@serverless/typescript';
const layers=[
  "arn:aws:lambda:ap-northeast-2:435401313062:layer:better-sqlite3:1"
];
const subnetIds=[
    "subnet-0f6ba45ec815e33a1",
    "subnet-0b58953a5b6630c89",
    "subnet-0a4f9c5a77a2f7523",
    "subnet-017ebab00591040ca",
];
const securityGroupIds =['sg-0d970116c53e9253a'];
const vpc = {subnetIds,securityGroupIds};
const functions = {
  // 글작성 API
  createPost:{
    handler : "handler.createPost",
    events: [{httpApi:{path:"/api/post",method:"post"}}],
    vpc,
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
    vpc,
  },
  // 글 삭제 API
  deletePost:{
    handler : "handler.deletePost",
    events : [{httpApi:{path:"/api/post/{title}",method :"delete"}}],
    vpc,
  },
  // 글 목록 조회 API
  listPosts:{
    handler:"handler.listPosts",
    events:[{httpApi:{path:"/api/post",method:"get"}}],
  }
}
const S3Bucket = {
  Type: "AWS::S3::Bucket",
  Properties: {
    BucketName: process.env.BUCKET_NAME!,
  },
};
// const S3BucketRoleStatement={
//   Action:['s3:PutObject','s3:GetObject'],
//   Effect:"Allow",
//   Resource: `arn:aws:s3:::${process.env.BUCKET_NAME}/*`,
// };

const RedisInstance = {
  Type: "AWS::ElastiCache::ReplicationGroup",
  Properties: {
    ReplicationGroupId: process.env.REDIS_NAME!,
    ReplicationGroupDescription: "Redis instance for simple locking",
    CacheNodeType: "cache.t3.micro",
    Engine: "redis",
    ReplicasPerNodeGroup: 0,
    AutomaticFailoverEnabled: false,
    SecurityGroupIds: securityGroupIds,
  },
};
const config: AWS = {
  service: 'serverless-blog',
  frameworkVersion: '3',
  plugins: ['serverless-webpack','serverless-s3-local','serverless-offline'],
  provider: {
    name: 'aws',
    runtime: 'nodejs14.x',
    region: "ap-northeast-2",
    environment:{
      BUCKET_NAME: process.env.BUCKET_NAME!,
      REDIS_HOST:{
        "Fn::GetAtt": ["RedisInstance", "PrimaryEndPoint.Address"],
      }
    },
    iam:{
      role:{
        statements:[
          {
            Action:['s3:PutObject','s3:GetObject'],
            Effect:"Allow",
            Resource: `arn:aws:s3:::${process.env.BUCKET_NAME}/*`,
          }
        ],
      }
    },
    layers,
  },
  functions,
  resources:{
    Resources:{
      S3Bucket,
      RedisInstance,
    }
  },
};

module.exports = config;
