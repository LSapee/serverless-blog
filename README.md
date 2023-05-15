에러 내역
```
aws ec2 describe-vpcs | jq -r '.Vpcs[] | {VpcId, IsDefault}'

```
```
zsh: command not found: jq
```
jq 다운 받아서 해결 brew install jq
