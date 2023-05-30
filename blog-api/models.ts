export interface Post{
    title:string;       //글 제목
    content:string;     //글 내용
    created: string;    //글 작성일
    modified?: string;  //글 변경 ?:undefined도 포함 즉 변경이 있을수도 있고 없을 수도 있다.
}
// 글 목록을 조회할때 참조할 모델
export interface PostListItem{
    title:string;   //글 제목
    created: string; //글 작성일
}