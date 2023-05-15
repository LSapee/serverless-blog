

에러 내역

dynamodb 로 배포까지 확인
```
sls dynamodb start
```
```
Running "serverless" from node_modules
Dynamodb Local Started, Visit: http://localhost:8000/shell
UnknownEndpoint: Inaccessible host: `localhost' at port `8000'. This service may not be available in the `localhost' region.: DynamoDB - Error - 
Environment: darwin, node 19.4.0, framework 3.30.1 (local) 3.30.1v (global), plugin 6.2.3, SDK 4.3.2
Docs:        docs.serverless.com
Support:     forum.serverless.com
Bugs:        github.com/serverless/serverless/issues

Error:
UnknownEndpoint: Inaccessible host: `localhost' at port `8000'. This service may not be available in the `localhost' region.
```

해결
storage.ts
```
const db = !process.env.IS_OFFLINE
    ? new DynamoDB.DocumentClient()
    : new DynamoDB.DocumentClient({
        region: "localhost",
        endpoint: "http://127.0.0.1:8000", 
    });
```

endpoint:"http://localhost:8000"을 위처럼 변경

serverless.ts
```
const dynamodbLocal = {
  stages: ["dev"],
  start: {
    host:"127.0.0.1",
    migrate: true,
  },
};
```
host:"127.0.0.1"
맥북에서 나는 에러인거 같습니다. 