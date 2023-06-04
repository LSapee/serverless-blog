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
  loginGoogle: {
    handler: "authHandler.loginGoogle",
    events: [{ httpApi: { path: "/api/login/google", method: "post" } }],
  },
  logout: {
    handler: "authHandler.logout",
    events: [
      { httpApi: { path: "/api/logout", method: "post", authorizer: "auth" } },
    ],
  },
  grant: {
    handler: "authHandler.grant",
    events: [{ httpApi: { path: "/api/grant", method: "post" } }],
  },
  authorize: {
    handler: "authHandler.authorize",
  },
  createPost: {
    handler: "handler.createPost",
    events: [{ httpApi: { path: "/api/post", method: "post",authorizers:"auth" } }],
    vpc,
    layers,
  },
  readPost: {
    handler: "handler.readPost",
    events: [{ httpApi: { path: "/api/post/{title}", method: "get" } }],
    layers,
  },
  updatePost: {
    handler: "handler.updatePost",
    events: [{ httpApi: { path: "/api/post/{title}", method: "put",authorizers:"auth" } }],
    layers,
    vpc,
  },
  deletePost: {
    handler: "handler.deletePost",
    events: [{ httpApi: { path: "/api/post/{title}", method: "delete",authorizers:"auth" } }],
    layers,
    vpc,
  },
  listPosts: {
    handler: "handler.listPosts",
    events: [{ httpApi: { path: "/api/post", method: "get" } }],
    layers,
  },
  serveStatic:{
    handler:"handler.serveStatic",
    events:[
      {httpApi:{path:"/",method:"get"}},
      {httpApi:{path:"/{fileName}",method:"get"}},
      {httpApi:{path:"/static/{type}/{fileName}",method: "get"}},
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
      JWT_SECRET_KEY:process.env.JWT_SECRET_KEY!,
      ADMIN_EMAIL:process.env.ADMIN_EMAIL!,
    },
    httpApi: {
      authorizers:{
        auth:{
          type:"request",
          functionName:"authorize",
          enableSimpleResponses:true,
          identitySource:["$request.header.cookie"]
        }
      }
    },
    logs:{
      httpApi:{
        format: `$context.identity.sourceIp - - [$context.requestTime] "$context.routeKey $context.protocol" $context.status $context.responseLength $context.requestId $context.authorizer.error`,
      }
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

  },
  functions,
  custom: {
    scripts: {
      hooks: {
        "webpack:package:packExternalModules":
            "[ -d .webpack/serveStatic ] && cp -r ../blog-frontend/build .webpack/serveStatic/pages || true",
      },
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
  ],
  resources: {
    Resources: {
      S3Bucket,
      RedisInstance,
    },
  },
};

module.exports = config;
