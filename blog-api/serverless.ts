import type { AWS } from '@serverless/typescript';
const layers=[
  "arn:aws:lambda:ap-northeast-2:435401313062:layer:better-sqlite3:7"
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
  createPost: {
    handler: "handler.createPost",
    events: [{ http: { path: "/api/post", method: "post" } }],
    vpc,
  },
  readPost: {
    handler: "handler.readPost",
    events: [{ http: { path: "/api/post/{title}", method: "get" } }],
  },
  updatePost: {
    handler: "handler.updatePost",
    events: [{ http: { path: "/api/post/{title}", method: "put" } }],
    vpc,
  },
  deletePost: {
    handler: "handler.deletePost",
    events: [{ http: { path: "/api/post/{title}", method: "delete" } }],
    vpc,
  },
  listPosts: {
    handler: "handler.listPosts",
    events: [{ http: { path: "/api/post", method: "get" } }],
  },
  serveStatic:{
    handler:"handler.serveStatic",
    events:[
      {http:{path:"/",method:"get"}},
      {http:{path:"/{fileName}",method:"get"}},
      {http:{path:"/static/{type}/{fileName}",method: "get"}},
    ]
  }
};

const S3Bucket = {
  Type: "AWS::S3::Bucket",
  Properties: {
    BucketName: process.env.BUCKET_NAME!,
  },
};

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
  service: "simple-blog-sqlite",
  frameworkVersion: "3",
  provider: {
    name: "aws",
    runtime: "nodejs14.x",
    region: "ap-northeast-2",
    environment: {
      BUCKET_NAME: process.env.BUCKET_NAME!,
      REDIS_HOST: {
        "Fn::GetAtt": ["RedisInstance", "PrimaryEndPoint.Address"],
      },
    },
    iam: {
      role: {
        statements: [
          {
            Action: ["s3:PutObject", "s3:GetObject"],
            Effect: "Allow",
            Resource: `arn:aws:s3:::${process.env.BUCKET_NAME}/*`,
          },
        ],
      },
    },
    apiGateway:{
      minimumCompressionSize :1024,
      binaryMediaTypes : ["image/*"]
    },
    tracing:{
      apiGateway:true,
      lambda:true,
    },
    layers,
  },
  functions,
  custom: {
    scripts: {
      hooks: {
        "webpack:package:packExternalModules":
            "[ -d .webpack/serveStatic ] && cp -r ../blog-frontend/build .webpack/serveStatic/pages || true",
      },
    },
    customDomain: {
      apiType: "rest",
      domainName: `${process.env.SUB_DOMAIN}.${process.env.ROOT_DOMAIN}`,
      certificateName: process.env.ROOT_DOMAIN!,
      endpointType: "edge",
      createRoute53Record: true,
    },
  },
  package: {
    individually: true,
  },
  plugins: [
    "serverless-webpack",
    "serverless-s3-local",
    "serverless-offline",
    "serverless-plugin-scripts",
    "serverless-domain-manager",
  ],
  resources: {
    Resources: {
      S3Bucket,
      RedisInstance,
    },
  },
};

module.exports = config;
