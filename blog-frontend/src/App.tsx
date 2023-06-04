import {BrowserRouter as Router, Route,  Routes} from "react-router-dom";
import {AdminPage, PostEditPage, PostListPage, PostNewPage, PostViewPage} from "./Pages";
import React from "react";
import {Grant} from "./models";
import {requestGrant} from "./server";
import {LogInOutButton ,GrantContext} from "./Components";
// 렌더링할 최상위 컴포넌트. 페이지 렌더링의 진입점 함수.
export default function App() {
    const [grant,setGrant] = React.useState<Grant>({email:null,admin:false});
    React.useEffect(()=>{
        requestGrant().then(setGrant).catch(alert);
    },[]);
    return (
        <>
        <LogInOutButton logged={!!grant.email}/>
        <GrantContext.Provider value={{admin:grant.admin}}>
            <Router>
                <Routes>
                    {/* "/"를 포함한 모든 예외적인 주소에 대해 "글 목록"을 보여준다. */}
                    <Route path="*" element={<PostListPage />} />
                    {/* "글 생성" 페이지의 주소를 "/_new"로 정한다. 따라서 "_new"라는 제목의 글은 제대로 보이지 않는다. */}
                    <Route path="/_new" element={<AdminPage><PostNewPage/></AdminPage>} />
                    {/* "글 보기" 페이지의 주소는 "글 제목"이다. */}
                    <Route path="/:title" element={<PostViewPage />} />
                    {/* "글 수정" 페이지의 주소는 "글 제목" 뒤에 "/edit"를 붙인다. */}
                    <Route path="/:title/edit" element={<AdminPage><PostEditPage /></AdminPage>} />
                </Routes>
            </Router>
        </GrantContext.Provider>
        </>
    );
}