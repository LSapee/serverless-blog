페이지 주소 : https://blog.studynodejs.com

화면에 게시글 정보 재대로 출력 안되던 이유 : 백엔드 api 에서 post값을 리턴할때 {post}로 묶어주다 보니 post에 프로토타입 데이터가 생겨서 models의 Post와 데이터가 일치하지 않아서 문제 였습니다.

이후 프론트 엔드 변경하여 배포시

frontend 폴더에서 npm run build 후
```
sls deploy function -f serveStatic
```

