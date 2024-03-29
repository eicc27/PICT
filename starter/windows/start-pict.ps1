# $npm = Get-Command npm -ErrorAction SilentlyContinue
# if ($null -eq $npm) {
#     Write-Output "npm not found."
#     exit 1
# } else {
#     Write-Output "npm found."
#     exit 0
# }

Import-Module -Name .\starter-git\windows\cstr.psm1
Import-Module -Name .\starter-git\windows\detect-ports.psm1
Import-Module -Name .\starter-git\windows\start-mongo.ps1

Write-Output "Using Windows Terminal."
Write-Colored "Trying to build from scratch..." "DarkYellow"
# query port 4200, 3000
Get-Port @(4200,3000)
Write-Colored "|---- Building ./front/**..." "DarkBlue"
# start a puppy windows terminal
wt.exe -w 0 -d (Resolve-Path .\front).Path powershell -c ember serve
Write-Colored "|---- Building ./back/**..." "DarkBlue"
wt.exe -w 0 -d (Resolve-Path .\back).Path powershell -c npm run dev
Write-Colored "|---- [EXTRA] Launching MongoDB Service..." "DarkBlue"
wt.exe -w 0 -d (Resolve-Path .).Path powershell -c $mongoCmd
exit 0
