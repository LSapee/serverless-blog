페이지 주소 : https://blog.studynodejs.com

화면에 게시글 정보 재대로 출력 안되던 이유 : 백엔드 api 에서 post값을 리턴할때 {post}로 묶어주다 보니 post에 프로토타입 데이터가 생겨서 models의 Post와 데이터가 일치하지 않아서 문제 였습니다.

이후 프론트 엔드 변경하여 배포시

frontend 폴더에서 npm run build 후
```
sls deploy function -f serveStatic
```


제목으로 특수문자 입력하면 게시글 입력은 되지만 조회가 안되는 문제가 있습니다.

RestAPI 설정시 연동 문제가 있어서 다시 HTTP API로 롤백

배포할때 API-Gateway-id 변경되서 문제 생기는 경우가 가끔씩 있으니 적어둔 cdn-stack의 안의 env 파일 확인해볼것!!!  


handler에서 아래의 에러 발생

```
{
    "error": "invalid_request",
    "error_description": "Invalid Credentials"
}
```

해결 참고한 사이트 : https://developers.google.com/workspace/add-ons/guides/alternate-runtimes?hl=ko#extract_the_information

idpiframe_initialization_failed 에러

라이브러리 사용 중단 : https://www.npmjs.com/package/react-google-login 
해당 라이브러리가 더이상 사용 되지 않는 문제
아마 https://developers.google.com/identity/sign-in/web/sign-in?hl=ko 이것때문에 중단된게 아닌가 싶다...

@react-oauth/google 라이브러리를 사용하여 문제 해결

