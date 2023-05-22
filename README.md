
# 로컬환경에서의 노드 버전은 18.16.0입니다.

## 에러 내역
```
aws ec2 describe-vpcs | jq -r '.Vpcs[] | {VpcId, IsDefault}'

```
```
zsh: command not found: jq
```
## 해결
### jq 다운 받아서 해결 brew install jq


## 에러내역
```
Error: ENOENT: no such file or directory, open '/tmp/simple-blog.db'
```

## 해결 

### 아래 코드를 변경
```
if (error.code === "Forbidden" || error.code === "NotFound") {
            return false;
        }
```
### 에러코드가 MissingRequiredParameter나오는 것을 확인하여 수정
```
if (error.code === "Forbidden" || error.code === "NotFound" || error.code==="MissingRequiredParameter") {
            return false;
        }
```

### buckets폴더 아래에 simple-blog-sqlite-db라는 폴더 생성해줌 - .envrc에 버킷이름으로 해둔거로 폴더 생성

### ide를 껏다 켰다 하다보니 direnv allow 설정이 꺼져서 env파일을 못 읽어서 bucketName이 undefined가 되는 현상도 있었습니다. bucketName도 콘솔로 찍어서 확인하여 수정


# 애플 실리콘 문제
```
Downloading and installing node v14.21.3...
Downloading https://nodejs.org/dist/v14.21.3/node-v14.21.3-darwin-arm64.tar.xz...
curl: (22) The requested URL returned error: 404     
```
                          
## 해결

### nvm install 14.15.0
참조 :  https://github.com/nvm-sh/nvm/issues/3033
