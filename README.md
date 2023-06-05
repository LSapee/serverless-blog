## 페이지 주소 : https://blog.studynodejs.com

# 서버리리스 이제는 AWS Lambda로 간다

https://catalog.11st.co.kr/catalogs/218257633?trTypeCd=PW22&trCtgrNo=585021

해당 책의 리포지토리 : https://github.com/bjpublic/aws-lambda/tree/main/401-blog-baseline

책의 4장 블로그 서비스를 구현 했습니다.  (리포지토리도 4장을 링크로 잡았습니다.)

4-1 서비스 소개 및 설계

1. 허가된 사용자만 글을 작성할 수 있다.
2. 모든 사용자는 작성된 글을 조회할 수 있다.
3. 작성된 모든 글을 최신순으로 조회할 수 있다.

4-2 기본 API 구현

| API                      | 목적      | 요청 내용           | 응답 내용                     |
|--------------------------|---------|-----------------|---------------------------|
| POST /api/post           | 글 생성    | {title,content} | {title }                  |
| GET /api/post/{title}    | 글 조회    |  | {title,content,created,modified} |
| PUT /api/post/{title}    | 글 수정    | {title,content} | {title}                   |
| DELETE /api/post/{title} | 글 삭제    |  |                           |
| GET /api/post            | 글 목록 조회 |  | {title,created}[]         |

특별한 에러 없이 구현 가능했습니다.

4-3 DynamoDB 연동

책보고 따라 하면서 구현하는데 에러 사항 없었습니다.

4-4 MySQL 구현

책보고 따라 하면서 구현하는데 에러 사항 없었습니다.

4-5 SQLite 연동

배포 환경은 node v14인데 맥북 m1이상 칩에서 node v14환경을 지원하지 않아서 better-sqlite3 라이브러리 배포에 문제가 있었습니다.
해결 -> ec2를 따로 생성하여 node v14로 better-sqlite3을 받아와서 배포하였습니다.

4-6 저장소 비교

DB별 특징 및 설명 + 비용 및 유지 보수 등에 대한 설명이 있다.

4-7 프런트엔드 연동

react는 잘 몰라서 책 읽어보면서 흐름만 이해하고 코드는 저자의 리포지토리에서 복붙했습니다.

중간에 에러 났던부분이 backend api에서 post를 {post}로 감싸주고 반환해서 에러가 있었습니다.

이외에 별다른 에러 없었습니다.

4-8 S3와 cloudFront를 사용해 배포

책보고 따라 하면서 구현하는데 에러 사항 없었습니다.

4-9 CloudFront의 다중 오리진 사용

책보고 따라 하면서 구현하는데 에러 사항 없었습니다.

4-10 API Gateway에서 웹 페이지 제공

custom 도메인 부분이 문제 있어서 해당 부분을 스킵했습니다.

4-11 REST API  사용

X-Ray 부분이 재대로 작동 안해서 롤백하고 넘어갔습니다.

4-12 인증 구형

backend API 부분에서 https.request 부분이 재대로 작동하지 않아서 아래 링크 사이트 참조 하였습니다.
참조 사이트 : https://developers.google.com/workspace/add-ons/guides/alternate-runtimes?hl=ko#extract_the_information

Frontend부분에서 "react-google-login"라이브러리를 더이상 사용하지 않게 되어서 "@react-oauth/google"라이브러리를 이용하여 구현하였습니다.

이후 4-13~4-16은 읽어보고 넘겼습니다.

### 상용화 한다면 수정이 필요한 기능

- 글 수정 및 삭제 권한 (현재는 로그인한 모든 사용자가 마음대로 아무글이나 수정/삭제 가능합니다.)
- 제목에 특수문자 입력시 에러가 발생하는 현상

나머지 상용화에 부족 및 적합한 내용은 4-13~4-16장에 기록 되어있습니다.

