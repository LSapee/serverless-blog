에러 내역

```
sls deploy
```
```
Error:
The CloudFormation template is invalid: Template Error: Encountered unsupported function: fn::GetAtt Supported functions are: [Fn::Base64, Fn::GetAtt, Fn::GetAZs, Fn::ImportValue, Fn::Join, Fn::Split, Fn::FindInMap, Fn::Select, Ref, Fn::Equals, Fn::If, Fn::Not, Condition, Fn::And, Fn::Or, Fn::Contains, Fn::EachMemberEquals, Fn::EachMemberIn, Fn::ValueOf, Fn::ValueOfAll, Fn::RefAll, Fn::Sub, Fn::Cidr]

```
해결
fn::GetAtt -> FN::GetAtt로 수정


```
sls deploy
```

```
Error:
CREATE_FAILED: MySQLDBInstance (AWS::RDS::DBInstance)
Properties validation failed for resource MySQLDBInstance with message:
#: extraneous key [MasterUserName] is not permitted

```

DataBase 생성
```
create Table post (
                      title varchar(400) not null primary key ,
                      content text,
                      created varchar(30),
                      modified varchar(30)
);
```