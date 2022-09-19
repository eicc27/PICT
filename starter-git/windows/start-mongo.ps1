# Find Mongo installation from root directory first
$mongoDir = Get-ChildItem . | Where-Object {$_.Name.Contains("mongodb")};
$mongoDir = (Resolve-Path($mongoDir.Name)).Path;
$basePath = (Resolve-Path('.')).Path;

$logName = Get-Date -Format "dd-MM-yyyy";

$mongoConf = "--dbpath $basePath\db\mongo\mongodb --logpath $basePath\db\mongo\log\$logName.log --quiet --logappend --port 4203";

# $mongoConf | Out-File -FilePath $confPath;

$mongoCmd = "$mongoDir\bin\mongod.exe $mongoConf"